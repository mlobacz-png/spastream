'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppointmentDialog } from './appointment-dialog';
import { supabase, Appointment, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { CalendarDays, Plus, Clock, User, TrendingUp, BarChart3, Edit, Trash2, Grid3x3, List } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    service: string;
    clientName: string;
    clientId: string;
    notes: string;
    status: string;
    duration: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'from-blue-400 to-cyan-500';
    case 'completed': return 'from-green-400 to-emerald-500';
    case 'cancelled': return 'from-slate-400 to-slate-500';
    case 'no-show': return 'from-red-400 to-rose-500';
    default: return 'from-purple-400 to-pink-500';
  }
};

export function CalendarSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [view, setView] = useState<View>('week');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({});
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;

    const [appointmentsRes, clientsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time'),
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (appointmentsRes.data) setAppointments(appointmentsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => {
      const client = clients.find((c) => c.id === apt.client_id);
      const start = new Date(apt.start_time);
      const end = addMinutes(start, apt.duration);

      return {
        id: apt.id,
        title: `${client?.name || 'Unknown'} - ${apt.service}`,
        start,
        end,
        resource: {
          service: apt.service,
          clientName: client?.name || 'Unknown',
          clientId: apt.client_id,
          notes: apt.notes,
          status: apt.status,
          duration: apt.duration,
        },
      };
    });
  }, [appointments, clients]);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setDefaultDate(slotInfo.start);
    setDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const appointment = appointments.find(apt => apt.id === event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setEditFormData(appointment);
      setDetailsOpen(true);
      setEditMode(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    await supabase
      .from('appointments')
      .delete()
      .eq('id', selectedAppointment.id);

    setDeleteDialogOpen(false);
    setDetailsOpen(false);
    setSelectedAppointment(null);
    await fetchData();
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    await supabase
      .from('appointments')
      .update({
        start_time: editFormData.start_time,
        duration: editFormData.duration,
        service: editFormData.service,
        notes: editFormData.notes,
        status: editFormData.status,
        price: editFormData.price,
        amount_paid: editFormData.amount_paid,
        payment_status: editFormData.payment_status,
        payment_method: editFormData.payment_method,
        payment_date: editFormData.payment_status === 'paid' && !selectedAppointment.payment_date
          ? new Date().toISOString()
          : editFormData.payment_date,
      })
      .eq('id', selectedAppointment.id);

    setEditMode(false);
    setDetailsOpen(false);
    setSelectedAppointment(null);
    await fetchData();
  };

  const upcomingCount = appointments.filter(apt => new Date(apt.start_time) >= new Date()).length;
  const todayCount = appointments.filter(apt => {
    const apptDate = new Date(apt.start_time);
    const today = new Date();
    return apptDate.toDateString() === today.toDateString();
  }).length;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthlyCount = appointments.filter(apt => {
    const apptDate = new Date(apt.start_time);
    return apptDate >= monthStart && apptDate <= monthEnd;
  }).length;

  const weekStart = startOfWeekFn(now);
  const weekEnd = endOfWeek(now);
  const weeklyCount = appointments.filter(apt => {
    const apptDate = new Date(apt.start_time);
    return apptDate >= weekStart && apptDate <= weekEnd;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-slate-800">Calendar</h2>
            <p className="text-sm text-slate-600">Manage your appointments and bookings</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setDefaultDate(new Date());
            setDialogOpen(true);
          }}
          className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg">Monthly Stats</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg">Weekly Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Appointments</p>
                <p className="text-3xl font-light text-slate-800">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Today</p>
                <p className="text-3xl font-light text-slate-800">{todayCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Upcoming</p>
                <p className="text-3xl font-light text-slate-800">{upcomingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">This Month</p>
                    <p className="text-4xl font-light text-slate-800 mb-2">{monthlyCount}</p>
                    <p className="text-xs text-slate-500">{format(now, 'MMMM yyyy')}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Avg Per Day</p>
                    <p className="text-4xl font-light text-slate-800 mb-2">
                      {monthlyCount > 0 ? (monthlyCount / now.getDate()).toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-slate-500">Based on {now.getDate()} days</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['confirmed', 'completed', 'cancelled', 'pending'].map(status => {
                  const count = appointments.filter(apt => {
                    const apptDate = new Date(apt.start_time);
                    return apptDate >= monthStart && apptDate <= monthEnd && apt.status === status;
                  }).length;
                  const percentage = monthlyCount > 0 ? (count / monthlyCount * 100).toFixed(0) : 0;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="capitalize rounded-full min-w-[100px] justify-center">
                          {status}
                        </Badge>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-[80px] justify-end">
                        <span className="text-lg font-semibold text-slate-800">{count}</span>
                        <span className="text-sm text-slate-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">This Week</p>
                    <p className="text-4xl font-light text-slate-800 mb-2">{weeklyCount}</p>
                    <p className="text-xs text-slate-500">
                      {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Avg Per Day</p>
                    <p className="text-4xl font-light text-slate-800 mb-2">
                      {weeklyCount > 0 ? (weeklyCount / 7).toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-slate-500">Based on 7 days</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Weekly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['confirmed', 'completed', 'cancelled', 'pending'].map(status => {
                  const count = appointments.filter(apt => {
                    const apptDate = new Date(apt.start_time);
                    return apptDate >= weekStart && apptDate <= weekEnd && apt.status === status;
                  }).length;
                  const percentage = weeklyCount > 0 ? (count / weeklyCount * 100).toFixed(0) : 0;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="capitalize rounded-full min-w-[100px] justify-center">
                          {status}
                        </Badge>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-[80px] justify-end">
                        <span className="text-lg font-semibold text-slate-800">{count}</span>
                        <span className="text-sm text-slate-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {appointments.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-6">
              <CalendarDays className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No appointments yet</h3>
            <p className="text-slate-500 mb-6">Get started by booking your first appointment</p>
            <Button
              onClick={() => {
                setDefaultDate(new Date());
                setDialogOpen(true);
              }}
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book First Appointment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Appointments</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-lg"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg"
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {viewMode === 'calendar' ? (
              <div className="calendar-wrapper">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 650 }}
                  view={view}
                  onView={setView}
                  views={['week', 'day', 'agenda']}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  defaultDate={new Date()}
                  step={15}
                  timeslots={4}
                  eventPropGetter={(event) => ({
                    style: {
                      background: `linear-gradient(135deg, ${getStatusColor(event.resource.status).includes('from-') ?
                        getStatusColor(event.resource.status).split(' ').map(c => c.replace('from-', '#').replace('to-', '#')).join(', ') :
                        '#3b82f6, #06b6d4'})`,
                      borderRadius: '10px',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      padding: '4px 8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    },
                  })}
                />
              </div>
            ) : (
              <div className="space-y-6 max-h-[650px] overflow-y-auto">
                {Object.entries(
                  appointments
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .reduce((groups, apt) => {
                      const date = format(new Date(apt.start_time), 'yyyy-MM-dd');
                      if (!groups[date]) groups[date] = [];
                      groups[date].push(apt);
                      return groups;
                    }, {} as Record<string, typeof appointments>)
                ).map(([date, dayAppointments]) => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-3 sticky top-0 bg-white/80 backdrop-blur py-2 z-10">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex flex-col items-center justify-center">
                          <span className="text-xs text-blue-600 font-medium uppercase">
                            {format(new Date(date), 'MMM')}
                          </span>
                          <span className="text-2xl font-bold text-blue-700">
                            {format(new Date(date), 'd')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-slate-800">
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </h3>
                          <p className="text-sm text-slate-500">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-20">
                        {dayAppointments.map((apt) => {
                          const client = clients.find(c => c.id === apt.client_id);
                          const startTime = new Date(apt.start_time);
                          const endTime = addMinutes(startTime, apt.duration);

                          return (
                            <Card
                              key={apt.id}
                              className="rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => handleSelectEvent(events.find(e => e.id === apt.id)!)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className="flex flex-col items-center min-w-[60px]">
                                      <div className="flex items-center gap-1 text-slate-600">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-sm font-medium">
                                          {format(startTime, 'h:mm a')}
                                        </span>
                                      </div>
                                      <span className="text-xs text-slate-400">
                                        {format(endTime, 'h:mm a')}
                                      </span>
                                      <span className="text-xs text-slate-500 mt-1">
                                        {apt.duration} min
                                      </span>
                                    </div>

                                    <div className="h-full w-px bg-slate-200" />

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-slate-800 truncate">
                                          {client?.name || 'Unknown Client'}
                                        </h4>
                                        <Badge
                                          variant="outline"
                                          className={`capitalize text-xs px-2 py-0 bg-gradient-to-r ${getStatusColor(apt.status)} text-white border-0`}
                                        >
                                          {apt.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-600 mb-2">{apt.service}</p>
                                      {apt.notes && (
                                        <p className="text-xs text-slate-500 line-clamp-2">{apt.notes}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-slate-800">
                                      ${(apt.price || 0).toFixed(0)}
                                    </p>
                                    {apt.payment_status && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {apt.payment_status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAppointmentAdded={fetchData}
        defaultDate={defaultDate}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editMode ? 'Edit Appointment' : 'Appointment Details'}
            </DialogTitle>
            <DialogDescription>
              {editMode ? 'Update appointment information' : 'View and manage this appointment'}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {!editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Client</Label>
                      <p className="text-base font-medium text-slate-800 mt-1">
                        {clients.find(c => c.id === selectedAppointment.client_id)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Status</Label>
                      <Badge className="mt-1 capitalize" variant="outline">
                        {selectedAppointment.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Date & Time</Label>
                      <p className="text-base font-medium text-slate-800 mt-1">
                        {format(new Date(selectedAppointment.start_time), 'PPP p')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Duration</Label>
                      <p className="text-base font-medium text-slate-800 mt-1">
                        {selectedAppointment.duration} minutes
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-slate-600">Service</Label>
                    <p className="text-base font-medium text-slate-800 mt-1">
                      {selectedAppointment.service}
                    </p>
                  </div>

                  {selectedAppointment.notes && (
                    <div>
                      <Label className="text-sm text-slate-600">Notes</Label>
                      <p className="text-base text-slate-700 mt-1">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-600">Price</Label>
                        <p className="text-base font-medium text-slate-800 mt-1">
                          ${(selectedAppointment.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">Amount Paid</Label>
                        <p className="text-base font-medium text-green-600 mt-1">
                          ${(selectedAppointment.amount_paid || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">Payment Status</Label>
                        <Badge className="mt-1 capitalize" variant="outline">
                          {selectedAppointment.payment_status || 'pending'}
                        </Badge>
                      </div>
                      {selectedAppointment.payment_method && (
                        <div>
                          <Label className="text-sm text-slate-600">Payment Method</Label>
                          <p className="text-base font-medium text-slate-800 mt-1 capitalize">
                            {selectedAppointment.payment_method}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={editFormData.start_time ? format(new Date(editFormData.start_time), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, start_time: new Date(e.target.value).toISOString() })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={editFormData.duration || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Input
                      value={editFormData.service || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, service: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.price || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount Paid ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.amount_paid || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, amount_paid: parseFloat(e.target.value) || 0 })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select
                          value={editFormData.payment_status}
                          onValueChange={(value) => setEditFormData({ ...editFormData, payment_status: value as 'pending' | 'paid' | 'partial' | 'refunded' })}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={editFormData.payment_method || ''}
                          onValueChange={(value) => setEditFormData({ ...editFormData, payment_method: value })}
                        >
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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!editMode ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="rounded-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-full"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setEditFormData(selectedAppointment!);
                  }}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAppointment}
                  className="rounded-full bg-green-600 hover:bg-green-700"
                >
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              Delete Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .calendar-wrapper {
          border-radius: 16px;
          overflow: hidden;
          background: white;
        }

        .rbc-calendar {
          font-family: inherit;
          background: white;
        }

        .rbc-toolbar {
          padding: 20px;
          margin-bottom: 0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .rbc-toolbar button {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          padding: 10px 18px;
          transition: all 0.2s ease;
          background: white;
          color: #475569;
          font-weight: 500;
          font-size: 0.875rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .rbc-toolbar button:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          color: #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
        }

        .rbc-toolbar-label {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          letter-spacing: -0.025em;
          min-width: 200px;
          text-align: center;
        }

        .rbc-header {
          padding: 18px 12px;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .rbc-header + .rbc-header {
          border-left: 1px solid #e2e8f0;
        }

        .rbc-today {
          background: linear-gradient(to bottom, #eff6ff 0%, #dbeafe 100%);
        }

        .rbc-off-range-bg {
          background-color: #f9fafb;
        }

        .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
          min-height: 48px;
        }

        .rbc-timeslot-group {
          border-left: 1px solid #e2e8f0;
          min-height: 96px;
        }

        .rbc-day-slot .rbc-time-slot:nth-child(2) {
          border-top: 1px solid #cbd5e1;
        }

        .rbc-current-time-indicator {
          background: linear-gradient(90deg, #ef4444, #f97316);
          height: 2px;
          border-radius: 2px;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }

        .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -4px;
          top: -3px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }

        .rbc-time-content {
          border-top: 2px solid #e2e8f0;
          background: white;
        }

        .rbc-time-header-content {
          border-left: 1px solid #e2e8f0;
        }

        .rbc-time-column {
          background: white;
        }

        .rbc-time-column:hover {
          background-color: #f9fafb;
        }

        .rbc-day-slot .rbc-time-slot:hover {
          background-color: rgba(59, 130, 246, 0.02);
        }

        .rbc-time-header-cell {
          min-height: 60px;
        }

        .rbc-label {
          padding: 0 12px;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          position: sticky;
          top: 0;
          background: white;
          border-right: 1px solid #e2e8f0;
        }

        .rbc-time-gutter {
          background: #fafbfc;
        }

        .rbc-event {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .rbc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          z-index: 10;
        }

        .rbc-event-label {
          font-size: 0.7rem;
          font-weight: 600;
          opacity: 0.9;
        }

        .rbc-event-content {
          padding: 4px 6px;
          font-weight: 500;
        }

        .rbc-selected {
          background-color: transparent !important;
        }

        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
        }

        .rbc-agenda-view {
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }

        .rbc-agenda-view table {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .rbc-agenda-table {
          border-spacing: 0;
        }

        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell,
        .rbc-agenda-event-cell {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rbc-agenda-date-cell {
          font-weight: 600;
          color: #334155;
          font-size: 0.95rem;
        }

        .rbc-agenda-time-cell {
          font-size: 0.9rem;
          color: #64748b;
        }

        .rbc-slot-selection {
          background-color: rgba(59, 130, 246, 0.08);
          border: 2px solid #3b82f6;
          border-radius: 6px;
        }

        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #e2e8f0;
        }

        .rbc-time-content > * + * > * {
          border-left: 1px solid #e2e8f0;
        }

        .rbc-addons-dnd .rbc-addons-dnd-resizable {
          position: relative;
        }

        .rbc-show-more {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 4px 8px;
          border-radius: 6px;
          margin: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rbc-show-more:hover {
          background-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .rbc-overlay {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        .rbc-overlay-header {
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
}
