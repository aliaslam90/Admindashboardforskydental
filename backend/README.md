# Dental Appointment System - Backend API

A comprehensive NestJS backend API for managing a dental clinic's operations including appointments, patients, doctors, services, and CMS functionality.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control (Admin, Receptionist, Content Manager)
- 👥 **User Management** - Staff user management with different roles
- 👨‍⚕️ **Doctor Management** - Doctor profiles, specializations, and availability
- 🏥 **Patient Management** - Patient records with medical history
- 📅 **Appointment System** - Online booking with availability checking
- 🛠️ **Service Management** - Dental services with pricing and categories
- 📦 **Packages & Offers** - Service packages with validity periods
- 📝 **Blog/CMS** - Content management for blog posts and pages
- 📊 **Dashboard** - Appointment statistics and analytics

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Language**: TypeScript

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── decorators/    # Custom decorators (@Public, @Roles, @CurrentUser)
│   ├── guards/        # Auth guards (JWT, Roles)
│   ├── strategies/    # Passport strategies
│   └── dto/           # Auth DTOs
├── users/             # User management
├── doctors/           # Doctor management
├── patients/          # Patient management
├── appointments/      # Appointment booking system
├── services/          # Service management
├── blog/              # Blog/CMS
├── packages/          # Packages & offers
├── content/           # Content management
├── doctor-availability/ # Doctor availability management
├── entities/           # TypeORM entities
└── config/            # Configuration files
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=dental_clinic
JWT_SECRET=your-secret-key
PORT=3003
```

4. Run database migrations (TypeORM will auto-sync in development):
```bash
npm run start:dev
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Admin only)

### Users
- `GET /api/users` - Get all users (Admin/Receptionist)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PATCH /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Doctors
- `GET /api/doctors` - Get all doctors (Public)
- `GET /api/doctors/:id` - Get doctor by ID (Public)
- `POST /api/doctors` - Create doctor (Admin/Receptionist)
- `PATCH /api/doctors/:id` - Update doctor (Admin/Receptionist)
- `DELETE /api/doctors/:id` - Delete doctor (Admin)

### Patients
- `GET /api/patients` - Get all patients (Admin/Receptionist)
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient (Public - for online booking)
- `PATCH /api/patients/:id` - Update patient (Admin/Receptionist)
- `DELETE /api/patients/:id` - Delete patient (Admin)

### Appointments
- `GET /api/appointments` - Get all appointments (with filters)
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment (Public)
- `POST /api/appointments/check-availability` - Check available time slots (Public)
- `GET /api/appointments/dashboard/stats` - Get dashboard statistics
- `PATCH /api/appointments/:id` - Update appointment (Admin/Receptionist)
- `DELETE /api/appointments/:id` - Delete appointment (Admin/Receptionist)

### Services
- `GET /api/services` - Get all services (Public)
- `GET /api/services/categories` - Get service categories (Public)
- `GET /api/services/:id` - Get service by ID (Public)
- `POST /api/services` - Create service (Admin/Content Manager)
- `PATCH /api/services/:id` - Update service (Admin/Content Manager)
- `DELETE /api/services/:id` - Delete service (Admin)

### Blog
- `GET /api/blog` - Get all blog posts (Public)
- `GET /api/blog/:id` - Get blog post by ID (Public)
- `GET /api/blog/slug/:slug` - Get blog post by slug (Public)
- `POST /api/blog` - Create blog post (Admin/Content Manager)
- `PATCH /api/blog/:id` - Update blog post (Admin/Content Manager)
- `DELETE /api/blog/:id` - Delete blog post (Admin/Content Manager)

### Packages
- `GET /api/packages` - Get all packages (Public)
- `GET /api/packages/:id` - Get package by ID (Public)
- `POST /api/packages` - Create package (Admin/Content Manager)
- `PATCH /api/packages/:id` - Update package (Admin/Content Manager)
- `DELETE /api/packages/:id` - Delete package (Admin)

### Content (CMS)
- `GET /api/content` - Get all content (Admin/Content Manager)
- `GET /api/content/:id` - Get content by ID (Public)
- `GET /api/content/key/:key` - Get content by key (Public)
- `POST /api/content` - Create content (Admin/Content Manager)
- `PATCH /api/content/:id` - Update content (Admin/Content Manager)
- `PATCH /api/content/key/:key` - Update content by key (Admin/Content Manager)
- `DELETE /api/content/:id` - Delete content (Admin/Content Manager)

### Doctor Availability
- `GET /api/doctor-availability/doctor/:doctorId` - Get availability for doctor
- `POST /api/doctor-availability` - Create availability (Admin/Receptionist)
- `PATCH /api/doctor-availability/:id` - Update availability (Admin/Receptionist)
- `DELETE /api/doctor-availability/:id` - Delete availability (Admin/Receptionist)

## User Roles

- **Admin**: Full access to all features
- **Receptionist**: Can manage appointments, patients, doctors, and view dashboard
- **Content Manager**: Can manage services, blog posts, packages, and content

## Database Schema

### Core Entities
- **User**: Staff users with roles
- **Doctor**: Doctor profiles with specializations
- **Patient**: Patient records with medical history
- **Service**: Dental services with pricing
- **Appointment**: Bookings with status tracking
- **DoctorAvailability**: Weekly availability schedule
- **Package**: Service packages with validity
- **Blog**: Blog posts with status (draft/published)
- **Content**: CMS content for pages

## Environment Variables

See `.env.example` for all required environment variables.

## Development Notes

- TypeORM synchronizes schema automatically in development (set `synchronize: false` in production)
- Use migrations for production database changes
- JWT tokens expire in 24 hours (configurable)
- CORS is enabled for frontend communication

## Next Steps

- [ ] Add email notifications for appointments
- [ ] Implement calendar integration (Google Calendar, Outlook)
- [ ] Add file upload for images
- [ ] Implement search functionality
- [ ] Add pagination for list endpoints
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger)
