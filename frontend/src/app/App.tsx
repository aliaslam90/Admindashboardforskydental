import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { DataProvider, useData } from './contexts/DataContext';
import { SyncIndicator } from './components/SyncIndicator';
import { DashboardLayout } from './components/DashboardLayout';
import { DoctorLayout } from './components/DoctorLayout';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { CalendarView } from './pages/CalendarView';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { Services } from './pages/Services';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { DoctorLogin } from './pages/DoctorLogin';
import { ForgotPassword } from './pages/ForgotPassword';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments';
import { DoctorCalendarView } from './pages/doctor/DoctorCalendarView';
import { DoctorPatients } from './pages/doctor/DoctorPatients';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { mockDoctors, mockServices, mockAdmins, Admin, Doctor, Appointment } from './data/mockData';
import { toast } from 'sonner';

type Page = 'dashboard' | 'appointments' | 'calendar' | 'patients' | 'doctors' | 'services' | 'notifications' | 'settings';
type DoctorPage = 'appointments' | 'calendar' | 'patients' | 'profile';
type AuthPage = 'admin-login' | 'doctor-login' | 'forgot-password' | 'admin-dashboard' | 'doctor-dashboard';

const AUTH_STORAGE_KEY = 'skydental_auth_state';
type NewAppointmentInput = Omit<Appointment, 'id'> & { email?: string; duration?: number };

function AppContent() {
  const { createAppointment } = useData();
  const [authPage, setAuthPage] = useState<AuthPage>('admin-login');
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [doctorPage, setDoctorPage] = useState<DoctorPage>('appointments');
  const [pageData, setPageData] = useState<any>(null);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Create appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    doctorId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: ''
  });

  const handleNavigate = (page: Page | string, data?: any) => {
    setCurrentPage(page as Page);
    setPageData(data || null);
  };

  // Restore login context on refresh
  useEffect(() => {
    const savedState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedState) {
      setIsBootstrapping(false);
      return;
    }
    try {
      const parsed = JSON.parse(savedState);
      if (parsed.currentAdmin) {
        setCurrentAdmin(parsed.currentAdmin);
        setAuthPage('admin-dashboard');
      } else if (parsed.currentDoctor) {
        setCurrentDoctor(parsed.currentDoctor);
        setAuthPage('doctor-dashboard');
      }
      if (parsed.currentPage) setCurrentPage(parsed.currentPage);
      if (parsed.doctorPage) setDoctorPage(parsed.doctorPage);
    } catch {
      // Ignore malformed storage
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  // Persist login context for reloads
  useEffect(() => {
    const payload = {
      currentAdmin,
      currentDoctor,
      currentPage,
      doctorPage,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }, [currentAdmin, currentDoctor, currentPage, doctorPage]);

  const handleCreateAppointment = () => {
    setCreateAppointmentOpen(true);
    // Reset form
    setAppointmentForm({
      patientName: '',
      phone: '',
      email: '',
      doctorId: '',
      serviceId: '',
      date: '',
      time: '',
      notes: ''
    });
  };

  const handleSaveAppointment = async () => {
    // Validation
    if (!appointmentForm.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    if (!appointmentForm.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!appointmentForm.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    if (!appointmentForm.serviceId) {
      toast.error('Please select a service');
      return;
    }
    if (!appointmentForm.date) {
      toast.error('Please select a date');
      return;
    }
    if (!appointmentForm.time) {
      toast.error('Please select a time');
      return;
    }

    try {
      // Find doctor and service details
      const doctor = mockDoctors.find(d => d.id === appointmentForm.doctorId);
      const service = mockServices.find(s => s.id === appointmentForm.serviceId);

      if (!doctor || !service) {
        toast.error('Invalid doctor or service selected');
        return;
      }

      const newAppointment: NewAppointmentInput = {
        patientId: `PAT${Date.now()}`,
        patientName: appointmentForm.patientName,
        phone: appointmentForm.phone,
        email: appointmentForm.email || undefined,
        doctorId: appointmentForm.doctorId,
        doctorName: doctor.name,
        serviceId: appointmentForm.serviceId,
        serviceName: service.name,
        date: appointmentForm.date,
        time: appointmentForm.time,
        duration: service.duration,
        status: 'booked',
        notes: appointmentForm.notes,
        clinicalNotes: '',
        prescription: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create appointment using DataContext
      await createAppointment(newAppointment);

      setCreateAppointmentOpen(false);
      setCurrentPage('appointments');
    } catch (error) {
      // Error already handled by DataContext
    }
  };

  const handleAdminLogin = (email: string, _password: string) => {
    // Find admin by email
    const admin = mockAdmins.find(a => a.email === email);
    
    if (admin) {
      setCurrentAdmin(admin);
      setAuthPage('admin-dashboard');
      toast.success(`Welcome back, ${admin.name}!`, {
        description: `Logged in as ${admin.role === 'super-admin' ? 'Super Admin' : 'Appointment Manager'}`
      });
    }
  };

  const handleDoctorLogin = (email: string, _password: string) => {
    // Find doctor by email
    const doctor = mockDoctors.find(d => d.email === email);
    
    if (doctor) {
      setCurrentDoctor(doctor);
      setAuthPage('doctor-dashboard');
      toast.success(`Welcome back, ${doctor.name}!`, {
        description: `Logged in as ${doctor.specialization} Doctor`
      });
    }
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    setCurrentDoctor(null);
    setAuthPage('admin-login');
    setCurrentPage('dashboard');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onCreateAppointment={handleCreateAppointment} />;
      case 'appointments':
        return (
          <Appointments 
            onCreateAppointment={handleCreateAppointment}
            selectedAppointmentId={pageData?.selectedId}
          />
        );
      case 'calendar':
        return <CalendarView onCreateAppointment={handleCreateAppointment} />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'services':
        return <Services />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings currentAdmin={currentAdmin!} onLogout={handleLogout} />;
      default:
        return <Dashboard onNavigate={handleNavigate} onCreateAppointment={handleCreateAppointment} />;
    }
  };

  const renderDoctorPage = () => {
    switch (doctorPage) {
      case 'appointments':
        return <DoctorAppointments currentDoctor={currentDoctor!} />;
      case 'calendar':
        return <DoctorCalendarView currentDoctor={currentDoctor!} />;
      case 'patients':
        return <DoctorPatients currentDoctor={currentDoctor!} />;
      case 'profile':
        return <DoctorProfile currentDoctor={currentDoctor!} />;
      default:
        return <DoctorAppointments currentDoctor={currentDoctor!} />;
    }
  };

  return (
    <>
      {!isBootstrapping && authPage === 'admin-login' && <Login onLogin={handleAdminLogin} onForgotPassword={() => setAuthPage('forgot-password')} onSwitchToDoctor={() => setAuthPage('doctor-login')} />}
      {!isBootstrapping && authPage === 'doctor-login' && <DoctorLogin onLogin={handleDoctorLogin} onSwitchToAdmin={() => setAuthPage('admin-login')} />}
      {!isBootstrapping && authPage === 'forgot-password' && <ForgotPassword onBackToLogin={() => setAuthPage('admin-login')} />}

      {authPage === 'admin-dashboard' && (
        <DashboardLayout currentPage={currentPage} onNavigate={handleNavigate} currentAdmin={currentAdmin!} onLogout={handleLogout}>
          {renderPage()}
        </DashboardLayout>
      )}

      {authPage === 'doctor-dashboard' && (
        <DoctorLayout currentPage={doctorPage} onNavigate={(page) => setDoctorPage(page as DoctorPage)} currentDoctor={currentDoctor!} onLogout={handleLogout}>
          {renderDoctorPage()}
        </DoctorLayout>
      )}

      {/* Create Appointment Dialog */}
      <Dialog open={createAppointmentOpen} onOpenChange={setCreateAppointmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details to book a new appointment for the patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Patient Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patient-name">Patient Name *</Label>
                  <Input
                    id="patient-name"
                    value={appointmentForm.patientName}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })}
                    placeholder="Enter patient name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={appointmentForm.phone}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                    placeholder="+971-XX-XXX-XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={appointmentForm.email}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-gray-900">Appointment Details</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor *</Label>
                  <Select
                    value={appointmentForm.doctorId}
                    onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctorId: value })}
                  >
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDoctors.filter(d => d.status === 'active').map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Select
                    value={appointmentForm.serviceId}
                    onValueChange={(value) => setAppointmentForm({ ...appointmentForm, serviceId: value })}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockServices.filter(s => s.active).map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAppointment} className="bg-blue-600 hover:bg-blue-700">
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SyncIndicator />
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}