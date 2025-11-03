'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { BookingRequests } from './booking-requests';
import { Globe, Clock, Settings, Plus, Trash2, Copy, CheckCircle, ExternalLink, Code, CalendarPlus } from 'lucide-react';

interface Service {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface BookingSettings {
  id: string;
  enabled: boolean;
  business_name: string;
  booking_url_slug: string;
  logo_url: string;
  primary_color: string;
  services_offered: Service[];
  booking_buffer_minutes: number;
  advance_booking_days: number;
  min_notice_hours: number;
  business_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  blocked_dates: string[];
  require_phone: boolean;
  require_email: boolean;
  confirmation_message: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function BookingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newService, setNewService] = useState<Service>({ name: '', duration: 60, price: 0 });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings(data);
    } else {
      const defaultSlug = `practice-${user.id.slice(0, 8)}`;
      setSettings({
        id: '',
        enabled: false,
        business_name: '',
        booking_url_slug: defaultSlug,
        logo_url: '',
        primary_color: '#3b82f6',
        services_offered: [],
        booking_buffer_minutes: 15,
        advance_booking_days: 30,
        min_notice_hours: 2,
        business_hours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
        blocked_dates: [],
        require_phone: true,
        require_email: true,
        confirmation_message: 'Thank you for booking! We will send you a confirmation shortly.',
      });
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    if (!user || !settings) return;

    setSaving(true);

    try {
      if (settings.id) {
        const { error } = await supabase
          .from('booking_settings')
          .update({
            enabled: settings.enabled,
            business_name: settings.business_name,
            booking_url_slug: settings.booking_url_slug,
            logo_url: settings.logo_url,
            primary_color: settings.primary_color,
            services_offered: settings.services_offered,
            booking_buffer_minutes: settings.booking_buffer_minutes,
            advance_booking_days: settings.advance_booking_days,
            min_notice_hours: settings.min_notice_hours,
            business_hours: settings.business_hours,
            blocked_dates: settings.blocked_dates,
            require_phone: settings.require_phone,
            require_email: settings.require_email,
            confirmation_message: settings.confirmation_message,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('booking_settings')
          .insert([{
            user_id: user.id,
            enabled: settings.enabled,
            business_name: settings.business_name,
            booking_url_slug: settings.booking_url_slug,
            logo_url: settings.logo_url,
            primary_color: settings.primary_color,
            services_offered: settings.services_offered,
            booking_buffer_minutes: settings.booking_buffer_minutes,
            advance_booking_days: settings.advance_booking_days,
            min_notice_hours: settings.min_notice_hours,
            business_hours: settings.business_hours,
            blocked_dates: settings.blocked_dates,
            require_phone: settings.require_phone,
            require_email: settings.require_email,
            confirmation_message: settings.confirmation_message,
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSettings({ ...settings, id: data.id });
        }
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!settings || !newService.name) return;

    setSettings({
      ...settings,
      services_offered: [...settings.services_offered, newService],
    });

    setNewService({ name: '', duration: 60, price: 0 });
  };

  const removeService = (index: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      services_offered: settings.services_offered.filter((_, i) => i !== index),
    });
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      business_hours: {
        ...settings.business_hours,
        [day]: {
          ...settings.business_hours[day],
          [field]: value,
        },
      },
    });
  };

  const copyBookingUrl = () => {
    if (!settings) return;
    const url = `${window.location.origin}/book/${settings.booking_url_slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEmbedCode = () => {
    if (!settings) return '';
    const url = `${window.location.origin}/book/${settings.booking_url_slug}`;
    return `<iframe src="${url}" width="100%" height="800" frameborder="0"></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  if (!settings) return null;

  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${settings.booking_url_slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Online Booking</h2>
          <p className="text-sm text-slate-600">Configure your public booking page</p>
        </div>
      </div>

      {settings.enabled && (
        <Alert className="border-green-200 bg-green-50 rounded-2xl">
          <Globe className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Your booking page is live!</strong>
            <div className="flex items-center gap-2 mt-2">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline flex items-center gap-1">
                {bookingUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyBookingUrl}
                className="h-6 px-2"
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full">
          <TabsTrigger value="requests" className="rounded-full">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-full">General</TabsTrigger>
          <TabsTrigger value="services" className="rounded-full">Services</TabsTrigger>
          <TabsTrigger value="hours" className="rounded-full">Business Hours</TabsTrigger>
          <TabsTrigger value="embed" className="rounded-full">Embed Code</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <BookingRequests />
        </TabsContent>

        <TabsContent value="general">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">General Settings</CardTitle>
              <CardDescription>Configure your booking page basics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label className="text-base font-medium">Enable Online Booking</Label>
                  <p className="text-sm text-slate-600">Allow clients to book appointments online</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="rounded-xl"
                  placeholder="Your Medical Spa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_url_slug">Booking URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">/book/</span>
                  <Input
                    id="booking_url_slug"
                    value={settings.booking_url_slug}
                    onChange={(e) => setSettings({ ...settings, booking_url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="rounded-xl flex-1"
                    placeholder="your-practice"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color">Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-20 h-10 rounded-xl"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buffer">Buffer Time (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    value={settings.booking_buffer_minutes}
                    onChange={(e) => setSettings({ ...settings, booking_buffer_minutes: parseInt(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advance">Advance Booking (days)</Label>
                  <Input
                    id="advance"
                    type="number"
                    value={settings.advance_booking_days}
                    onChange={(e) => setSettings({ ...settings, advance_booking_days: parseInt(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice">Min Notice (hours)</Label>
                  <Input
                    id="notice"
                    type="number"
                    value={settings.min_notice_hours}
                    onChange={(e) => setSettings({ ...settings, min_notice_hours: parseInt(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Require Phone Number</Label>
                  <Switch
                    checked={settings.require_phone}
                    onCheckedChange={(require_phone) => setSettings({ ...settings, require_phone })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Email Address</Label>
                  <Switch
                    checked={settings.require_email}
                    onCheckedChange={(require_email) => setSettings({ ...settings, require_email })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirmation Message</Label>
                <Textarea
                  id="confirmation"
                  value={settings.confirmation_message}
                  onChange={(e) => setSettings({ ...settings, confirmation_message: e.target.value })}
                  className="rounded-xl"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Services Offered</CardTitle>
              <CardDescription>Add services clients can book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {settings.services_offered.map((service, idx) => (
                  <Card key={idx} className="rounded-xl border border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{service.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                            <span>{service.duration} minutes</span>
                            <span>•</span>
                            <span>${service.price}</span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(idx)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Service Name"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newService.description || ''}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      className="rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Duration (min)"
                        value={newService.duration}
                        onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                        className="rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={addService}
                      disabled={!newService.name}
                      className="w-full rounded-xl"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Business Hours</CardTitle>
              <CardDescription>Set your availability for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={settings.business_hours[day]?.enabled}
                      onCheckedChange={(enabled) => updateBusinessHours(day, 'enabled', enabled)}
                    />
                    <span className="font-medium text-slate-800 capitalize w-24">{day}</span>
                  </div>
                  {settings.business_hours[day]?.enabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={settings.business_hours[day]?.start}
                        onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                        className="rounded-xl w-32"
                      />
                      <span className="text-slate-600">to</span>
                      <Input
                        type="time"
                        value={settings.business_hours[day]?.end}
                        onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                        className="rounded-xl w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Embed Code</CardTitle>
              <CardDescription>Add this code to your website to embed the booking widget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Direct Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={bookingUrl}
                    readOnly
                    className="rounded-xl font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={copyBookingUrl}
                    className="rounded-xl"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Embed Code (iframe)</Label>
                <div className="relative">
                  <Textarea
                    value={getEmbedCode()}
                    readOnly
                    className="rounded-xl font-mono text-sm"
                    rows={4}
                  />
                  <Button
                    variant="outline"
                    onClick={copyEmbedCode}
                    className="absolute top-2 right-2 rounded-lg"
                    size="sm"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 rounded-xl">
                <Code className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  Copy and paste this code into your website to embed the booking widget. You can adjust the width and height as needed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          onClick={saveSettings}
          disabled={saving || !settings.business_name || !settings.booking_url_slug}
          className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
