import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  service: string;
  start_time: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', tomorrow.toISOString())
      .lte('start_time', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .in('status', ['confirmed', 'pending']);

    if (apptError) throw apptError;

    const remindersCreated = [];

    for (const appointment of appointments || []) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, email, phone')
        .eq('id', appointment.client_id)
        .single();

      if (!client || !client.email) continue;

      const { data: existingReminder } = await supabase
        .from('appointment_reminders')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('status', 'pending')
        .single();

      if (existingReminder) continue;

      const reminderTime = new Date(appointment.start_time);
      reminderTime.setHours(reminderTime.getHours() - 24);

      const { data: reminder, error: reminderError } = await supabase
        .from('appointment_reminders')
        .insert({
          user_id: user.id,
          appointment_id: appointment.id,
          reminder_type: 'email',
          scheduled_for: reminderTime.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (!reminderError && reminder) {
        remindersCreated.push({
          appointmentId: appointment.id,
          clientName: client.name,
          scheduledFor: reminderTime,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${remindersCreated.length} reminder(s)`,
        reminders: remindersCreated,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
