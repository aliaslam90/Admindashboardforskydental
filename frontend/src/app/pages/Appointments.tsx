import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Calendar as CalendarIcon, Edit, Ban, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { StatusBadge } from '../components/StatusBadge';
import { AppointmentDrawer } from '../components/AppointmentDrawer';
import { Appointment, AppointmentStatus, Doctor, Admin } from '../data/types';
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
  currentAdmin?: Admin | null;
}

export function Appointments({ onCreateAppointment, selectedAppointmentId, refreshKey = 0, currentAdmin }: AppointmentsProps) {
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; date: string; time: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
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
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      setRescheduleAppointmentId(id);
      setRescheduleForm({
        date: appointment.date,
        time: appointment.time,
      });
      setRescheduleOpen(true);
    }
  };

  // Load available slots when reschedule dialog opens
  useEffect(() => {
    const loadSlots = async () => {
      if (!rescheduleOpen || !rescheduleAppointmentId) {
        setAvailableSlots([]);
        setSlotsError(null);
        return;
      }

      const appointment = appointments.find(a => a.id === rescheduleAppointmentId);
      if (!appointment) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setSlotsError(null);
      try {
        const slots = await appointmentsApi.getAvailability({
          doctorId: appointment.doctorId,
          serviceId: appointment.serviceId,
          excludeAppointmentId: rescheduleAppointmentId, // Exclude current appointment from conflicts
        });
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Failed to load availability', err);
        setSlotsError('Could not load availability for this doctor/service.');
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    void loadSlots();
  }, [rescheduleOpen, rescheduleAppointmentId, appointments]);

  const availableDates = useMemo(
    () => Array.from(new Set(availableSlots.map((s) => s.date))),
    [availableSlots],
  );

  const selectedDate = useMemo(() => {
    if (!rescheduleForm.date) return undefined;
    const [year, month, day] = rescheduleForm.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [rescheduleForm.date]);

  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    return !availableDates.includes(dateStr);
  };

  const availableTimesForDate = useMemo(() => {
    if (!rescheduleForm.date) return [];
    return availableSlots
      .filter((s) => s.date === rescheduleForm.date)
      .map((s) => s.time)
      .sort();
  }, [availableSlots, rescheduleForm.date]);

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

  const handleAutoCancelPast = async () => {
    setIsCancelling(true);
    try {
      const result = await appointmentsApi.autoCancelPastBooked();
      if (result.cancelled > 0) {
        toast.success(`Successfully cancelled ${result.cancelled} past appointment${result.cancelled > 1 ? 's' : ''}`, {
          description: 'Past booked appointments have been automatically cancelled'
        });
        // Refresh appointments data
        const data = await appointmentsApi.getAll();
        setAppointments(data);
      } else {
        toast.info('No past booked appointments found to cancel', {
          description: 'All appointments are up to date'
        });
      }
    } catch (error) {
      console.error('Failed to auto-cancel past appointments', error);
      toast.error('Failed to cancel past appointments');
    } finally {
      setIsCancelling(false);
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
        <div className="flex items-center gap-2">
          {currentAdmin?.role !== 'receptionist' && (
            <Button 
              variant="outline" 
              onClick={handleAutoCancelPast}
              disabled={isCancelling}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCancelling ? 'animate-spin' : ''}`} />
              {isCancelling ? 'Cancelling...' : 'Cancel Past Appointments'}
            </Button>
          )}
          <Button onClick={() => onCreateAppointment()}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
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
                  id="appointments-search"
                  name="appointments-search"
                  type="search"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="search"
                  placeholder="Search by patient name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => {
                    // Prevent autofill by briefly making readonly
                    e.target.setAttribute('readonly', 'readonly');
                    setTimeout(() => e.target.removeAttribute('readonly'), 0);
                  }}
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
      <Dialog open={rescheduleOpen} onOpenChange={(open) => {
        setRescheduleOpen(open);
        if (!open) {
          setRescheduleAppointmentId(null);
          setRescheduleForm({ date: '', time: '' });
          setAvailableSlots([]);
          setSlotsError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={
                        isRescheduling ||
                        isLoadingSlots ||
                        availableDates.length === 0
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span className="text-muted-foreground">
                          {isLoadingSlots
                            ? "Loading..."
                            : availableDates.length === 0
                            ? "No dates available"
                            : "Pick a date"}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setRescheduleForm({
                            ...rescheduleForm,
                            date: dateStr,
                            time: "",
                          });
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        return isDateDisabled(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={rescheduleForm.time}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        time: e.target.value,
                      })
                    }
                    disabled={
                      isRescheduling ||
                      !rescheduleForm.date ||
                      availableTimesForDate.length === 0 ||
                      isLoadingSlots
                    }
                    className="pr-10"
                    list={rescheduleForm.date && availableTimesForDate.length > 0 ? `available-times-${rescheduleForm.date}` : undefined}
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                  {rescheduleForm.date && availableTimesForDate.length > 0 && (
                    <datalist id={`available-times-${rescheduleForm.date}`}>
                      {availableTimesForDate.map((time) => (
                        <option key={time} value={time} />
                      ))}
                    </datalist>
                  )}
                </div>
                {rescheduleForm.date && availableTimesForDate.length > 0 && (
                  <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        View all available times ({availableTimesForDate.length})
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="max-h-48 overflow-y-auto">
                        <p className="text-xs font-medium mb-2">Available times:</p>
                        <div className="grid grid-cols-3 gap-1">
                          {availableTimesForDate.map((time) => {
                            const [hours, minutes] = time.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours, minutes, 0, 0);
                            const time12Hour = format(date, 'h:mm a');

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setRescheduleForm({
                                    ...rescheduleForm,
                                    time: time,
                                  });
                                  setTimePopoverOpen(false);
                                }}
                                className={`text-xs px-2 py-1 rounded border ${
                                  rescheduleForm.time === time
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {time12Hour}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {!rescheduleForm.date && (
                  <p className="text-xs text-muted-foreground">Select date first</p>
                )}
                {rescheduleForm.date && isLoadingSlots && (
                  <p className="text-xs text-muted-foreground">Loading availability...</p>
                )}
                {rescheduleForm.date && !isLoadingSlots && availableTimesForDate.length === 0 && (
                  <p className="text-xs text-red-500">No times available for this date</p>
                )}
              </div>
            </div>

            {slotsError && (
              <p className="text-sm text-red-500">{slotsError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRescheduleOpen(false);
                setRescheduleAppointmentId(null);
                setRescheduleForm({ date: '', time: '' });
              }}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveReschedule}
              disabled={isRescheduling || !rescheduleForm.date || !rescheduleForm.time}
            >
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}