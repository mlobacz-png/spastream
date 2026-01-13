'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Globe, Copy, Check, Mail } from 'lucide-react';

interface ClientPortalAccessProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientPortalAccess({
  clientId,
  clientName,
  clientEmail,
  open,
  onOpenChange,
}: ClientPortalAccessProps) {
  const [portalAccess, setPortalAccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(clientEmail);

  useEffect(() => {
    if (open && clientId) {
      fetchPortalAccess();
    }
  }, [open, clientId]);

  const fetchPortalAccess = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_portal_access')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (data) {
      setPortalAccess(data);
      setEmail(data.email);
    }
    setLoading(false);
  };

  const handleCreateAccess = async () => {
    if (!email) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('client_portal_access')
      .insert([{
        client_id: clientId,
        email: email,
        is_active: true,
      }])
      .select()
      .single();

    if (!error && data) {
      setPortalAccess(data);
    }
    setLoading(false);
  };

  const handleToggleAccess = async () => {
    if (!portalAccess) return;

    setLoading(true);
    const { data } = await supabase
      .from('client_portal_access')
      .update({ is_active: !portalAccess.is_active })
      .eq('id', portalAccess.id)
      .select()
      .single();

    if (data) {
      setPortalAccess(data);
    }
    setLoading(false);
  };

  const getPortalUrl = () => {
    if (!portalAccess) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/portal?token=${portalAccess.access_token}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getPortalUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    const portalUrl = getPortalUrl();
    const subject = 'Your Client Portal Access';
    const body = `Hi ${clientName},\n\nYou now have access to your client portal where you can:\n\n• View your appointment history\n• Rebook your favorite services\n• Manage your profile\n• View your package balances\n• Access your before/after photos\n\nAccess your portal here:\n${portalUrl}\n\nIf you have any questions, please don't hesitate to reach out!\n\nBest regards`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client Portal Access</DialogTitle>
          <DialogDescription>
            Give {clientName} access to their client portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!portalAccess ? (
            <>
              <Alert>
                <Globe className="w-4 h-4" />
                <AlertDescription>
                  The client portal allows clients to view their appointment history, rebook services,
                  manage their profile, check package balances, and access their before/after photos.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Client Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">
                  This email will be used for portal notifications
                </p>
              </div>

              <Button
                onClick={handleCreateAccess}
                disabled={!email || loading}
                className="w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {loading ? 'Creating...' : 'Create Portal Access'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Portal Status</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {portalAccess.last_login
                        ? `Last login: ${new Date(portalAccess.last_login).toLocaleString()}`
                        : 'Never logged in'}
                    </p>
                  </div>
                  <Badge
                    variant={portalAccess.is_active ? 'default' : 'outline'}
                    className={portalAccess.is_active ? 'bg-green-100 text-green-700 border-green-200' : ''}
                  >
                    {portalAccess.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Portal URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getPortalUrl()}
                      readOnly
                      className="rounded-xl font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                      className="rounded-xl flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Share this URL with the client to access their portal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    value={portalAccess.access_token}
                    readOnly
                    className="rounded-xl font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Clients can also use this token to log in directly
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleToggleAccess}
                    disabled={loading}
                    className="flex-1 rounded-full"
                  >
                    {portalAccess.is_active ? 'Disable Access' : 'Enable Access'}
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
