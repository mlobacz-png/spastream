'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientPhotoUpload } from './client-photo-upload';
import { ClientPortalAccess } from './client-portal-access';
import { supabase, Client, Treatment, logAuditEvent } from '@/lib/supabase';
import { Calendar, FileText, History, X, Plus, User, Image as ImageIcon, Globe, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClientProfileProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ClientProfile({ clientId, open, onOpenChange, onUpdate }: ClientProfileProps) {
  console.log('ClientProfile component rendered - VERSION 2.0 WITH DELETE BUTTON');
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTreatment, setNewTreatment] = useState({ service: '', notes: '' });
  const [photos, setPhotos] = useState<any[]>([]);
  const [portalAccessOpen, setPortalAccessOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (clientId && open) {
      fetchClient();
      fetchPhotos();
      logAuditEvent('VIEW_CLIENT', clientId, { action: 'opened_profile' });
    }
  }, [clientId, open]);

  const fetchClient = async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();
    if (data) setClient(data);
    setLoading(false);
  };

  const fetchPhotos = async () => {
    if (!clientId) return;

    const { data: photoData } = await supabase
      .from('client_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('taken_at', { ascending: false });

    if (photoData) {
      const photosWithUrls = await Promise.all(
        photoData.map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('client-photos')
            .createSignedUrl(photo.storage_path, 60 * 60);
          return { ...photo, url: urlData?.signedUrl };
        })
      );
      setPhotos(photosWithUrls);
    }
  };

  const addNote = async () => {
    if (!client || !newNote.trim()) return;

    const updatedNotes = [
      ...(client.notes || []),
      {
        id: crypto.randomUUID(),
        text: newNote,
        created_at: new Date().toISOString(),
        type: 'general' as const,
      },
    ];

    const { error } = await supabase
      .from('clients')
      .update({ notes: updatedNotes })
      .eq('id', client.id);

    if (!error) {
      setClient({ ...client, notes: updatedNotes });
      setNewNote('');
      logAuditEvent('ADD_NOTE', client.id, { note_length: newNote.length });
      onUpdate();
    }
  };

  const addTreatment = async () => {
    if (!client || !newTreatment.service.trim()) return;

    const treatment: Treatment = {
      service: newTreatment.service,
      date: new Date().toISOString(),
      notes: newTreatment.notes,
    };

    const updatedTreatments = [...(client.treatments || []), treatment];

    const { error } = await supabase
      .from('clients')
      .update({ treatments: updatedTreatments })
      .eq('id', client.id);

    if (!error) {
      setClient({ ...client, treatments: updatedTreatments });
      setNewTreatment({ service: '', notes: '' });
      logAuditEvent('ADD_TREATMENT', client.id, { service: treatment.service });
      onUpdate();
    }
  };

  const deleteClient = async () => {
    if (!client) return;

    setDeleting(true);

    // Delete client photos from storage first
    if (photos.length > 0) {
      const photoPaths = photos.map(photo => photo.storage_path);
      await supabase.storage.from('client-photos').remove(photoPaths);
    }

    // Delete client record
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (!error) {
      logAuditEvent('DELETE_CLIENT', client.id, { client_name: client.name });
      onUpdate();
      onOpenChange(false);
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  if (!client) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl rounded-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 animate-pulse" />
            <p className="text-2xl font-bold text-red-600 ml-4">LOADING CLIENT DATA...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const age = client.dob ? new Date().getFullYear() - new Date(client.dob).getFullYear() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={client.photo_url || ''} alt={client.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-2xl">
                  {client.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-light truncate">{client.name}</DialogTitle>
                <div className="flex items-center gap-3 text-sm text-slate-600 mt-1 flex-wrap">
                  {age && <span>{age} years old</span>}
                  {client.phone && <span>• {client.phone}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('Delete button clicked');
                  setDeleteDialogOpen(true);
                }}
                className="rounded-full"
                data-test-delete-button="true"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setPortalAccessOpen(true)}
                className="rounded-full"
              >
                <Globe className="w-4 h-4 mr-2" />
                Portal Access
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="bg-slate-100 rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-full">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="treatments" className="rounded-full">
              <History className="w-4 h-4 mr-2" />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-full">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <p className="text-slate-800 mt-1">{client.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Phone</Label>
                    <p className="text-slate-800 mt-1">{client.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Date of Birth</Label>
                    <p className="text-slate-800 mt-1">
                      {client.dob ? format(new Date(client.dob), 'MMM dd, yyyy') : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Client Since</Label>
                    <p className="text-slate-800 mt-1">{format(new Date(client.created_at), 'MMM yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Treatment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Total Treatments: <span className="font-semibold text-slate-800">{client.treatments?.length || 0}</span>
                </p>
                {client.treatments && client.treatments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Array.from(new Set(client.treatments.map(t => t.service))).map(service => (
                      <Badge key={service} variant="secondary" className="rounded-full">
                        {service}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 mt-4">
            <ClientPhotoUpload
              clientId={client.id}
              clientName={client.name}
              photos={photos}
              onPhotosUpdated={fetchPhotos}
            />
          </TabsContent>

          <TabsContent value="treatments" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Add Treatment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="treatment-service">Service</Label>
                  <Input
                    id="treatment-service"
                    value={newTreatment.service}
                    onChange={(e) => setNewTreatment({ ...newTreatment, service: e.target.value })}
                    placeholder="e.g., Botox, Dermal Filler"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="treatment-notes">Notes</Label>
                  <Textarea
                    id="treatment-notes"
                    value={newTreatment.notes}
                    onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                    placeholder="Treatment details..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={addTreatment}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Treatment
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {client.treatments && client.treatments.length > 0 ? (
                client.treatments.slice().reverse().map((treatment, idx) => (
                  <Card key={idx} className="rounded-2xl border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-800">{treatment.service}</h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(new Date(treatment.date), 'MMM dd, yyyy')}
                          </p>
                          {treatment.notes && (
                            <p className="text-sm text-slate-600 mt-2">{treatment.notes}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">No treatments recorded yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this client..."
                  className="rounded-xl"
                  rows={4}
                />
                <Button
                  onClick={addNote}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {client.notes && client.notes.length > 0 ? (
                client.notes.slice().reverse().map((note) => (
                  <Card key={note.id} className="rounded-2xl border-slate-200">
                    <CardContent className="pt-4">
                      <p className="text-slate-700">{note.text}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(note.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">No notes added yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ClientPortalAccess
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        open={portalAccessOpen}
        onOpenChange={setPortalAccessOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all data for this client. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteClient}
              disabled={deleting}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
