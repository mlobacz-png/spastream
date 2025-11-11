'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Plus, Pencil, Trash2, DollarSign, Clock, Tag, Globe, CheckCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: string;
  available_for_online_booking: boolean;
  requires_consultation: boolean;
  deposit_required: boolean;
  deposit_amount: number;
  active: boolean;
  display_order: number;
}

const CATEGORIES = [
  { value: 'injectables', label: 'Injectables' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'laser', label: 'Laser Treatments' },
  { value: 'body', label: 'Body Treatments' },
  { value: 'consultation', label: 'Consultations' },
  { value: 'other', label: 'Other' },
  { value: 'general', label: 'General' },
];

export function ServicesSection() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category: 'general',
    available_for_online_booking: true,
    requires_consultation: false,
    deposit_required: false,
    deposit_amount: 0,
    active: true,
  });

  useEffect(() => {
    fetchServices();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        category: service.category,
        available_for_online_booking: service.available_for_online_booking,
        requires_consultation: service.requires_consultation,
        deposit_required: service.deposit_required,
        deposit_amount: service.deposit_amount,
        active: service.active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 0,
        category: 'general',
        available_for_online_booking: true,
        requires_consultation: false,
        deposit_required: false,
        deposit_amount: 0,
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!user) return;

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([{
            ...formData,
            user_id: user.id,
            display_order: services.length,
          }]);

        if (error) throw error;
      }

      setDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchServices();
    }
  };

  const handleToggleActive = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .update({ active: !service.active })
      .eq('id', service.id);

    if (!error) {
      fetchServices();
    }
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-900">Services</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage your treatment offerings and pricing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Botox, Hydrafacial"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the service..."
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit Amount ($)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                    className="rounded-xl"
                    disabled={!formData.deposit_required}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Service</Label>
                    <p className="text-xs text-slate-500">Show in appointment booking</p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Available for Online Booking</Label>
                    <p className="text-xs text-slate-500">Show on public booking page</p>
                  </div>
                  <Switch
                    checked={formData.available_for_online_booking}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, available_for_online_booking: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requires Consultation</Label>
                    <p className="text-xs text-slate-500">Client must book consultation first</p>
                  </div>
                  <Switch
                    checked={formData.requires_consultation}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_consultation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Deposit</Label>
                    <p className="text-xs text-slate-500">Collect deposit when booking</p>
                  </div>
                  <Switch
                    checked={formData.deposit_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, deposit_required: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveService}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  disabled={!formData.name}
                >
                  {editingService ? 'Update' : 'Add'} Service
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Alert>
          <AlertDescription>
            No services yet. Add your first service to start booking appointments.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className={`rounded-2xl ${!service.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-slate-900">{service.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find((c) => c.value === service.category)?.label}
                      </Badge>
                      {!service.active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-slate-600 mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {service.duration_minutes} min
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${service.price}
                      </div>
                      {service.deposit_required && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          ${service.deposit_amount} deposit
                        </div>
                      )}
                      {service.available_for_online_booking && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Globe className="h-4 w-4" />
                          Online
                        </div>
                      )}
                      {service.requires_consultation && (
                        <Badge variant="outline" className="text-xs">
                          Consultation Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(service)}
                      className="rounded-xl"
                    >
                      {service.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(service)}
                      className="rounded-xl"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                      className="rounded-xl text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
