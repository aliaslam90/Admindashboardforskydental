import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';

@Controller('settings/appointments')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.getAppointmentSettings();
  }

  @Patch()
  update(@Body() dto: UpdateAppointmentSettingsDto) {
    return this.settingsService.updateAppointmentSettings(dto);
  }
}

