import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Calendar as CalendarIcon, Edit, Ban, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { StatusBadge } from '../components/StatusBadge';
import { AppointmentDrawer } from '../components/AppointmentDrawer';
import { Appointment, AppointmentStatus, Doctor } from '../data/mockData';
import { appointmentsApi } from '../services/appointmentsApi';
import { cancelAppointmentFlow, rescheduleAppointmentFlow, updateStatusFlow } from './appointmentActions';
import { doctorsApi } from '../services/doctorsApi';
import { toast } from 'sonner';
import { CreateAppointmentPrefill } from '../components/CreateAppointmentModal';
import { servicesApi, Service } from '../services/servicesApi';

interface AppointmentsProps {
  onCreateAppointment: (prefill?: CreateAppointmentPrefill) => void;
  selectedAppointmentId?: string;
  refreshKey?: number;
}

export function Appointments({ onCreateAppointment, selectedAppointmentId, refreshKey = 0 }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Service[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const openNativePicker = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    // Improves UX on browsers that support showPicker (e.g., Chrome)
    const input = e.currentTarget;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  };

  const toDateValue = (value: string) => (value ? new Date(value).getTime() : null);
  const formatTime = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return value;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load appointments from backend
  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const data = await appointmentsApi.getAll();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to load appointments', error);
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [refreshKey]);

  // Load doctors and services for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [doctors, services] = await Promise.all([
          doctorsApi.getAll(),
          servicesApi.getAll(),
        ]);
        setDoctorOptions(doctors);
        setServiceOptions(services);
      } catch (error) {
        console.error('Failed to load doctors/services', error);
        toast.error('Failed to load doctors/services');
      }
    };
    fetchFilterOptions();
  }, []);

  // Open drawer for selected appointment
  useEffect(() => {
    if (selectedAppointmentId) {
      const apt = appointments.find(a => a.id === selectedAppointmentId);
      if (apt) {
        setSelectedAppointment(apt);
        setDrawerOpen(true);
      }
    }
  }, [selectedAppointmentId, appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !apt.patientName.toLowerCase().includes(query) &&
          !apt.phone.toLowerCase().includes(query) &&
          !apt.id.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Doctor filter
      if (filterDoctor !== 'all' && apt.doctorId !== filterDoctor) {
        return false;
      }

      // Service filter
      if (filterService !== 'all' && apt.serviceId !== filterService) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && apt.status !== filterStatus) {
        return false;
      }

      // Date range filter
      const aptDateValue = toDateValue(apt.date);
      const fromValue = toDateValue(dateFrom);
      const toValue = toDateValue(dateTo);

      if (fromValue !== null && aptDateValue !== null && aptDateValue < fromValue) {
        return false;
      }
      if (toValue !== null && aptDateValue !== null && aptDateValue > toValue) {
        return false;
      }

      return true;
    });
  }, [appointments, searchQuery, filterDoctor, filterService, filterStatus, dateFrom, dateTo]);

  // Sort by date and time
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [filteredAppointments]);

  const handleOpenAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDrawerOpen(true);
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === id 
          ? { ...apt, status, updatedAt: new Date().toISOString() }
          : apt
      )
    );
  };

  const handleConfirm = async (id: string) => {
    await updateStatusFlow({
      appointmentId: id,
      newStatus: 'confirmed',
      appointments,
      setAppointments,
    });
  };

  const handleCheckIn = async (id: string) => {
    await updateStatusFlow({
      appointmentId: id,
      newStatus: 'checked-in',
      appointments,
      setAppointments,
    });
  };

  const handleComplete = async (id: string) => {
    await updateStatusFlow({
      appointmentId: id,
      newStatus: 'completed',
      appointments,
      setAppointments,
    });
  };

  const handleReschedule = (id: string) => {
    setRescheduleAppointmentId(id);
    setRescheduleOpen(true);
  };

  const handleSaveReschedule = async () => {
    await rescheduleAppointmentFlow({
      appointmentId: rescheduleAppointmentId,
      appointments,
      serviceOptions,
      rescheduleForm,
      setAppointments,
      setRescheduleOpen,
      setRescheduleAppointmentId,
      setRescheduleForm,
      setIsRescheduling,
    });
  };

  const handleNoShow = (id: string) => {
    updateAppointmentStatus(id, 'no-show');
  };

  const handleCancel = async (id: string) => {
    await cancelAppointmentFlow({
      appointmentId: id,
      appointments,
      setAppointments,
    });
  };

  const handleQuickAction = (appointment: Appointment, action: string) => {
    switch (action) {
      case 'confirm':
        updateAppointmentStatus(appointment.id, 'confirmed');
        toast.success('Appointment confirmed');
        break;
      case 'reschedule':
        handleReschedule(appointment.id);
        break;
      case 'cancel':
        handleCancel(appointment.id);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all appointments</p>
        </div>
        <Button onClick={() => onCreateAppointment()}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onClick={openNativePicker}
                onFocus={openNativePicker}
                placeholder="From date"
              />
            </div>

            {/* Date To */}
            <div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onClick={openNativePicker}
                onFocus={openNativePicker}
                placeholder="To date"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Filter */}
            <div>
              <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctorOptions.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Filter */}
            <div>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceOptions.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || filterDoctor !== 'all' || filterService !== 'all' || filterStatus !== 'all' || dateFrom || dateTo) && (
              <div className="lg:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDoctor('all');
                    setFilterService('all');
                    setFilterStatus('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredAppointments.length} Appointment{filteredAppointments.length !== 1 ? 's' : ''}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading appointments...
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No appointments found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new appointment</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => onCreateAppointment()}
              >
                Create Appointment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAppointments.map(appointment => (
                    <TableRow 
                      key={appointment.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOpenAppointment(appointment)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patientName}</p>
                          <p className="text-xs text-gray-500">ID: {appointment.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{appointment.phone}</TableCell>
                      <TableCell className="text-sm text-gray-600">{appointment.doctorName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{appointment.serviceName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">{formatTime(appointment.time)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell>
                        {(appointment.status !== 'completed' && appointment.status !== 'cancelled') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {appointment.status === 'booked' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAction(appointment, 'confirm');
                                  }}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {(appointment.status === 'booked' || appointment.status === 'confirmed') && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(appointment, 'reschedule');
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Reschedule
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(appointment, 'cancel');
                                }}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Drawer */}
      <AppointmentDrawer
        appointment={selectedAppointment}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirm}
        onCheckIn={handleCheckIn}
        onComplete={handleComplete}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onNoShow={handleNoShow}
      />

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="pr-10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                  className="pr-10"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveReschedule}
              disabled={isRescheduling}
            >
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}