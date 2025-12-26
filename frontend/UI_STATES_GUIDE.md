# UI States Implementation Guide

## 🎨 Complete State Coverage

### 1. Loading States ⏳

#### Skeleton Loaders
**Location**: Dashboard KPI Cards
```tsx
// When isLoading = true
<Skeleton className="h-4 w-24" />
<Skeleton className="h-8 w-16 mb-2" />
<Skeleton className="h-3 w-32" />
```

**Used in**:
- Dashboard KPI cards
- Appointment tables (shimmer effect)
- Patient lists
- Doctor profiles

#### Spinner Loader
**Component**: `LoadingSpinner.tsx`
```tsx
<LoadingSpinner size="md" message="Loading appointments..." />
```

**Used in**:
- Async operations
- Page transitions
- Data fetching

---

### 2. Empty States 🗂️

#### Dashboard - No Appointments Today
```
📅 Calendar Icon (gray)
"No appointments scheduled for today"
[Create Appointment] button
```

#### Appointments - No Results
```
📅 Calendar Icon (gray)
"No appointments found"
"Try adjusting your filters or create a new appointment"
[Create Appointment] button
```

#### Patients - No Patients
```
👤 User Icon (gray)
"No patients found"
"Try adjusting your search"
```

#### Services - No Services
```
📋 Clipboard Icon (gray)
"No services found"
[Create First Service] button
```

**Component**: `EmptyState.tsx` - Reusable with custom icon, title, description, CTA

---

### 3. Error States ❌

#### Data Load Error
```
🔴 Alert Circle Icon
"Unable to load dashboard data"
"Please refresh or contact admin"
[Try Again] button
```

#### Form Validation Errors
**Toast Notifications**:
- ❌ "Patient name is required"
- ❌ "Phone number is required"
- ❌ "Duration must be greater than 0"
- ❌ "Selected slot is no longer available"

#### Notification Delivery Failure
**Table Row**:
- Status: 🔴 Failed badge (red)
- Action: 🔄 Retry button
- Click retry → "Message delivery failed. Retry or switch channel."

**Component**: `ErrorState.tsx` - Shows alert with retry option

---

### 4. Success States ✅

#### Toast Notifications (Green, Auto-dismiss 3s)
```
✓ "Appointment created successfully"
✓ "Appointment confirmed. Patient notified."
✓ "Patient checked in successfully"
✓ "Appointment marked as completed"
✓ "Service updated successfully"
✓ "Doctor availability updated"
✓ "Buffer time updated"
✓ "Message sent successfully"
```

**Success with Description**:
```
✓ "OTP sent to patient"
  "Appointment will be created after OTP verification"
```

---

### 5. Warning States ⚠️

#### Toast Warnings (Amber)
```
⚠️ "This service is linked to existing appointments"
   "Deactivating will prevent new bookings"
```

#### Confirmation Modals
**Buffer Time Change**:
```
Title: "Confirm Changes"
Message: "Changing buffer time affects future appointments only. 
         Existing appointments will not be modified."
[Cancel] [Confirm]
```

**Calendar Disconnect**:
```
Title: "Confirm Changes"
Message: "This will stop syncing new appointments with your 
         calendar. Are you sure?"
[Cancel] [Confirm]
```

**Doctor Leave with Conflicts**:
```
❌ "Doctor has confirmed appointments in this period"
```

**Service Deletion**:
```
⚠️ "Are you sure you want to delete 'Teeth Cleaning'?"
   "This service may be linked to existing appointments."
[Cancel] [Delete]
```

---

### 6. Info States ℹ️

#### Info Boxes (Blue background)
**Create Appointment**:
```
📱 "An OTP will be sent to the patient's phone number 
    for verification before booking is confirmed."
```

**Calendar View**:
```
ℹ️ Calendar Features
   • Click on an empty slot to create a new appointment
   • Click on an appointment to view details
   • Color-coded statuses for easy identification
   • Filter by doctor to see specific availability
```

**Notifications Template Variables**:
```
🔔 "Use variables like {patient}, {doctor}, {date}, {time}, 
    and {code} in your templates. They will be automatically 
    replaced with actual appointment data."
```

**Settings - Calendar Connected**:
```
✓ "Your appointments are being synced with Google Calendar 
    in real-time"
```

---

### 7. Interactive States 🖱️

#### Hover States
**Buttons**: 
- Primary: bg-blue-600 → bg-blue-700
- Outline: border-gray-300 → border-gray-400, bg-transparent → bg-gray-50
- Ghost: bg-transparent → bg-gray-100

**Table Rows**:
- Default: bg-white
- Hover: bg-gray-50
- Cursor: pointer

**Cards**:
- Default: shadow-sm
- Hover: shadow-lg (Doctor cards)

**Calendar Slots**:
- Empty: hover:bg-blue-50
- With appointment: hover:shadow-sm

#### Active/Selected States
**Sidebar Navigation**:
- Active: bg-blue-50, text-blue-700, icon blue-700
- Inactive: text-gray-700, icon gray-500

**Status Badges** (non-interactive but visually distinct):
- Each status has unique background + text color
- Hover: same color (no change, as they're indicators)

---

### 8. Processing States 🔄

#### Appointment Drawer Actions
```tsx
// When isProcessing = true:
- All action buttons disabled
- Button shows loading state
- 800ms simulated API call
- Success toast → Drawer closes
```

**User sees**:
1. Click "Confirm Appointment"
2. Button disabled for 800ms
3. ✓ "Appointment confirmed successfully"
4. Drawer closes

#### Service Save
```tsx
// Validation happens first
- If invalid: Toast error (no processing)
- If valid: Save → Toast success
```

#### Notification Retry
```tsx
// Click retry button
1. toast.info("Retrying message delivery...")
2. 1000ms delay
3. Update status to 'sent'
4. ✓ "Message sent successfully"
```

---

### 9. Disabled States 🚫

#### Conditional Button States

**Appointment Actions** (in drawer):
- Confirm: Only if status = 'booked'
- Check-in: Only if status = 'confirmed' or 'booked'
- Complete: Only if status = 'checked-in' or 'confirmed'
- Reschedule: Not if 'completed' or 'cancelled'
- Cancel: Not if 'completed' or 'cancelled'

**When disabled**: Button grayed out, not clickable

---

### 10. Notification States 🔔

#### Header Bell Icon
```
🔔 Bell icon with red dot (notification badge)
- Shows unread notifications count
- Click to view notifications
```

#### Notification Status in Table
**Sent** (Green badge):
- ✓ Delivered successfully
- Shows timestamp

**Failed** (Red badge):
- ✗ Delivery failed
- Shows retry button
- Click retry → Process → Update to Sent

---

### 11. Filter States 🔍

#### Active Filters Indicator
**Appointments Page**:
```tsx
// When any filter is active:
"Clear Filters" button appears
```

**Visible when**:
- Search query exists
- Doctor filter ≠ 'all'
- Service filter ≠ 'all'
- Status filter ≠ 'all'
- Date range selected

**Action**: Click "Clear Filters" → All reset to default

---

### 12. Modal/Dialog States 🪟

#### Open States
**Create Appointment Modal**:
- Triggered by: "Create Appointment" button
- Overlay: Semi-transparent dark background
- Content: Form with all fields
- Scrollable: If content exceeds viewport

**Appointment Drawer** (Right-side):
- Triggered by: Click appointment row
- Slides in from right
- Overlay on mobile
- Full height

**Confirmation Dialogs**:
- Centered modal
- Clear message
- Two buttons (Cancel + Action)

#### Close Behaviors
- Click overlay → Close
- Click X button → Close
- Click Cancel → Close
- After successful action → Auto-close with delay

---

### 13. Data States 📊

#### KPI Cards
**Normal State**:
```
Today's Appointments: 4
"3 confirmed"
```

**Zero State**:
```
Today's Appointments: 0
"No appointments today"
```

**Loading State**:
```
Skeleton placeholders
```

#### Calendar Appointment Counts
**Week View**:
- Each day shows appointment count
- Color-coded appointments
- Empty days show blank slots

---

### 14. Form States 📝

#### Input States
**Default**: 
- Gray border
- Placeholder text (gray-400)

**Focus**:
- Blue ring outline
- Border color intensifies

**Filled**:
- Text appears (gray-900)

**Error** (after validation):
- Red border
- Error toast appears

**Disabled** (when processing):
- Grayed out
- Not editable
- Cursor: not-allowed

#### Select Dropdown States
**Closed**: Shows selected value or placeholder
**Open**: Dropdown menu with options
**Selected**: Option highlighted
**Hover**: Option background changes

---

### 15. Patient/Doctor Flag States 🏁

#### Patient Flags
**VIP**:
- Yellow badge
- bg-yellow-100, text-yellow-800
- Shows in: Patient list, Patient profile, Appointment drawer

**No-show Risk**:
- Orange badge
- bg-orange-100, text-orange-800
- Shows in: Patient list, Patient profile

**No Flags**:
- No badges shown
- Clean appearance

#### Doctor Status
**Active**:
- Green badge
- bg-green-100, text-green-700
- Available for booking

**Inactive**:
- Gray badge
- bg-gray-100, text-gray-700
- Not shown in appointment creation

---

## 🎯 State Transition Examples

### Appointment Lifecycle
```
1. CREATE
   → Status: Booked (blue)
   → Toast: ✓ "Appointment created successfully"

2. CONFIRM
   → Status: Confirmed (green)
   → Toast: ✓ "Appointment confirmed successfully"
   → Notification sent

3. CHECK-IN
   → Status: Checked-in (purple)
   → Toast: ✓ "Patient checked in successfully"

4. COMPLETE
   → Status: Completed (gray)
   → Toast: ✓ "Appointment marked as completed"

Alternative paths:
- CANCEL → Cancelled (red)
- NO-SHOW → No-show (orange)
```

### Service Lifecycle
```
1. CREATE
   → Active toggle: ON
   → Toast: ✓ "Service created successfully"

2. EDIT
   → Update duration/name
   → Toast: ✓ "Service updated successfully"

3. DEACTIVATE
   → Active toggle: OFF
   → Warning toast: ⚠️ "Linked to existing appointments"
   → Service hidden from booking

4. DELETE
   → Confirmation modal
   → Warning: "May be linked to appointments"
   → Toast: ✓ "Service deleted successfully"
```

---

## 🎨 Color Reference

### Status Colors
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Booked | blue-100 | blue-700 | blue-500 |
| Confirmed | green-100 | green-700 | green-500 |
| Checked-in | purple-100 | purple-700 | purple-500 |
| Completed | gray-100 | gray-700 | gray-500 |
| Cancelled | red-100 | red-700 | red-500 |
| No-show | orange-100 | orange-700 | orange-500 |

### Action Colors
| Type | Color | Usage |
|------|-------|-------|
| Primary | blue-600 | Main actions |
| Success | green-600 | Confirmations |
| Warning | amber-500 | Warnings |
| Danger | red-600 | Destructive actions |
| Neutral | gray-600 | Secondary actions |

### Feedback Colors
| Type | Background | Text | Icon |
|------|-----------|------|------|
| Success Toast | green-50 | green-900 | green-600 |
| Error Toast | red-50 | red-900 | red-600 |
| Warning Toast | amber-50 | amber-900 | amber-600 |
| Info Box | blue-50 | blue-900 | blue-600 |

---

## ✅ Accessibility States

### Focus States
- All interactive elements have visible focus rings
- Tab navigation works throughout
- Focus trap in modals/dialogs

### ARIA States
- `aria-label` on icon buttons
- `aria-describedby` on form inputs with errors
- `role="status"` on loading indicators
- `role="alert"` on error messages

### Screen Reader States
- Loading: "Loading appointments..."
- Empty: "No appointments found. Create new appointment"
- Error: "Error loading data. Try again button"
- Success: "Appointment created successfully"

---

This comprehensive guide ensures every possible UI state is accounted for and properly styled!
