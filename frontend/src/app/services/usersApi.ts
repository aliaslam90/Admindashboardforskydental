import { apiClient } from './api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'patient' | 'receptionist' | 'manager' | 'admin' | 'content_editor';
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  role?: 'patient' | 'receptionist' | 'manager' | 'admin' | 'content_editor';
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  full_name?: string;
  phone_number?: string;
  role?: 'patient' | 'receptionist' | 'manager' | 'admin' | 'content_editor';
  is_active?: boolean;
  email_verified?: boolean;
}

class UsersApi {
  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  }

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async create(data: CreateUserDto): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  }
}

export const usersApi = new UsersApi();

