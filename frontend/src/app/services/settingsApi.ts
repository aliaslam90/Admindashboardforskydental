import { apiClient } from './api';

export interface AppointmentSettings {
  id: number;
  buffer_minutes: number;
  cancellation_window_hours: number;
  otp_required: boolean;
  otp_expiry_minutes: number;
  opening_time: string; // HH:mm
  closing_time: string; // HH:mm
  working_days: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateAppointmentSettingsPayload {
  buffer_minutes?: number;
  cancellation_window_hours?: number;
  otp_required?: boolean;
  otp_expiry_minutes?: number;
  opening_time?: string;
  closing_time?: string;
  working_days?: string[];
}

class SettingsApi {
  async getAppointmentSettings(): Promise<AppointmentSettings> {
    return apiClient.get<AppointmentSettings>('/settings/appointments');
  }

  async updateAppointmentSettings(
    data: UpdateAppointmentSettingsPayload,
  ): Promise<AppointmentSettings> {
    return apiClient.patch<AppointmentSettings>('/settings/appointments', data);
  }
}

export const settingsApi = new SettingsApi();

