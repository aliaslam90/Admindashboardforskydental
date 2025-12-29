import { useState, useMemo, useRef, useEffect } from 'react';
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
import { mockAppointments, mockDoctors, mockServices, Appointment, AppointmentStatus } from '../data/mockData';
import { toast } from 'sonner';

interface AppointmentsProps {
  onCreateAppointment: () => void;
  selectedAppointmentId?: string;
}

export function Appointments({ onCreateAppointment, selectedAppointmentId }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
      if (dateFrom && apt.date < dateFrom) {
        return false;
      }
      if (dateTo && apt.date > dateTo) {
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

  const handleConfirm = (id: string) => {
    updateAppointmentStatus(id, 'confirmed');
  };

  const handleCheckIn = (id: string) => {
    updateAppointmentStatus(id, 'checked-in');
  };

  const handleComplete = (id: string) => {
    updateAppointmentStatus(id, 'completed');
  };

  const handleReschedule = (id: string) => {
    setRescheduleAppointmentId(id);
    setRescheduleOpen(true);
  };

  const handleSaveReschedule = () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.error('Please select both date and time');
      return;
    }

    setAppointments(prev => 
      prev.map(apt => 
        apt.id === rescheduleAppointmentId 
          ? { ...apt, date: rescheduleForm.date, time: rescheduleForm.time, updatedAt: new Date().toISOString() }
          : apt
      )
    );

    toast.success('Appointment rescheduled successfully');
    setRescheduleOpen(false);
    setRescheduleAppointmentId(null);
    setRescheduleForm({ date: '', time: '' });
  };

  const handleNoShow = (id: string) => {
    updateAppointmentStatus(id, 'no-show');
  };

  const handleCancel = (id: string) => {
    // This would open a cancel modal
    toast.info('Cancel confirmation modal would open here');
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
        <Button onClick={onCreateAppointment}>
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
                placeholder="From date"
              />
            </div>

            {/* Date To */}
            <div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
                  {mockDoctors.map(doctor => (
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
                  {mockServices.map(service => (
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
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No appointments found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new appointment</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={onCreateAppointment}
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
                          <p className="text-xs text-gray-500">{appointment.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(appointment, 'reschedule');
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
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
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}