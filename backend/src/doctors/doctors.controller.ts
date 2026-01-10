import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.doctorsService.create(createDoctorDto, userId);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('services')
  findServices() {
    return this.doctorsService.findAllServices();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.doctorsService.update(id, updateDoctorDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.remove(id);
  }

  // Additional endpoints for managing leave dates
  @Post(':id/leave-dates')
  @HttpCode(HttpStatus.CREATED)
  addLeaveDate(
    @Param('id', ParseIntPipe) doctorId: number,
    @Body() leaveDto: CreateDoctorLeaveDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.doctorsService.addLeaveDate(doctorId, leaveDto, userId);
  }

  @Delete('leave-dates/:leaveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLeaveDate(@Param('leaveId', ParseIntPipe) leaveId: number) {
    return this.doctorsService.removeLeaveDate(leaveId);
  }

  @Patch('leave-dates/:leaveId')
  updateLeaveDate(
    @Param('leaveId', ParseIntPipe) leaveId: number,
    @Body() updateDto: UpdateDoctorLeaveDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.doctorsService.updateLeaveDate(leaveId, updateDto, userId);
  }
}
