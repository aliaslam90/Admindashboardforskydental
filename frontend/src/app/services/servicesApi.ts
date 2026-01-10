import { apiClient } from './api';

export interface Service {
  id: string;
  category: string;
  name: string;
  duration: number; // in minutes
  active: boolean;
}

interface BackendService {
  id: number;
  category: string;
  name: string;
  duration_minutes: number;
  active_status: boolean;
}

const toService = (svc: BackendService): Service => ({
  id: svc.id.toString(),
  category: svc.category,
  name: svc.name,
  duration: svc.duration_minutes,
  active: svc.active_status,
});

class ServicesApi {
  async getAll(): Promise<Service[]> {
    const data = await apiClient.get<BackendService[]>('/services');
    return data.map(toService);
  }

  async create(payload: {
    category: string;
    name: string;
    duration_minutes: number;
    active_status: boolean;
  }): Promise<Service> {
    const svc = await apiClient.post<BackendService>('/services', payload);
    return toService(svc);
  }

  async update(
    id: string,
    payload: Partial<{
      category: string;
      name: string;
      duration_minutes: number;
      active_status: boolean;
    }>,
  ): Promise<Service> {
    const svc = await apiClient.patch<BackendService>(`/services/${id}`, payload);
    return toService(svc);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  }
}

export const servicesApi = new ServicesApi();

