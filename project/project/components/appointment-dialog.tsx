'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';

const appointmentSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  service: z.string().min(1, 'Service is required'),
  start_time: z.string().min(1, 'Date and time are required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  notes: z.string().optional(),
  price: z.number().optional(),
  payment_status: z.string().optional(),
  payment_method: z.string().optional(),
  booking_method: z.string().optional(),
  deposit_amount: z.number().optional(),
  deposit_paid: z.boolean().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentAdded: () => void;
  defaultDate?: Date;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  deposit_required: boolean;
  deposit_amount: number;
}

export function AppointmentDialog({ open, onOpenChange, onAppointmentAdded, defaultDate }: AppointmentDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 60,
      price: 0,
      payment_status: 'pending',
      booking_method: 'admin',
      deposit_amount: 0,
      deposit_paid: false,
    },
  });

  const watchPaymentStatus = watch('payment_status');

  useEffect(() => {
    if (open && user) {
      fetchClients();
      fetchServices();
      if (defaultDate) {
        const formattedDate = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
        setValue('start_time', formattedDate);
      }
    }
  }, [open, user, defaultDate, setValue]);

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (data) setClients(data);
  };

  const fetchServices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('display_order');
    if (data) setServices(data);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      const appointmentDate = new Date(data.start_time);
      const bookingLeadTimeDays = Math.floor((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      const { error } = await supabase.from('appointments').insert([
        {
          user_id: user.id,
          client_id: data.client_id,
          service: data.service,
          start_time: data.start_time,
          duration: data.duration,
          status: 'scheduled',
          notes: data.notes || '',
          price: data.price || 0,
          amount_paid: data.payment_status === 'paid' ? (data.price || 0) : 0,
          payment_status: data.payment_status || 'pending',
          payment_method: data.payment_method,
          payment_date: data.payment_status === 'paid' ? new Date().toISOString() : null,
          booking_method: data.booking_method || 'admin',
          deposit_amount: data.deposit_amount || 0,
          deposit_paid: data.deposit_paid || false,
          booking_lead_time_days: bookingLeadTimeDays,
        },
      ]);

      if (error) throw error;

      reset();
      onOpenChange(false);
      onAppointmentAdded();
    } catch (error) {
      console.error('Error adding appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Book Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select onValueChange={(value) => setValue('client_id', value)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-sm text-red-500">{errors.client_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select onValueChange={(value) => {
              setValue('service', value);
              const selectedService = services.find(s => s.name === value);
              if (selectedService) {
                setValue('duration', selectedService.duration_minutes);
                setValue('price', selectedService.price);
                if (selectedService.deposit_required) {
                  setValue('deposit_amount', selectedService.deposit_amount);
                }
              }
            }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name} (${service.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && <p className="text-sm text-red-500">{errors.service.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_time">Date & Time *</Label>
            <Input
              id="start_time"
              type="datetime-local"
              {...register('start_time')}
              className="rounded-xl"
            />
            {errors.start_time && <p className="text-sm text-red-500">{errors.start_time.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              className="rounded-xl"
            />
            {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              {...register('notes')}
              placeholder="Special instructions..."
              className="rounded-xl"
            />
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="rounded-xl"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select onValueChange={(value) => setValue('payment_status', value)} defaultValue="pending">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit ($)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  {...register('deposit_amount', { valueAsNumber: true })}
                  className="rounded-xl"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking_method">Booking Method</Label>
                <Select onValueChange={(value) => setValue('booking_method', value)} defaultValue="admin">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {watchPaymentStatus === 'paid' && (
              <div className="space-y-2 mt-3">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select onValueChange={(value) => setValue('payment_method', value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? 'Booking...' : 'Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
