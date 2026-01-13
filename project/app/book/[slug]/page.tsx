'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabase';
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfDay, addMinutes, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, Sparkles, User, Mail, Phone, MessageSquare } from 'lucide-react';

interface BookingSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  business_name: string;
  booking_url_slug: string;
  logo_url: string;
  primary_color: string;
  services_offered: Array<{
    name: string;
    duration: number;
    price: number;
    description?: string;
  }>;
  booking_buffer_minutes: number;
  advance_booking_days: number;
  min_notice_hours: number;
  business_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  blocked_dates: string[];
  require_phone: boolean;
  require_email: boolean;
  confirmation_message: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: string;
  requires_consultation: boolean;
  deposit_required: boolean;
  deposit_amount: number;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetchBookingSettings();
  }, [slug]);

  useEffect(() => {
    if (settings && selectedDate) {
      fetchExistingAppointments();
    }
  }, [settings, selectedDate]);

  useEffect(() => {
    if (settings && selectedDate && selectedService) {
      generateTimeSlots();
    }
  }, [settings, selectedDate, selectedService, existingAppointments]);

  const fetchBookingSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('booking_url_slug', slug)
      .eq('enabled', true)
      .maybeSingle();

    if (data) {
      setSettings(data);
      await fetchServices(data.user_id);
    }
    setLoading(false);
  };

  const fetchServices = async (userId: string) => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('available_for_online_booking', true)
      .order('display_order');

    if (data) {
      setServices(data);
    }
  };

  const fetchExistingAppointments = async () => {
    if (!settings || !selectedDate) return;

    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = addDays(startOfSelectedDay, 1);

    const { data } = await supabase
      .from('appointments')
      .select('start_time, duration')
      .eq('user_id', settings.user_id)
      .gte('start_time', startOfSelectedDay.toISOString())
      .lt('start_time', endOfSelectedDay.toISOString())
      .neq('status', 'cancelled');

    setExistingAppointments(data || []);
  };

  const generateTimeSlots = () => {
    if (!settings || !selectedDate || !selectedService) return;

    const service = services.find(s => s.name === selectedService);
    if (!service) return;

    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    const dayHours = settings.business_hours[dayName];

    if (!dayHours?.enabled) {
      setAvailableSlots([]);
      return;
    }

    const [startHour, startMinute] = dayHours.start.split(':').map(Number);
    const [endHour, endMinute] = dayHours.end.split(':').map(Number);

    let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute);
    const endTime = setMinutes(setHours(selectedDate, endHour), endMinute);
    const now = new Date();
    const minBookingTime = addMinutes(now, settings.min_notice_hours * 60);

    const slots: TimeSlot[] = [];

    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, service.duration_minutes);

      const isPastMinNotice = isBefore(currentTime, minBookingTime);

      const isBooked = existingAppointments.some(appt => {
        const apptStart = parseISO(appt.start_time);
        const apptEnd = addMinutes(apptStart, appt.duration);
        return (
          (isBefore(currentTime, apptEnd) && isAfter(currentTime, apptStart)) ||
          (isBefore(slotEnd, apptEnd) && isAfter(slotEnd, apptStart)) ||
          (isBefore(apptStart, slotEnd) && isAfter(apptEnd, currentTime))
        );
      });

      slots.push({
        time: new Date(currentTime),
        available: !isPastMinNotice && !isBooked,
      });

      currentTime = addMinutes(currentTime, service.duration_minutes + settings.booking_buffer_minutes);
    }

    setAvailableSlots(slots);
  };

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    setSelectedTime(null);
    setStep(2);
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!settings || !selectedTime || !selectedService) return;

    setSubmitting(true);

    const service = services.find(s => s.name === selectedService);
    if (!service) return;

    const { error } = await supabase.from('public_bookings').insert([{
      practitioner_user_id: settings.user_id,
      client_name: formData.name,
      client_email: formData.email,
      client_phone: formData.phone,
      service: selectedService,
      requested_time: selectedTime.toISOString(),
      duration_minutes: service.duration_minutes,
      status: 'pending',
      notes: formData.notes,
    }]);

    if (!error) {
      if (formData.email) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: formData.email,
              businessName: settings.business_name,
              clientName: formData.name,
              service: selectedService,
              date: format(selectedTime, 'MMMM dd, yyyy'),
              time: format(selectedTime, 'h:mm a'),
              confirmationMessage: settings.confirmation_message,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      setConfirmed(true);
    }

    setSubmitting(false);
  };

  const isDateDisabled = (date: Date) => {
    if (!settings) return true;

    const today = startOfDay(new Date());
    const maxDate = addDays(today, settings.advance_booking_days);

    if (isBefore(date, today) || isAfter(date, maxDate)) {
      return true;
    }

    const dayName = format(date, 'EEEE').toLowerCase();
    const dayHours = settings.business_hours[dayName];
    if (!dayHours?.enabled) {
      return true;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    if (settings.blocked_dates.includes(dateStr)) {
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 animate-pulse" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-medium text-slate-800 mb-2">Booking Not Available</h2>
            <p className="text-slate-600">This booking page is not active or does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-slate-800 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-600 mb-6">{settings.confirmation_message}</p>
            <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Service:</span>
                  <span className="font-medium text-slate-800">{selectedService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium text-slate-800">{selectedTime && format(selectedTime, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Time:</span>
                  <span className="font-medium text-slate-800">{selectedTime && format(selectedTime, 'h:mm a')}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="rounded-full"
              style={{ backgroundColor: settings.primary_color }}
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.business_name} className="h-16 mx-auto mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: settings.primary_color }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-light text-slate-800 mb-2">{settings.business_name}</h1>
          <p className="text-slate-600">Book your appointment online</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={step >= 1 ? { backgroundColor: settings.primary_color } : {}}>
              1
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={step >= 2 ? { backgroundColor: settings.primary_color } : {}}>
              2
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={step >= 3 ? { backgroundColor: settings.primary_color } : {}}>
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Select a Service</CardTitle>
              <CardDescription>Choose the treatment you would like to book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                  onClick={() => handleServiceSelect(service.name)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-1">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} min
                          </div>
                          {service.deposit_required && (
                            <Badge variant="outline" className="text-xs">
                              ${service.deposit_amount} deposit
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold" style={{ color: settings.primary_color }}>
                          ${service.price}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Select Date & Time</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mr-2">{selectedService}</Badge>
                Choose your preferred appointment time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    className="rounded-xl border"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 mb-3">Available Times</h3>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No available times for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {availableSlots.map((slot, idx) => (
                        <Button
                          key={idx}
                          variant={selectedTime?.getTime() === slot.time.getTime() ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => handleTimeSelect(slot.time)}
                          className="rounded-lg"
                          style={selectedTime?.getTime() === slot.time.getTime() ? { backgroundColor: settings.primary_color } : {}}
                        >
                          {format(slot.time, 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Your Information</CardTitle>
              <CardDescription>Please provide your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service:</span>
                    <span className="font-medium text-slate-800">{selectedService}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date & Time:</span>
                    <span className="font-medium text-slate-800">
                      {selectedTime && format(selectedTime, 'MMM dd, yyyy • h:mm a')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl mt-1"
                    required
                  />
                </div>

                {settings.require_email && (
                  <div>
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email {settings.require_email && '*'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-xl mt-1"
                      required={settings.require_email}
                    />
                  </div>
                )}

                {settings.require_phone && (
                  <div>
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone {settings.require_phone && '*'}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-xl mt-1"
                      required={settings.require_phone}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-xl mt-1"
                    rows={3}
                    placeholder="Any special requests or information we should know?"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-full">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.name || (settings.require_email && !formData.email) || (settings.require_phone && !formData.phone)}
                  className="rounded-full flex-1"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
