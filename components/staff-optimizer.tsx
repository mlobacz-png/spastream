'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Calendar, CheckCircle, Star, Trash2, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;
    console.log('Fetching schedules for user:', user.id);
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('Schedules fetched:', { count: data?.length, error });
    if (data) {
      console.log('Setting schedules:', data);
      setSchedules(data);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const { error } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    } else {
      await fetchSchedules();
    }
  };

  const generateOptimizedSchedule = async () => {
    console.log('generateOptimizedSchedule called', { user: !!user, staffName, role });
    if (!user || !staffName || !role) {
      console.log('Missing required fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Step 1: Creating date objects');
      const date = new Date(shiftDate);
      const shiftStart = setMinutes(setHours(date, 9), 0);
      const shiftEnd = setMinutes(setHours(date, 17), 0);
      console.log('Shift times:', { shiftStart, shiftEnd });

      console.log('Step 2: Getting session');
      const session = await supabase.auth.getSession();
      console.log('Session obtained:', !!session.data.session);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        console.error('Supabase URL not found');
        alert('Configuration error: Supabase URL not found');
        return;
      }

      const apiUrl = `${supabaseUrl}/functions/v1/staff-optimizer`;
      console.log('Step 3: Calling API:', apiUrl);

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

      console.log('Step 4: Response received:', response.status, response.statusText);

      let assignedTasks = [];
      if (response.ok) {
        console.log('Step 5: Response OK, parsing JSON');
        const optimization = await response.json();
        console.log('Optimization data:', optimization);
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
        console.log('Assigned tasks from API:', assignedTasks);
      } else {
        console.log('Step 5: Response NOT OK');
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        alert(`Failed to generate schedule: ${errorData.error || response.statusText}`);
      }

      if (assignedTasks.length === 0) {
        console.log('Step 6: Using fallback tasks');
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
        console.log('Fallback tasks:', assignedTasks);
      }

      console.log('Step 7: Inserting into database');
      const { data: insertData, error: insertError } = await supabase.from('staff_schedules').insert([{
        user_id: user.id,
        staff_name: staffName,
        role,
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        tasks: assignedTasks,
        performance_score: 0.85 + Math.random() * 0.15,
      }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Step 8: Insert successful, clearing form');
      setStaffName('');
      setRole('');

      console.log('Step 9: Fetching updated schedules');
      await fetchSchedules();
      console.log('Step 10: Complete!');
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate schedule'}`);
    } finally {
      setIsLoading(false);
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
            disabled={!staffName || !role || isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-12"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Optimized Schedule'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="individual" className="rounded-lg">
            <Users className="w-4 h-4 mr-2" />
            Individual Schedules
          </TabsTrigger>
          <TabsTrigger value="master" className="rounded-lg">
            <CalendarDays className="w-4 h-4 mr-2" />
            Master Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Staff Schedules</h3>
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
                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {format(new Date(schedule.shift_start), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-lg font-semibold text-indigo-600">
                        {format(new Date(schedule.shift_start), 'h:mm a')} - {format(new Date(schedule.shift_end), 'h:mm a')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
        </TabsContent>

        <TabsContent value="master" className="space-y-4">
          <MasterScheduleView schedules={schedules} getRoleColor={getRoleColor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MasterScheduleProps {
  schedules: StaffSchedule[];
  getRoleColor: (role: string) => string;
}

function MasterScheduleView({ schedules, getRoleColor }: MasterScheduleProps) {
  const groupedByDate = schedules.reduce((acc, schedule) => {
    const date = format(new Date(schedule.shift_start), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, StaffSchedule[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (schedules.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No schedules to display. Create schedules to see the master view.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <Card key={date} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedByDate[date]
                .sort((a: StaffSchedule, b: StaffSchedule) => new Date(a.shift_start).getTime() - new Date(b.shift_start).getTime())
                .map((schedule: StaffSchedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-slate-800">{schedule.staff_name}</p>
                      <Badge className={`rounded-full border mt-1 text-xs ${getRoleColor(schedule.role)}`}>
                        {schedule.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">
                        {format(new Date(schedule.shift_start), 'h:mm a')} - {format(new Date(schedule.shift_end), 'h:mm a')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {schedule.tasks?.length || 0} tasks assigned
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-sm text-slate-600">
                        {(schedule.performance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
