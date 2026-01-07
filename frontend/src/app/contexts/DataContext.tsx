import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Appointment,
  Doctor,
  Patient,
  Service,
  Admin,
  AppointmentStatus,
} from '../data/mockData';
import { appointmentsApi, AppointmentFilters } from '../services/appointmentsApi';
import { patientsApi } from '../services/patientsApi';
import { doctorsApi } from '../services/doctorsApi';
import { toast } from 'sonner';

/**
 * DATA SYNC CONTEXT
 * Single source of truth for all application data
 * 
 * API Integration Points:
 * - GET /api/appointments - Fetch all appointments
 * - GET /api/doctors - Fetch all doctors
 * - GET /api/patients - Fetch all patients
 * - GET /api/services - Fetch all services
 * - PUT /api/appointments/{id} - Update appointment
 * - PUT /api/doctors/{id} - Update doctor
 * - POST /api/appointments - Create appointment
 */

interface Notification {
  id: string;
  type: 'appointment_created' | 'appointment_cancelled' | 'appointment_rescheduled' | 'appointment_checked_in' | 'appointment_completed' | 'doctor_updated' | 'profile_updated';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId: string; // admin or doctor ID
  userType: 'admin' | 'doctor';
  appointmentId?: string;
  doctorId?: string;
}

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncMessage: string | null;
}

interface DataContextType {
  // Data
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  services: Service[];
  admins: Admin[];
  notifications: Notification[];
  syncState: SyncState;

  // Appointment Actions
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  createAppointment: (
    payload: {
      patient: { full_name: string; phone_number: string; email?: string };
      doctor_id: number;
      service_id: number;
      start_datetime: string;
      end_datetime: string;
      status?: string;
      notes?: string;
    },
  ) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;

  // Doctor Actions
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  fetchDoctors: () => Promise<void>;

  // Patient Actions
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  createPatient: (patient: { full_name: string; phone_number: string; email: string }) => Promise<Patient>;
  fetchPatients: (search?: string) => Promise<void>;

  // Notification Actions
  getNotifications: (userId: string, userType: 'admin' | 'doctor') => Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: (userId: string) => void;

  // Sync Actions
  syncData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    syncMessage: null
  });

  // Initial sync on mount
  useEffect(() => {
    syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers to map backend models already handled by API clients

  // Create notification
  const createNotification = (
    type: Notification['type'],
    title: string,
    message: string,
    userId: string,
    userType: 'admin' | 'doctor',
    appointmentId?: string,
    doctorId?: string
  ) => {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      userId,
      userType,
      appointmentId,
      doctorId
    };
    setNotifications(prev => [notification, ...prev]);
  };

  /**
   * API: PUT /api/appointments/{id}
   * Updates appointment and syncs across both portals
   */
  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Saving changes...' });
    try {
      const updated = await appointmentsApi.update(id, {
        notes: updates.notes,
        status: updates.status,
      });
      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, ...updated } : apt)),
      );
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Updated successfully', { description: 'Changes synced across all portals' });
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Update failed', { description: 'Please try again' });
      throw error;
    }
  };

  const createAppointment = async (payload: {
    patient: { full_name: string; phone_number: string; email?: string };
    doctor_id: number;
    service_id: number;
    start_datetime: string;
    end_datetime: string;
    status?: string;
    notes?: string;
  }): Promise<Appointment> => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Creating appointment...' });
    try {
      const created = await appointmentsApi.create(payload);
      setAppointments(prev => [...prev, created]);
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Appointment created', { description: 'Doctor has been notified' });
      return created;
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Creation failed');
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Deleting appointment...' });
    try {
      await appointmentsApi.delete(id);
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Appointment deleted');
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Deletion failed');
      throw error;
    }
  };

  /**
   * API: PUT /api/doctors/{id}
   * Updates doctor profile and syncs to admin dashboard
   */
  const updateDoctor = async (id: string, updates: Partial<Doctor>) => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Saving doctor profile...' });
    try {
      const updated = await doctorsApi.update(id, {
        name: updates.name,
        specialization: updates.specialization,
        services: updates.services,
        availability: updates.availability,
        status: updates.status,
      });
      setDoctors(prev => prev.map(doc => (doc.id === id ? updated : doc)));
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Profile updated', { description: 'Changes synced to admin dashboard' });
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Update failed');
      throw error;
    }
  };

  /**
   * API: PUT /api/patients/{id}
   */
  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Updating patient...' });
    try {
      const updated = await patientsApi.update(id, {
        full_name: updates.name,
        phone_number: updates.phone,
        email: updates.email,
      });
      setPatients(prev => prev.map(pat => (pat.id === id ? updated : pat)));
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Patient updated');
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Update failed');
      throw error;
    }
  };

  /**
   * API: POST /api/patients
   */
  const createPatient = async (patientData: { full_name: string; phone_number: string; email: string }): Promise<Patient> => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Creating patient...' });
    try {
      const newPatient = await patientsApi.create(patientData);
      setPatients(prev => [...prev, newPatient]);
      setSyncState({ isSyncing: false, lastSyncTime: new Date(), syncMessage: null });
      toast.success('Patient created');
      return newPatient;
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Creation failed');
      throw error;
    }
  };

  // Get notifications for specific user
  const getNotifications = (userId: string, userType: 'admin' | 'doctor') => {
    return notifications.filter(n => 
      (n.userId === userId || n.userId === userType) && n.userType === userType
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  // Clear all notifications
  const clearAllNotifications = (userId: string) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  };

  const fetchAppointments = async (filters?: AppointmentFilters) => {
    const data = await appointmentsApi.getAll(filters);
    setAppointments(data);
  };

  const fetchDoctors = async () => {
    const data = await doctorsApi.getAll();
    setDoctors(data);
  };

  const fetchPatients = async (search?: string) => {
    const data = await patientsApi.getAll(search);
    setPatients(data);
  };

  const fetchServices = async () => {
    const data = await doctorsApi.getServices();
    setServices(data);
  };

  /**
   * API: GET /api/sync
   * Syncs all data from backend
   */
  const syncData = async () => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Syncing data...' });
    try {
      await Promise.all([fetchAppointments(), fetchDoctors(), fetchPatients(), fetchServices()]);
      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null,
      });
      toast.success('Data synced successfully');
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Sync failed');
    }
  };

  const value: DataContextType = {
    appointments,
    doctors,
    patients,
    services,
    admins,
    notifications,
    syncState,
    updateAppointment,
    createAppointment,
    deleteAppointment,
    fetchAppointments,
    updateDoctor,
    fetchDoctors,
    updatePatient,
    createPatient,
    fetchPatients,
    getNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    syncData,
    fetchServices,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
