# Google Calendar API Endpoints

All endpoints are prefixed with `/api/calendar`

## 1. Get OAuth Authorization URL

**GET** `/api/calendar/auth-url`

Get the Google OAuth authorization URL to redirect users for authentication.

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Usage:**
- Frontend calls this endpoint to get the authorization URL
- Redirect user to the returned URL
- User grants permissions in Google's consent screen
- Google redirects to the callback URL with an authorization code

---

## 2. Handle OAuth Callback

**GET** `/api/calendar/callback?code=...`

Handle the OAuth callback from Google and store the access/refresh tokens.

**Query Parameters:**
- `code` (required): Authorization code from Google

**Response:**
```json
{
  "success": true
}
```

**Usage:**
- This endpoint is called automatically by Google after user grants permissions
- Exchanges the authorization code for access and refresh tokens
- Stores tokens in the database (AppointmentSettings table)
- Sets `calendar_connected` to `true`

---

## 3. Get Connection Status

**GET** `/api/calendar/status`

Get the current calendar connection status and configuration.

**Response:**
```json
{
  "connected": true,
  "configured": true,
  "token_expiry": "2024-12-31T23:59:59.000Z"
}
```

**Response Fields:**
- `connected`: Whether calendar is currently connected
- `configured`: Whether OAuth credentials are configured in environment
- `token_expiry`: Token expiration date (or undefined)

**Note:** All appointments are synced to the user's primary Google Calendar.

**Usage:**
- Check if calendar is connected before showing connect/disconnect buttons
- Display connection status in UI
- Check if OAuth is properly configured

---

## 4. Test Connection

**GET** `/api/calendar/test`

Test the calendar connection by making a simple API call.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Google Calendar"
}
```

**Response Fields:**
- `success`: Whether the test was successful
- `message`: Human-readable message about the test result

**Usage:**
- Verify that the connection is working
- Diagnose connection issues
- Show connection status to users

**Error:**
- Returns `success: false` with error message if connection fails
- Returns 401 if authentication fails

---

## 5. Disconnect Calendar

**POST** `/api/calendar/disconnect`

Disconnect Google Calendar integration and clear stored tokens.

**Response:**
```json
{
  "success": true
}
```

**Usage:**
- Allow users to disconnect their Google Calendar
- Clears all stored OAuth tokens
- Sets `calendar_connected` to `false`
- Stops automatic calendar syncing

**Note:**
- This does not delete existing calendar events
- Only stops future syncing

---

## Automatic Calendar Sync

The following operations automatically sync with Google Calendar (if connected):

### Appointment Creation
- When an appointment is created via `POST /api/appointments`
- Creates a new calendar event
- Stores `calendar_event_id` in the appointment record

### Appointment Update
- When an appointment is updated via `PATCH /api/appointments/:id`
- Updates the corresponding calendar event
- If event doesn't exist, creates a new one

### Appointment Deletion
- When an appointment is deleted via `DELETE /api/appointments/:id`
- Deletes the corresponding calendar event from Google Calendar

### Status Changes
- When appointment status changes to `CANCELLED` or `NO_SHOW`
- Deletes the calendar event
- For other status changes, updates the event

---

## Error Handling

All endpoints handle errors gracefully:

- **400 Bad Request**: Invalid request or missing parameters
- **401 Unauthorized**: Calendar not connected or authentication failed
- **500 Internal Server Error**: Server-side errors

Calendar sync operations are **non-blocking**:
- If calendar sync fails, the appointment operation still succeeds
- Errors are logged to console but don't fail the main operation
- This ensures appointments can be created even if calendar is temporarily unavailable

---

## Example Frontend Integration

```typescript
// 1. Get authorization URL
const { url } = await fetch('/api/calendar/auth-url').then(r => r.json());
window.location.href = url;

// 2. Check connection status
const status = await fetch('/api/calendar/status').then(r => r.json());
if (status.connected) {
  console.log('Calendar is connected');
}

// 3. Test connection
const test = await fetch('/api/calendar/test').then(r => r.json());
if (test.success) {
  console.log('Connection test passed');
}

// 4. Disconnect
await fetch('/api/calendar/disconnect', { method: 'POST' });
```

---

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3003/api/calendar/callback
```

See `GOOGLE_CALENDAR_SETUP.md` for detailed setup instructions.

