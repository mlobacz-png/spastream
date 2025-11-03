'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase, Package } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Package as PackageIcon, Plus, Edit, Trash2, DollarSign, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';

export function PackagesSection() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service: '',
    total_sessions: 1,
    price: 0,
    validity_days: 365,
    active: true,
  });
  const { user } = useAuth();

  const fetchPackages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPackages(data);
  };

  useEffect(() => {
    fetchPackages();
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      service: '',
      total_sessions: 1,
      price: 0,
      validity_days: 365,
      active: true,
    });
    setEditingPackage(null);
  };

  const handleOpenDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description,
        service: pkg.service,
        total_sessions: pkg.total_sessions,
        price: pkg.price,
        validity_days: pkg.validity_days,
        active: pkg.active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSavePackage = async () => {
    if (!user) return;

    if (!formData.name || !formData.service || formData.total_sessions < 1 || formData.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const packageData = {
      user_id: user.id,
      ...formData,
    };

    if (editingPackage) {
      const { error } = await supabase
        .from('packages')
        .update(packageData)
        .eq('id', editingPackage.id);

      if (error) {
        toast.error('Failed to update package');
      } else {
        toast.success('Package updated successfully');
      }
    } else {
      const { error } = await supabase
        .from('packages')
        .insert([packageData]);

      if (error) {
        toast.error('Failed to create package');
      } else {
        toast.success('Package created successfully');
      }
    }

    setDialogOpen(false);
    resetForm();
    await fetchPackages();
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete package');
    } else {
      toast.success('Package deleted successfully');
      await fetchPackages();
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    const { error } = await supabase
      .from('packages')
      .update({ active: !pkg.active })
      .eq('id', pkg.id);

    if (error) {
      toast.error('Failed to update package status');
    } else {
      toast.success(`Package ${!pkg.active ? 'activated' : 'deactivated'}`);
      await fetchPackages();
    }
  };

  const pricePerSession = (price: number, sessions: number) => {
    return (price / sessions).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
            <PackageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-slate-800">Treatment Packages</h2>
            <p className="text-sm text-slate-600">Manage service packages and bundles</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PackageIcon className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-700 font-medium mb-1">No packages yet</p>
            <p className="text-slate-500 text-sm">Create your first treatment package to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all ${
                !pkg.active ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium">{pkg.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{pkg.service}</p>
                  </div>
                  <Badge variant={pkg.active ? 'default' : 'secondary'} className="rounded-full">
                    {pkg.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.description && (
                  <p className="text-sm text-slate-600">{pkg.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{pkg.total_sessions} sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{pkg.validity_days} days</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-semibold text-slate-800">{pkg.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ${pricePerSession(pkg.price, pkg.total_sessions)} per session
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(pkg)}
                    className="flex-1 rounded-full"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(pkg)}
                    className="flex-1 rounded-full"
                  >
                    {pkg.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Update package details' : 'Create a new treatment package bundle'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package Name *</Label>
              <Input
                placeholder="e.g., 3 Botox Sessions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Input
                placeholder="e.g., Botox, Filler, Laser"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Package details and benefits..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Sessions *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.total_sessions}
                  onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || 1 })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Validity (days)</Label>
              <Input
                type="number"
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 365 })}
                className="rounded-xl"
              />
              <p className="text-xs text-slate-500">How long the package is valid after purchase</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <Label className="text-sm font-medium">Active Package</Label>
                <p className="text-xs text-slate-500">Available for purchase</p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>

            {formData.total_sessions > 0 && formData.price > 0 && (
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700">
                  <strong>${pricePerSession(formData.price, formData.total_sessions)}</strong> per session
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePackage}
              className="rounded-full bg-violet-600 hover:bg-violet-700"
            >
              {editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
