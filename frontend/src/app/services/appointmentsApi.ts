import { apiClient } from './api';
import { Appointment, AppointmentStatus } from '../data/types';

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
  // Preserve the time sent by backend without timezone conversion
  const [datePart, timeWithZone] = backend.start_datetime.split('T');
  const timePart = timeWithZone ? timeWithZone.slice(0, 5) : '';

  const patientName = backend.patient?.full_name ?? '';
  const patientPhone = backend.patient?.phone_number ?? '';
  const doctorName = backend.doctor?.name ?? '';
  const serviceName = backend.service?.name ?? '';
  const serviceDuration = backend.service?.duration_minutes;

  return {
    id: backend.id,
    patientId: backend.patient_id,
    patientName,
    phone: patientPhone,
    doctorId: backend.doctor_id.toString(),
    doctorName,
    serviceId: backend.service_id.toString(),
    serviceName,
    durationMinutes: serviceDuration,
    date: datePart || '',
    time: timePart,
    status: backendToFrontendStatus(backend.status),
    notes: backend.notes || undefined,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

class AppointmentsApi {
  async getAvailability(params: {
    doctorId: string;
    serviceId: string;
    from?: string;
    days?: number;
  }): Promise<
    {
      start: string;
      end: string;
      date: string;
      time: string;
    }[]
  > {
    const query: Record<string, string> = {
      doctorId: params.doctorId,
      serviceId: params.serviceId,
    };
    if (params.from) query.from = params.from;
    if (params.days) query.days = String(params.days);

    const slots = await apiClient.get<
      {
        start: string;
        end: string;
      }[]
    >('/appointments/availability', query);

    return slots.map((slot) => {
      // Parse the ISO string - extract date and time directly from ISO string
      // to avoid timezone conversion issues
      const isoMatch = slot.start.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):/);
      if (isoMatch) {
        const datePart = isoMatch[1];
        const timePart = isoMatch[2];
        return {
          start: slot.start,
          end: slot.end,
          date: datePart,
          time: timePart,
        };
      }
      // Fallback to Date parsing if format is unexpected
      const slotDate = new Date(slot.start);
      const year = slotDate.getUTCFullYear();
      const month = String(slotDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(slotDate.getUTCDate()).padStart(2, '0');
      const datePart = `${year}-${month}-${day}`;
      const hours = String(slotDate.getUTCHours()).padStart(2, '0');
      const minutes = String(slotDate.getUTCMinutes()).padStart(2, '0');
      const timePart = `${hours}:${minutes}`;
      return {
        start: slot.start,
        end: slot.end,
        date: datePart,
        time: timePart,
      };
    });
  }

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

  async create(data: CreateAppointmentPayload): Promise<Appointment | null> {
    const backendAppointment = await apiClient.post<BackendAppointment | null>(
      '/appointments/with-patient',
      data,
    );

    if (!backendAppointment) {
      // Surface a failure so the UI can inform the user appropriately
      throw new Error('Appointment could not be created (empty server response).');
    }

    return transformBackendToFrontend(backendAppointment as BackendAppointment);
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

