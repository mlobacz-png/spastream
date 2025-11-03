'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { canAddClient } from '@/lib/subscription-utils';
import { useToast } from '@/hooks/use-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  dob: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  onClientAdded: () => void;
}

export function ClientDialog({ onClientAdded }: ClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      const { allowed, message } = await canAddClient();
      if (!allowed) {
        toast({
          title: 'Client Limit Reached',
          description: message,
          variant: 'destructive',
        });
        return;
      }
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      const { allowed, message } = await canAddClient();
      if (!allowed) {
        toast({
          title: 'Client Limit Reached',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('clients').insert([
        {
          user_id: user.id,
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          dob: data.dob || null,
          photo_url: data.photo_url || '',
          treatments: [],
          notes: [],
          consents: {},
        },
      ]);

      if (error) throw error;

      reset();
      setOpen(false);
      onClientAdded();
      toast({
        title: 'Success',
        description: 'Client added successfully',
      });
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: 'Error',
        description: 'Failed to add client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
          <UserPlus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Jane Doe"
              className="rounded-xl"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="jane@example.com"
              className="rounded-xl"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              {...register('dob')}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              {...register('photo_url')}
              placeholder="https://images.unsplash.com/..."
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
