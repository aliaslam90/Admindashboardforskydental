# Sky Dental Clinic Dashboard - Quick Reference

## 🚀 Getting Started

### Run the Application
```bash
npm run dev
# or
pnpm dev
```

The dashboard will be available at `http://localhost:5173`

---

## 📍 Navigation Map

### Main Pages (Left Sidebar)

| Page | Icon | Purpose | Key Features |
|------|------|---------|--------------|
| **Dashboard** | 📊 | Home overview | KPIs, Today's appointments, Calendar |
| **Appointments** | 📅 | Manage bookings | List, Filters, Drawer details |
| **Calendar** | 📅 | Visual schedule | Day/Week view, Color-coded |
| **Patients** | 👥 | Patient records | List, History, Flags |
| **Doctors** | 🩺 | Doctor management | Profiles, Availability, Leave |
| **Services** | 📋 | Service catalog | CRUD, Duration, Categories |
| **Notifications** | 🔔 | Communication logs | SMS/Email, Templates, Retry |
| **Settings** | ⚙️ | System config | Hours, Buffer, Roles, Integration |

---

## ⚡ Quick Actions

### From Any Page
- **Create Appointment**: Blue button (top-right) → Opens modal
- **Navigation**: Sidebar menu → Click any page
- **Notifications**: Bell icon (top-right) → View alerts

### Dashboard Page
- **View Appointment**: Click row → Opens detail drawer
- **Block Slot**: "Block Doctor Slot" button
- **Go to Calendar**: "Open Calendar View" button

### Appointments Page
- **Filter**: Use filter bar (search, date, doctor, service, status)
- **View Details**: Click row → Drawer opens
- **Quick Actions**: ⋯ menu → Confirm/Reschedule/Cancel
- **Clear Filters**: Button appears when filters active

### Calendar View
- **Switch View**: Day/Week dropdown
- **Filter Doctor**: Doctor dropdown
- **Navigate Dates**: ← Today → buttons
- **Create**: Click empty slot

### Patients Page
- **Search**: Search bar (name, phone, ID)
- **View Profile**: Click row → Dialog opens
- **View History**: In profile dialog

### Doctors Page
- **View Details**: Click doctor card → Dialog opens
- **Block Leave**: In doctor profile
- **View Availability**: Weekly grid in profile

### Services Page
- **Create Service**: "Add Service" button
- **Edit Service**: ✏️ icon in row
- **Delete Service**: 🗑️ icon (shows confirmation)
- **Toggle Active**: Switch in row

### Notifications Page
- **View Logs**: Default tab
- **Retry Failed**: 🔄 button in row
- **View Templates**: "Message Templates" tab
- **Edit Template**: "Edit Template" button

### Settings Page
- **Change Hours**: Select new times → Save
- **Update Buffer**: Dropdown → Update button
- **Manage Roles**: "Manage" button per role
- **Connect Calendar**: Connect/Disconnect button

---

## 🎨 Status Color Guide

| Status | Color | When Used |
|--------|-------|-----------|
| 🔵 Booked | Blue | Initial booking |
| 🟢 Confirmed | Green | Verified booking |
| 🟣 Checked In | Purple | Patient arrived |
| ⚫ Completed | Gray | Finished |
| 🔴 Cancelled | Red | Cancelled |
| 🟠 No-show | Orange | Patient didn't show |

---

## 📋 Common Workflows

### Create New Appointment
1. Click "Create Appointment" (any page)
2. Fill patient info (name, phone required)
3. Select doctor and service
4. Choose date and time
5. Add notes (optional)
6. Click "Send OTP & Create"
7. ✓ Success toast appears

### Manage Existing Appointment
1. Go to Appointments or Dashboard
2. Click appointment row
3. Drawer opens with full details
4. Choose action:
   - **Confirm**: If status is Booked
   - **Check In**: If Confirmed/Booked
   - **Complete**: If Checked In/Confirmed
   - **Reschedule**: Opens reschedule flow
   - **Cancel**: Opens cancel confirmation

### Check Patient History
1. Go to Patients page
2. Search for patient (name/phone)
3. Click patient row
4. View full appointment history
5. See flags (VIP, No-show risk)
6. Read internal notes

### Add New Service
1. Go to Services page
2. Click "Add Service"
3. Select category (or create new)
4. Enter name and duration
5. Toggle active ON
6. Click "Save Service"
7. ✓ Service appears in list

### Block Doctor Leave
1. Go to Doctors page
2. Click doctor card
3. Click "Block Leave"
4. Select date range
5. Add reason (optional)
6. If conflicts exist → Warning shows
7. Confirm → Slots blocked

### Review Notifications
1. Go to Notifications page
2. View logs table (recent first)
3. Check success rate cards
4. For failed messages → Click retry
5. Switch to Templates tab to view/edit

### Configure Settings
1. Go to Settings page
2. **Working Hours**: Set open/close times + days
3. **Buffer Time**: Select minutes between appointments
4. **Cancellation**: Set minimum notice hours
5. **OTP**: Toggle verification + set expiry
6. **Calendar**: Connect/disconnect integration
7. Save changes → Confirmation shown

---

## 🔍 Search & Filter Tips

### Appointments Filters
- **Search**: Patient name, phone, or appointment ID
- **Date Range**: From + To dates
- **Doctor**: Dropdown (all or specific)
- **Service**: Dropdown (all or specific)
- **Status**: All, Booked, Confirmed, etc.
- **Clear**: Button appears when filters active

### Calendar Filters
- **Doctor**: Show appointments for specific doctor only
- **View**: Day shows 1 day, Week shows 7 days
- **Navigate**: Use arrows or "Today" button

### Patient Search
- Search by: Name, Phone, or Patient ID
- Real-time filtering as you type

---

## 🎯 Keyboard Shortcuts & Navigation

### General
- **Tab**: Navigate between fields
- **Enter**: Submit forms / Select items
- **Esc**: Close modals/drawers
- **Click outside**: Close dropdowns/modals

### Forms
- **Tab**: Next field
- **Shift + Tab**: Previous field
- **Space**: Toggle switches/checkboxes
- **Arrow keys**: Navigate dropdown options

---

## 💡 Tips & Best Practices

### Creating Appointments
- ✅ Always verify phone number format
- ✅ Check doctor availability before selecting time
- ✅ Add internal notes for special cases
- ✅ OTP verification prevents no-shows

### Managing Appointments
- ✅ Confirm appointments as soon as patient verifies
- ✅ Check in patients when they arrive
- ✅ Mark complete after consultation
- ✅ Use reschedule instead of delete when possible

### Patient Management
- ✅ Flag VIP patients for special treatment
- ✅ Mark no-show risks after 2+ missed appointments
- ✅ Keep internal notes updated
- ✅ Review history before scheduling

### Doctor Availability
- ✅ Update availability grid weekly
- ✅ Block leave in advance
- ✅ Check for conflicts before blocking dates
- ✅ Keep services list updated per doctor

### Service Configuration
- ✅ Set realistic durations (includes buffer)
- ✅ Deactivate instead of delete (preserves history)
- ✅ Organize by category for clarity
- ✅ Review active services monthly

### System Settings
- ✅ Set buffer time based on cleaning needs
- ✅ Review cancellation policy regularly
- ✅ Keep working hours updated for holidays
- ✅ Monitor notification success rates

---

## 🆘 Troubleshooting

### "No appointments found"
- Check active filters
- Try clearing all filters
- Verify date range is correct

### Can't create appointment
- Verify all required fields filled (*)
- Check phone number format
- Ensure doctor and service selected
- Confirm date is not in past

### Doctor not showing in dropdown
- Check doctor status (must be Active)
- Verify doctor has services assigned
- Check doctor availability for selected date

### Service not available
- Verify service is Active
- Check if doctor offers this service
- Ensure service duration is set

### Notification failed
- Click retry button in logs
- Check if phone/email is valid
- Verify notification settings

### Calendar integration not working
- Check connection status in Settings
- Disconnect and reconnect
- Verify permissions granted

---

## 📊 Data Summary

### Mock Data Included
- **Patients**: 5 patients
  - 2 VIP, 1 No-show risk
  - Various visit counts (3-15 visits)
  
- **Doctors**: 3 doctors
  - General Dentistry, Orthodontics, Cosmetic
  - Different availability schedules
  
- **Services**: 8 services
  - 3 categories (General, Orthodontics, Cosmetic)
  - Durations: 30-90 minutes
  
- **Appointments**: 10 appointments
  - Mix of all statuses
  - Past, today, and future dates
  - Various doctors and services

- **Notifications**: 5 log entries
  - SMS and Email channels
  - Sent and Failed statuses

---

## 🎨 UI Components Used

### Layout
- Sidebar navigation
- Top header with date
- Main content area
- Responsive mobile menu

### Data Display
- Tables (sortable, filterable)
- KPI cards
- Calendar grid
- Timeline views
- Badge indicators

### Inputs
- Text inputs
- Number inputs
- Date pickers
- Time pickers
- Dropdowns
- Textareas
- Switches
- Checkboxes

### Feedback
- Toast notifications
- Modal dialogs
- Confirmation dialogs
- Loading skeletons
- Empty states
- Error states

### Navigation
- Tabs
- Dropdown menus
- Action menus (⋯)
- Breadcrumbs (implied in page hierarchy)

---

## 🔒 Security Notes

### Current Implementation
- Mock data (no backend)
- No authentication (demo mode)
- No real API calls

### For Production
- ⚠️ Implement user authentication
- ⚠️ Add role-based access control
- ⚠️ Encrypt sensitive data
- ⚠️ Validate all inputs server-side
- ⚠️ Implement rate limiting
- ⚠️ Use HTTPS only
- ⚠️ Secure API endpoints
- ⚠️ Audit trail for all actions

---

## 📱 Browser Support

### Recommended
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)

### Mobile
- ✅ iOS Safari
- ✅ Chrome Android
- ✅ Samsung Internet

### Requirements
- JavaScript enabled
- Minimum screen width: 320px
- Local storage enabled (for theme)

---

## 📞 Support

### For Issues
1. Check this Quick Reference
2. Review UI States Guide
3. Check Project Summary
4. Review component documentation

### Mock Data Location
`/src/app/data/types.ts`

### Modify Mock Data
1. Open types.ts
2. Edit arrays (patients, doctors, services, appointments)
3. Save file
4. Refresh browser

---

**Last Updated**: December 25, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
