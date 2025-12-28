# Quick Integration Guide - Appointments Module

## 🎉 Integration Status: COMPLETE ✅

### What's Working Now

1. **✅ Appointments Page** - Fully integrated with backend
   - Fetches real data from PostgreSQL database
   - Real-time status updates
   - Search and filtering
   - Loading states and error handling

2. **✅ Backend API** - Enhanced with new features
   - Advanced filtering (search, doctor, service, status, date range)
   - Patient auto-creation on appointment booking
   - Quick status update endpoint
   - Full CRUD operations

3. **✅ Database** - Seeded with test data
   - 4 Doctors (Dr. Sarah Johnson, Dr. Michael Chen, Dr. Emily Rodriguez, Dr. James Wilson)
   - 12 Services (Checkup, Cleaning, Filling, Whitening, Braces, etc.)
   - 3 Test Appointments created

---

## 🚀 Quick Start

### Access the Application

1. **Frontend Dashboard**: http://localhost:3000
   - Login with admin credentials (if auth is implemented)
   - Navigate to "Appointments" tab
   - You'll see 3 test appointments

2. **Backend API**: http://localhost:3001/api
   - Direct API access for testing
   - Swagger docs (if enabled): http://localhost:3001/api/docs

### Test the Integration

#### View Appointments
```bash
# Get all appointments
curl http://localhost:3001/api/appointments

# Filter by doctor
curl "http://localhost:3001/api/appointments?doctorId=1"

# Filter by status
curl "http://localhost:3001/api/appointments?status=confirmed"

# Search by patient name
curl "http://localhost:3001/api/appointments?search=John"
```

#### Create Appointment
```bash
curl -X POST http://localhost:3001/api/appointments/with-patient \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "full_name": "Your Name",
      "phone_number": "+971-50-123-4567",
      "email": "your.email@example.com"
    },
    "doctor_id": 1,
    "service_id": 2,
    "start_datetime": "2025-12-30T10:00:00Z",
    "end_datetime": "2025-12-30T10:45:00Z",
    "status": "booked",
    "notes": "First visit"
  }'
```

#### Update Status
```bash
# Replace {appointment-id} with actual ID
curl -X PATCH http://localhost:3001/api/appointments/{appointment-id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

---

## 📁 Key Files

### Backend
- `backend/src/appointments/appointments.controller.ts` - API endpoints
- `backend/src/appointments/appointments.service.ts` - Business logic
- `backend/src/appointments/dto/create-appointment-with-patient.dto.ts` - Request validation

### Frontend
- `frontend/src/app/services/api.ts` - Generic API client
- `frontend/src/app/services/appointmentsApi.ts` - Appointments API wrapper
- `frontend/src/app/pages/Appointments.tsx` - UI component

---

## 🔧 How It Works

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ◄─────► │   Frontend   │ ◄─────► │   Backend    │
│             │  HTTP   │   (Vite)     │   API   │   (NestJS)   │
│ localhost:  │         │ localhost:   │         │ localhost:   │
│    3000     │         │    3000      │         │    3001      │
└─────────────┘         └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  PostgreSQL  │
                                                  │  Database    │
                                                  │ localhost:   │
                                                  │    5432      │
                                                  └──────────────┘
```

### API Request Flow

1. **User Action** → Click "Confirm" on appointment
2. **Frontend** → Calls `appointmentsApi.updateStatus(id, 'confirmed')`
3. **API Service** → Transforms status to backend format (`confirmed`)
4. **HTTP Request** → `PATCH /api/appointments/:id/status`
5. **Backend** → Updates database
6. **Response** → Returns updated appointment with relations
7. **Transform** → Converts backend format to frontend format
8. **UI Update** → Updates appointment in state, shows toast notification

---

## 🎯 What You Can Do Now

### In the Frontend UI
- ✅ View all appointments in a table
- ✅ Search by patient name, phone, or appointment ID
- ✅ Filter by doctor, service, status, or date range
- ✅ Click on appointment to view details in drawer
- ✅ Update appointment status (Confirm, Check-in, Complete)
- ✅ See real-time updates with loading indicators

### Via API
- ✅ Create appointments with automatic patient creation
- ✅ Update appointment details
- ✅ Quick status updates
- ✅ Delete appointments
- ✅ Advanced filtering and search

---

## 📊 Database Schema

### Appointments Table
```sql
Appointments
├── id (UUID, PK)
├── patient_id (UUID, FK → Patients)
├── doctor_id (INT, FK → Doctors)
├── service_id (INT, FK → Services)
├── start_datetime (TIMESTAMP)
├── end_datetime (TIMESTAMP)
├── status (ENUM)
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Status Values
- `pending_confirmation` - Initial state
- `booked` - Appointment booked
- `confirmed` - Confirmed by staff
- `checked_in` - Patient arrived
- `completed` - Appointment finished
- `cancelled` - Cancelled by patient/staff
- `no_show` - Patient didn't show up
- `rescheduled` - Moved to different time

---

## 🐛 Troubleshooting

### Frontend not showing appointments?
```bash
# Check if backend is running
curl http://localhost:3001/api/appointments

# Check browser console for CORS errors
# Open DevTools → Console tab

# Restart frontend
docker restart dental_frontend
```

### Backend API errors?
```bash
# Check backend logs
docker logs dental_backend --tail 50

# Restart backend
docker restart dental_backend

# Check database connection
docker logs dental_postgres --tail 20
```

### Database issues?
```bash
# Check if PostgreSQL is healthy
docker ps | grep dental_postgres

# Connect to database
docker exec -it dental_postgres psql -U dental_user -d dental_db

# Check appointments table
SELECT COUNT(*) FROM "Appointments";
```

---

## 🔜 Next Steps

### Recommended Order
1. **Integrate Doctors Page** - Similar pattern to appointments
2. **Integrate Services Page** - CRUD operations
3. **Integrate Patients Page** - With appointment history
4. **Add Create Appointment Form** - Modal with validation
5. **Implement Reschedule** - Date/time picker
6. **Add Cancel Functionality** - With confirmation dialog

### Future Enhancements
- Real-time notifications (WebSockets/SSE)
- Appointment conflict detection
- Calendar view integration
- Email/SMS notifications
- Export to PDF/CSV
- Analytics dashboard
- Appointment reminders
- Patient portal

---

## 💡 Tips for Further Integration

### Pattern to Follow
1. Create API service in `frontend/src/app/services/`
2. Add transformation functions for data mapping
3. Update page component to use API instead of mock data
4. Add loading and error states
5. Test with real data
6. Update backend if needed (filters, new endpoints)

### Code Structure
```typescript
// 1. Define types
interface BackendEntity { ... }
interface FrontendEntity { ... }

// 2. Transform functions
function transformBackendToFrontend(data: BackendEntity): FrontendEntity { ... }

// 3. API class
class EntityApi {
  async getAll() { ... }
  async create(data) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
}

// 4. Export instance
export const entityApi = new EntityApi();
```

---

## 📞 Support

If you encounter any issues:
1. Check the logs: `docker logs dental_backend` or `docker logs dental_frontend`
2. Review `INTEGRATION_SUMMARY.md` for detailed information
3. Check API endpoints with curl or Postman
4. Verify database state with psql

---

**Last Updated**: December 26, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0


