import { apiClient } from './api';
import { Patient } from '../data/mockData';

interface BackendPatient {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  emirates_id_last4?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientPayload {
  full_name: string;
  phone_number: string;
  email: string;
  emirates_id_last4?: string;
}

function toPatient(backend: BackendPatient): Patient {
  return {
    id: backend.id,
    name: backend.full_name,
    phone: backend.phone_number,
    email: backend.email,
    // Stats derived on the frontend; default to empty values
    totalVisits: 0,
    lastVisit: '',
    flags: [],
    notes: '',
  };
}

class PatientsApi {
  async getAll(search?: string): Promise<Patient[]> {
    const params = search ? { search } : undefined;
    const backendPatients = await apiClient.get<BackendPatient[]>('/patients', params);
    return backendPatients.map(toPatient);
  }

  async getById(id: string): Promise<Patient> {
    const backendPatient = await apiClient.get<BackendPatient>(`/patients/${id}`);
    return toPatient(backendPatient);
  }

  async create(data: CreatePatientPayload): Promise<Patient> {
    const backendPatient = await apiClient.post<BackendPatient>('/patients', data);
    return toPatient(backendPatient);
  }

  async update(id: string, data: Partial<CreatePatientPayload>): Promise<Patient> {
    const backendPatient = await apiClient.patch<BackendPatient>(`/patients/${id}`, data);
    return toPatient(backendPatient);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }
}

export const patientsApi = new PatientsApi();


