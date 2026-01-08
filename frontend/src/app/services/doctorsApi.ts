import { apiClient } from './api';
import { Doctor } from '../data/types';
import type { Service } from './servicesApi';

type WorkingHours = Record<string, { start: string; end: string }[]>;

interface BackendDoctor {
  id: number;
  name: string;
  specialization: string;
  status?: 'active' | 'inactive';
  services_offered: string[] | null;
  working_hours: WorkingHours | null;
}

export interface CreateDoctorPayload {
  name: string;
  specialization: string;
  services: string[];
  availability: { day: string; slots: { start: string; end: string }[] }[];
  status?: 'active' | 'inactive';
}

const capitalize = (day: string) =>
  day.charAt(0).toUpperCase() + day.slice(1);

function workingHoursToAvailability(
  workingHours?: WorkingHours | null,
): { day: string; slots: { start: string; end: string }[] }[] {
  if (!workingHours) return [];
  return Object.entries(workingHours)
    .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
    .map(([day, slots]) => ({
      day: capitalize(day),
      slots,
    }));
}

function availabilityToWorkingHours(
  availability: { day: string; slots: { start: string; end: string }[] }[],
): WorkingHours {
  return availability.reduce<WorkingHours>((acc, entry) => {
    const key = entry.day.toLowerCase();
    acc[key] = entry.slots;
    return acc;
  }, {});
}

function toDoctor(backend: BackendDoctor): Doctor {
  return {
    id: backend.id.toString(),
    name: backend.name,
    specialization: backend.specialization,
    status: backend.status || 'active',
    services: (backend.services_offered || []).map(String),
    availability: workingHoursToAvailability(backend.working_hours),
    // Optional fields not present in backend
    email: '',
    phone: '',
  };
}

class DoctorsApi {
  async getAll(): Promise<Doctor[]> {
    const backendDoctors = await apiClient.get<BackendDoctor[]>('/doctors');
    return backendDoctors.map(toDoctor);
  }

  async getServices(): Promise<Service[]> {
    const backendServices = await apiClient.get<{
      id: number;
      category: string;
      name: string;
      duration_minutes: number;
      active_status: boolean;
    }[]>('/services');

    return backendServices.map((svc) => ({
      id: svc.id.toString(),
      category: svc.category,
      name: svc.name,
      duration: svc.duration_minutes,
      active: svc.active_status,
    }));
  }

  async create(payload: CreateDoctorPayload): Promise<Doctor> {
    const backendDoctor = await apiClient.post<BackendDoctor>('/doctors', {
      name: payload.name,
      specialization: payload.specialization,
      status: payload.status || 'active',
      services_offered: payload.services,
      working_hours: availabilityToWorkingHours(payload.availability),
    });
    return toDoctor(backendDoctor);
  }

  async update(id: string, payload: Partial<CreateDoctorPayload>): Promise<Doctor> {
    const backendDoctor = await apiClient.patch<BackendDoctor>(`/doctors/${id}`, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.specialization !== undefined ? { specialization: payload.specialization } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.services !== undefined ? { services_offered: payload.services } : {}),
      ...(payload.availability !== undefined
        ? { working_hours: availabilityToWorkingHours(payload.availability) }
        : {}),
    });
    return toDoctor(backendDoctor);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/doctors/${id}`);
  }

  async createService(payload: {
    category: string;
    name: string;
    duration_minutes: number;
    active_status: boolean;
  }): Promise<Service> {
    const svc = await apiClient.post<{
      id: number;
      category: string;
      name: string;
      duration_minutes: number;
      active_status: boolean;
    }>('/services', payload);
    return {
      id: svc.id.toString(),
      category: svc.category,
      name: svc.name,
      duration: svc.duration_minutes,
      active: svc.active_status,
    };
  }

  async updateService(
    id: string,
    payload: Partial<{
      category: string;
      name: string;
      duration_minutes: number;
      active_status: boolean;
    }>,
  ): Promise<Service> {
    const svc = await apiClient.patch<{
      id: number;
      category: string;
      name: string;
      duration_minutes: number;
      active_status: boolean;
    }>(`/services/${id}`, payload);
    return {
      id: svc.id.toString(),
      category: svc.category,
      name: svc.name,
      duration: svc.duration_minutes,
      active: svc.active_status,
    };
  }

  async deleteService(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  }
}

export const doctorsApi = new DoctorsApi();


