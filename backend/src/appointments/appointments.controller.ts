import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Headers,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentWithPatientDto } from './dto/create-appointment-with-patient.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('availability')
  getAvailability(
    @Query('doctorId') doctorId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('from') from?: string,
    @Query('days') days?: string,
    @Query('excludeAppointmentId') excludeAppointmentId?: string,
  ) {
    if (!doctorId || !serviceId) {
      // Using a simple error here; in real usage you might want BadRequestException
      throw new Error('doctorId and serviceId are required');
    }
    return this.appointmentsService.getAvailability({
      doctorId: parseInt(doctorId, 10),
      serviceId: parseInt(serviceId, 10),
      from,
      days: days ? parseInt(days, 10) : undefined,
      excludeAppointmentId,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.appointmentsService.create(createAppointmentDto, userId);
  }

  @Post('with-patient')
  @HttpCode(HttpStatus.CREATED)
  createWithPatient(
    @Body() createAppointmentWithPatientDto: CreateAppointmentWithPatientDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.appointmentsService.createWithPatient(
      createAppointmentWithPatientDto,
      userId,
    );
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('doctorId') doctorId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.appointmentsService.findAll({
      search,
      doctorId: doctorId ? parseInt(doctorId) : undefined,
      serviceId: serviceId ? parseInt(serviceId) : undefined,
      status,
      dateFrom,
      dateTo,
      patientId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.appointmentsService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Post('auto-cancel-past')
  @HttpCode(HttpStatus.OK)
  autoCancelPastBooked(@Headers('x-user-id') userId?: string) {
    return this.appointmentsService.autoCancelPastBookedAppointments(userId);
  }
}

