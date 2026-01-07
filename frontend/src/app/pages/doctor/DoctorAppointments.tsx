import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, User, Phone, FileText, CheckCircle2, AlertCircle, Pill, Plus, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Appointment, AppointmentStatus, Doctor, Medication } from '../../data/mockData';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { appointmentsApi } from '../../services/appointmentsApi';
import { doctorsApi } from '../../services/doctorsApi';
import { servicesApi, Service } from '../../services/servicesApi';

interface DoctorAppointmentsProps {
  currentDoctor: Doctor;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';

export function DoctorAppointments({ currentDoctor }: DoctorAppointmentsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // New medication form
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: 'twice-daily',
    timings: ['09:00', '21:00'],
    duration: 7,
    instructions: '',
    withFood: 'any'
  });

  useEffect(() => {
    fetchData();
  }, [currentDoctor.id]);

  const fetchData = async () => {
    // no loading UI; still guard re-entrance
    try {
      const [aptRes, svcRes] = await Promise.all([
        appointmentsApi.getAll({ doctorId: currentDoctor.id }),
        servicesApi.getAll(),
      ]);
      setAppointments(aptRes);
      setServices(svcRes);
    } catch (error) {
      console.error('Failed to load doctor appointments', error);
      toast.error('Failed to load appointments');
    }
  };

  const doctorAppointments = useMemo(
    () => appointments.filter(apt => apt.doctorId === currentDoctor.id),
    [appointments, currentDoctor.id],
  );

  // Date filter helpers
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return endOfWeek;
  };

  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const isDateInRange = (dateStr: string) => {
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        return dateStr === todayStr;
      
      case 'week':
        const weekStart = getStartOfWeek(today);
        const weekEnd = getEndOfWeek(today);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        return appointmentDate >= weekStart && appointmentDate <= weekEnd;
      
      case 'month':
        const monthStart = getStartOfMonth(today);
        const monthEnd = getEndOfMonth(today);
        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return appointmentDate >= monthStart && appointmentDate <= monthEnd;
      
      case 'all':
      default:
        return true;
    }
  };

  // Apply date filter
  const filteredAppointments = doctorAppointments.filter(apt => isDateInRange(apt.date));

  // Get service duration
  const getServiceDuration = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.duration || 30;
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Format time slot
  const formatTimeSlot = (time: string, serviceId: string) => {
    const duration = getServiceDuration(serviceId);
    const endTime = calculateEndTime(time, duration);
    
    const formatTime12hr = (time24: string) => {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    return `${formatTime12hr(time)} - ${formatTime12hr(endTime)}`;
  };

  // Categorize appointments
  const upcomingAppointments = filteredAppointments.filter(
    apt => ['booked', 'confirmed', 'checked-in'].includes(apt.status) && new Date(apt.date) >= new Date()
  );
  
  const todayAppointments = filteredAppointments.filter(
    apt => apt.date === new Date().toISOString().split('T')[0]
  ).sort((a, b) => a.time.localeCompare(b.time)); // Sort by time
  
  const pastAppointments = filteredAppointments.filter(
    apt => ['completed', 'cancelled', 'no-show'].includes(apt.status)
  );

  const getStatusColor = (status: AppointmentStatus) => {
    const colors = {
      'booked': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'checked-in': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setClinicalNotes(appointment.clinicalNotes || '');
    setMedications(appointment.prescription?.medications || []);
    setDetailsOpen(true);
    setShowAddMedication(false);
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast.error('Please fill in medication name and dosage');
      return;
    }

    const med: Medication = {
      id: `MED${Date.now()}`,
      name: newMedication.name!,
      dosage: newMedication.dosage!,
      frequency: newMedication.frequency || 'twice-daily',
      timings: newMedication.timings || ['09:00', '21:00'],
      duration: newMedication.duration || 7,
      instructions: newMedication.instructions,
      withFood: newMedication.withFood
    };

    setMedications([...medications, med]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'twice-daily',
      timings: ['09:00', '21:00'],
      duration: 7,
      instructions: '',
      withFood: 'any'
    });
    setShowAddMedication(false);
    toast.success('Medication added');
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    toast.success('Medication removed');
  };

  const handleFrequencyChange = (frequency: string) => {
    const timingPresets: Record<string, string[]> = {
      'once-daily': ['09:00'],
      'twice-daily': ['09:00', '21:00'],
      'three-times-daily': ['09:00', '14:00', '21:00'],
      'four-times-daily': ['08:00', '12:00', '16:00', '20:00'],
      'as-needed': []
    };

    setNewMedication({
      ...newMedication,
      frequency: frequency as any,
      timings: timingPresets[frequency] || []
    });
  };

  const handleMarkCompleted = () => {
    if (selectedAppointment) {
      toast.success('Appointment completed', {
        description: `Clinical notes and prescription saved for ${selectedAppointment.patientName}`
      });
      setDetailsOpen(false);
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(appointment)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{appointment.patientName}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {appointment.phone}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{appointment.serviceName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(appointment.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-blue-700">
              {formatTimeSlot(appointment.time, appointment.serviceId)}
            </span>
          </div>
        </div>

        {appointment.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <span className="font-medium">Notes:</span> {appointment.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your patient appointments and prescriptions</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant={dateFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateFilter('all')}
            className={cn(
              "text-xs px-3",
              dateFilter === 'all' && "bg-white shadow-sm"
            )}
          >
            All
          </Button>
          <Button
            variant={dateFilter === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateFilter('today')}
            className={cn(
              "text-xs px-3",
              dateFilter === 'today' && "bg-white shadow-sm"
            )}
          >
            <Filter className="h-3 w-3 mr-1" />
            Today
          </Button>
          <Button
            variant={dateFilter === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateFilter('week')}
            className={cn(
              "text-xs px-3",
              dateFilter === 'week' && "bg-white shadow-sm"
            )}
          >
            <Filter className="h-3 w-3 mr-1" />
            This Week
          </Button>
          <Button
            variant={dateFilter === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateFilter('month')}
            className={cn(
              "text-xs px-3",
              dateFilter === 'month' && "bg-white shadow-sm"
            )}
          >
            <Filter className="h-3 w-3 mr-1" />
            This Month
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-semibold text-gray-900">{todayAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{upcomingAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pastAppointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">
                Today ({todayAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4 mt-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No appointments scheduled for today</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No past appointments</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details & Prescription</DialogTitle>
            <DialogDescription>
              Add clinical notes and prescribe medications
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Patient & Appointment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Patient</Label>
                  <p className="font-medium">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="text-sm">{selectedAppointment.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Service</Label>
                  <p className="text-sm">{selectedAppointment.serviceName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <p className="text-sm">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Time Slot</Label>
                  <p className="text-sm font-medium text-blue-700">
                    {formatTimeSlot(selectedAppointment.time, selectedAppointment.serviceId)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Clinical Notes */}
              <div>
                <Label htmlFor="clinical-notes">Clinical Notes</Label>
                <Textarea
                  id="clinical-notes"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical observations, diagnosis, treatment provided..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Separator />

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      Prescription
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">Add medications for this patient</p>
                  </div>
                  <Button
                    onClick={() => setShowAddMedication(!showAddMedication)}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </div>

                {/* Add Medication Form */}
                {showAddMedication && (
                  <Card className="mb-4 border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="med-name">Medication Name *</Label>
                          <Input
                            id="med-name"
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            placeholder="e.g., Amoxicillin"
                          />
                        </div>
                        <div>
                          <Label htmlFor="med-dosage">Dosage *</Label>
                          <Input
                            id="med-dosage"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                            placeholder="e.g., 500mg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="med-frequency">Frequency</Label>
                          <Select
                            value={newMedication.frequency}
                            onValueChange={handleFrequencyChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once-daily">Once Daily</SelectItem>
                              <SelectItem value="twice-daily">Twice Daily</SelectItem>
                              <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                              <SelectItem value="four-times-daily">Four Times Daily</SelectItem>
                              <SelectItem value="as-needed">As Needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="med-duration">Duration (days)</Label>
                          <Input
                            id="med-duration"
                            type="number"
                            value={newMedication.duration}
                            onChange={(e) => setNewMedication({ ...newMedication, duration: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                      </div>

                      {newMedication.frequency !== 'as-needed' && newMedication.timings && newMedication.timings.length > 0 && (
                        <div>
                          <Label>Times to Take</Label>
                          <div className="grid grid-cols-4 gap-2 mt-1">
                            {newMedication.timings.map((time, index) => (
                              <Input
                                key={index}
                                type="time"
                                value={time}
                                onChange={(e) => {
                                  const newTimings = [...(newMedication.timings || [])];
                                  newTimings[index] = e.target.value;
                                  setNewMedication({ ...newMedication, timings: newTimings });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="med-food">Take with Food</Label>
                        <Select
                          value={newMedication.withFood}
                          onValueChange={(value: any) => setNewMedication({ ...newMedication, withFood: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Anytime</SelectItem>
                            <SelectItem value="before">Before meals</SelectItem>
                            <SelectItem value="with">With meals</SelectItem>
                            <SelectItem value="after">After meals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="med-instructions">Special Instructions</Label>
                        <Textarea
                          id="med-instructions"
                          value={newMedication.instructions}
                          onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                          placeholder="Any special instructions..."
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddMedication(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddMedication}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add Medication
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Medication List */}
                {medications.length > 0 ? (
                  <div className="space-y-3">
                    {medications.map((med) => (
                      <Card key={med.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Pill className="h-4 w-4 text-blue-600" />
                                <h4 className="font-medium text-gray-900">{med.name}</h4>
                                <Badge variant="secondary">{med.dosage}</Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Frequency:</span>{' '}
                                  {med.frequency.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  {med.frequency !== 'as-needed' && med.timings.length > 0 && (
                                    <span className="ml-2 text-blue-700">
                                      ({med.timings.join(', ')})
                                    </span>
                                  )}
                                </p>
                                <p>
                                  <span className="font-medium">Duration:</span> {med.duration} days
                                </p>
                                {med.withFood && med.withFood !== 'any' && (
                                  <p>
                                    <span className="font-medium">Take:</span> {med.withFood} meals
                                  </p>
                                )}
                                {med.instructions && (
                                  <p className="text-xs mt-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-yellow-900">
                                    <span className="font-medium">Note:</span> {med.instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMedication(med.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No medications prescribed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedAppointment?.status !== 'completed' && (
              <Button onClick={handleMarkCompleted} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete & Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}