import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { mockAppointments, AppointmentStatus, Doctor } from '../../data/mockData';

interface DoctorCalendarViewProps {
  currentDoctor: Doctor;
}

export function DoctorCalendarView({ currentDoctor }: DoctorCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');

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

  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockAppointments.filter(apt => {
      if (apt.date !== dateStr) return false;
      if (apt.doctorId !== currentDoctor.id) return false;
      
      // Check if appointment time matches the slot (simple time matching)
      return apt.time.startsWith(time.split(':')[0]);
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar View</h1>
          <p className="text-sm text-gray-500 mt-1">View your appointments by day, week, or month</p>
        </div>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
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
              <div className="w-3 h-3 rounded bg-yellow-100 border-l-4 border-yellow-500" />
              <span className="text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border-l-4 border-blue-500" />
              <span className="text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border-l-4 border-purple-500" />
              <span className="text-gray-600">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border-l-4 border-green-500" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border-l-4 border-red-500" />
              <span className="text-gray-600">Cancelled</span>
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
                    {time}
                  </div>
                  {weekDays.map((day, idx) => {
                    const appointments = getAppointmentsForSlot(day, time);
                    return (
                      <div 
                        key={idx} 
                        className="p-2 border-r border-gray-200 last:border-r-0 min-h-[80px]"
                      >
                        <div className="space-y-1">
                          {appointments.length === 0 && (
                            <div className="text-xs text-gray-400 p-2">No appointments</div>
                          )}
                          {appointments.map(apt => {
                            const statusColors: Record<AppointmentStatus, string> = {
                              'booked': 'bg-yellow-100 border-yellow-500',
                              'confirmed': 'bg-blue-100 border-blue-500',
                              'checked-in': 'bg-purple-100 border-purple-500',
                              'completed': 'bg-green-100 border-green-500',
                              'cancelled': 'bg-red-100 border-red-500',
                              'no-show': 'bg-orange-100 border-orange-500'
                            };

                            return (
                              <div 
                                key={apt.id} 
                                className={`p-2 rounded text-xs border-l-4 ${statusColors[apt.status]} hover:shadow-sm transition-shadow cursor-pointer`}
                              >
                                <p className="font-medium text-gray-900 truncate">{apt.time}</p>
                                <p className="font-medium text-gray-900 truncate">{apt.patientName}</p>
                                <p className="text-gray-600 truncate">{apt.serviceName}</p>
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
                <li>View your appointments in day or week format</li>
                <li>Color-coded statuses for easy identification</li>
                <li>Navigate between dates using the controls</li>
                <li>Click "Today" to jump to the current date</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
