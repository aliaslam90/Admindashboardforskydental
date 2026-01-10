import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AppointmentDrawer } from '../components/AppointmentDrawer';
import { Appointment, AppointmentStatus, Doctor, Admin } from '../data/types';
import { appointmentsApi } from '../services/appointmentsApi';
import { doctorsApi } from '../services/doctorsApi';
import { servicesApi, Service } from '../services/servicesApi';
import { cancelAppointmentFlow, rescheduleAppointmentFlow, updateStatusFlow } from './appointmentActions';
import { toast } from 'sonner';
import { CreateAppointmentPrefill } from '../components/CreateAppointmentModal';

interface CalendarViewProps {
  onCreateAppointment: (prefill?: CreateAppointmentPrefill) => void;
  currentAdmin?: Admin | null;
}

export function CalendarView({ onCreateAppointment, currentAdmin }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Service[]>([]);
  const [, setIsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9; // 9 AM to 6 PM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getWeekDays = (date: Date) => {
    const days = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = view === 'week' ? getWeekDays(currentDate) : [currentDate];

  const doctorById = useMemo(
    () =>
      doctorOptions.reduce<Record<string, Doctor>>((acc, doc) => {
        acc[doc.id] = doc;
        return acc;
      }, {}),
    [doctorOptions],
  );

  const formatTime = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return value;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const statusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'confirmed':
        return 'Confirmed';
      case 'checked-in':
        return 'Checked-in';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no-show':
        return 'No-show';
      default:
        return status;
    }
  };

  const isSlotWithinDoctorAvailability = (doctorId: string, date: Date, time: string) => {
    const doctor = doctorById[doctorId];
    if (!doctor) return true;
    const availability = doctor.availability || [];
    if (availability.length === 0) return true;

    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = availability.find(
      (a) => a.day.toLowerCase() === weekday.toLowerCase(),
    );
    if (!dayAvailability || !dayAvailability.slots?.length) return true;
    return dayAvailability.slots.some(
      (slot) => time >= slot.start && time < slot.end,
    );
  };

  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      if (apt.date !== dateStr) return false;
      if (selectedDoctor !== 'all' && apt.doctorId !== selectedDoctor) return false;
      
      // Check if appointment time matches the slot (simple time matching)
      return apt.time.startsWith(time.split(':')[0]);
    });
  };

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctors = await doctorsApi.getAll();
        setDoctorOptions(doctors);
      } catch (error) {
        console.error('Failed to load doctors', error);
        toast.error('Failed to load doctors');
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const services = await servicesApi.getAll();
        setServiceOptions(services);
      } catch (error) {
        console.error('Failed to load services', error);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      const days = view === 'week' ? getWeekDays(currentDate) : [currentDate];
      const start = days[0];
      const end = days[days.length - 1];
      const format = (d: Date) => d.toISOString().split('T')[0];

      try {
        const results = await appointmentsApi.getAll({
          dateFrom: format(start),
          dateTo: format(end),
          ...(selectedDoctor !== 'all' ? { doctorId: selectedDoctor } : {}),
        });
        setAppointments(results);
      } catch (error) {
        console.error('Failed to load calendar appointments', error);
        toast.error('Failed to load calendar appointments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [currentDate, view, selectedDoctor]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAutoCancelPast = async () => {
    setIsCancelling(true);
    try {
      const result = await appointmentsApi.autoCancelPastBooked();
      if (result.cancelled > 0) {
        toast.success(`Successfully cancelled ${result.cancelled} past appointment${result.cancelled > 1 ? 's' : ''}`, {
          description: 'Past booked appointments have been automatically cancelled'
        });
        // Refresh calendar appointments
        const days = view === 'week' ? getWeekDays(currentDate) : [currentDate];
        const start = days[0];
        const end = days[days.length - 1];
        const format = (d: Date) => d.toISOString().split('T')[0];
        const results = await appointmentsApi.getAll({
          dateFrom: format(start),
          dateTo: format(end),
          ...(selectedDoctor !== 'all' ? { doctorId: selectedDoctor } : {}),
        });
        setAppointments(results);
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

  const handleOpenAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDrawerOpen(true);
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
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      setRescheduleAppointmentId(id);
      setRescheduleForm({
        date: appointment.date,
        time: appointment.time
      });
      setRescheduleOpen(true);
    }
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

  const handleCancel = async (id: string) => {
    await cancelAppointmentFlow({
      appointmentId: id,
      appointments,
      setAppointments,
    });
  };

  const handleNoShow = async (id: string) => {
    await updateStatusFlow({
      appointmentId: id,
      newStatus: 'no-show',
      appointments,
      setAppointments,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar View</h1>
          <p className="text-sm text-gray-500 mt-1">Visual scheduling and conflict prevention</p>
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
          <Button onClick={() => onCreateAppointment()} className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-4 text-sm font-medium text-gray-900">
                {view === 'day' 
                  ? currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                }
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[180px]">
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

              <Select value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border-l-4 border-blue-500" />
              <span className="text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border-l-4 border-green-500" />
              <span className="text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border-l-4 border-purple-500" />
              <span className="text-gray-600">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100 border-l-4 border-gray-500" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border-l-4 border-red-500" />
              <span className="text-gray-600">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-100 border-l-4 border-orange-500" />
              <span className="text-gray-600">No-show</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header */}
              <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
                <div className="p-3 border-r border-gray-200" />
                {weekDays.map((day, idx) => (
                  <div key={idx} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                    <div className="text-xs text-gray-500">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-semibold mt-1 ${
                      day.toDateString() === new Date().toDateString() 
                        ? 'text-blue-600' 
                        : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map(time => (
                <div 
                  key={time} 
                  className="grid border-b border-gray-200 hover:bg-gray-50" 
                  style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}
                >
                  <div className="p-3 border-r border-gray-200 text-sm text-gray-500 font-medium">
                    {formatTime(time)}
                  </div>
                  {weekDays.map((day, idx) => {
                    const appointments = getAppointmentsForSlot(day, time);
                    return (
                      <div 
                        key={idx} 
                        className="p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          const dateStr = day.toISOString().split('T')[0];
                          const start = new Date(`${dateStr}T${time}`);
                          if (start.getTime() <= Date.now()) {
                            toast.error("Cannot create an appointment in the past");
                            return;
                          }
                          if (selectedDoctor !== 'all') {
                            const available = isSlotWithinDoctorAvailability(selectedDoctor, day, time);
                            if (!available) {
                              toast.error("This doctor isn't available in this slot.");
                              return;
                            }
                          }

                          onCreateAppointment({
                            date: dateStr,
                            time,
                            doctorId: selectedDoctor !== 'all' ? selectedDoctor : '',
                          });
                        }}
                      >
                        <div className="space-y-1">
                          {appointments.map(apt => {
                            const statusColors: Record<AppointmentStatus, string> = {
                              'booked': 'bg-blue-100 border-blue-500',
                              'confirmed': 'bg-green-100 border-green-500',
                              'checked-in': 'bg-purple-100 border-purple-500',
                              'completed': 'bg-gray-100 border-gray-500',
                              'cancelled': 'bg-red-100 border-red-500',
                              'no-show': 'bg-orange-100 border-orange-500'
                            };

                            return (
                              <div 
                                key={apt.id} 
                                className={`p-2 rounded text-xs border-l-4 ${statusColors[apt.status]} hover:shadow-sm transition-shadow cursor-pointer`}
                                title={statusLabel(apt.status)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAppointment(apt);
                                }}
                              >
                                <p className="font-medium text-gray-900 truncate">{apt.patientName}</p>
                                <p className="text-gray-600 truncate">
                                  {formatTime(apt.time)} • {apt.serviceName}
                                </p>
                                <p className="text-gray-500 text-[11px]">
                                  {(() => {
                                    const start = new Date(`${apt.date}T${apt.time}`);
                                    const minutes = apt.durationMinutes ?? 30;
                                    const end = new Date(start.getTime() + minutes * 60000);
                                    const endString = `${end
                                      .getHours()
                                      .toString()
                                      .padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                                    return `${formatTime(apt.time)} – ${formatTime(endString)} (${minutes} min)`;
                                  })()}
                                </p>
                                {selectedDoctor === 'all' && (
                                  <p className="text-gray-500 truncate text-[10px] mt-0.5">{apt.doctorName}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              i
            </div>
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Calendar Features</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Click on an empty slot to create a new appointment</li>
                <li>Click on an appointment to view details</li>
                <li>Color-coded statuses for easy identification</li>
                <li>Filter by doctor to see specific availability</li>
              </ul>
            </div>
          </div>
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
              Select a new date and time for this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Date *</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Time *</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
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