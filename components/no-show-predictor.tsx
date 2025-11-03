'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase, Appointment, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { TrendingUp, AlertTriangle, CheckCircle, Send, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';

interface PredictionData {
  id: string;
  appointment_id: string;
  client_id: string;
  no_show_probability: number;
  risk_factors: any;
  reminder_sent: boolean;
  outcome: string;
  appointment?: Appointment;
  client?: Client;
}

export function NoShowPredictor() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [apptRes, clientRes, predRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time'),
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('booking_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (apptRes.data) setUpcomingAppointments(apptRes.data);
    if (clientRes.data) setClients(clientRes.data);
    if (predRes.data) setPredictions(predRes.data);
  };

  const calculateNoShowProbability = (appointment: Appointment, client: Client): number => {
    let probability = 0.15;

    const apptTime = new Date(appointment.start_time);
    const now = new Date();
    const hoursUntil = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) probability += 0.10;
    if (hoursUntil < 12) probability += 0.15;

    if (appointment.status === 'confirmed') probability -= 0.05;

    const dayOfWeek = apptTime.getDay();
    if (dayOfWeek === 1) probability += 0.08;
    if (dayOfWeek === 0 || dayOfWeek === 6) probability += 0.05;

    const hour = apptTime.getHours();
    if (hour < 9 || hour > 17) probability += 0.07;

    if (!client.phone) probability += 0.12;
    if (!client.email) probability += 0.08;

    const treatmentCount = client.treatments?.length || 0;
    if (treatmentCount === 0) probability += 0.15;
    else if (treatmentCount > 5) probability -= 0.10;

    return Math.min(Math.max(probability, 0), 0.99);
  };

  const getRiskFactors = (appointment: Appointment, client: Client, probability: number) => {
    const factors = [];
    const apptTime = new Date(appointment.start_time);
    const hoursUntil = (apptTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) factors.push('Within 24 hours');
    if (apptTime.getDay() === 1) factors.push('Monday appointment');
    if (!client.phone) factors.push('No phone number');
    if ((client.treatments?.length || 0) === 0) factors.push('New client');
    if (apptTime.getHours() < 9 || apptTime.getHours() > 17) factors.push('Off-peak hours');

    return factors;
  };

  const analyzeUpcoming = async () => {
    if (!user) return;
    setAnalyzing(true);

    try {
      const session = await supabase.auth.getSession();
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/no-show-predictor`;

      for (const appt of upcomingAppointments) {
        const client = clients.find(c => c.id === appt.client_id);
        if (!client) continue;

        const existing = predictions.find(p => p.appointment_id === appt.id);
        if (existing) continue;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: client.id,
            appointmentDate: appt.start_time,
            treatmentType: appt.service,
          }),
        });

        if (response.ok) {
          const prediction = await response.json();
          await supabase.from('booking_predictions').insert([{
            user_id: user.id,
            appointment_id: appt.id,
            client_id: client.id,
            no_show_probability: prediction.riskScore / 100,
            risk_factors: {
              factors: prediction.factors || [],
              recommendations: prediction.recommendations || [],
              riskLevel: prediction.riskLevel,
            },
            reminder_sent: false,
            outcome: 'pending',
          }]);
        }
      }

      await fetchData();
    } catch (error) {
      console.error('Error analyzing appointments:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const sendReminder = async (predictionId: string) => {
    await supabase
      .from('booking_predictions')
      .update({ reminder_sent: true })
      .eq('id', predictionId);
    await fetchData();
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.5) return { level: 'High', color: 'bg-red-100 text-red-700 border-red-200' };
    if (probability >= 0.3) return { level: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { level: 'Low', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const enrichedPredictions = predictions.map(pred => {
    const appointment = upcomingAppointments.find(a => a.id === pred.appointment_id);
    const client = clients.find(c => c.id === pred.client_id);
    return { ...pred, appointment, client };
  }).filter(p => p.appointment && p.client);

  const highRiskCount = enrichedPredictions.filter(p => p.no_show_probability >= 0.5).length;
  const avgProbability = enrichedPredictions.length > 0
    ? (enrichedPredictions.reduce((sum, p) => sum + p.no_show_probability, 0) / enrichedPredictions.length * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">No-Show Predictor</h2>
          <p className="text-sm text-slate-600">AI predicts no-show risk and sends smart reminders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming</p>
                <p className="text-3xl font-light text-slate-800">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">High Risk</p>
                <p className="text-3xl font-light text-slate-800">{highRiskCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Risk</p>
                <p className="text-3xl font-light text-slate-800">{avgProbability}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Risk Analysis</CardTitle>
            <Button
              onClick={analyzeUpcoming}
              disabled={analyzing || upcomingAppointments.length === 0}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Appointments'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrichedPredictions.length === 0 ? (
            <Alert className="border-blue-200 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Click "Analyze Appointments" to predict no-show risks for upcoming appointments.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {enrichedPredictions.map((pred) => {
                const risk = getRiskLevel(pred.no_show_probability);
                return (
                  <Card key={pred.id} className="rounded-xl border border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{pred.client?.name}</h4>
                          <p className="text-sm text-slate-600 mt-1">
                            {pred.appointment?.service} • {format(new Date(pred.appointment?.start_time || ''), 'MMM dd, h:mm a')}
                          </p>
                        </div>
                        <Badge className={`rounded-full border ${risk.color}`}>
                          {risk.level} Risk: {(pred.no_show_probability * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      {pred.risk_factors?.factors?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-2">Risk Factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {pred.risk_factors.factors.map((factor: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs rounded-full">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => sendReminder(pred.id)}
                          disabled={pred.reminder_sent}
                          className="rounded-full"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          {pred.reminder_sent ? 'Reminder Sent' : 'Send Reminder'}
                        </Button>
                        {pred.reminder_sent && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
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
