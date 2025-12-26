import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      message: 'Dental Appointment System API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        root: '/api',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dental-backend',
      database: 'connected',
    };
  }
}

