# Sky Dental Clinic - API Documentation

## Overview
This document outlines the API structure for the Sky Dental Clinic Admin Dashboard and Doctor Portal. The system is designed to be API-ready with consistent naming conventions and clear data flows.

---

## Base URL
```
Production: https://api.skydentalclinic.ae
Development: http://localhost:3000/api
```

---

## Authentication

### Admin Login
```
POST /api/auth/admin/login
```
**Request Body:**
```json
{
  "email": "admin@skydentalclinic.ae",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "admin_id": "string",
    "name": "string",
    "email": "string",
    "role": "super-admin | appointment-manager",
    "token": "string"
  }
}
```

### Doctor Login
```
POST /api/auth/doctor/login
```
**Request Body:**
```json
{
  "email": "doctor@skydentalclinic.ae",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "doctor_id": "string",
    "name": "string",
    "email": "string",
    "specialization": "string",
    "token": "string"
  }
}
```

---

## Appointments

### Get All Appointments
```
GET /api/appointments
```
**Query Parameters:**
- `status` (optional): booked | confirmed | checked-in | completed | cancelled | no-show
- `doctor_id` (optional): Filter by doctor
- `patient_id` (optional): Filter by patient
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "appointment_id": "string",
      "patient_id": "string",
      "patient_name": "string",
      "phone": "string",
      "email": "string",
      "doctor_id": "string",
      "doctor_name": "string",
      "service_id": "string",
      "service_name": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "duration": 30,
      "status": "string",
      "notes": "string",
      "clinical_notes": "string",
      "prescription": {
        "prescription_id": "string",
        "medications": []
      },
      "created_at": "ISO 8601",
      "updated_at": "ISO 8601"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Get Single Appointment
```
GET /api/appointments/{appointment_id}
```

### Create Appointment
```
POST /api/appointments
```
**Request Body:**
```json
{
  "patient_name": "string",
  "phone": "string",
  "email": "string (optional)",
  "doctor_id": "string",
  "service_id": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "notes": "string (optional)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointment_id": "string",
    "status": "booked",
    "created_at": "ISO 8601"
  }
}
```

### Update Appointment
```
PUT /api/appointments/{appointment_id}
```
**Request Body:**
```json
{
  "status": "string (optional)",
  "date": "YYYY-MM-DD (optional)",
  "time": "HH:MM (optional)",
  "notes": "string (optional)",
  "clinical_notes": "string (optional)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "appointment_id": "string",
    "updated_at": "ISO 8601"
  }
}
```

### Delete Appointment
```
DELETE /api/appointments/{appointment_id}
```

---

## Doctors

### Get All Doctors
```
GET /api/doctors
```
**Query Parameters:**
- `status` (optional): active | on-leave | inactive
- `specialization` (optional): Filter by specialization

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "doctor_id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "specialization": "string",
      "license_number": "string",
      "years_of_experience": 0,
      "photo_url": "string",
      "status": "string",
      "availability": {
        "monday": ["09:00-17:00"],
        "tuesday": ["09:00-17:00"],
        "wednesday": ["09:00-17:00"],
        "thursday": ["09:00-17:00"],
        "friday": ["09:00-17:00"],
        "saturday": [],
        "sunday": []
      },
      "leave_dates": ["YYYY-MM-DD"],
      "created_at": "ISO 8601",
      "updated_at": "ISO 8601"
    }
  ]
}
```

### Get Single Doctor
```
GET /api/doctors/{doctor_id}
```

### Update Doctor Profile
```
PUT /api/doctors/{doctor_id}
```
**Request Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "specialization": "string (optional)",
  "photo_url": "string (optional)",
  "availability": "object (optional)",
  "status": "string (optional)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Doctor profile updated successfully. Changes synced to admin dashboard.",
  "data": {
    "doctor_id": "string",
    "updated_at": "ISO 8601"
  }
}
```

---

## Patients

### Get All Patients
```
GET /api/patients
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "patient_id": "string",
      "name": "string",
      "phone": "string",
      "email": "string",
      "date_of_birth": "YYYY-MM-DD",
      "gender": "male | female | other",
      "address": "string",
      "medical_history": "string",
      "allergies": "string",
      "last_visit": "YYYY-MM-DD",
      "total_visits": 0,
      "created_at": "ISO 8601"
    }
  ]
}
```

### Create Patient
```
POST /api/patients
```

### Update Patient
```
PUT /api/patients/{patient_id}
```

---

## Prescriptions

### Add Prescription to Appointment
```
POST /api/appointments/{appointment_id}/prescription
```
**Request Body:**
```json
{
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "once-daily | twice-daily | three-times-daily | four-times-daily | as-needed",
      "timings": ["09:00", "21:00"],
      "duration": 7,
      "instructions": "string (optional)",
      "with_food": "before | after | with | any"
    }
  ],
  "notes": "string (optional)"
}
```

### Get Prescription
```
GET /api/prescriptions/{prescription_id}
```

---

## Services

### Get All Services
```
GET /api/services
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "service_id": "string",
      "category": "string",
      "name": "string",
      "duration": 30,
      "active": true
    }
  ]
}
```

---

## Notifications

### Get Notifications
```
GET /api/notifications
```
**Query Parameters:**
- `user_type`: admin | doctor
- `user_id`: string
- `unread_only`: boolean

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": "string",
      "type": "appointment_created | appointment_cancelled | appointment_rescheduled | appointment_checked_in | appointment_completed | doctor_updated",
      "title": "string",
      "message": "string",
      "read": false,
      "timestamp": "ISO 8601",
      "appointment_id": "string (optional)",
      "doctor_id": "string (optional)"
    }
  ],
  "unread_count": 0
}
```

### Mark Notification as Read
```
PUT /api/notifications/{notification_id}/read
```

### Mark All as Read
```
PUT /api/notifications/read-all
```

---

## Data Sync

### Sync All Data
```
GET /api/sync
```
**Response:**
```json
{
  "success": true,
  "message": "Data synced successfully",
  "data": {
    "last_sync_time": "ISO 8601",
    "appointments_updated": 0,
    "doctors_updated": 0,
    "patients_updated": 0
  }
}
```

---

## Real-Time Sync Behavior

### When Admin Updates Doctor
1. `PUT /api/doctors/{doctor_id}` is called
2. Server updates doctor record
3. Server broadcasts update to all connected clients via WebSocket
4. Doctor Portal receives update and refreshes doctor profile
5. UI shows: "Syncing data..." → "Profile updated by admin"

### When Doctor Updates Profile
1. `PUT /api/doctors/{doctor_id}` is called
2. Server updates doctor record
3. Server broadcasts update to admin dashboard
4. Admin Dashboard receives update and refreshes doctor list
5. UI shows: "Saving changes..." → "Updated successfully"
6. Notification sent to admin: "Dr. [Name] updated their profile"

### When Admin Creates Appointment
1. `POST /api/appointments` is called
2. Server creates appointment with status "booked"
3. Server broadcasts new appointment
4. Doctor Portal receives notification
5. UI shows: "Creating appointment..." → "Appointment created"
6. Notification sent to doctor: "New appointment with [Patient Name]"

### When Doctor Marks Appointment Complete
1. `PUT /api/appointments/{appointment_id}` with `status: "completed"`
2. Server updates appointment
3. Server broadcasts to admin dashboard
4. Admin Dashboard receives update
5. UI shows: "Saving..." → "Updated successfully"
6. Notification sent to admin: "Dr. [Name] completed appointment with [Patient]"

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Patient name is required",
    "field": "patient_name"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., double booking)
- `SERVER_ERROR` - Internal server error

---

## WebSocket Events

### Connection
```
wss://api.skydentalclinic.ae/ws?token={auth_token}
```

### Events

**appointment.created**
```json
{
  "event": "appointment.created",
  "data": {
    "appointment_id": "string",
    "doctor_id": "string",
    "patient_name": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM"
  }
}
```

**appointment.updated**
```json
{
  "event": "appointment.updated",
  "data": {
    "appointment_id": "string",
    "changes": {
      "status": "completed"
    }
  }
}
```

**doctor.updated**
```json
{
  "event": "doctor.updated",
  "data": {
    "doctor_id": "string",
    "changes": {
      "availability": {}
    }
  }
}
```

---

## Data Model Consistency

### Naming Conventions
- **IDs**: Always use snake_case with `_id` suffix (e.g., `appointment_id`, `doctor_id`)
- **Dates**: ISO 8601 format for timestamps, YYYY-MM-DD for dates
- **Times**: 24-hour format HH:MM
- **Enums**: lowercase with hyphens (e.g., `checked-in`, `twice-daily`)

### Single Source of Truth
The backend database is the single source of truth. All changes flow through the API and are broadcast to connected clients.

---

## UI Feedback Messages

### Saving States
- "Saving changes..." (0-800ms)
- "Updated successfully" (toast notification)
- "Syncing data..." (for multi-portal updates)
- "Changes synced across all portals" (success message)

### Error States
- "Update failed. Please try again" (with retry button)
- "Connection lost. Retrying..." (auto-retry with exponential backoff)
- "Unable to save changes" (manual retry required)

---

## Developer Notes

### Component Integration Example

```typescript
// Appointments Page Component
import { useData } from '../contexts/DataContext';

function AppointmentsPage() {
  const { appointments, updateAppointment } = useData();
  
  const handleStatusChange = async (id: string, status: string) => {
    // This will:
    // 1. Show "Saving changes..." indicator
    // 2. Call PUT /api/appointments/{id}
    // 3. Sync across portals
    // 4. Show success toast
    await updateAppointment(id, { status });
  };
  
  return (
    // Component JSX
  );
}
```

### Adding New API Endpoints
1. Add method to `DataContext.tsx`
2. Implement API call with try/catch
3. Add sync state management
4. Add success/error toasts
5. Broadcast to other portals if needed
6. Update this documentation

---

## Testing

### Mock Data
Development uses type definitions from `/src/app/data/types.ts`

### API Integration Checklist
- [ ] Replace mock data with API calls
- [ ] Add authentication headers
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test sync across portals
- [ ] Verify notifications work
- [ ] Test offline/retry logic
- [ ] Load test concurrent updates

---

## Production Deployment

### Environment Variables
```bash
REACT_APP_API_URL=https://api.skydentalclinic.ae
REACT_APP_WS_URL=wss://api.skydentalclinic.ae/ws
REACT_APP_OTP_PROVIDER=twilio
REACT_APP_TWILIO_ACCOUNT_SID=xxx
REACT_APP_TWILIO_AUTH_TOKEN=xxx
```

### Build Command
```bash
npm run build
```

### Pre-flight Checklist
- [ ] All API endpoints documented
- [ ] Authentication working
- [ ] Sync tested across portals
- [ ] Notifications functional
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] Accessibility tested