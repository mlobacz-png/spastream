'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Upload, Image as ImageIcon, X, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClientPhoto {
  id: string;
  storage_path: string;
  photo_type: string;
  caption: string;
  taken_at: string;
  url?: string;
}

interface ClientPhotoUploadProps {
  clientId: string;
  clientName: string;
  photos: ClientPhoto[];
  onPhotosUpdated: () => void;
}

const PHOTO_TYPES = [
  { value: 'before', label: 'Before Treatment', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'after', label: 'After Treatment', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'treatment', label: 'During Treatment', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'consultation', label: 'Consultation', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export function ClientPhotoUpload({ clientId, clientName, photos, onPhotosUpdated }: ClientPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [photoType, setPhotoType] = useState('before');
  const [caption, setCaption] = useState('');
  const [takenAt, setTakenAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('client_photos').insert([{
        user_id: user.id,
        client_id: clientId,
        storage_path: filePath,
        photo_type: photoType,
        caption: caption,
        taken_at: new Date(takenAt).toISOString(),
      }]);

      if (dbError) throw dbError;

      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      setPhotoType('before');
      setTakenAt(format(new Date(), 'yyyy-MM-dd'));
      onPhotosUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: ClientPhoto) => {
    if (!user) return;

    try {
      await supabase.storage.from('client-photos').remove([photo.storage_path]);
      await supabase.from('client_photos').delete().eq('id', photo.id);
      onPhotosUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  const getPhotoTypeInfo = (type: string) => {
    return PHOTO_TYPES.find(pt => pt.value === type) || PHOTO_TYPES[4];
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="photo-upload" className="text-sm font-medium text-slate-700">
              Select Photo
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              {selectedFile && (
                <span className="text-sm text-slate-600">{selectedFile.name}</span>
              )}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border-2 border-slate-200">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={clearSelection}
                className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="photo-type" className="text-sm font-medium text-slate-700">
                Photo Type
              </Label>
              <Select value={photoType} onValueChange={setPhotoType}>
                <SelectTrigger id="photo-type" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taken-at" className="text-sm font-medium text-slate-700">
                Date Taken
              </Label>
              <Input
                id="taken-at"
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-medium text-slate-700">
              Caption (Optional)
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description or notes about this photo..."
              className="rounded-xl"
              rows={3}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            Photo Gallery ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No photos uploaded yet</p>
              <p className="text-sm text-slate-400 mt-1">Upload treatment photos to track progress</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => {
                const typeInfo = getPhotoTypeInfo(photo.photo_type);
                return (
                  <Card key={photo.id} className="rounded-xl overflow-hidden border border-slate-200 group">
                    <div className="relative aspect-square">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={photo.caption || typeInfo.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(photo)}
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <Badge className={`rounded-full border mb-2 ${typeInfo.color}`}>
                        {typeInfo.label}
                      </Badge>
                      {photo.caption && (
                        <p className="text-sm text-slate-700 mb-2 line-clamp-2">{photo.caption}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(photo.taken_at), 'MMM dd, yyyy')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
