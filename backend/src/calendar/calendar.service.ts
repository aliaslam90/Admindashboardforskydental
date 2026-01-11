import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { AppointmentSettings } from '../settings/entities/appointment-settings.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class CalendarService {
  private oauth2Client: any;

  constructor(
    @InjectRepository(AppointmentSettings)
    private readonly settingsRepo: Repository<AppointmentSettings>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly configService: ConfigService,
  ) {
    this.initializeOAuth2Client();
  }

  private initializeOAuth2Client() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      console.warn('Google OAuth credentials not configured');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  async getAuthUrl(): Promise<{ url: string }> {
    if (!this.oauth2Client) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });

    return { url };
  }

  async handleCallback(code: string): Promise<{ success: boolean }> {
    if (!this.oauth2Client) {
      throw new BadRequestException('Google OAuth not configured');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
      if (!settings) {
        throw new BadRequestException('Settings not found');
      }

      settings.calendar_access_token = tokens.access_token;
      settings.calendar_refresh_token = tokens.refresh_token;
      settings.calendar_token_expiry = tokens.expiry_date 
        ? new Date(tokens.expiry_date) 
        : null;
      settings.calendar_connected = true;

      await this.settingsRepo.save(settings);

      return { success: true };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw new BadRequestException('Failed to authenticate with Google Calendar');
    }
  }

  private async getAuthenticatedClient() {
    if (!this.oauth2Client) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings || !settings.calendar_connected) {
      throw new UnauthorizedException('Calendar not connected');
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: settings.calendar_access_token,
      refresh_token: settings.calendar_refresh_token,
      expiry_date: settings.calendar_token_expiry?.getTime(),
    });

    // Refresh token if expired
    if (settings.calendar_token_expiry && new Date() >= settings.calendar_token_expiry) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        settings.calendar_access_token = credentials.access_token;
        if (credentials.refresh_token) {
          settings.calendar_refresh_token = credentials.refresh_token;
        }
        settings.calendar_token_expiry = credentials.expiry_date 
          ? new Date(credentials.expiry_date) 
          : null;
        
        await this.settingsRepo.save(settings);
        
        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new UnauthorizedException('Failed to refresh calendar token');
      }
    }

    return this.oauth2Client;
  }

  async createEvent(appointment: Appointment): Promise<string> {
    try {
      const auth = await this.getAuthenticatedClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Always use primary calendar
      const calendarId = 'primary';

      // Load relations if not already loaded
      if (!appointment.doctor || !appointment.patient || !appointment.service) {
        const loadedAppointment = await this.appointmentRepo.findOne({
          where: { id: appointment.id },
          relations: ['doctor', 'patient', 'service'],
        });
        if (!loadedAppointment) {
          throw new BadRequestException('Appointment not found');
        }
        appointment = loadedAppointment;
      }

      if (!appointment.service || !appointment.patient || !appointment.doctor) {
        throw new BadRequestException('Appointment missing required relations');
      }

      // Format datetime for Google Calendar
      // The Date object from database is already in local time (Dubai) when retrieved
      // Google Calendar adds 1 hour when we specify timeZone: 'Asia/Dubai' with a time string
      // So we subtract 1 hour to compensate - this is a known quirk with Google Calendar API
      const formatDateTime = (date: Date): string => {
        // Use local time methods since Date object is already in local time (Dubai)
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Subtract 1 hour to compensate for Google Calendar's timezone interpretation
        // Handle day rollover safely
        let finalYear = year;
        let finalMonth = month;
        let finalDay = day;
        hours -= 1;

        if (hours < 0) {
          hours += 24;
          finalDay -= 1;
          if (finalDay < 1) {
            finalMonth -= 1;
            if (finalMonth < 0) {
              finalMonth = 11;
              finalYear -= 1;
            }
            // Get days in previous month
            finalDay = new Date(finalYear, finalMonth + 1, 0).getDate();
          }
        }

        return `${finalYear}-${String(finalMonth + 1).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      };

      const event = {
        summary: `${appointment.service.name} - ${appointment.patient.full_name}`,
        description: `Appointment with Dr. ${appointment.doctor.name}\nPatient: ${appointment.patient.full_name}\nPhone: ${appointment.patient.phone_number}\nEmail: ${appointment.patient.email}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`,
        start: {
          dateTime: formatDateTime(appointment.start_datetime),
          timeZone: 'Asia/Dubai',
        },
        end: {
          dateTime: formatDateTime(appointment.end_datetime),
          timeZone: 'Asia/Dubai',
        },
        attendees: [
          {
            email: appointment.patient.email,
            displayName: appointment.patient.full_name,
          },
        ],
      };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return response.data.id || '';
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new BadRequestException('Failed to create calendar event');
    }
  }

  async updateEvent(appointment: Appointment): Promise<void> {
    if (!appointment.calendar_event_id) {
      // If no event ID, create a new event
      const eventId = await this.createEvent(appointment);
      appointment.calendar_event_id = eventId;
      await this.appointmentRepo.save(appointment);
      return;
    }

    try {
      const auth = await this.getAuthenticatedClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Always use primary calendar
      const calendarId = 'primary';

      // Load relations if not already loaded
      if (!appointment.doctor || !appointment.patient || !appointment.service) {
        const loadedAppointment = await this.appointmentRepo.findOne({
          where: { id: appointment.id },
          relations: ['doctor', 'patient', 'service'],
        });
        if (!loadedAppointment) {
          throw new BadRequestException('Appointment not found');
        }
        appointment = loadedAppointment;
      }

      if (!appointment.service || !appointment.patient || !appointment.doctor) {
        throw new BadRequestException('Appointment missing required relations');
      }

      // Format datetime for Google Calendar
      // The Date object from database is already in local time (Dubai) when retrieved
      // Google Calendar adds 1 hour when we specify timeZone: 'Asia/Dubai' with a time string
      // So we subtract 1 hour to compensate - this is a known quirk with Google Calendar API
      const formatDateTime = (date: Date): string => {
        // Use local time methods since Date object is already in local time (Dubai)
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Subtract 1 hour to compensate for Google Calendar's timezone interpretation
        // Handle day rollover safely
        let finalYear = year;
        let finalMonth = month;
        let finalDay = day;
        hours -= 1;

        if (hours < 0) {
          hours += 24;
          finalDay -= 1;
          if (finalDay < 1) {
            finalMonth -= 1;
            if (finalMonth < 0) {
              finalMonth = 11;
              finalYear -= 1;
            }
            // Get days in previous month
            finalDay = new Date(finalYear, finalMonth + 1, 0).getDate();
          }
        }

        return `${finalYear}-${String(finalMonth + 1).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      };

      const event = {
        summary: `${appointment.service.name} - ${appointment.patient.full_name}`,
        description: `Appointment with Dr. ${appointment.doctor.name}\nPatient: ${appointment.patient.full_name}\nPhone: ${appointment.patient.phone_number}\nEmail: ${appointment.patient.email}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`,
        start: {
          dateTime: formatDateTime(appointment.start_datetime),
          timeZone: 'Asia/Dubai',
        },
        end: {
          dateTime: formatDateTime(appointment.end_datetime),
          timeZone: 'Asia/Dubai',
        },
        attendees: [
          {
            email: appointment.patient.email,
            displayName: appointment.patient.full_name,
          },
        ],
      };

      await calendar.events.update({
        calendarId,
        eventId: appointment.calendar_event_id,
        requestBody: event,
      });
    } catch (error) {
      console.error('Error updating calendar event:', error);
      // If event not found, create a new one
      if (error.code === 404) {
        const eventId = await this.createEvent(appointment);
        appointment.calendar_event_id = eventId;
        await this.appointmentRepo.save(appointment);
      } else {
        throw new BadRequestException('Failed to update calendar event');
      }
    }
  }

  async deleteEvent(appointment: Appointment): Promise<void> {
    if (!appointment.calendar_event_id) {
      return; // No event to delete
    }

    try {
      const auth = await this.getAuthenticatedClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Always use primary calendar
      const calendarId = 'primary';

      await calendar.events.delete({
        calendarId,
        eventId: appointment.calendar_event_id,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      // Don't throw error if event not found (already deleted)
      if (error.code !== 404) {
        throw new BadRequestException('Failed to delete calendar event');
      }
    }
  }

  async disconnect(): Promise<{ success: boolean }> {
    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      throw new BadRequestException('Settings not found');
    }

    settings.calendar_connected = false;
    settings.calendar_access_token = null;
    settings.calendar_refresh_token = null;
    settings.calendar_token_expiry = null;
    settings.calendar_calendar_id = null;

    await this.settingsRepo.save(settings);

    return { success: true };
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    calendar_id?: string;
    token_expiry?: Date;
  }> {
    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    const configured = !!(this.oauth2Client);

    if (!settings) {
      return {
        connected: false,
        configured,
      };
    }

    return {
      connected: settings.calendar_connected || false,
      configured,
      token_expiry: settings.calendar_token_expiry || undefined,
    };
  }


  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const auth = await this.getAuthenticatedClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Try to get the calendar list as a test
      await calendar.calendarList.list({
        maxResults: 1,
      });

      return {
        success: true,
        message: 'Successfully connected to Google Calendar',
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to Google Calendar',
      };
    }
  }
}

