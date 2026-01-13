'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, User, Package, Image as ImageIcon, Clock, DollarSign, Mail, Phone, LogOut, CalendarPlus } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  photo_url?: string;
}

interface Appointment {
  id: string;
  service: string;
  start_time: string;
  duration: number;
  status: string;
  price?: number;
  notes?: string;
}

interface ClientPackage {
  id: string;
  sessions_remaining: number;
  purchase_date: string;
  expiry_date: string;
  status: string;
  package: {
    name: string;
    service: string;
    total_sessions: number;
  };
}

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string;
  treatment_area: string;
  taken_date: string;
  notes?: string;
}

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [medspaSlug, setMedspaSlug] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAccessToken(token);
      handleLogin(token);
    }
  }, [searchParams]);

  const handleLogin = async (token?: string) => {
    setLoading(true);
    setError('');
    const tokenToUse = token || accessToken;

    const { data: portalAccess, error: accessError } = await supabase
      .from('client_portal_access')
      .select('*, client:clients(*)')
      .eq('access_token', tokenToUse)
      .eq('is_active', true)
      .single();

    if (accessError || !portalAccess) {
      setError('Invalid access token. Please contact your medspa for access.');
      setLoading(false);
      return;
    }

    await supabase
      .from('client_portal_access')
      .update({ last_login: new Date().toISOString() })
      .eq('id', portalAccess.id);

    setClientData(portalAccess.client);
    setIsAuthenticated(true);
    await fetchPortalData(portalAccess.client.id);
    await fetchMedspaSlug(portalAccess.client.user_id);
    setLoading(false);
  };

  const fetchPortalData = async (clientId: string) => {
    const [appointmentsRes, packagesRes, photosRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false }),
      supabase
        .from('client_packages')
        .select('*, package:packages(*)')
        .eq('client_id', clientId)
        .eq('status', 'active'),
      supabase
        .from('client_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('taken_date', { ascending: false }),
    ]);

    if (appointmentsRes.data) setAppointments(appointmentsRes.data);
    if (packagesRes.data) setPackages(packagesRes.data as any);
    if (photosRes.data) setPhotos(photosRes.data);
  };

  const fetchMedspaSlug = async (userId: string) => {
    const { data } = await supabase
      .from('booking_settings')
      .select('booking_url_slug, enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.booking_url_slug && data.enabled) {
      setMedspaSlug(data.booking_url_slug);
    }
  };

  const handleUpdateProfile = async (updates: Partial<ClientData>) => {
    if (!clientData) return;

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientData.id);

    if (!error) {
      setClientData({ ...clientData, ...updates });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClientData(null);
    setAccessToken('');
    setAppointments([]);
    setPackages([]);
    setPhotos([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Enter your access token to view your appointment history and manage your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="rounded-xl"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button
                onClick={() => handleLogin()}
                disabled={!accessToken || loading}
                className="w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {loading ? 'Logging in...' : 'Access Portal'}
              </Button>
              <p className="text-xs text-center text-slate-500">
                Don't have an access token? Contact your medspa to get portal access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => !isPast(new Date(apt.start_time)));
  const pastAppointments = appointments.filter(apt => isPast(new Date(apt.start_time)));
  const activePackages = packages.filter(pkg => pkg.status === 'active' && !isPast(new Date(pkg.expiry_date)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-light text-slate-800">Welcome, {clientData?.name?.split(' ')[0]}</h1>
              <p className="text-xs text-slate-500">Client Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="rounded-full text-slate-600 hover:text-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Upcoming</p>
                  <p className="text-3xl font-light text-slate-800">{upcomingAppointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Packages</p>
                  <p className="text-3xl font-light text-slate-800">{activePackages.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Visits</p>
                  <p className="text-3xl font-light text-slate-800">{pastAppointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full p-1 shadow-lg">
            <TabsTrigger value="appointments" className="rounded-full">Appointments</TabsTrigger>
            <TabsTrigger value="book" className="rounded-full">Book Appointment</TabsTrigger>
            <TabsTrigger value="packages" className="rounded-full">Packages</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-full">Photos</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Upcoming Appointments</h3>
              <div className="space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <Card className="rounded-2xl border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No upcoming appointments</p>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <Card key={apt.id} className="rounded-xl border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-slate-800">{apt.service}</h4>
                              <Badge variant="outline" className="capitalize">
                                {apt.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(apt.start_time), 'PPP')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(apt.start_time), 'p')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {apt.duration} min
                              </div>
                            </div>
                            {apt.notes && (
                              <p className="text-sm text-slate-500 mt-2">{apt.notes}</p>
                            )}
                          </div>
                          {apt.price && (
                            <div className="text-right">
                              <p className="text-lg font-semibold text-slate-800">
                                ${apt.price.toFixed(0)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Past Appointments</h3>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((apt) => (
                  <Card key={apt.id} className="rounded-xl border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-800">{apt.service}</h4>
                            <Badge variant="outline" className="capitalize">
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(apt.start_time), 'PPP')}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => window.location.href = `/book?service=${encodeURIComponent(apt.service)}`}
                        >
                          Rebook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="book" className="space-y-4">
            {medspaSlug ? (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarPlus className="w-5 h-5" />
                    Book New Appointment
                  </CardTitle>
                  <CardDescription>
                    Schedule your next visit with us
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={`/book/${medspaSlug}`}
                    className="w-full h-[600px] border-0 rounded-xl"
                    title="Book Appointment"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <CalendarPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Online booking is not available yet</p>
                  <p className="text-sm text-slate-500 mt-2">Please contact us to schedule an appointment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            {activePackages.length === 0 ? (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No active packages</p>
                </CardContent>
              </Card>
            ) : (
              activePackages.map((pkg) => (
                <Card key={pkg.id} className="rounded-2xl border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">{pkg.package.name}</h3>
                        <p className="text-sm text-slate-600">{pkg.package.service}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Sessions Remaining</span>
                        <span className="text-lg font-semibold text-slate-800">
                          {pkg.sessions_remaining} / {pkg.package.total_sessions}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all"
                          style={{
                            width: `${(pkg.sessions_remaining / pkg.package.total_sessions) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Purchased: {format(new Date(pkg.purchase_date), 'MMM d, yyyy')}</span>
                        <span>Expires: {format(new Date(pkg.expiry_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {photos.length === 0 ? (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No photos available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <div className="aspect-square relative bg-slate-100">
                      <img
                        src={photo.photo_url}
                        alt={`${photo.photo_type} - ${photo.treatment_area}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {photo.photo_type}
                        </Badge>
                        <Badge variant="outline">
                          {photo.treatment_area}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {format(new Date(photo.taken_date), 'MMM d, yyyy')}
                      </p>
                      {photo.notes && (
                        <p className="text-sm text-slate-600 mt-2">{photo.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={clientData?.name || ''}
                    onChange={(e) => setClientData({ ...clientData!, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={clientData?.email || ''}
                        onChange={(e) => setClientData({ ...clientData!, email: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={clientData?.phone || ''}
                        onChange={(e) => setClientData({ ...clientData!, phone: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={clientData?.dob || ''}
                    onChange={(e) => setClientData({ ...clientData!, dob: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  onClick={() => handleUpdateProfile({
                    name: clientData?.name,
                    email: clientData?.email,
                    phone: clientData?.phone,
                    dob: clientData?.dob,
                  })}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ClientPortal() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ClientPortalContent />
    </Suspense>
  );
}
