# Google OAuth Troubleshooting Guide

## Error: "Sky Dental has not completed the Google verification process"

This error occurs when:
1. Your OAuth app is in **Testing** mode
2. The user trying to authenticate is **not** in the test users list

### Solution 1: Add Test Users (Quick Fix for Development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **"APIs & Services"** > **"OAuth consent screen"**
4. Scroll down to the **"Test users"** section
5. Click **"+ ADD USERS"**
6. Add the email address of the user trying to connect:
   - This should be the Google account email they'll use to authenticate
   - You can add multiple emails (up to 100 test users)
7. Click **"SAVE"**
8. The user should now be able to authenticate

### Solution 2: Publish Your App (For Production)

If you want anyone to be able to use your app without being added as a test user:

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Review all the required information:
   - App name, logo, support email, etc.
   - Scopes (permissions) your app requests
   - Privacy policy URL (required for production)
   - Terms of service URL (required for production)
3. Click **"PUBLISH APP"**
4. Your app will be in "In production" mode
5. **Note**: Google may require verification for sensitive scopes, which can take several days

**For development/testing**: Use Solution 1 (add test users) - it's immediate and doesn't require verification.

## Other Common Issues

### "Access blocked: This app's request is invalid"

- Check that your redirect URI matches exactly in Google Cloud Console
- Make sure you're using the correct OAuth client ID and secret
- Verify the redirect URI includes the correct protocol (http/https) and port

### "redirect_uri_mismatch"

- The redirect URI in your `.env` file must match exactly what's in Google Cloud Console
- Check for trailing slashes, http vs https, and port numbers
- Example: `http://localhost:3003/api/calendar/callback` must match exactly

### "invalid_client"

- Your `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in `.env` is incorrect
- Make sure there are no extra spaces or quotes
- Regenerate credentials if needed

### Token refresh fails

- Make sure you requested `offline` access (we do this with `access_type: 'offline'`)
- The refresh token is only provided on the first authorization
- If you need a new refresh token, revoke access and re-authenticate

## Testing Checklist

- [ ] OAuth consent screen is configured
- [ ] Test users are added (if in testing mode)
- [ ] Redirect URI matches exactly in both places
- [ ] Environment variables are set correctly
- [ ] Google Calendar API is enabled
- [ ] Scopes are added to OAuth consent screen

## Quick Reference

**OAuth Consent Screen**: `APIs & Services` > `OAuth consent screen`
**Credentials**: `APIs & Services` > `Credentials`
**Test Users**: `OAuth consent screen` > Scroll to `Test users` section
**API Status**: `APIs & Services` > `Library` > Search "Google Calendar API"

