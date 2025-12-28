import { apiClient } from './api';
import { Appointment, AppointmentStatus } from '../data/mockData';

// Backend types
export type BackendAppointmentStatus =
  | 'pending_confirmation'
  | 'booked'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

interface BackendPatient {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
}

interface BackendDoctor {
  id: number;
  name: string;
  specialization: string;
  services_offered: string[];
  working_hours: Record<string, any>;
}

interface BackendService {
  id: number;
  category: string;
  name: string;
  duration_minutes: number;
  active_status: boolean;
}

interface BackendAppointment {
  id: string;
  patient_id: string;
  doctor_id: number;
  service_id: number;
  start_datetime: string;
  end_datetime: string;
  status: BackendAppointmentStatus;
  notes: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
  patient: BackendPatient;
  doctor: BackendDoctor;
  service: BackendService;
}

export interface AppointmentFilters {
  search?: string;
  doctorId?: string;
  serviceId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

export interface CreateAppointmentPayload {
  patient: {
    id?: string;
    full_name: string;
    phone_number: string;
    email?: string;
  };
  doctor_id: number;
  service_id: number;
  start_datetime: string;
  end_datetime: string;
  status?: BackendAppointmentStatus;
  notes?: string;
}

// Helper functions to convert between frontend and backend formats
function frontendToBackendStatus(
  status: AppointmentStatus,
): BackendAppointmentStatus {
  const statusMap: Record<AppointmentStatus, BackendAppointmentStatus> = {
    booked: 'booked',
    confirmed: 'confirmed',
    'checked-in': 'checked_in',
    completed: 'completed',
    cancelled: 'cancelled',
    'no-show': 'no_show',
  };
  return statusMap[status] || 'booked';
}

function backendToFrontendStatus(
  status: BackendAppointmentStatus,
): AppointmentStatus {
  const statusMap: Record<BackendAppointmentStatus, AppointmentStatus> = {
    pending_confirmation: 'booked',
    booked: 'booked',
    confirmed: 'confirmed',
    checked_in: 'checked-in',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no-show',
    rescheduled: 'booked',
  };
  return statusMap[status] || 'booked';
}

function transformBackendToFrontend(
  backend: BackendAppointment,
): Appointment {
  const startDate = new Date(backend.start_datetime);

  return {
    id: backend.id,
    patientId: backend.patient_id,
    patientName: backend.patient.full_name,
    phone: backend.patient.phone_number,
    doctorId: backend.doctor_id.toString(),
    doctorName: backend.doctor.name,
    serviceId: backend.service_id.toString(),
    serviceName: backend.service.name,
    date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), // HH:MM
    status: backendToFrontendStatus(backend.status),
    notes: backend.notes || undefined,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

class AppointmentsApi {
  async getAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params: Record<string, string> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.doctorId) params.doctorId = filters.doctorId;
    if (filters?.serviceId) params.serviceId = filters.serviceId;
    if (filters?.status) params.status = frontendToBackendStatus(filters.status as AppointmentStatus);
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.patientId) params.patientId = filters.patientId;

    const backendAppointments = await apiClient.get<BackendAppointment[]>(
      '/appointments',
      Object.keys(params).length > 0 ? params : undefined,
    );

    return backendAppointments.map(transformBackendToFrontend);
  }

  async getById(id: string): Promise<Appointment> {
    const backendAppointment = await apiClient.get<BackendAppointment>(
      `/appointments/${id}`,
    );
    return transformBackendToFrontend(backendAppointment);
  }

  async create(data: CreateAppointmentPayload): Promise<Appointment> {
    const backendAppointment = await apiClient.post<BackendAppointment>(
      '/appointments/with-patient',
      data,
    );
    return transformBackendToFrontend(backendAppointment);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const backendAppointment = await apiClient.patch<BackendAppointment>(
      `/appointments/${id}/status`,
      { status: frontendToBackendStatus(status) },
    );
    return transformBackendToFrontend(backendAppointment);
  }

  async update(
    id: string,
    data: Partial<CreateAppointmentPayload>,
  ): Promise<Appointment> {
    const backendAppointment = await apiClient.patch<BackendAppointment>(
      `/appointments/${id}`,
      data,
    );
    return transformBackendToFrontend(backendAppointment);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  }
}

export const appointmentsApi = new AppointmentsApi();

