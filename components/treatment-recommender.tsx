'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { generateTreatmentPlanPDF } from '@/lib/pdf-generator';
import { Sparkles, Image, CheckCircle, DollarSign, Calendar, Trash2, FileDown } from 'lucide-react';
import { format } from 'date-fns';

interface TreatmentRecommendation {
  id: string;
  client_id: string;
  photo_url: string;
  analysis: any;
  recommendations: any[];
  estimated_cost: number;
  status: string;
  created_at: string;
  client?: Client;
}

const SKIN_CONCERNS = [
  'Fine Lines & Wrinkles',
  'Volume Loss',
  'Skin Texture',
  'Pigmentation',
  'Acne Scarring',
  'Skin Laxity',
];

const TREATMENT_DATABASE = {
  'Fine Lines & Wrinkles': [
    { name: 'Botox', cost: 400, duration: '3-4 months', areas: ['forehead', 'crows feet', 'frown lines'] },
    { name: 'Chemical Peel', cost: 250, duration: '6-8 weeks', areas: ['full face'] },
    { name: 'Microneedling', cost: 350, duration: '4-6 weeks', areas: ['full face'] },
  ],
  'Volume Loss': [
    { name: 'Dermal Fillers', cost: 650, duration: '9-12 months', areas: ['cheeks', 'lips', 'nasolabial'] },
    { name: 'Sculptra', cost: 900, duration: '18-24 months', areas: ['full face'] },
  ],
  'Skin Texture': [
    { name: 'Microneedling', cost: 350, duration: '4-6 weeks', areas: ['full face'] },
    { name: 'Laser Resurfacing', cost: 800, duration: '6-12 months', areas: ['full face'] },
    { name: 'Hydrafacial', cost: 200, duration: '4 weeks', areas: ['full face'] },
  ],
  'Pigmentation': [
    { name: 'Chemical Peel', cost: 250, duration: '6-8 weeks', areas: ['full face'] },
    { name: 'IPL Photofacial', cost: 400, duration: '8-12 weeks', areas: ['full face'] },
  ],
  'Acne Scarring': [
    { name: 'Microneedling', cost: 350, duration: '4-6 weeks', areas: ['full face'] },
    { name: 'CO2 Laser', cost: 1200, duration: '12 months', areas: ['targeted'] },
  ],
  'Skin Laxity': [
    { name: 'Ultherapy', cost: 2500, duration: '12-18 months', areas: ['face and neck'] },
    { name: 'Radiofrequency', cost: 600, duration: '6-8 weeks', areas: ['full face'] },
  ],
};

export function TreatmentRecommender() {
  const [recommendations, setRecommendations] = useState<TreatmentRecommendation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [clientPhotos, setClientPhotos] = useState<any[]>([]);
  const [photoSource, setPhotoSource] = useState<'url' | 'upload'>('upload');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientPhotos(selectedClient);
    } else {
      setClientPhotos([]);
      setSelectedPhoto('');
    }
  }, [selectedClient]);

  const fetchData = async () => {
    if (!user) return;

    const [clientRes, recRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('treatment_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (clientRes.data) setClients(clientRes.data);
    if (recRes.data) setRecommendations(recRes.data);
  };

  const fetchClientPhotos = async (clientId: string) => {
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
      setClientPhotos(photosWithUrls);
    }
  };

  const analyzeAndRecommend = async () => {
    console.log('=== analyzeAndRecommend called ===');
    console.log('User:', user?.id);
    console.log('Selected Client:', selectedClient);
    console.log('Selected Concerns:', selectedConcerns);

    if (!user || !selectedClient || selectedConcerns.length === 0) {
      console.log('Validation failed - missing required fields');
      return;
    }

    setAnalyzing(true);
    setErrorMessage('');

    try {
      const client = clients.find(c => c.id === selectedClient);
      const finalPhotoUrl = photoSource === 'upload' ? selectedPhoto : photoUrl;

      let aiResult = null;

      console.log('Calling treatment recommendations edge function...');

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/treatment-recommendations`;

        const functionResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: selectedClient,
            skinType: client?.notes,
            concerns: selectedConcerns,
            goals: 'Looking to improve overall appearance',
            previousTreatments: [],
          }),
        });

        if (functionResponse.ok) {
          aiResult = await functionResponse.json();
          console.log('AI Result from edge function:', aiResult);
        } else {
          const errorText = await functionResponse.text();
          console.error('Edge function error:', errorText);
          setErrorMessage('AI service error. Using template recommendations.');
        }
      } catch (error) {
        console.error('Error calling edge function:', error);
        setErrorMessage('Failed to connect to AI service. Using template recommendations.');
      }

      const recommendations = aiResult?.recommendations || [];

      let enrichedRecommendations;
      if (recommendations.length > 0) {
        enrichedRecommendations = recommendations.map((rec: any) => ({
          name: rec.treatment,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          expectedResults: rec.expectedResults,
          contraindications: rec.contraindications,
          addressesConcerns: selectedConcerns,
          cost: TREATMENT_DATABASE[selectedConcerns[0] as keyof typeof TREATMENT_DATABASE]?.[0]?.cost || 500,
          duration: '4-6 weeks',
          areas: ['full face'],
        }));
      } else {
        enrichedRecommendations = selectedConcerns.flatMap(concern => {
          const treatments = TREATMENT_DATABASE[concern as keyof typeof TREATMENT_DATABASE] || [];
          return treatments.slice(0, 2).map(treatment => ({
            name: treatment.name,
            confidence: 85,
            reasoning: `Effective treatment for ${concern}`,
            expectedResults: `Improvement in ${concern.toLowerCase()} visible after treatment course`,
            contraindications: 'Consult during consultation',
            addressesConcerns: [concern],
            cost: treatment.cost,
            duration: treatment.duration,
            areas: treatment.areas,
          }));
        });
      }

      const estimatedCost = enrichedRecommendations.reduce((sum: number, t: any) => sum + t.cost, 0);

      const analysis = {
        concerns: selectedConcerns,
        aiAnalysis: aiResult || { note: 'Generated from template' },
        analysisDate: new Date().toISOString(),
      };

      console.log('Inserting into database...');
      const { error } = await supabase.from('treatment_recommendations').insert([{
        user_id: user.id,
        client_id: selectedClient,
        photo_url: finalPhotoUrl,
        analysis,
        recommendations: enrichedRecommendations,
        estimated_cost: estimatedCost,
        status: 'draft',
      }]);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Success! Refreshing data...');
      setSelectedClient('');
      setPhotoUrl('');
      setSelectedPhoto('');
      setSelectedConcerns([]);
      await fetchData();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      setErrorMessage(error.message || 'Failed to generate treatment plan');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearAllPlans = async () => {
    if (!user) return;

    await supabase
      .from('treatment_recommendations')
      .delete()
      .eq('user_id', user.id);

    setShowClearDialog(false);
    await fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('treatment_recommendations')
      .update({ status })
      .eq('id', id);
    await fetchData();
  };

  const handleGeneratePDF = async (rec: TreatmentRecommendation) => {
    if (!rec.client) return;

    await generateTreatmentPlanPDF({
      clientName: rec.client.name,
      createdAt: rec.created_at,
      photoUrl: rec.photo_url,
      concerns: rec.analysis?.concerns || [],
      recommendations: rec.recommendations || [],
      estimatedCost: rec.estimated_cost,
    });
  };

  const toggleConcern = (concern: string) => {
    setSelectedConcerns(prev =>
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'presented': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const enrichedRecommendations = recommendations.map(rec => {
    const client = clients.find(c => c.id === rec.client_id);
    return { ...rec, client };
  }).filter(r => r.client);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Treatment Recommender</h2>
          <p className="text-sm text-slate-600">AI-powered skin analysis and personalized treatment plans</p>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Create Treatment Plan</CardTitle>
          <CardDescription>Select a client and their skin concerns to generate AI recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Client Photo (Optional)</label>
              <Tabs value={photoSource} onValueChange={(v) => setPhotoSource(v as 'url' | 'upload')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="upload" className="rounded-lg">Uploaded Photos</TabsTrigger>
                  <TabsTrigger value="url" className="rounded-lg">Photo URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  {clientPhotos.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl">
                      <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No photos uploaded for this client</p>
                      <p className="text-xs text-slate-400 mt-1">Upload photos in the client profile</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {clientPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo.url || '')}
                          className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedPhoto === photo.url
                              ? 'border-green-500 ring-2 ring-green-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Client photo'}
                            className="w-full h-full object-cover"
                          />
                          {selectedPhoto === photo.url && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <Badge className="absolute bottom-1 left-1 text-xs rounded-full">
                            {photo.photo_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="url" className="mt-3">
                  <Input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="rounded-xl"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Skin Concerns</label>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERNS.map(concern => (
                <Badge
                  key={concern}
                  variant={selectedConcerns.includes(concern) ? "default" : "outline"}
                  className="cursor-pointer rounded-full px-4 py-2"
                  onClick={() => toggleConcern(concern)}
                >
                  {selectedConcerns.includes(concern) && <CheckCircle className="w-3 h-3 mr-1" />}
                  {concern}
                </Badge>
              ))}
            </div>
          </div>

          {errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-sm text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-teal-200 bg-teal-50">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <AlertDescription className="text-sm text-teal-800">
              AI analyzes selected concerns and recommends optimal treatment combinations with cost estimates and timelines.
            </AlertDescription>
          </Alert>

          <Button
            onClick={analyzeAndRecommend}
            disabled={analyzing || !selectedClient || selectedConcerns.length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 h-12"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Generate Treatment Plan'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800">Treatment Plans</h3>
          {enrichedRecommendations.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="rounded-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        {enrichedRecommendations.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No treatment plans yet. Create your first recommendation above.</p>
            </CardContent>
          </Card>
        ) : (
          enrichedRecommendations.map(rec => (
            <Card key={rec.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800 text-lg">{rec.client?.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {format(new Date(rec.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge className={`rounded-full border ${getStatusColor(rec.status)}`}>
                    {rec.status}
                  </Badge>
                </div>

                {rec.photo_url && (
                  <div className="mb-4">
                    <img
                      src={rec.photo_url}
                      alt="Client"
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Concerns:</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.analysis?.concerns?.map((concern: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="rounded-full">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Recommended Treatments:</p>
                  <div className="space-y-3">
                    {rec.recommendations?.map((treatment: any, idx: number) => (
                      <Card key={idx} className="rounded-xl border border-slate-200 bg-gradient-to-r from-teal-50 to-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{treatment.name}</h5>
                              <p className="text-sm text-slate-600 mt-1">
                                Duration: {treatment.duration} • Areas: {treatment.areas?.join(', ')}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {treatment.addressesConcerns?.map((concern: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs rounded-full">
                                    ✓ {concern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-teal-700">${treatment.cost}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <DollarSign className="w-5 h-5" />
                    Total Estimate: ${rec.estimated_cost}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGeneratePDF(rec)}
                      className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Create PDF
                    </Button>
                    {rec.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(rec.id, 'presented')}
                          className="rounded-full"
                        >
                          Present to Client
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(rec.id, 'accepted')}
                          className="rounded-full bg-green-600 hover:bg-green-700"
                        >
                          Mark Accepted
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Treatment Plans?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all treatment plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllPlans}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              Clear All Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
