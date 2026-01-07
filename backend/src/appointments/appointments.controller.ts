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
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentWithPatientDto } from './dto/create-appointment-with-patient.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Post('with-patient')
  @HttpCode(HttpStatus.CREATED)
  createWithPatient(
    @Body() createAppointmentWithPatientDto: CreateAppointmentWithPatientDto,
  ) {
    return this.appointmentsService.createWithPatient(
      createAppointmentWithPatientDto,
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
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}

