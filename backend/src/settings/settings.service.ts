import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSettings } from './entities/appointment-settings.entity';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppointmentSettings)
    private readonly settingsRepo: Repository<AppointmentSettings>,
  ) {}

  private async getSingleton(): Promise<AppointmentSettings> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 1,
        buffer_minutes: 15,
        cancellation_window_hours: 24,
        otp_required: false,
        otp_expiry_minutes: 5,
        opening_time: '09:00',
        closing_time: '18:00',
        working_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        calendar_connected: false,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async getAppointmentSettings(): Promise<AppointmentSettings> {
    return this.getSingleton();
  }

  async updateAppointmentSettings(
    dto: UpdateAppointmentSettingsDto,
    userId?: string,
  ): Promise<AppointmentSettings> {
    const settings = await this.getSingleton();

    if (dto.opening_time && dto.closing_time) {
      if (!this.isOpeningBeforeClosing(dto.opening_time, dto.closing_time)) {
        throw new BadRequestException('opening_time must be before closing_time');
      }
    }

    Object.assign(settings, {
      ...dto,
      updated_by: userId,
    });
    return this.settingsRepo.save(settings);
  }

  private isOpeningBeforeClosing(open: string, close: string): boolean {
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    return oh * 60 + om < ch * 60 + cm;
  }
}

