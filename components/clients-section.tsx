'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClientDialog } from './client-dialog';
import { ClientProfile } from './client-profile';
import { ImportClients } from './import-clients';
import { supabase, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Mail, Phone, User, Search, X } from 'lucide-react';

export function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-light text-slate-800">Clients</h2>
        <div className="flex items-center gap-3">
          <ImportClients onImportComplete={fetchClients} />
          <ClientDialog onClientAdded={fetchClients} />
        </div>
      </div>

      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 rounded-full border-slate-200 focus:border-blue-400 focus:ring-blue-400 h-12 text-base shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {clients.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No clients yet. Add your first client to get started.</p>
          </CardContent>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-700 font-medium mb-1">No clients found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => {
                setSelectedClientId(client.id);
                setProfileOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.photo_url || ''} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white">
                      {client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium">{client.name}</CardTitle>
                    {client.treatments && client.treatments.length > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs rounded-full">
                        {client.treatments.length} treatment{client.treatments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientProfile
        clientId={selectedClientId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onUpdate={fetchClients}
      />
    </div>
  );
}
