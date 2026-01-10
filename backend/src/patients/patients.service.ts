import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto, userId?: string): Promise<Patient> {
    try {
      // Check if phone number already exists
      const existingPatient = await this.patientRepository.findOne({
        where: { phone_number: createPatientDto.phone_number },
      });

      if (existingPatient) {
        throw new ConflictException(
          `Patient with phone number ${createPatientDto.phone_number} already exists`,
        );
      }

      const patient = this.patientRepository.create({
        ...createPatientDto,
        // created_by is nullable - null for public registration, user_id for dashboard operations
        created_by: userId || null,
      });
      return await this.patientRepository.save(patient);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create patient: ${error.message}`);
    }
  }

  async findAll(search?: string): Promise<Patient[]> {
    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .orderBy('patient.created_at', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(patient.full_name ILIKE :search OR patient.phone_number ILIKE :search OR patient.id::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId?: string): Promise<Patient> {
    const patient = await this.findOne(id);

    // Check if phone number is being updated and if it conflicts with another patient
    if (
      updatePatientDto.phone_number &&
      updatePatientDto.phone_number !== patient.phone_number
    ) {
      const existingPatient = await this.patientRepository.findOne({
        where: { phone_number: updatePatientDto.phone_number },
      });

      if (existingPatient) {
        throw new ConflictException(
          `Patient with phone number ${updatePatientDto.phone_number} already exists`,
        );
      }
    }

    // Update patient fields
    Object.assign(patient, {
      ...updatePatientDto,
      // updated_by is nullable - null for public updates, user_id for dashboard operations
      updated_by: userId || null,
    });

    try {
      return await this.patientRepository.save(patient);
    } catch (error) {
      throw new BadRequestException(`Failed to update patient: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }
}

