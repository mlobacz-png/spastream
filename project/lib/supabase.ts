import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-kviciiartofmqbsbrqii-auth-token',
  },
});

export interface Treatment {
  service: string;
  date: string;
  notes: string;
  provider?: string;
}

export interface ClientNote {
  id: string;
  text: string;
  created_at: string;
  type: 'general' | 'medical' | 'consent';
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  dob?: string;
  photo_url: string;
  treatments: Treatment[];
  notes: ClientNote[];
  consents: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  service: string;
  start_time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'no-show' | 'cancelled';
  notes: string;
  price?: number;
  amount_paid?: number;
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method?: string;
  payment_date?: string;
  payment_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  user_id: string;
  name: string;
  description: string;
  service: string;
  total_sessions: number;
  price: number;
  validity_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPackage {
  id: string;
  user_id: string;
  client_id: string;
  package_id: string;
  sessions_remaining: number;
  purchase_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface AppointmentReminder {
  id: string;
  user_id: string;
  appointment_id: string;
  reminder_type: 'email' | 'sms' | 'both';
  scheduled_for: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  client_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  specializations: string[];
  hourly_rate: number;
  commission_rate: number;
  hire_date: string;
  photo_url?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffWeeklySchedule {
  id: string;
  user_id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffTimeOff {
  id: string;
  user_id: string;
  staff_member_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface TreatmentRoom {
  id: string;
  user_id: string;
  name: string;
  room_type: string;
  equipment: string[];
  max_capacity: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface RoomBooking {
  id: string;
  user_id: string;
  room_id: string;
  appointment_id?: string;
  staff_member_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_use' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface TreatmentNotesTemplate {
  id: string;
  user_id: string;
  name: string;
  service_type: string;
  template_content?: string;
  sections: any[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function logAuditEvent(
  action: string,
  clientId?: string,
  details?: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_log').insert([{
    user_id: user.id,
    client_id: clientId,
    action,
    details: details || {},
    ip_address: '',
  }]);
}
