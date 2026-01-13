'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Shield, AlertTriangle, CheckCircle, XCircle, Scan } from 'lucide-react';

interface ComplianceScan {
  id: string;
  scan_type: string;
  content: string;
  state: string;
  risks: any[];
  severity: string;
  status: string;
  created_at: string;
}

const STATE_REGULATIONS = {
  CA: [
    'No before/after photos without disclaimer',
    'No claims of permanence',
    'Must disclose provider credentials',
    'Cannot guarantee results',
  ],
  NY: [
    'Must be licensed medical professional',
    'No testimonials without consent',
    'Pricing must be transparent',
  ],
  TX: [
    'Board-certified oversight required',
    'No false advertising',
    'Medical records must be maintained',
  ],
  FL: [
    'Physician supervision required',
    'No deceptive practices',
    'Age restrictions must be stated',
  ],
};

export function AICompliance() {
  const [scans, setScans] = useState<ComplianceScan[]>([]);
  const [content, setContent] = useState('');
  const [scanType, setScanType] = useState('ad');
  const [state, setState] = useState('CA');
  const [scanning, setScanning] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchScans();
  }, [user]);

  const fetchScans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('compliance_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setScans(data);
  };

  const analyzeContent = (text: string, selectedState: string): any[] => {
    const risks = [];
    const lowerText = text.toLowerCase();

    if (selectedState === 'CA') {
      if (lowerText.includes('before') && lowerText.includes('after')) {
        risks.push({
          issue: 'Before/After Claims Detected',
          description: 'California prohibits before/after photos in medical spa advertising without proper disclaimers',
          severity: 'high',
          recommendation: 'Add disclaimer: "Results may vary. Not a guarantee of outcomes."',
        });
      }
      if (lowerText.includes('permanent') || lowerText.includes('forever')) {
        risks.push({
          issue: 'Permanence Claims',
          description: 'Claims of permanent results are not allowed in CA',
          severity: 'critical',
          recommendation: 'Replace with "long-lasting" or "extended duration"',
        });
      }
      if (lowerText.includes('guaranteed') || lowerText.includes('guarantee')) {
        risks.push({
          issue: 'Guaranteed Results',
          description: 'Cannot guarantee specific outcomes',
          severity: 'high',
          recommendation: 'Remove guarantee language or add disclaimer',
        });
      }
    }

    if (lowerText.includes('fda approved') && !lowerText.includes('fda-approved device')) {
      risks.push({
        issue: 'Misleading FDA Claims',
        description: 'Must specify FDA approval is for device, not procedure',
        severity: 'medium',
        recommendation: 'Clarify: "FDA-approved device" not "FDA-approved procedure"',
      });
    }

    if (lowerText.includes('cheap') || lowerText.includes('discount') || lowerText.includes('sale')) {
      risks.push({
        issue: 'Price Advertising',
        description: 'Be cautious with price advertising in medical contexts',
        severity: 'low',
        recommendation: 'Ensure pricing is clear and not deceptive',
      });
    }

    return risks;
  };

  const runScan = async () => {
    if (!user || !content.trim()) return;
    setScanning(true);

    const risks = analyzeContent(content, state);
    const severity = risks.some(r => r.severity === 'critical') ? 'critical' :
                    risks.some(r => r.severity === 'high') ? 'high' :
                    risks.some(r => r.severity === 'medium') ? 'medium' : 'low';

    const { error } = await supabase.from('compliance_scans').insert([{
      user_id: user.id,
      scan_type: scanType,
      content,
      state,
      risks,
      severity,
      status: risks.length > 0 ? 'pending' : 'reviewed',
    }]);

    if (!error) {
      setContent('');
      await fetchScans();
    }

    setScanning(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-5 h-5" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">AI Compliance Auditor</h2>
          <p className="text-sm text-slate-600">Scan ads, emails, and website content for regulatory compliance</p>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium">New Compliance Scan</CardTitle>
          <CardDescription>Automatically flags potential regulatory risks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Content Type</label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ad">Advertisement</SelectItem>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="website">Website Content</SelectItem>
                  <SelectItem value="social">Social Media Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">State</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Content to Scan</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your ad copy, email, or website content here..."
              className="rounded-xl min-h-32"
            />
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Key {state} Regulations: {STATE_REGULATIONS[state as keyof typeof STATE_REGULATIONS]?.join(' • ')}
            </AlertDescription>
          </Alert>

          <Button
            onClick={runScan}
            disabled={scanning || !content.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
          >
            <Scan className="w-4 h-4 mr-2" />
            {scanning ? 'Scanning...' : 'Run Compliance Scan'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Recent Scans</h3>
        {scans.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No scans yet. Run your first compliance check above.</p>
            </CardContent>
          </Card>
        ) : (
          scans.map((scan) => (
            <Card key={scan.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full">{scan.scan_type}</Badge>
                    <Badge variant="outline" className="rounded-full">{scan.state}</Badge>
                    <Badge className={`rounded-full border ${getSeverityColor(scan.severity)}`}>
                      {getSeverityIcon(scan.severity)}
                      <span className="ml-1">{scan.severity}</span>
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{scan.content}</p>

                {scan.risks.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Issues Found: {scan.risks.length}</h4>
                    {scan.risks.map((risk, idx) => (
                      <Alert key={idx} className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-medium text-orange-900">{risk.issue}</p>
                            <p className="text-sm text-orange-800">{risk.description}</p>
                            <p className="text-sm text-orange-700 mt-2">
                              <strong>Fix:</strong> {risk.recommendation}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      No compliance issues detected. Content appears compliant with {scan.state} regulations.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
