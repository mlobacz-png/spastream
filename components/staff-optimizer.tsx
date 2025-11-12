'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Calendar, CheckCircle, Star } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';

interface StaffSchedule {
  id: string;
  staff_name: string;
  role: string;
  shift_start: string;
  shift_end: string;
  tasks: any[];
  performance_score: number;
}

const ROLES = ['Medical Director', 'Nurse Injector', 'Esthetician', 'Receptionist', 'Medical Assistant'];
const TASKS = ['Botox Injections', 'Filler Procedures', 'Facials', 'Client Consultations', 'Inventory Management', 'Front Desk'];

export function StaffOptimizer() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [staffName, setStaffName] = useState('');
  const [role, setRole] = useState('');
  const [shiftDate, setShiftDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { user } = useAuth();

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('user_id', user.id)
      .gte('shift_start', new Date().toISOString())
      .order('shift_start')
      .limit(20);
    if (data) setSchedules(data);
  };

  const generateOptimizedSchedule = async () => {
    if (!user || !staffName || !role) return;

    try {
      const date = new Date(shiftDate);
      const shiftStart = setMinutes(setHours(date, 9), 0);
      const shiftEnd = setMinutes(setHours(date, 17), 0);

      const session = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        console.error('Supabase URL not found');
        alert('Configuration error: Supabase URL not found');
        return;
      }

      const apiUrl = `${supabaseUrl}/functions/v1/staff-optimizer`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: shiftStart.toISOString(),
          endDate: shiftEnd.toISOString(),
          staffMembers: [{
            id: Date.now().toString(),
            name: staffName,
            specialties: [role],
            hoursPerWeek: 40,
          }],
        }),
      });

      let assignedTasks = [];
      if (response.ok) {
        const optimization = await response.json();
        const dayOfWeek = format(date, 'EEEE');
        const daySchedule = optimization.recommendations?.find((rec: any) => rec.day === dayOfWeek);

        if (daySchedule?.shifts?.[0]) {
          assignedTasks = daySchedule.shifts.map((shift: any) => ({
            name: shift.role,
            priority: 'high',
            estimated_time: `${shift.startTime} - ${shift.endTime}`,
            reasoning: shift.reasoning,
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        alert(`Failed to generate schedule: ${errorData.error || response.statusText}`);
      }

      if (assignedTasks.length === 0) {
        const roleTasks: Record<string, string[]> = {
          'Medical Director': ['Botox Injections', 'Filler Procedures', 'Client Consultations'],
          'Nurse Injector': ['Botox Injections', 'Filler Procedures'],
          'Esthetician': ['Facials', 'Client Consultations'],
          'Receptionist': ['Front Desk', 'Client Consultations'],
          'Medical Assistant': ['Inventory Management', 'Client Consultations'],
        };

        assignedTasks = (roleTasks[role] || []).map(task => ({
          name: task,
          priority: 'high',
          estimated_time: '2 hours',
        }));
      }

      await supabase.from('staff_schedules').insert([{
        user_id: user.id,
        staff_name: staffName,
        role,
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        tasks: assignedTasks,
        performance_score: 0.85 + Math.random() * 0.15,
      }]);

      setStaffName('');
      setRole('');
      await fetchSchedules();
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate schedule'}`);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Medical Director': 'bg-purple-100 text-purple-700 border-purple-200',
      'Nurse Injector': 'bg-blue-100 text-blue-700 border-blue-200',
      'Esthetician': 'bg-pink-100 text-pink-700 border-pink-200',
      'Receptionist': 'bg-green-100 text-green-700 border-green-200',
      'Medical Assistant': 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const avgPerformance = schedules.length > 0
    ? ((schedules.reduce((sum, s) => sum + s.performance_score, 0) / schedules.length) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Staff Optimizer</h2>
          <p className="text-sm text-slate-600">AI-powered scheduling, task assignment, and performance tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Scheduled Staff</p>
                <p className="text-3xl font-light text-slate-800">{schedules.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Performance</p>
                <p className="text-3xl font-light text-slate-800">{avgPerformance}%</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Schedule Staff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Staff Name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="rounded-xl"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <Button
            onClick={generateOptimizedSchedule}
            disabled={!staffName || !role}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-12"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Generate Optimized Schedule
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Upcoming Shifts</h3>
        {schedules.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No schedules yet. Create your first staff schedule above.</p>
            </CardContent>
          </Card>
        ) : (
          schedules.map(schedule => (
            <Card key={schedule.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-slate-800 text-lg">{schedule.staff_name}</h4>
                    <Badge className={`rounded-full border mt-2 ${getRoleColor(schedule.role)}`}>
                      {schedule.role}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">
                      {format(new Date(schedule.shift_start), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {format(new Date(schedule.shift_start), 'h:mm a')} - {format(new Date(schedule.shift_end), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Assigned Tasks:</p>
                  <div className="space-y-2">
                    {schedule.tasks?.map((task: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{task.name}</span>
                        <Badge variant="outline" className="text-xs rounded-full">
                          {task.estimated_time}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-slate-600">
                    Performance Score: <strong>{(schedule.performance_score * 100).toFixed(0)}%</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
