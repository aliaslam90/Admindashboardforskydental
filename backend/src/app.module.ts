import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServicesModule } from './services/services.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Support connection string from cloud providers (Vercel Postgres, Neon, Supabase, etc.)
        const postgresUrl = configService.get('POSTGRES_URL') || configService.get('DATABASE_URL');
        
        if (postgresUrl) {
          try {
            // Parse connection string (format: postgres://user:password@host:port/database?sslmode=require)
            const normalizedUrl = postgresUrl.replace(/^postgresql:\/\//, 'postgres://');
            const url = new URL(normalizedUrl);
            
            return {
              type: 'postgres' as const,
              host: url.hostname,
              port: parseInt(url.port) || 5432,
              username: url.username,
              password: url.password,
              database: url.pathname.slice(1), // Remove leading '/'
              entities: [__dirname + '/**/*.entity{.ts,.js}'],
              synchronize: configService.get('NODE_ENV') !== 'production',
              logging: configService.get('NODE_ENV') === 'development',
              ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
            };
          } catch (error) {
            console.error('Failed to parse POSTGRES_URL:', error);
            throw new Error('Invalid POSTGRES_URL format');
          }
        }
        
        // Fall back to individual environment variables (for Docker/local dev)
        return {
          type: 'postgres' as const,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'dental_user'),
          password: configService.get('DB_PASSWORD', 'dental_pass'),
          database: configService.get('DB_NAME', 'dental_db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    ServicesModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    UsersModule,
    SeedModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

