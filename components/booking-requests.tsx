'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Check, X, CalendarPlus } from 'lucide-react';

interface PublicBooking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service: string;
  requested_time: string;
  duration_minutes: number;
  status: string;
  notes: string;
  created_at: string;
}

export function BookingRequests() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<PublicBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<PublicBooking | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('public_bookings')
      .select('*')
      .eq('practitioner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBookings(data);
    }
  };

  const confirmBooking = async () => {
    if (!selectedBooking || !user) return;

    setProcessing(true);

    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', selectedBooking.client_name)
      .maybeSingle();

    let clientId = clientData?.id;

    if (!clientId) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert([{
          user_id: user.id,
          name: selectedBooking.client_name,
          email: selectedBooking.client_email,
          phone: selectedBooking.client_phone,
          treatments: [],
          notes: [],
          consents: {},
        }])
        .select()
        .single();

      clientId = newClient?.id;
    }

    if (clientId) {
      const { data: appointment } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          client_id: clientId,
          service: selectedBooking.service,
          start_time: selectedBooking.requested_time,
          duration: selectedBooking.duration_minutes,
          status: 'confirmed',
          notes: selectedBooking.notes || '',
        }])
        .select()
        .single();

      if (appointment) {
        await supabase
          .from('public_bookings')
          .update({
            status: 'confirmed',
            appointment_id: appointment.id,
          })
          .eq('id', selectedBooking.id);
      }
    }

    setProcessing(false);
    setShowConfirmDialog(false);
    setSelectedBooking(null);
    await fetchBookings();
  };

  const rejectBooking = async () => {
    if (!selectedBooking) return;

    setProcessing(true);

    await supabase
      .from('public_bookings')
      .update({ status: 'cancelled' })
      .eq('id', selectedBooking.id);

    setProcessing(false);
    setShowRejectDialog(false);
    setSelectedBooking(null);
    await fetchBookings();
  };

  const handleConfirmClick = (booking: PublicBooking) => {
    setSelectedBooking(booking);
    setShowConfirmDialog(true);
  };

  const handleRejectClick = (booking: PublicBooking) => {
    setSelectedBooking(booking);
    setShowRejectDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const processedBookings = bookings.filter(b => b.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
          <CalendarPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Booking Requests</h2>
          <p className="text-sm text-slate-600">Manage online booking requests from clients</p>
        </div>
      </div>

      {pendingBookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Pending Requests</h3>
          {pendingBookings.map((booking) => (
            <Card key={booking.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-slate-800 text-lg">{booking.client_name}</h4>
                      <Badge className={`rounded-full border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {booking.client_email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {booking.client_email}
                        </div>
                      )}
                      {booking.client_phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          {booking.client_phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Service
                    </div>
                    <p className="font-medium text-slate-800">{booking.service}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Date & Time
                    </div>
                    <p className="font-medium text-slate-800">
                      {format(new Date(booking.requested_time), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <p className="text-sm text-slate-600">{booking.duration_minutes} minutes</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4 bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      Notes
                    </div>
                    <p className="text-sm text-slate-700">{booking.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleConfirmClick(booking)}
                    className="rounded-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Add to Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectClick(booking)}
                    className="rounded-full text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {processedBookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
          {processedBookings.slice(0, 10).map((booking) => (
            <Card key={booking.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-slate-800">{booking.client_name}</h4>
                      <Badge className={`rounded-full border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {booking.service} • {format(new Date(booking.requested_time), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Requested {format(new Date(booking.created_at), 'MMM dd')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bookings.length === 0 && (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarPlus className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No booking requests yet.</p>
            <p className="text-sm text-slate-400 mt-1">Requests will appear here when clients book online.</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              This will add the appointment to your calendar and create a client record if needed.
              {selectedBooking && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <p className="font-medium text-slate-800">{selectedBooking.client_name}</p>
                  <p className="text-slate-600">{selectedBooking.service}</p>
                  <p className="text-slate-600">
                    {format(new Date(selectedBooking.requested_time), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBooking}
              disabled={processing}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Confirm Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this booking request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={rejectBooking}
              disabled={processing}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Processing...' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
