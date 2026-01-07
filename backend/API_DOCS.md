# Dental Appointment System API Docs

Base URL: `/api`

## Services

- **POST** `/services`
  - Create a service.
  - Body: `{ "category": "Preventive", "name": "Checkup", "duration_minutes": 30, "active_status": true }`
  - Response: Created service.

- **GET** `/services`
  - List all services.

- **GET** `/services/:id`
  - Get a specific service.

- **PATCH** `/services/:id`
  - Update fields of a service.
  - Body (examples): `{ "name": "Teeth Cleaning" }` or `{ "active_status": false }`

- **DELETE** `/services/:id`
  - Delete a service. Response: 204 No Content.

## Doctors

- **POST** `/doctors`
  - Create a doctor with optional leaves.
  - Body example:
    ```json
    {
      "name": "Dr. Sarah Johnson",
      "specialization": "General Dentistry",
      "services_offered": ["Checkup", "Cleaning"],
      "working_hours": { "monday": { "start": "09:00", "end": "17:00" } },
      "leave_dates": [
        { "leave_date": "2025-01-10", "reason": "Conference" }
      ]
    }
    ```

- **GET** `/doctors`
  - List all doctors (includes leave_dates).

- **GET** `/doctors/:id`
  - Get a specific doctor with leave_dates.

- **PATCH** `/doctors/:id`
  - Update doctor and replace leave_dates if provided.
  - Body example:
    ```json
    {
      "name": "Dr. Sarah J.",
      "leave_dates": [
        { "leave_date": "2025-02-01", "reason": "Vacation" }
      ]
    }
    ```

- **DELETE** `/doctors/:id`
  - Delete a doctor. Response: 204 No Content.

### Doctor Leave Management

- **POST** `/doctors/:id/leave-dates`
  - Add a leave date for a doctor.
  - Body: `{ "leave_date": "2025-03-05", "reason": "Family event" }`

- **PATCH** `/doctors/leave-dates/:leaveId`
  - Update a specific leave date (date and/or reason).
  - Body: `{ "reason": "Rescheduled appointment" }` or `{ "leave_date": "2025-03-06" }`

- **DELETE** `/doctors/leave-dates/:leaveId`
  - Remove a leave date. Response: 204 No Content.

## Patients

- **POST** `/patients`
  - Create a patient.
  - Body example:
    ```json
    {
      "full_name": "Ahmed Al Mansouri",
      "phone_number": "+971501234567",
      "email": "ahmed.mansouri@example.com",
      "emirates_id_last4": "1234"
    }
    ```
  - Note: `emirates_id_last4` is optional and must be exactly 4 digits.
  - Response: Created patient with UUID.

- **GET** `/patients`
  - List all patients (ordered by most recent).

- **GET** `/patients/:id`
  - Get a specific patient by UUID.

- **PATCH** `/patients/:id`
  - Update patient fields.
  - Body example:
    ```json
    {
      "email": "newemail@example.com",
      "phone_number": "+971509876543"
    }
    ```
  - Note: Phone number must be unique across all patients.

- **DELETE** `/patients/:id`
  - Delete a patient. Response: 204 No Content.

## Appointments

- **POST** `/appointments`
  - Create an appointment.
  - Body example:
    ```json
    {
      "patient_id": "550e8400-e29b-41d4-a716-446655440000",
      "doctor_id": 1,
      "service_id": 2,
      "start_datetime": "2025-12-25T10:00:00Z",
      "end_datetime": "2025-12-25T10:30:00Z",
      "status": "scheduled",
      "calendar_event_id": "google_calendar_event_123",
      "notes": "Patient has dental anxiety"
    }
    ```
  - Note: `status`, `calendar_event_id`, and `notes` are optional.
  - Status values: 
    - `pending_confirmation` (default) – OTP not yet verified
    - `booked` – OTP verified, slot reserved
    - `confirmed` – Appointment acknowledged by clinic
    - `checked_in` – Patient arrived
    - `completed` – Treatment done
    - `cancelled` – Cancelled by patient or admin
    - `no_show` – Patient did not arrive
    - `rescheduled` – Appointment moved to another slot
  - Response: Created appointment with UUID and populated relations.

- **GET** `/appointments`
  - List all appointments with patient, doctor, and service details (ordered by start_datetime DESC).

- **GET** `/appointments/:id`
  - Get a specific appointment by UUID with all relations populated.

- **PATCH** `/appointments/:id`
  - Update appointment fields.
  - Body example:
    ```json
    {
      "status": "completed",
      "notes": "Cleaning completed successfully",
      "calendar_event_id": "updated_google_event_id"
    }
    ```
  - Can update any field including patient_id, doctor_id, service_id, datetimes, etc.

- **DELETE** `/appointments/:id`
  - Delete an appointment. Response: 204 No Content.

## Users

- **POST** `/users`
  - Create a user account.
  - Body example:
    ```json
    {
      "email": "receptionist@clinic.com",
      "password": "SecurePass123",
      "full_name": "Sarah Johnson",
      "phone_number": "+971501234567",
      "role": "receptionist",
      "is_active": true,
      "email_verified": false
    }
    ```
  - Role values: 
    - `patient` (default) – Public user booking appointments via website with OTP verification
    - `receptionist` – Manages appointments, calendar, and patient check-ins
    - `admin` – Full system access, reports, settings, and user management
    - `content_editor` – Manages website content only
  - Optional fields: `role`, `is_active`, `email_verified`
  - Password is automatically hashed using bcrypt
  - Response: Created user with UUID (password excluded from response)

- **GET** `/users`
  - List all users (ordered by most recent, passwords excluded)

- **GET** `/users/:id`
  - Get a specific user by UUID (password excluded)

- **PATCH** `/users/:id`
  - Update user fields.
  - Body example:
    ```json
    {
      "email": "newemail@clinic.com",
      "password": "NewSecurePass456",
      "role": "admin",
      "is_active": false
    }
    ```
  - Password will be hashed if updated
  - Email and phone_number must be unique

- **DELETE** `/users/:id`
  - Delete a user. Response: 204 No Content.

## Health / Root

- **GET** `/` — Root info
- **GET** `/health` — Health check

## Validation & Notes

- Global validation is enabled (whitelist + forbidNonWhitelisted + transform).
- **IDs**: Services and Doctors use numeric IDs, Patients, Appointments, and Users use UUIDs.
- **Phone Numbers**: Must be unique across all patients and users. Supports international format with `+` prefix.
- **Emirates ID**: Optional field storing only last 4 digits (masked for security).
- **Users**:
  - Email and phone_number must be unique across all users.
  - Passwords must be at least 8 characters and are hashed using bcrypt (10 salt rounds).
  - Passwords are never returned in API responses.
  - `email_verified` flag tracks OTP verification status.
  - User roles determine access permissions (to be enforced via authentication middleware).
- **Appointments**: 
  - Foreign key validation ensures patient, doctor, and service exist.
  - `end_datetime` must be after `start_datetime`.
  - Relations are eagerly loaded (patient, doctor, service details included in responses).
  - `calendar_event_id` stores Google Calendar event ID for integration.
- **Date Formats**: 
  - Leave dates use ISO date strings (e.g., `2025-01-10`).
  - Appointment datetimes use ISO 8601 format with time (e.g., `2025-12-25T10:00:00Z`).
- `working_hours` is stored as JSON; structure is flexible (e.g., `{ "monday": { "start": "09:00", "end": "17:00" } }`).

## Seeding (dev)

- On startup, seeds default Services and Doctors if tables are empty.
- Runs automatically via `SeedModule` when the app boots (e.g., `docker compose up`).
