import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Get Google OAuth authorization URL
   * GET /api/calendar/auth-url
   */
  @Get('auth-url')
  getAuthUrl() {
    return this.calendarService.getAuthUrl();
  }

  /**
   * Handle OAuth callback from Google
   * GET /api/calendar/callback?code=...
   */
  @Get('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Query('code') code: string) {
    if (!code) {
      throw new Error('Authorization code is required');
    }
    return this.calendarService.handleCallback(code);
  }

  /**
   * Get calendar connection status
   * GET /api/calendar/status
   */
  @Get('status')
  getConnectionStatus() {
    return this.calendarService.getConnectionStatus();
  }

  /**
   * Test calendar connection
   * GET /api/calendar/test
   */
  @Get('test')
  testConnection() {
    return this.calendarService.testConnection();
  }

  /**
   * Disconnect Google Calendar integration
   * POST /api/calendar/disconnect
   */
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  disconnect() {
    return this.calendarService.disconnect();
  }
}

