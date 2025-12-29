import { useState, useMemo } from 'react';
import { Stethoscope, Calendar, Clock, ChevronRight, Plus, Trash2, X, Edit, AlertTriangle, UserX, CalendarOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { mockDoctors, mockServices, mockAppointments, Doctor, BlockedLeave } from '../data/mockData';
import { toast } from 'sonner';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Doctors() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [blockLeaveOpen, setBlockLeaveOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    services: [] as string[],
    availability: [] as { day: string; slots: { start: string; end: string }[] }[]
  });

  // Block Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'full-day' as 'full-day' | 'partial',
    startTime: '09:00',
    endTime: '17:00',
    reason: 'Annual Leave',
    notes: ''
  });

  // Local state for blocked leaves (in real app, this would come from API/database)
  const [doctorLeaves, setDoctorLeaves] = useState<Record<string, BlockedLeave[]>>({});

  const handleOpenDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleOpenAddDoctor = () => {
    setAddDoctorOpen(true);
    // Reset form
    setDoctorForm({
      name: '',
      specialization: '',
      services: [],
      availability: []
    });
  };

  const handleOpenEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditDoctorOpen(true);
    // Set form with doctor's data
    setDoctorForm({
      name: doctor.name,
      specialization: doctor.specialization,
      services: [...doctor.services],
      availability: JSON.parse(JSON.stringify(doctor.availability))
    });
  };

  const handleOpenDeleteDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleOpenToggleStatusDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setToggleStatusDialogOpen(true);
  };

  const handleOpenBlockLeaveDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBlockLeaveOpen(true);
    // Reset form
    setLeaveForm({
      startDate: '',
      endDate: '',
      leaveType: 'full-day',
      startTime: '09:00',
      endTime: '17:00',
      reason: 'Annual Leave',
      notes: ''
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setDoctorForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleAddAvailabilityDay = (day: string) => {
    const exists = doctorForm.availability.find(a => a.day === day);
    if (exists) {
      // Remove day
      setDoctorForm(prev => ({
        ...prev,
        availability: prev.availability.filter(a => a.day !== day)
      }));
    } else {
      // Add day with default slot
      setDoctorForm(prev => ({
        ...prev,
        availability: [...prev.availability, { day, slots: [{ start: '09:00', end: '17:00' }] }]
      }));
    }
  };

  const handleAddTimeSlot = (day: string) => {
    setDoctorForm(prev => ({
      ...prev,
      availability: prev.availability.map(a =>
        a.day === day
          ? { ...a, slots: [...a.slots, { start: '09:00', end: '17:00' }] }
          : a
      )
    }));
  };

  const handleRemoveTimeSlot = (day: string, slotIndex: number) => {
    setDoctorForm(prev => ({
      ...prev,
      availability: prev.availability.map(a =>
        a.day === day
          ? { ...a, slots: a.slots.filter((_, idx) => idx !== slotIndex) }
          : a
      )
    }));
  };

  const handleUpdateTimeSlot = (day: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setDoctorForm(prev => ({
      ...prev,
      availability: prev.availability.map(a =>
        a.day === day
          ? {
              ...a,
              slots: a.slots.map((slot, idx) =>
                idx === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : a
      )
    }));
  };

  const validateDoctorForm = () => {
    if (!doctorForm.name.trim()) {
      toast.error('Doctor name is required');
      return false;
    }
    if (!doctorForm.specialization.trim()) {
      toast.error('Specialization is required');
      return false;
    }
    if (doctorForm.services.length === 0) {
      toast.error('Please select at least one service');
      return false;
    }
    if (doctorForm.availability.length === 0) {
      toast.error('Please set availability for at least one day');
      return false;
    }

    const hasEmptySlots = doctorForm.availability.some(a => a.slots.length === 0);
    if (hasEmptySlots) {
      toast.error('Each working day must have at least one time slot');
      return false;
    }

    return true;
  };

  const handleSubmitDoctor = async () => {
    if (!validateDoctorForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Doctor added successfully', {
        description: `${doctorForm.name} has been added to the system`
      });
      setIsSubmitting(false);
      setAddDoctorOpen(false);
    }, 1500);
  };

  const handleEditDoctor = async () => {
    if (!validateDoctorForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Doctor updated successfully', {
        description: `${doctorForm.name} has been updated in the system`
      });
      setIsSubmitting(false);
      setEditDoctorOpen(false);
    }, 1500);
  };

  const handleDeleteDoctor = async () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Doctor deleted successfully', {
        description: `${selectedDoctor?.name} has been removed from the system`
      });
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }, 1500);
  };

  const handleToggleStatusDoctor = async () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Doctor status updated successfully', {
        description: `${selectedDoctor?.name} status has been updated in the system`
      });
      setIsSubmitting(false);
      setToggleStatusDialogOpen(false);
    }, 1500);
  };

  const handleBlockLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Leave blocked successfully', {
        description: `Leave has been blocked for ${selectedDoctor?.name}`
      });
      setIsSubmitting(false);
      setBlockLeaveOpen(false);

      // Add leave to local state
      if (selectedDoctor) {
        const newLeaves = [...(doctorLeaves[selectedDoctor.id] || []), leaveForm];
        setDoctorLeaves(prev => ({
          ...prev,
          [selectedDoctor.id]: newLeaves
        }));
      }
    }, 1500);
  };

  const getDoctorServices = (serviceIds: string[]) => {
    return mockServices.filter(s => serviceIds.includes(s.id));
  };

  const getDoctorAppointments = (doctorId: string) => {
    return mockAppointments.filter(a => a.doctorId === doctorId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctor availability and information</p>
        </div>
        <Button className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]" onClick={handleOpenAddDoctor}>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      {/* Doctors Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockDoctors.map(doctor => (
          <Card 
            key={doctor.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleOpenDoctor(doctor)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{doctor.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">{doctor.specialization}</p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={doctor.status === 'active' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }
                >
                  {doctor.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Services Offered</p>
                  <p className="text-sm text-gray-900">{getDoctorServices(doctor.services).length} services</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Working Days</p>
                  <p className="text-sm text-gray-900">{doctor.availability.length} days/week</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-blue-600">View Details</span>
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Doctor Profile</DialogTitle>
            <DialogDescription>View and manage doctor details</DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedDoctor.specialization}</p>
                  <div className="mt-2">
                    <Badge 
                      variant="secondary" 
                      className={selectedDoctor.status === 'active' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {selectedDoctor.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDoctor(selectedDoctor)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenBlockLeaveDialog(selectedDoctor)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Block Leave
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Tabbed Content */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                  <TabsTrigger value="appointments">
                    Appointments ({getDoctorAppointments(selectedDoctor.id).length})
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Services Offered</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {getDoctorServices(selectedDoctor.services).map(service => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{service.duration} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">{getDoctorAppointments(selectedDoctor.id).length}</p>
                          <p className="text-xs text-gray-500 mt-1">Total Appointments</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">{selectedDoctor.availability.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Working Days/Week</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">{getDoctorServices(selectedDoctor.services).length}</p>
                          <p className="text-xs text-gray-500 mt-1">Services Offered</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Availability Tab */}
                <TabsContent value="availability" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Weekly Availability
                    </h3>
                    <div className="space-y-2">
                      {daysOfWeek.map(day => {
                        const availability = selectedDoctor.availability.find(a => a.day === day);
                        return (
                          <div 
                            key={day} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              availability ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
                            }`}
                          >
                            <span className={`text-sm font-medium ${
                              availability ? 'text-green-900' : 'text-gray-400'
                            }`}>
                              {day}
                            </span>
                            {availability ? (
                              <div className="flex flex-wrap gap-2">
                                {availability.slots.map((slot, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="bg-green-100 text-green-700 hover:bg-green-100"
                                  >
                                    {slot.start} - {slot.end}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not available</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Doctor's Appointments</h3>
                    {getDoctorAppointments(selectedDoctor.id).length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Patient</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getDoctorAppointments(selectedDoctor.id).map(appointment => (
                              <TableRow key={appointment.id}>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                                    <p className="text-xs text-gray-500">{appointment.phone}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-900">{appointment.serviceName}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm text-gray-900">{appointment.date}</p>
                                    <p className="text-xs text-gray-500">{appointment.time}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="secondary"
                                    className={
                                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                      appointment.status === 'booked' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                      appointment.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                      appointment.status === 'no-show' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' :
                                      'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                    }
                                  >
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-sm font-medium text-gray-900">No appointments found</h3>
                        <p className="text-sm text-gray-500 mt-1">This doctor has no scheduled appointments</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => {
                  setDialogOpen(false);
                  handleOpenToggleStatusDialog(selectedDoctor);
                }}>
                  {selectedDoctor.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => {
                  setDialogOpen(false);
                  handleOpenDeleteDialog(selectedDoctor);
                }}>
                  <UserX className="h-4 w-4 mr-2" />
                  Delete Doctor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Doctor Form Component */}
      <DoctorFormDialog
        open={addDoctorOpen || editDoctorOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddDoctorOpen(false);
            setEditDoctorOpen(false);
          }
        }}
        isEdit={editDoctorOpen}
        doctorForm={doctorForm}
        setDoctorForm={setDoctorForm}
        onSubmit={editDoctorOpen ? handleEditDoctor : handleSubmitDoctor}
        isSubmitting={isSubmitting}
        handleServiceToggle={handleServiceToggle}
        handleAddAvailabilityDay={handleAddAvailabilityDay}
        handleAddTimeSlot={handleAddTimeSlot}
        handleRemoveTimeSlot={handleRemoveTimeSlot}
        handleUpdateTimeSlot={handleUpdateTimeSlot}
      />

      {/* Delete Doctor Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the doctor and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteDoctor}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting Doctor...' : 'Delete Doctor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Status Doctor Dialog */}
      <AlertDialog open={toggleStatusDialogOpen} onOpenChange={setToggleStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the doctor's status to {selectedDoctor?.status === 'active' ? 'inactive' : 'active'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToggleStatusDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A] text-white"
              onClick={handleToggleStatusDoctor}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating Status...' : 'Update Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Leave Dialog */}
      <Dialog open={blockLeaveOpen} onOpenChange={setBlockLeaveOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Block Leave</DialogTitle>
            <DialogDescription>Enter leave details for {selectedDoctor?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900">Name</Label>
                <Input 
                  className="mt-1"
                  placeholder="e.g., Dr. Ahmed Hassan"
                  value={selectedDoctor?.name || ''}
                  readOnly
                />
                <Label className="text-sm font-medium text-gray-900 mt-3">Specialization</Label>
                <Input 
                  className="mt-1"
                  placeholder="e.g., General Dentistry, Orthodontics"
                  value={selectedDoctor?.specialization || ''}
                  readOnly
                />
              </div>
            </div>

            <Separator />

            {/* Leave Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Leave Details</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Start Date</Label>
                    <Input 
                      type="date"
                      className="mt-1"
                      value={leaveForm.startDate}
                      onChange={e => setLeaveForm((prev: any) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">End Date</Label>
                    <Input 
                      type="date"
                      className="mt-1"
                      value={leaveForm.endDate}
                      onChange={e => setLeaveForm((prev: any) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Leave Type</Label>
                    <Select
                      value={leaveForm.leaveType}
                      onValueChange={value => setLeaveForm((prev: any) => ({ ...prev, leaveType: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-day">Full Day</SelectItem>
                        <SelectItem value="partial">Partial Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {leaveForm.leaveType === 'partial' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Start Time</Label>
                        <Input
                          type="time"
                          value={leaveForm.startTime}
                          onChange={(e) => setLeaveForm((prev: any) => ({ ...prev, startTime: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">End Time</Label>
                        <Input
                          type="time"
                          value={leaveForm.endTime}
                          onChange={(e) => setLeaveForm((prev: any) => ({ ...prev, endTime: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Reason</Label>
                    <Input 
                      className="mt-1"
                      placeholder="e.g., Annual Leave, Personal Day"
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm((prev: any) => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Notes</Label>
                    <Input 
                      className="mt-1"
                      placeholder="Additional notes"
                      value={leaveForm.notes}
                      onChange={e => setLeaveForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBlockLeaveOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A] text-white"
                onClick={handleBlockLeave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Blocking Leave...' : 'Block Leave'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component for the form to improve code organization
function DoctorFormDialog({
  open,
  onOpenChange,
  isEdit,
  doctorForm,
  setDoctorForm,
  onSubmit,
  isSubmitting,
  handleServiceToggle,
  handleAddAvailabilityDay,
  handleAddTimeSlot,
  handleRemoveTimeSlot,
  handleUpdateTimeSlot
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  doctorForm: any;
  setDoctorForm: any;
  onSubmit: () => void;
  isSubmitting: boolean;
  handleServiceToggle: (serviceId: string) => void;
  handleAddAvailabilityDay: (day: string) => void;
  handleAddTimeSlot: (day: string) => void;
  handleRemoveTimeSlot: (day: string, slotIndex: number) => void;
  handleUpdateTimeSlot: (day: string, slotIndex: number, field: 'start' | 'end', value: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          <DialogDescription>Enter doctor details and availability</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-900">Name</Label>
              <Input 
                className="mt-1"
                placeholder="e.g., Dr. Ahmed Hassan"
                value={doctorForm.name}
                onChange={e => setDoctorForm((prev: any) => ({ ...prev, name: e.target.value }))}
              />
              <Label className="text-sm font-medium text-gray-900 mt-3">Specialization</Label>
              <Input 
                className="mt-1"
                placeholder="e.g., General Dentistry, Orthodontics"
                value={doctorForm.specialization}
                onChange={e => setDoctorForm((prev: any) => ({ ...prev, specialization: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Services Offered */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Services Offered</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {mockServices.map(service => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.category}</p>
                  </div>
                  <div className="text-right">
                    <Checkbox 
                      checked={doctorForm.services.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Weekly Availability */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Weekly Availability
            </h3>
            <p className="text-xs text-gray-500 mb-3">Click "Add Day" to set working hours for each day of the week</p>
            <div className="space-y-3">
              {daysOfWeek.map(day => {
                const availability = doctorForm.availability.find((a: any) => a.day === day);
                return (
                  <div 
                    key={day} 
                    className={`rounded-lg border ${
                      availability ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <span className={`text-sm font-medium ${
                        availability ? 'text-green-900' : 'text-gray-500'
                      }`}>
                        {day}
                      </span>
                      <Button 
                        variant={availability ? "ghost" : "outline"}
                        size="sm"
                        className={availability ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
                        onClick={() => handleAddAvailabilityDay(day)}
                      >
                        {availability ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Remove Day
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Day
                          </>
                        )}
                      </Button>
                    </div>

                    {availability && (
                      <div className="px-3 pb-3 space-y-2 border-t border-green-200 pt-3">
                        {availability.slots.map((slot: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-green-100">
                            <Label className="text-xs text-gray-600 min-w-[40px]">Slot {idx + 1}</Label>
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleUpdateTimeSlot(day, idx, 'start', e.target.value)}
                              className="flex-1"
                            />
                            <span className="text-gray-400">to</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleUpdateTimeSlot(day, idx, 'end', e.target.value)}
                              className="flex-1"
                            />
                            {availability.slots.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveTimeSlot(day, idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => handleAddTimeSlot(day)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Time Slot
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A] text-white"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEdit ? 'Updating Doctor...' : 'Adding Doctor...') : (isEdit ? 'Update Doctor' : 'Add Doctor')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}