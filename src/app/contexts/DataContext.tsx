import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  mockAppointments, 
  mockDoctors, 
  mockPatients, 
  mockServices,
  mockAdmins,
  Appointment, 
  Doctor, 
  Patient, 
  Service,
  Admin,
  AppointmentStatus 
} from '../data/mockData';
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
  createAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  
  // Doctor Actions
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  
  // Patient Actions
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  createPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient>;
  
  // Notification Actions
  getNotifications: (userId: string, userType: 'admin' | 'doctor') => Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: (userId: string) => void;
  
  // Sync Actions
  syncData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    syncMessage: null
  });

  // Simulate API delay
  const simulateApiCall = async (duration: number = 800) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  // Show sync feedback
  const showSyncFeedback = (message: string) => {
    setSyncState(prev => ({ ...prev, syncMessage: message }));
    setTimeout(() => {
      setSyncState(prev => ({ ...prev, syncMessage: null }));
    }, 3000);
  };

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
      // Simulate API call
      await simulateApiCall();
      
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) throw new Error('Appointment not found');

      // Update appointment
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, ...updates, updatedAt: new Date().toISOString() } : apt
      ));

      // Create notifications based on update type
      if (updates.status) {
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        
        // Notify admin
        if (updates.status === 'checked-in') {
          createNotification(
            'appointment_checked_in',
            'Patient Checked In',
            `${appointment.patientName} has been checked in by ${doctor?.name}`,
            'admin',
            'admin',
            id,
            appointment.doctorId
          );
        } else if (updates.status === 'completed') {
          createNotification(
            'appointment_completed',
            'Appointment Completed',
            `${doctor?.name} completed appointment with ${appointment.patientName}`,
            'admin',
            'admin',
            id,
            appointment.doctorId
          );
        } else if (updates.status === 'cancelled') {
          createNotification(
            'appointment_cancelled',
            'Appointment Cancelled',
            `Appointment with ${appointment.patientName} has been cancelled`,
            'admin',
            'admin',
            id
          );
          // Notify doctor
          createNotification(
            'appointment_cancelled',
            'Appointment Cancelled',
            `Your appointment with ${appointment.patientName} has been cancelled`,
            appointment.doctorId,
            'doctor',
            id
          );
        }
      }

      if (updates.date || updates.time) {
        createNotification(
          'appointment_rescheduled',
          'Appointment Rescheduled',
          `Appointment with ${appointment.patientName} has been rescheduled`,
          appointment.doctorId,
          'doctor',
          id
        );
      }

      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
      toast.success('Updated successfully', {
        description: 'Changes synced across all portals'
      });
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Update failed', {
        description: 'Please try again'
      });
      throw error;
    }
  };

  /**
   * API: POST /api/appointments
   * Creates new appointment and notifies relevant users
   */
  const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Creating appointment...' });
    
    try {
      await simulateApiCall();
      
      const newAppointment: Appointment = {
        ...appointmentData,
        id: `APT${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setAppointments(prev => [...prev, newAppointment]);

      // Notify doctor
      createNotification(
        'appointment_created',
        'New Appointment',
        `New appointment with ${newAppointment.patientName} scheduled for ${new Date(newAppointment.date).toLocaleDateString()}`,
        newAppointment.doctorId,
        'doctor',
        newAppointment.id
      );

      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
      toast.success('Appointment created', {
        description: 'Doctor has been notified'
      });

      return newAppointment;
    } catch (error) {
      setSyncState({ isSyncing: false, lastSyncTime: null, syncMessage: null });
      toast.error('Creation failed');
      throw error;
    }
  };

  /**
   * API: DELETE /api/appointments/{id}
   */
  const deleteAppointment = async (id: string) => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Deleting appointment...' });
    
    try {
      await simulateApiCall();
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      
      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
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
      await simulateApiCall();
      
      setDoctors(prev => prev.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      ));

      // Notify all admins
      const doctor = doctors.find(d => d.id === id);
      createNotification(
        'doctor_updated',
        'Doctor Profile Updated',
        `${doctor?.name || 'A doctor'} updated their profile information`,
        'admin',
        'admin',
        undefined,
        id
      );

      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
      toast.success('Profile updated', {
        description: 'Changes synced to admin dashboard'
      });
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
      await simulateApiCall();
      setPatients(prev => prev.map(pat => 
        pat.id === id ? { ...pat, ...updates } : pat
      ));
      
      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
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
  const createPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Creating patient...' });
    
    try {
      await simulateApiCall();
      
      const newPatient: Patient = {
        ...patientData,
        id: `PAT${Date.now()}`
      };

      setPatients(prev => [...prev, newPatient]);
      
      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
      });
      
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

  /**
   * API: GET /api/sync
   * Syncs all data from backend
   */
  const syncData = async () => {
    setSyncState({ isSyncing: true, lastSyncTime: null, syncMessage: 'Syncing data...' });
    
    try {
      await simulateApiCall(1200);
      
      // In production, fetch from API:
      // const [appointmentsRes, doctorsRes, patientsRes, servicesRes] = await Promise.all([
      //   fetch('/api/appointments'),
      //   fetch('/api/doctors'),
      //   fetch('/api/patients'),
      //   fetch('/api/services')
      // ]);
      
      setSyncState({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: null
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
    updateDoctor,
    updatePatient,
    createPatient,
    getNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    syncData
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
