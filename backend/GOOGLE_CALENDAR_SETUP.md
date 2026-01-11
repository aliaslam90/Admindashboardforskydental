# Google Calendar OAuth Setup

This document explains how to set up Google Calendar OAuth integration for the dental appointment system.

## Prerequisites

1. A Google Cloud Project
2. Google Calendar API enabled
3. OAuth 2.0 credentials configured

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add test users (if in testing mode)
   - Save and continue
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Dental Appointment System" (or your preferred name)
   - Authorized redirect URIs:
     - For development: `http://localhost:3003/api/calendar/callback`
     - For production: `https://yourdomain.com/api/calendar/callback`
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env` file in the backend directory:

```env
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3003/api/calendar/callback
```

**For production**, update `GOOGLE_REDIRECT_URI` to match your production domain:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback
```

## Step 4: Add Test Users (Required for Testing Mode)

**Important**: If your app is in "Testing" mode (which it is by default), you MUST add test users:

1. Go to "APIs & Services" > "OAuth consent screen"
2. Scroll down to the **"Test users"** section
3. Click **"+ ADD USERS"**
4. Add the email addresses of users who will connect their Google Calendar:
   - Add your own email address
   - Add any other admin/receptionist emails who will use the calendar integration
   - You can add up to 100 test users
5. Click **"SAVE"**

**Note**: Only users added as test users will be able to authenticate. If you get an error saying "The app is currently being tested", you need to add that user's email to the test users list.

## Step 5: OAuth Flow

1. **Get Authorization URL**: 
   - Frontend calls `GET /api/calendar/auth-url`
   - Backend returns `{ url: "https://accounts.google.com/..." }`

2. **Redirect User**: 
   - Frontend redirects user to the authorization URL
   - User grants permissions in Google's consent screen

3. **Handle Callback**: 
   - Google redirects to `GOOGLE_REDIRECT_URI` with a `code` parameter
   - Backend endpoint `GET /api/calendar/callback?code=...` exchanges the code for tokens
   - Tokens are stored in the database (AppointmentSettings table)

4. **Calendar Sync**: 
   - Once connected, appointments are automatically synced to Google Calendar
   - Events are created/updated/deleted when appointments change

## API Endpoints

- `GET /api/calendar/auth-url` - Get Google OAuth authorization URL
- `GET /api/calendar/callback?code=...` - Handle OAuth callback and store tokens
- `POST /api/calendar/disconnect` - Disconnect Google Calendar integration

## Troubleshooting

### "Google OAuth not configured" error
- Ensure all environment variables are set correctly
- Restart the backend server after adding environment variables

### "Failed to authenticate with Google Calendar" error
- Check that the redirect URI matches exactly (including http/https and port)
- Verify the OAuth consent screen is configured correctly
- Ensure the Google Calendar API is enabled

### Token refresh issues
- The system automatically refreshes expired tokens
- If refresh fails, user needs to reconnect via the OAuth flow

### Events not appearing in calendar
- Check that `calendar_connected` is `true` in the database
- Verify tokens are stored correctly in `AppointmentSettings` table
- Check backend logs for calendar sync errors

## Security Notes

- Never commit `.env` file to version control
- Keep `GOOGLE_CLIENT_SECRET` secure
- Use HTTPS in production
- Regularly rotate OAuth credentials if compromised

