import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, Plus, RefreshCw } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Appointment, Admin } from '../data/types';
import { appointmentsApi } from '../services/appointmentsApi';
import { toast } from 'sonner';
import { CreateAppointmentPrefill } from '../components/CreateAppointmentModal';

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
  onCreateAppointment: (prefill?: CreateAppointmentPrefill) => void;
  currentAdmin?: Admin | null;
}

export function Dashboard({ onNavigate, onCreateAppointment, currentAdmin }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      try {
        const [todayList, upcomingList] = await Promise.all([
          appointmentsApi.getAll({ dateFrom: todayStr, dateTo: todayStr }),
          appointmentsApi.getAll({ dateFrom: fmt(tomorrow), dateTo: fmt(nextWeek) }),
        ]);
        setTodayAppointments(todayList);
        setUpcomingAppointments(upcomingList);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedToday = todayAppointments.filter(apt => apt.status === 'completed');
  const cancelledToday = todayAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'no-show');
  
  const handleAutoCancelPast = async () => {
    setIsCancelling(true);
    try {
      const result = await appointmentsApi.autoCancelPastBooked();
      if (result.cancelled > 0) {
        toast.success(`Successfully cancelled ${result.cancelled} past appointment${result.cancelled > 1 ? 's' : ''}`, {
          description: 'Past booked appointments have been automatically cancelled'
        });
        // Refresh dashboard data
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
        const fmt = (d: Date) => d.toISOString().split('T')[0];
        const [todayList, upcomingList] = await Promise.all([
          appointmentsApi.getAll({ dateFrom: todayStr, dateTo: todayStr }),
          appointmentsApi.getAll({ dateFrom: fmt(tomorrow), dateTo: fmt(nextWeek) }),
        ]);
        setTodayAppointments(todayList);
        setUpcomingAppointments(upcomingList);
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
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's today's overview</p>
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
            Create Appointment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={Calendar}
          description={`${todayAppointments.filter(a => a.status === 'confirmed').length} confirmed`}
          isLoading={isLoading}
        />
        <KPICard
          title="Upcoming (7 days)"
          value={upcomingAppointments.length}
          icon={Clock}
          description="Next week's schedule"
          isLoading={isLoading}
        />
        <KPICard
          title="Completed Today"
          value={completedToday.length}
          icon={CheckCircle2}
          description="Successfully completed"
          isLoading={isLoading}
        />
        <KPICard
          title="Cancelled / No-show"
          value={cancelledToday.length}
          icon={XCircle}
          description="Today's cancellations"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('appointments')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No appointments scheduled for today</p>
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
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(appointment => (
                        <TableRow 
                          key={appointment.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => onNavigate('appointments', { selectedId: appointment.id })}
                        >
                          <TableCell className="font-medium">{appointment.time}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{appointment.patientName}</p>
                              <p className="text-xs text-gray-500">{appointment.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{appointment.doctorName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{appointment.serviceName}</TableCell>
                          <TableCell>
                            <StatusBadge status={appointment.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mini Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="text-4xl font-bold text-blue-700">
                  {new Date().getDate()}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Upcoming Highlights</h4>
                {upcomingAppointments.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-xs text-gray-500">
                        {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {new Date(apt.date).getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{apt.patientName}</p>
                      <p className="text-xs text-gray-500">{apt.time} - {apt.doctorName}</p>
                    </div>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onNavigate('calendar')}
              >
                Open Calendar View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}