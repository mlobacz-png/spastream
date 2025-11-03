"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Send, Settings, MessageCircle, AlertCircle, CheckCircle, ExternalLink, Phone } from "lucide-react";
import { format } from "date-fns";

interface SMSSettings {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  enabled: boolean;
  auto_appointment_reminders: boolean;
  reminder_hours_before: number;
  reminder_template: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Conversation {
  id: string;
  client_id: string;
  client_phone: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  clients?: { name: string };
}

interface Message {
  id: string;
  direction: string;
  message_body: string;
  status: string;
  created_at: string;
}

export function SMSSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [settings, setSettings] = useState<SMSSettings>({
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_phone_number: "",
    enabled: false,
    auto_appointment_reminders: true,
    reminder_hours_before: 24,
    reminder_template: "Hi {{client_name}}! This is a reminder about your {{service}} appointment tomorrow at {{time}}. Reply CONFIRM to confirm or call us to reschedule. - {{business_name}}",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [quickSend, setQuickSend] = useState({
    client_id: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchData = async () => {
    if (!user) return;

    const [settingsRes, clientsRes, conversationsRes] = await Promise.all([
      supabase.from("sms_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("clients").select("id, name, phone").eq("user_id", user.id),
      supabase
        .from("sms_conversations")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false }),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
    }

    if (clientsRes.data) {
      setClients(clientsRes.data.filter((c) => c.phone));
    }

    if (conversationsRes.data) {
      setConversations(conversationsRes.data as any);
    }

    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    const { data } = await supabase
      .from("sms_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("client_id", conversation.client_id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);

      if (conversation.unread_count > 0) {
        await supabase
          .from("sms_conversations")
          .update({ unread_count: 0 })
          .eq("id", conversationId);
        fetchData();
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    setShowSuccess(false);

    const { error } = await supabase
      .from("sms_settings")
      .upsert({ ...settings, user_id: user.id }, { onConflict: "user_id" });

    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleSendMessage = async (clientId: string, message: string) => {
    if (!user || !message.trim()) return;

    setSendingMessage(true);

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: client.phone,
          message: message,
          clientId: clientId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        setQuickSend({ client_id: "", message: "" });
        fetchData();
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }

    setSendingMessage(false);
  };

  const isTwilioConfigured = settings.twilio_account_sid && settings.twilio_auth_token && settings.twilio_phone_number;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">SMS settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageCircle className="h-4 w-4 mr-2" />
            Conversations
            {conversations.filter((c) => c.unread_count > 0).length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            Quick Send
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To enable SMS functionality, you need a Twilio account. Sign up for free at{" "}
              <a
                href="https://www.twilio.com/try-twilio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-medium"
              >
                twilio.com/try-twilio <ExternalLink className="h-3 w-3" />
              </a>
              <br />
              Cost: ~$0.0079 per SMS in the US. Free trial includes $15 credit.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-cyan-600" />
                Twilio Configuration
              </CardTitle>
              <CardDescription>Connect your Twilio account for SMS messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilio_account_sid">Account SID</Label>
                <Input
                  id="twilio_account_sid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={settings.twilio_account_sid}
                  onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                />
                <p className="text-xs text-gray-500">Found in your Twilio Console dashboard</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_auth_token">Auth Token</Label>
                <Input
                  id="twilio_auth_token"
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={settings.twilio_auth_token}
                  onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                />
                <p className="text-xs text-gray-500">Keep this secret! Found in Twilio Console</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_phone_number">Twilio Phone Number</Label>
                <Input
                  id="twilio_phone_number"
                  placeholder="+15551234567"
                  value={settings.twilio_phone_number}
                  onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
                />
                <p className="text-xs text-gray-500">Format: +1 followed by 10 digits (US)</p>
              </div>

              {isTwilioConfigured && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">Twilio is configured!</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Enable SMS System</p>
                  <p className="text-sm text-gray-500">Allow sending and receiving SMS messages</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  disabled={!isTwilioConfigured}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Reminders</CardTitle>
              <CardDescription>Automated SMS reminders for appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Send Reminders</p>
                  <p className="text-sm text-gray-500">Automatically send SMS reminders</p>
                </div>
                <Switch
                  checked={settings.auto_appointment_reminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_appointment_reminders: checked })
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_hours_before">Send Reminder (hours before)</Label>
                <Input
                  id="reminder_hours_before"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.reminder_hours_before}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder_hours_before: parseInt(e.target.value) || 24 })
                  }
                  disabled={!settings.auto_appointment_reminders}
                />
                <p className="text-xs text-gray-500">Common: 24 hours (1 day) or 48 hours (2 days)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_template">Reminder Message Template</Label>
                <Textarea
                  id="reminder_template"
                  rows={4}
                  value={settings.reminder_template}
                  onChange={(e) => setSettings({ ...settings, reminder_template: e.target.value })}
                  disabled={!settings.auto_appointment_reminders}
                />
                <p className="text-xs text-gray-500">
                  Available variables: {"{"}
                  {"{"}client_name{"}"}
                  {"}"}, {"{"}
                  {"{"}service{"}"}
                  {"}"}, {"{"}
                  {"{"}time{"}"}
                  {"}"}, {"{"}
                  {"{"}business_name{"}"}
                  {"}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={fetchData} disabled={saving}>
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          {!isTwilioConfigured || !settings.enabled ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure Twilio settings and enable SMS to view conversations.
              </AlertDescription>
            </Alert>
          ) : conversations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No conversations yet. Send your first message!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedConversation === conv.id
                          ? "bg-cyan-50 border-cyan-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{conv.clients?.name || "Unknown"}</span>
                        {conv.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {selectedConversation
                      ? conversations.find((c) => c.id === selectedConversation)?.clients?.name ||
                        "Chat"
                      : "Select a conversation"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.direction === "outbound" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.direction === "outbound"
                                  ? "bg-cyan-500 text-white"
                                  : "bg-white border"
                              }`}
                            >
                              <p className="text-sm">{msg.message_body}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.direction === "outbound" ? "text-cyan-100" : "text-gray-400"
                                }`}
                              >
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const conv = conversations.find((c) => c.id === selectedConversation);
                              if (conv) {
                                handleSendMessage(conv.client_id, newMessage);
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const conv = conversations.find((c) => c.id === selectedConversation);
                            if (conv) {
                              handleSendMessage(conv.client_id, newMessage);
                            }
                          }}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                        <p>Select a conversation to view messages</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          {!isTwilioConfigured || !settings.enabled ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure Twilio settings and enable SMS to send messages.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Send Quick Message</CardTitle>
                <CardDescription>Send a one-time message to any client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={quickSend.client_id}
                    onChange={(e) => setQuickSend({ ...quickSend, client_id: e.target.value })}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={5}
                    placeholder="Type your message here..."
                    value={quickSend.message}
                    onChange={(e) => setQuickSend({ ...quickSend, message: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Character count: {quickSend.message.length} (Standard SMS: 160 chars)
                  </p>
                </div>

                <Button
                  onClick={() => handleSendMessage(quickSend.client_id, quickSend.message)}
                  disabled={sendingMessage || !quickSend.client_id || !quickSend.message.trim()}
                  className="w-full"
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
