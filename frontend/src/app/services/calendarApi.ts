import { apiClient } from './api';

export interface CalendarStatus {
  connected: boolean;
  configured: boolean;
  token_expiry?: string;
}

export interface CalendarTestResult {
  success: boolean;
  message: string;
}

class CalendarApi {
  /**
   * Get Google OAuth authorization URL
   */
  async getAuthUrl(): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>('/calendar/auth-url');
  }

  /**
   * Get calendar connection status
   */
  async getStatus(): Promise<CalendarStatus> {
    return apiClient.get<CalendarStatus>('/calendar/status');
  }

  /**
   * Test calendar connection
   */
  async testConnection(): Promise<CalendarTestResult> {
    return apiClient.get<CalendarTestResult>('/calendar/test');
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/calendar/disconnect');
  }
}

export const calendarApi = new CalendarApi();

