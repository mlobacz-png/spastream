'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, logAuditEvent } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface ImportedClient {
  name: string;
  phone?: string;
  email?: string;
  dob?: string;
  photo_url?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface ImportClientsProps {
  onImportComplete: () => void;
}

export function ImportClients({ onImportComplete }: ImportClientsProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [clients, setClients] = useState<ImportedClient[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const { user } = useAuth();

  const downloadTemplate = () => {
    const template = 'name,phone,email,dob,photo_url\nJane Doe,(555) 123-4567,jane@example.com,1990-01-15,https://images.unsplash.com/photo-1494790108377-be9c29b29330\nJohn Smith,(555) 234-5678,john@example.com,1985-05-20,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medspaflow-client-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ImportedClient[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const phoneIndex = headers.indexOf('phone');
    const emailIndex = headers.indexOf('email');
    const dobIndex = headers.indexOf('dob');
    const photoIndex = headers.indexOf('photo_url');

    if (nameIndex === -1) {
      return [];
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        name: values[nameIndex] || '',
        phone: phoneIndex !== -1 ? values[phoneIndex] : '',
        email: emailIndex !== -1 ? values[emailIndex] : '',
        dob: dobIndex !== -1 ? values[dobIndex] : '',
        photo_url: photoIndex !== -1 ? values[photoIndex] : '',
        status: 'pending' as const,
      };
    }).filter(client => client.name);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    const text = await selectedFile.text();
    const parsed = parseCSV(text);

    if (parsed.length === 0) {
      alert('No valid clients found in CSV. Make sure your file has a "name" column.');
      return;
    }

    setClients(parsed);
    setImportComplete(false);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateDate = (date: string): boolean => {
    if (!date) return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  };

  const importClients = async () => {
    if (!user || clients.length === 0) return;
    setImporting(true);

    const updatedClients = [...clients];

    for (let i = 0; i < updatedClients.length; i++) {
      const client = updatedClients[i];

      if (!validateEmail(client.email || '')) {
        updatedClients[i] = {
          ...client,
          status: 'error',
          error: 'Invalid email format',
        };
        continue;
      }

      if (!validateDate(client.dob || '')) {
        updatedClients[i] = {
          ...client,
          status: 'error',
          error: 'Invalid date format (use YYYY-MM-DD)',
        };
        continue;
      }

      try {
        const { error } = await supabase.from('clients').insert([{
          user_id: user.id,
          name: client.name,
          phone: client.phone || '',
          email: client.email || '',
          dob: client.dob || null,
          photo_url: client.photo_url || '',
          treatments: [],
          notes: [],
          consents: {},
        }]);

        if (error) throw error;

        updatedClients[i] = {
          ...client,
          status: 'success',
        };
      } catch (error: any) {
        updatedClients[i] = {
          ...client,
          status: 'error',
          error: error.message || 'Failed to import',
        };
      }

      setClients([...updatedClients]);
    }

    const successCount = updatedClients.filter(c => c.status === 'success').length;
    await logAuditEvent('BULK_IMPORT', undefined, {
      total: updatedClients.length,
      successful: successCount,
      failed: updatedClients.length - successCount,
    });

    setImporting(false);
    setImportComplete(true);
    onImportComplete();
  };

  const resetImport = () => {
    setFile(null);
    setClients([]);
    setImportComplete(false);
  };

  const successCount = clients.filter(c => c.status === 'success').length;
  const errorCount = clients.filter(c => c.status === 'error').length;
  const pendingCount = clients.filter(c => c.status === 'pending').length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetImport();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-slate-300">
          <Upload className="w-4 h-4 mr-2" />
          Import Clients
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Import Client List</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Upload a CSV file with your client list. Download the template below to see the required format.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {!file ? (
            <Card className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
              <CardContent className="pt-6">
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mb-4" />
                  <span className="text-lg font-medium text-slate-700 mb-2">
                    Choose CSV file
                  </span>
                  <span className="text-sm text-slate-500">
                    or drag and drop here
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{clients.length} clients found</p>
                  </div>
                </div>
                {!importComplete && (
                  <Button
                    variant="ghost"
                    onClick={resetImport}
                    className="rounded-full"
                  >
                    Change File
                  </Button>
                )}
              </div>

              {clients.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="rounded-full">
                        {pendingCount} Pending
                      </Badge>
                    )}
                    {successCount > 0 && (
                      <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">
                        {successCount} Imported
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">
                        {errorCount} Failed
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3">
                    {clients.map((client, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{client.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            {client.email && <span>{client.email}</span>}
                            {client.phone && <span>• {client.phone}</span>}
                          </div>
                          {client.error && (
                            <p className="text-xs text-red-600 mt-1">{client.error}</p>
                          )}
                        </div>
                        <div>
                          {client.status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {client.status === 'error' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {client.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!importComplete ? (
                <Button
                  onClick={importClients}
                  disabled={importing || clients.length === 0}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12"
                >
                  {importing ? (
                    <>Importing {successCount + errorCount} / {clients.length}...</>
                  ) : (
                    <>Import {clients.length} Clients</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      Import complete! {successCount} clients imported successfully.
                      {errorCount > 0 && ` ${errorCount} failed - check errors above.`}
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => {
                      resetImport();
                      setOpen(false);
                    }}
                    className="w-full rounded-xl"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
