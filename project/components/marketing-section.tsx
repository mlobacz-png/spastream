'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Mail, MessageSquare, Send, TrendingUp, Users, Eye, MousePointer, CheckCircle, Edit, Trash2, Play, Pause, TestTube, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  email_template: string;
  sms_template: string;
  subject_line: string;
  send_method: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  is_active: boolean;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  content: string;
  is_default: boolean;
}

export function MarketingSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [processing, setProcessing] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testCampaignId, setTestCampaignId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'birthday',
    send_method: 'email',
    subject_line: '',
    email_template: '',
    sms_template: '',
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('is_default', true);

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const handleSaveCampaign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const campaignData = {
      user_id: user.id,
      name: formData.name,
      campaign_type: formData.campaign_type,
      send_method: formData.send_method,
      subject_line: formData.subject_line,
      email_template: formData.email_template,
      sms_template: formData.sms_template,
      status: 'draft',
      is_active: false,
    };

    if (selectedCampaign) {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(campaignData)
        .eq('id', selectedCampaign.id);

      if (error) {
        console.error('Error updating campaign:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('marketing_campaigns')
        .insert(campaignData);

      if (error) {
        console.error('Error creating campaign:', error);
        return;
      }
    }

    setDialogOpen(false);
    setSelectedCampaign(null);
    resetForm();
    fetchCampaigns();
  };

  const handleToggleCampaign = async (campaignId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_active: !isActive,
        status: !isActive ? 'active' : 'paused',
      })
      .eq('id', campaignId);

    if (error) {
      console.error('Error toggling campaign:', error);
      return;
    }

    fetchCampaigns();
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      send_method: campaign.send_method,
      subject_line: campaign.subject_line,
      email_template: campaign.email_template,
      sms_template: campaign.sms_template,
    });
    setDialogOpen(true);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('Error deleting campaign:', error);
      return;
    }

    fetchCampaigns();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      campaign_type: 'birthday',
      send_method: 'email',
      subject_line: '',
      email_template: '',
      sms_template: '',
    });
  };

  const handleProcessCampaigns = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/marketing-campaigns?action=process`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Campaign processing complete! ${result.processed} campaigns sent.`);
        fetchCampaigns(); // Refresh to see updated stats
      } else {
        alert(`Error: ${result.error || 'Failed to process campaigns'}`);
      }
    } catch (error) {
      console.error('Error processing campaigns:', error);
      alert('Failed to process campaigns. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTestCampaign = (campaignId: string) => {
    setTestCampaignId(campaignId);
    setTestDialogOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/marketing-campaigns?action=test`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: testCampaignId,
          testEmail: testEmail,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setTestDialogOpen(false);
        setTestEmail('');
      } else {
        alert(`Error: ${result.error || 'Failed to send test email'}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email. Please try again.');
    }
  };

  const useTemplate = (template: Template) => {
    if (template.template_type === 'email') {
      setFormData({ ...formData, email_template: template.content });
    } else {
      setFormData({ ...formData, sms_template: template.content });
    }
  };

  const getTotalStats = () => {
    return campaigns.reduce(
      (acc, campaign) => ({
        sent: acc.sent + campaign.total_sent,
        opened: acc.opened + campaign.total_opened,
        clicked: acc.clicked + campaign.total_clicked,
        converted: acc.converted + campaign.total_converted,
      }),
      { sent: 0, opened: 0, clicked: 0, converted: 0 }
    );
  };

  const stats = getTotalStats();
  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0.0';
  const clickRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : '0.0';
  const conversionRate = stats.sent > 0 ? ((stats.converted / stats.sent) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Marketing Automation</h2>
          <p className="text-sm text-slate-600">Automate campaigns and engage with clients</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleProcessCampaigns}
            disabled={processing}
            variant="outline"
            className="rounded-full"
          >
            <Zap className="w-4 h-4 mr-2" />
            {processing ? 'Processing...' : 'Process Campaigns'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedCampaign(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
              <DialogDescription>
                Set up automated marketing campaigns to engage with your clients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Birthday Special Offer"
                  />
                </div>

                <div>
                  <Label>Campaign Type *</Label>
                  <Select value={formData.campaign_type} onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday Campaign</SelectItem>
                      <SelectItem value="win_back">Win-Back Campaign</SelectItem>
                      <SelectItem value="post_treatment">Post-Treatment Follow-up</SelectItem>
                      <SelectItem value="review_request">Review Request</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="referral">Referral Program</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Send Method *</Label>
                  <Select value={formData.send_method} onValueChange={(value) => setFormData({ ...formData, send_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.send_method === 'email' || formData.send_method === 'both') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Template</Label>
                    <Select onValueChange={(value) => {
                      const template = templates.find(t => t.id === value && t.template_type === 'email');
                      if (template) useTemplate(template);
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Use template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.template_type === 'email').map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Subject Line *</Label>
                    <Input
                      value={formData.subject_line}
                      onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                      placeholder="e.g., Happy Birthday! Special Gift Inside"
                    />
                  </div>

                  <div>
                    <Label>Email Content *</Label>
                    <Textarea
                      value={formData.email_template}
                      onChange={(e) => setFormData({ ...formData, email_template: e.target.value })}
                      placeholder="Use variables: {{client_name}}, {{discount}}, {{practice_name}}"
                      rows={8}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Available variables: &#123;&#123;client_name&#125;&#125;, &#123;&#123;discount&#125;&#125;, &#123;&#123;practice_name&#125;&#125;, &#123;&#123;treatment_name&#125;&#125;
                    </p>
                  </div>
                </div>
              )}

              {(formData.send_method === 'sms' || formData.send_method === 'both') && (
                <div>
                  <Label>SMS Template</Label>
                  <Textarea
                    value={formData.sms_template}
                    onChange={(e) => setFormData({ ...formData, sms_template: e.target.value })}
                    placeholder="Keep it short (160 chars max)"
                    rows={4}
                    maxLength={160}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.sms_template.length}/160 characters
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Automation Rules</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {formData.campaign_type === 'birthday' && (
                    <p>Automatically sent on client birthdays</p>
                  )}
                  {formData.campaign_type === 'win_back' && (
                    <p>Sent to clients who haven&apos;t visited in 90+ days</p>
                  )}
                  {formData.campaign_type === 'post_treatment' && (
                    <p>Sent 7 days after each treatment</p>
                  )}
                  {formData.campaign_type === 'review_request' && (
                    <p>Sent 14 days after treatment completion</p>
                  )}
                  {formData.campaign_type === 'promotional' && (
                    <p>Manual send - select recipients when ready</p>
                  )}
                  {formData.campaign_type === 'referral' && (
                    <p>Sent to clients who refer new clients</p>
                  )}
                </div>
              </div>

              <Button onClick={handleSaveCampaign} className="w-full">
                {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-light">{stats.sent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-light">{openRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-violet-600" />
              <span className="text-2xl font-light">{clickRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <span className="text-2xl font-light">{conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full p-1">
          <TabsTrigger value="campaigns" className="rounded-full">Campaigns</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-full">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-light">Active Campaigns</CardTitle>
              <CardDescription>Manage your automated marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No campaigns yet. Create your first campaign to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-slate-800">{campaign.name}</h3>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">
                            {campaign.campaign_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex gap-6 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" /> {campaign.total_sent} sent
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {campaign.total_opened} opened
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" /> {campaign.total_clicked} clicked
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {campaign.total_converted} converted
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Created {format(new Date(campaign.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestCampaign(campaign.id)}
                          className="rounded-full"
                          title="Send test email"
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCampaign(campaign.id, campaign.is_active)}
                          className="rounded-full"
                        >
                          {campaign.is_active ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                          className="rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="rounded-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-light">Email & SMS Templates</CardTitle>
              <CardDescription>Pre-built templates for common campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {template.template_type === 'email' ? (
                        <Mail className="w-4 h-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      )}
                      <h3 className="font-medium text-slate-800">{template.name}</h3>
                      {template.is_default && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                      {template.content}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => useTemplate(template)}
                      className="w-full rounded-full"
                    >
                      Use This Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your campaign content before activating
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Email Address</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <Button onClick={handleSendTestEmail} className="w-full">
              Send Test Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
