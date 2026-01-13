'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, StaffMember, StaffWeeklySchedule, StaffTimeOff, TreatmentRoom } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, Calendar, Clock, DoorOpen, FileText, Edit, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STAFF_ROLES = [
  'Medical Director',
  'Nurse Practitioner',
  'Registered Nurse',
  'Medical Assistant',
  'Receptionist',
  'Practice Manager',
  'Aesthetician',
];

const TREATMENT_SPECIALIZATIONS = [
  'Botox',
  'Dermal Fillers',
  'Laser Treatments',
  'Chemical Peels',
  'Microneedling',
  'IV Therapy',
  'Body Contouring',
  'Consultations',
];

export function StaffSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [schedules, setSchedules] = useState<StaffWeeklySchedule[]>([]);
  const [timeOff, setTimeOff] = useState<StaffTimeOff[]>([]);
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { user } = useAuth();

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    specializations: [] as string[],
    hourly_rate: 0,
    commission_rate: 0,
    hire_date: format(new Date(), 'yyyy-MM-dd'),
    bio: '',
    is_active: true,
  });

  const [timeOffForm, setTimeOffForm] = useState({
    staff_member_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    notes: '',
  });

  const [roomForm, setRoomForm] = useState({
    name: '',
    room_type: 'treatment',
    equipment: [] as string[],
    max_capacity: 1,
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [staffRes, schedulesRes, timeOffRes, roomsRes] = await Promise.all([
      supabase.from('staff_members').select('*').eq('user_id', user.id).order('name'),
      supabase.from('staff_weekly_schedules').select('*').eq('user_id', user.id),
      supabase.from('staff_time_off').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('treatment_rooms').select('*').eq('user_id', user.id).order('name'),
    ]);

    if (staffRes.data) setStaff(staffRes.data);
    if (schedulesRes.data) setSchedules(schedulesRes.data);
    if (timeOffRes.data) setTimeOff(timeOffRes.data);
    if (roomsRes.data) setRooms(roomsRes.data);
  };

  const handleAddStaff = () => {
    setIsEdit(false);
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      specializations: [],
      hourly_rate: 0,
      commission_rate: 0,
      hire_date: format(new Date(), 'yyyy-MM-dd'),
      bio: '',
      is_active: true,
    });
    setStaffDialogOpen(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setIsEdit(true);
    setSelectedStaff(member);
    setStaffForm({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
      specializations: member.specializations,
      hourly_rate: member.hourly_rate,
      commission_rate: member.commission_rate,
      hire_date: member.hire_date,
      bio: member.bio || '',
      is_active: member.is_active,
    });
    setStaffDialogOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!user) return;

    if (isEdit && selectedStaff) {
      await supabase
        .from('staff_members')
        .update(staffForm)
        .eq('id', selectedStaff.id);
    } else {
      await supabase
        .from('staff_members')
        .insert([{ ...staffForm, user_id: user.id }]);
    }

    setStaffDialogOpen(false);
    setSelectedStaff(null);
    await fetchData();
  };

  const handleDeleteStaff = async (id: string) => {
    await supabase.from('staff_members').delete().eq('id', id);
    await fetchData();
  };

  const handleManageSchedule = (member: StaffMember) => {
    setSelectedStaff(member);
    setScheduleDialogOpen(true);
  };

  const handleAddTimeOff = () => {
    setTimeOffForm({
      staff_member_id: '',
      start_date: '',
      end_date: '',
      reason: '',
      notes: '',
    });
    setTimeOffDialogOpen(true);
  };

  const handleSaveTimeOff = async () => {
    if (!user) return;

    await supabase
      .from('staff_time_off')
      .insert([{ ...timeOffForm, user_id: user.id, status: 'pending' }]);

    setTimeOffDialogOpen(false);
    await fetchData();
  };

  const handleApproveTimeOff = async (id: string) => {
    await supabase
      .from('staff_time_off')
      .update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', id);
    await fetchData();
  };

  const handleDenyTimeOff = async (id: string) => {
    await supabase
      .from('staff_time_off')
      .update({ status: 'denied', approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', id);
    await fetchData();
  };

  const handleAddRoom = () => {
    setRoomForm({
      name: '',
      room_type: 'treatment',
      equipment: [],
      max_capacity: 1,
      notes: '',
      is_active: true,
    });
    setRoomDialogOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!user) return;

    await supabase
      .from('treatment_rooms')
      .insert([{ ...roomForm, user_id: user.id }]);

    setRoomDialogOpen(false);
    await fetchData();
  };

  const handleDeleteRoom = async (id: string) => {
    await supabase.from('treatment_rooms').delete().eq('id', id);
    await fetchData();
  };

  const activeStaff = staff.filter(s => s.is_active).length;
  const pendingTimeOff = timeOff.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-slate-800">Staff & Operations</h2>
            <p className="text-sm text-slate-600">Manage staff, schedules, and treatment rooms</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Staff</p>
                <p className="text-3xl font-light text-slate-800">{activeStaff}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending Time Off</p>
                <p className="text-3xl font-light text-slate-800">{pendingTimeOff}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Treatment Rooms</p>
                <p className="text-3xl font-light text-slate-800">{rooms.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <DoorOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4">
          <TabsTrigger value="staff" className="rounded-lg">Staff Members</TabsTrigger>
          <TabsTrigger value="timeoff" className="rounded-lg">Time Off</TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-lg">Treatment Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleAddStaff}
              className="rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((member) => (
              <Card key={member.id} className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-slate-800">{member.name}</h3>
                        {member.is_active && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{member.role}</p>
                      {member.email && <p className="text-sm text-slate-500">{member.email}</p>}
                      {member.phone && <p className="text-sm text-slate-500">{member.phone}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStaff(member)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {member.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-600">
                      Hired: {format(new Date(member.hire_date), 'MMM d, yyyy')}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageSchedule(member)}
                      className="rounded-lg"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {staff.length === 0 && (
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">No staff members yet</p>
                <Button
                  onClick={handleAddStaff}
                  className="rounded-full bg-gradient-to-r from-green-500 to-teal-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeoff" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleAddTimeOff}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Time Off
            </Button>
          </div>

          <div className="space-y-3">
            {timeOff.map((request) => {
              const staffMember = staff.find(s => s.id === request.staff_member_id);
              return (
                <Card key={request.id} className="rounded-xl border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-slate-800">{staffMember?.name}</h4>
                          <Badge
                            variant="outline"
                            className={
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : request.status === 'denied'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {format(new Date(request.start_date), 'MMM d, yyyy')} -{' '}
                          {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </p>
                        {request.reason && <p className="text-sm text-slate-500">{request.reason}</p>}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveTimeOff(request.id)}
                            className="rounded-lg text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDenyTimeOff(request.id)}
                            className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {timeOff.length === 0 && (
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600">No time off requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleAddRoom}
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Treatment Room
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <DoorOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-slate-800">{room.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600 capitalize mb-2">{room.room_type}</p>
                      <p className="text-xs text-slate-500">Capacity: {room.max_capacity}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="rounded-lg text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {room.equipment.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Equipment:</p>
                      <div className="flex flex-wrap gap-1">
                        {room.equipment.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {rooms.length === 0 && (
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DoorOpen className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">No treatment rooms yet</p>
                <Button
                  onClick={handleAddRoom}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Room
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Add'} Staff Member</DialogTitle>
            <DialogDescription>
              Enter the staff member's information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={staffForm.role}
                  onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="grid grid-cols-2 gap-2">
                {TREATMENT_SPECIALIZATIONS.map((spec) => (
                  <div key={spec} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={spec}
                      checked={staffForm.specializations.includes(spec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStaffForm({
                            ...staffForm,
                            specializations: [...staffForm.specializations, spec],
                          });
                        } else {
                          setStaffForm({
                            ...staffForm,
                            specializations: staffForm.specializations.filter(s => s !== spec),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={spec} className="text-sm cursor-pointer">{spec}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={staffForm.hourly_rate}
                  onChange={(e) => setStaffForm({ ...staffForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={staffForm.commission_rate}
                  onChange={(e) => setStaffForm({ ...staffForm, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={staffForm.hire_date}
                  onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={staffForm.bio}
                onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
                className="rounded-xl"
                rows={3}
                placeholder="Brief bio or qualifications..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSaveStaff}
              disabled={!staffForm.name || !staffForm.role}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              {isEdit ? 'Update' : 'Add'} Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timeOffDialogOpen} onOpenChange={setTimeOffDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
            <DialogDescription>
              Submit a time off request for a staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Member *</Label>
              <Select
                value={timeOffForm.staff_member_id}
                onValueChange={(value) => setTimeOffForm({ ...timeOffForm, staff_member_id: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.is_active).map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={timeOffForm.start_date}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, start_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={timeOffForm.end_date}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, end_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={timeOffForm.reason}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                className="rounded-xl"
                placeholder="Vacation, sick leave, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={timeOffForm.notes}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, notes: e.target.value })}
                className="rounded-xl"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeOffDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSaveTimeOff}
              disabled={!timeOffForm.staff_member_id || !timeOffForm.start_date || !timeOffForm.end_date}
              className="rounded-full bg-amber-600 hover:bg-amber-700"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Treatment Room</DialogTitle>
            <DialogDescription>
              Add a new treatment room to your facility
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room Name *</Label>
              <Input
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                className="rounded-xl"
                placeholder="Room 1, Laser Suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select
                  value={roomForm.room_type}
                  onValueChange={(value) => setRoomForm({ ...roomForm, room_type: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="laser">Laser</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={roomForm.max_capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, max_capacity: parseInt(e.target.value) || 1 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Equipment (comma-separated)</Label>
              <Input
                value={roomForm.equipment.join(', ')}
                onChange={(e) => setRoomForm({ ...roomForm, equipment: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="rounded-xl"
                placeholder="Laser machine, Treatment bed, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={roomForm.notes}
                onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                className="rounded-xl"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoom}
              disabled={!roomForm.name}
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="rounded-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Schedule - {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              Set weekly recurring schedule for this staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day, index) => {
              const daySchedule = schedules.find(
                s => s.staff_member_id === selectedStaff?.id && s.day_of_week === index
              );

              return (
                <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="w-24">
                    <Label className="text-sm font-medium">{day}</Label>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="time"
                      defaultValue={daySchedule?.start_time || '09:00'}
                      className="rounded-lg"
                    />
                    <span className="text-slate-600">to</span>
                    <Input
                      type="time"
                      defaultValue={daySchedule?.end_time || '17:00'}
                      className="rounded-lg"
                    />
                  </div>
                  <Badge variant={daySchedule?.is_available ? 'default' : 'outline'}>
                    {daySchedule?.is_available ? 'Working' : 'Off'}
                  </Badge>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className="rounded-full">
              Close
            </Button>
            <Button className="rounded-full bg-green-600 hover:bg-green-700">
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
