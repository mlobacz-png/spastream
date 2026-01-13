'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UploadVideo() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [videoUrl, setVideoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadStatus('error');
      setErrorMessage('Please select a valid video file');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      // Upload to Supabase Storage
      const fileName = 'demo.mp4';
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Replace if exists
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      setVideoUrl(publicUrl);
      setUploadStatus('success');
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Demo Video</CardTitle>
            <CardDescription>
              Upload your demo.mp4 video file. It will be accessible on your landing page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <label htmlFor="video-upload" className="cursor-pointer">
                <div className="text-lg font-medium mb-2">
                  {uploading ? 'Uploading...' : 'Choose Video File'}
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  Click to browse or drag and drop your demo.mp4
                </div>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <Button disabled={uploading} type="button">
                  {uploading ? 'Uploading...' : 'Select File'}
                </Button>
              </label>
            </div>

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-medium mb-2">Video uploaded successfully!</div>
                  <div className="text-sm">
                    Your video is now available at:<br />
                    <code className="bg-green-100 px-2 py-1 rounded text-xs break-all">
                      {videoUrl}
                    </code>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-1">Upload failed</div>
                  <div className="text-sm">{errorMessage}</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Select your demo.mp4 file from your Desktop</li>
                <li>Wait for the upload to complete</li>
                <li>The video will automatically appear on your landing page</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
