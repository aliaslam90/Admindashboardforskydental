// Mock data for Sky Dental Clinic Admin Dashboard

export type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'checked-in';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  lastVisit: string | null;
  flags: ('no-show-risk' | 'vip')[];
  notes?: string;
  emiratesIdLast4?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization: string;
  status: 'active' | 'inactive';
  services: string[];
  availability: {
    day: string;
    slots: { start: string; end: string }[];
  }[];
  blockedLeaves?: BlockedLeave[];
  education?: string;
  experience?: string;
  bio?: string;
}

export interface BlockedLeave {
  id: string;
  doctorId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: 'full-day' | 'partial';
  timeSlot?: { start: string; end: string }; // For partial leaves
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  category: string;
  name: string;
  duration: number; // in minutes
  active: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'once-daily' | 'twice-daily' | 'three-times-daily' | 'four-times-daily' | 'as-needed';
  timings: string[]; // e.g., ['09:00', '21:00']
  duration: number; // number of days
  instructions?: string;
  withFood?: 'before' | 'after' | 'with' | 'any';
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email?: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  duration?: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  clinicalNotes?: string;
  prescription?: Prescription;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  appointmentId: string;
  channel: 'sms' | 'email';
  type: 'otp' | 'confirmation' | 'reschedule' | 'cancellation' | 'reminder';
  status: 'sent' | 'failed';
  sentAt: string;
  recipient: string;
}

export type AdminRole = 'super-admin' | 'appointment-manager';

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: 'active' | 'inactive';
  permissions: {
    dashboard: boolean;
    appointments: boolean;
    calendar: boolean;
    patients: boolean;
    doctors: boolean;
    services: boolean;
    notifications: boolean;
    settings: boolean;
    adminManagement: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

// Mock Patients
export const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'Ahmed Al Mansoori',
    phone: '+971-50-123-4567',
    email: 'ahmed.m@email.com',
    totalVisits: 12,
    lastVisit: '2025-12-20',
    flags: ['vip'],
    notes: 'Prefers morning appointments'
  },
  {
    id: 'P002',
    name: 'Fatima Hassan',
    phone: '+971-55-234-5678',
    email: 'fatima.h@email.com',
    totalVisits: 5,
    lastVisit: '2025-12-18',
    flags: ['no-show-risk'],
    notes: 'Allergic to penicillin'
  },
  {
    id: 'P003',
    name: 'Mohammed Ali',
    phone: '+971-50-345-6789',
    totalVisits: 3,
    lastVisit: '2025-12-15',
    flags: ['no-show-risk'],
    notes: 'Missed 2 appointments in the past'
  },
  {
    id: 'P004',
    name: 'Sarah Johnson',
    phone: '+971-52-456-7890',
    email: 'sarah.j@email.com',
    totalVisits: 8,
    lastVisit: '2025-12-22',
    flags: [],
    notes: ''
  },
  {
    id: 'P005',
    name: 'Omar Abdullah',
    phone: '+971-50-567-8901',
    totalVisits: 15,
    lastVisit: '2025-12-24',
    flags: ['vip'],
    notes: 'Regular cleaning every 3 months'
  },
  {
    id: 'P006',
    name: 'Lina Carter',
    phone: '+971-56-678-9012',
    email: 'lina.c@email.com',
    totalVisits: 9,
    lastVisit: '2025-12-23',
    flags: ['vip', 'no-show-risk'],
    notes: 'High-value client, occasionally late'
  }
];

// Mock Doctors
export const mockDoctors: Doctor[] = [
  {
    id: 'D001',
    name: 'Dr. Amira Khalil',
    email: 'amira.k@email.com',
    phone: '+971-50-123-4567',
    specialization: 'General Dentistry',
    status: 'active',
    services: ['S001', 'S002', 'S003', 'S004'],
    availability: [
      { day: 'Monday', slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Tuesday', slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Wednesday', slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Thursday', slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Saturday', slots: [{ start: '10:00', end: '14:00' }] }
    ],
    education: 'DDS, University of Dubai',
    experience: '10 years in General Dentistry',
    bio: 'Dr. Amira Khalil is a highly experienced dentist with a focus on general dentistry. She has been practicing for over 10 years and is dedicated to providing the best care to her patients.'
  },
  {
    id: 'D002',
    name: 'Dr. Hassan Ahmed',
    email: 'hassan.a@email.com',
    phone: '+971-55-234-5678',
    specialization: 'Orthodontics',
    status: 'active',
    services: ['S005', 'S006'],
    availability: [
      { day: 'Sunday', slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'Monday', slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'Tuesday', slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'Wednesday', slots: [{ start: '10:00', end: '18:00' }] }
    ],
    education: 'DDS, University of Sharjah',
    experience: '8 years in Orthodontics',
    bio: 'Dr. Hassan Ahmed is a specialist in orthodontics with over 8 years of experience. He is known for his expertise in braces and other orthodontic treatments.'
  },
  {
    id: 'D003',
    name: 'Dr. Layla Mohamed',
    email: 'layla.m@email.com',
    phone: '+971-50-345-6789',
    specialization: 'Cosmetic Dentistry',
    status: 'active',
    services: ['S007', 'S008'],
    availability: [
      { day: 'Sunday', slots: [{ start: '09:00', end: '15:00' }] },
      { day: 'Tuesday', slots: [{ start: '09:00', end: '15:00' }] },
      { day: 'Thursday', slots: [{ start: '09:00', end: '15:00' }] },
      { day: 'Saturday', slots: [{ start: '09:00', end: '13:00' }] }
    ],
    education: 'DDS, University of Abu Dhabi',
    experience: '5 years in Cosmetic Dentistry',
    bio: 'Dr. Layla Mohamed is a cosmetic dentist with 5 years of experience. She specializes in teeth whitening and veneers, helping patients achieve their desired smile.'
  }
];

// Mock Services
export const mockServices: Service[] = [
  { id: 'S001', category: 'General', name: 'Consultation', duration: 30, active: true },
  { id: 'S002', category: 'General', name: 'Teeth Cleaning', duration: 45, active: true },
  { id: 'S003', category: 'General', name: 'Filling', duration: 60, active: true },
  { id: 'S004', category: 'General', name: 'Extraction', duration: 45, active: true },
  { id: 'S005', category: 'Orthodontics', name: 'Braces Consultation', duration: 30, active: true },
  { id: 'S006', category: 'Orthodontics', name: 'Braces Adjustment', duration: 30, active: true },
  { id: 'S007', category: 'Cosmetic', name: 'Teeth Whitening', duration: 90, active: true },
  { id: 'S008', category: 'Cosmetic', name: 'Veneers Consultation', duration: 45, active: true }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'A001',
    patientId: 'P001',
    patientName: 'Ahmed Al Mansoori',
    phone: '+971-50-123-4567',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S002',
    serviceName: 'Teeth Cleaning',
    date: '2025-12-25',
    time: '10:00',
    status: 'confirmed',
    notes: 'Regular checkup',
    createdAt: '2025-12-20T10:00:00Z',
    updatedAt: '2025-12-21T14:00:00Z'
  },
  {
    id: 'A002',
    patientId: 'P002',
    patientName: 'Fatima Hassan',
    phone: '+971-55-234-5678',
    doctorId: 'D002',
    doctorName: 'Dr. Hassan Ahmed',
    serviceId: 'S005',
    serviceName: 'Braces Consultation',
    date: '2025-12-25',
    time: '11:00',
    status: 'booked',
    notes: '',
    createdAt: '2025-12-23T09:00:00Z',
    updatedAt: '2025-12-23T09:00:00Z'
  },
  {
    id: 'A003',
    patientId: 'P004',
    patientName: 'Sarah Johnson',
    phone: '+971-52-456-7890',
    doctorId: 'D003',
    doctorName: 'Dr. Layla Mohamed',
    serviceId: 'S007',
    serviceName: 'Teeth Whitening',
    date: '2025-12-25',
    time: '14:00',
    status: 'confirmed',
    notes: 'First whitening session',
    createdAt: '2025-12-22T11:00:00Z',
    updatedAt: '2025-12-23T16:00:00Z'
  },
  {
    id: 'A004',
    patientId: 'P005',
    patientName: 'Omar Abdullah',
    phone: '+971-50-567-8901',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S002',
    serviceName: 'Teeth Cleaning',
    date: '2025-12-25',
    time: '15:30',
    status: 'booked',
    notes: 'Regular cleaning - every 3 months',
    createdAt: '2025-12-24T08:00:00Z',
    updatedAt: '2025-12-24T08:00:00Z'
  },
  {
    id: 'A005',
    patientId: 'P003',
    patientName: 'Mohammed Ali',
    phone: '+971-50-345-6789',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S003',
    serviceName: 'Filling',
    date: '2025-12-26',
    time: '09:00',
    status: 'confirmed',
    notes: 'Left molar filling',
    createdAt: '2025-12-21T14:00:00Z',
    updatedAt: '2025-12-22T10:00:00Z'
  },
  {
    id: 'A006',
    patientId: 'P001',
    patientName: 'Ahmed Al Mansoori',
    phone: '+971-50-123-4567',
    doctorId: 'D002',
    doctorName: 'Dr. Hassan Ahmed',
    serviceId: 'S006',
    serviceName: 'Braces Adjustment',
    date: '2025-12-27',
    time: '10:30',
    status: 'booked',
    notes: 'Monthly adjustment',
    createdAt: '2025-12-20T15:00:00Z',
    updatedAt: '2025-12-20T15:00:00Z'
  },
  {
    id: 'A007',
    patientId: 'P002',
    patientName: 'Fatima Hassan',
    phone: '+971-55-234-5678',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S001',
    serviceName: 'Consultation',
    date: '2025-12-24',
    time: '14:00',
    status: 'completed',
    notes: '',
    createdAt: '2025-12-23T11:00:00Z',
    updatedAt: '2025-12-24T15:00:00Z'
  },
  {
    id: 'A008',
    patientId: 'P004',
    patientName: 'Sarah Johnson',
    phone: '+971-52-456-7890',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S002',
    serviceName: 'Teeth Cleaning',
    date: '2025-12-23',
    time: '11:00',
    status: 'completed',
    notes: '',
    createdAt: '2025-12-20T09:00:00Z',
    updatedAt: '2025-12-23T12:00:00Z'
  },
  {
    id: 'A009',
    patientId: 'P003',
    patientName: 'Mohammed Ali',
    phone: '+971-50-345-6789',
    doctorId: 'D002',
    doctorName: 'Dr. Hassan Ahmed',
    serviceId: 'S005',
    serviceName: 'Braces Consultation',
    date: '2025-12-22',
    time: '11:00',
    status: 'no-show',
    notes: 'Patient did not show up',
    createdAt: '2025-12-18T10:00:00Z',
    updatedAt: '2025-12-22T11:30:00Z'
  },
  {
    id: 'A010',
    patientId: 'P005',
    patientName: 'Omar Abdullah',
    phone: '+971-50-567-8901',
    doctorId: 'D001',
    doctorName: 'Dr. Amira Khalil',
    serviceId: 'S002',
    serviceName: 'Teeth Cleaning',
    date: '2025-12-20',
    time: '10:00',
    status: 'cancelled',
    notes: 'Patient requested cancellation - conflict',
    createdAt: '2025-12-15T14:00:00Z',
    updatedAt: '2025-12-19T09:00:00Z'
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'N001',
    appointmentId: 'A001',
    channel: 'sms',
    type: 'confirmation',
    status: 'sent',
    sentAt: '2025-12-21T14:05:00Z',
    recipient: '+971-50-123-4567'
  },
  {
    id: 'N002',
    appointmentId: 'A002',
    channel: 'sms',
    type: 'confirmation',
    status: 'sent',
    sentAt: '2025-12-23T09:05:00Z',
    recipient: '+971-55-234-5678'
  },
  {
    id: 'N003',
    appointmentId: 'A003',
    channel: 'email',
    type: 'confirmation',
    status: 'sent',
    sentAt: '2025-12-23T16:05:00Z',
    recipient: 'sarah.j@email.com'
  },
  {
    id: 'N004',
    appointmentId: 'A004',
    channel: 'sms',
    type: 'confirmation',
    status: 'failed',
    sentAt: '2025-12-24T08:05:00Z',
    recipient: '+971-50-567-8901'
  },
  {
    id: 'N005',
    appointmentId: 'A001',
    channel: 'sms',
    type: 'reminder',
    status: 'sent',
    sentAt: '2025-12-24T10:00:00Z',
    recipient: '+971-50-123-4567'
  }
];

// Mock Admins
export const mockAdmins: Admin[] = [
  {
    id: 'AD001',
    name: 'John Doe',
    email: 'admin@skydentalclinic.com',
    phone: '+971-50-123-4567',
    role: 'super-admin',
    status: 'active',
    permissions: {
      dashboard: true,
      appointments: true,
      calendar: true,
      patients: true,
      doctors: true,
      services: true,
      notifications: true,
      settings: true,
      adminManagement: true
    },
    lastLogin: '2025-12-25T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z'
  },
  {
    id: 'AD002',
    name: 'Jane Smith',
    email: 'manager@skydentalclinic.com',
    phone: '+971-55-234-5678',
    role: 'appointment-manager',
    status: 'active',
    permissions: {
      dashboard: true,
      appointments: true,
      calendar: true,
      patients: true,
      doctors: true,
      services: true,
      notifications: true,
      settings: true,
      adminManagement: false
    },
    lastLogin: '2025-12-24T09:00:00Z',
    createdAt: '2025-01-15T09:00:00Z'
  }
];

// Helper functions
export const getPatientById = (id: string) => mockPatients.find(p => p.id === id);
export const getDoctorById = (id: string) => mockDoctors.find(d => d.id === id);
export const getServiceById = (id: string) => mockServices.find(s => s.id === id);
export const getAppointmentById = (id: string) => mockAppointments.find(a => a.id === id);
export const getAdminById = (id: string) => mockAdmins.find(a => a.id === id);