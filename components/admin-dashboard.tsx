"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Activity, AlertCircle, Search, Eye, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";

interface SpaAccount {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  client_count?: number;
  appointment_count?: number;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  details: any;
  created_at: string;
  admin_email?: string;
}

interface BusinessInfo {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  number_of_employees: number;
  business_type: string;
  website: string | null;
  created_at: string;
  user_email?: string;
}

export function AdminDashboard() {
  const router = useRouter();
  const [spaAccounts, setSpaAccounts] = useState<SpaAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpas: 0,
    totalClients: 0,
    totalAppointments: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;

      const enrichedAccounts = await Promise.all(
        users.map(async (user) => {
          const { count: clientCount } = await supabase
            .from("clients")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { count: appointmentCount } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          return {
            id: user.id,
            email: user.email || "",
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || "",
            client_count: clientCount || 0,
            appointment_count: appointmentCount || 0,
          };
        })
      );

      setSpaAccounts(enrichedAccounts);

      const totalClients = enrichedAccounts.reduce((sum, acc) => sum + (acc.client_count || 0), 0);
      const totalAppointments = enrichedAccounts.reduce((sum, acc) => sum + (acc.appointment_count || 0), 0);

      setStats({
        totalSpas: enrichedAccounts.length,
        totalClients,
        totalAppointments,
      });

      const { data: logs, error: logsError } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!logsError && logs) {
        const enrichedLogs = await Promise.all(
          logs.map(async (log) => {
            const user = users.find(u => u.id === log.admin_user_id);
            return {
              ...log,
              admin_email: user?.email || "Unknown",
            };
          })
        );
        setAuditLogs(enrichedLogs);
      }

      const { data: businessData, error: businessError } = await supabase
        .from("business_information")
        .select("*")
        .order("created_at", { ascending: false });

      if (!businessError && businessData) {
        const enrichedBusinessInfo = businessData.map((info) => {
          const user = users.find(u => u.id === info.user_id);
          return {
            ...info,
            user_email: user?.email || "Unknown",
          };
        });
        setBusinessInfo(enrichedBusinessInfo);
      }
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (action: string, targetUserId: string, tableName?: string) => {
    try {
      await supabase.rpc("log_admin_action", {
        p_action: action,
        p_target_user_id: targetUserId,
        p_table_name: tableName,
        p_details: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error("Error logging admin action:", error);
    }
  };

  const viewSpaAccount = async (spaId: string) => {
    await logAdminAction("view_spa_account", spaId);
    toast.success("Viewing spa account (feature in development)");
  };

  const filteredAccounts = spaAccounts.filter((account) =>
    account.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBusinessInfo = businessInfo.filter((info) =>
    info.business_name.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
    info.full_name.toLowerCase().includes(businessSearchQuery.toLowerCase()) ||
    info.user_email?.toLowerCase().includes(businessSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage and monitor all spa accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/revenue')}>
            Platform Revenue
          </Button>
          <Button onClick={() => router.push('/admin/subscribers')}>
            View All Subscribers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpas}</div>
            <p className="text-xs text-muted-foreground">Active spa accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Across all spas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">All-time bookings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Spa Accounts</TabsTrigger>
          <TabsTrigger value="business">Business Information</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spa Accounts</CardTitle>
              <CardDescription>View and manage all registered spas</CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.email}</TableCell>
                      <TableCell>{account.client_count}</TableCell>
                      <TableCell>{account.appointment_count}</TableCell>
                      <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {account.last_sign_in_at
                          ? new Date(account.last_sign_in_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSpaAccount(account.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>View detailed business information from all signups</CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by business name, owner, or email..."
                  value={businessSearchQuery}
                  onChange={(e) => setBusinessSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredBusinessInfo.map((info) => (
                  <Card key={info.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            {info.business_name}
                          </CardTitle>
                          <CardDescription>
                            Owner: {info.full_name} • Account: {info.user_email}
                          </CardDescription>
                        </div>
                        <Badge>{info.business_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-slate-600">{info.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-slate-600">{info.phone}</p>
                            </div>
                          </div>
                          {info.website && (
                            <div className="flex items-start gap-2">
                              <Globe className="h-4 w-4 text-slate-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Website</p>
                                <a
                                  href={info.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {info.website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Address</p>
                              <p className="text-sm text-slate-600">
                                {info.address_line1}
                                {info.address_line2 && `, ${info.address_line2}`}
                                <br />
                                {info.city}, {info.state} {info.zip_code}
                                <br />
                                {info.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Employees</p>
                              <p className="text-sm text-slate-600">{info.number_of_employees}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-xs text-slate-500">
                          Signed up: {new Date(info.created_at).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredBusinessInfo.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No business information available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all admin actions and access</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.table_name || "N/A"}</TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No audit logs yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
