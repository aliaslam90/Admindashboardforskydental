# Environment Variables

## Required Environment Variables

Add these to your `.env` file in the `backend` directory:

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dental_user
DB_PASSWORD=dental_pass
DB_NAME=dental_db
```

### Server Configuration
```env
PORT=3003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Google Calendar OAuth (Required for Calendar Integration)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3003/api/calendar/callback
```

**For production**, update `GOOGLE_REDIRECT_URI`:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback
```

## Where to Store

1. **Development**: Create a `.env` file in the `backend/` directory
2. **Production**: Set environment variables in your hosting platform (Heroku, AWS, etc.)
3. **Never commit** `.env` files to version control (they should be in `.gitignore`)

## Getting Google OAuth Credentials

See `GOOGLE_CALENDAR_SETUP.md` for detailed instructions on:
- Creating a Google Cloud Project
- Enabling Google Calendar API
- Creating OAuth 2.0 credentials
- Configuring redirect URIs

## Example .env File

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dental_user
DB_PASSWORD=dental_pass
DB_NAME=dental_db

# Server
PORT=3003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google Calendar OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3003/api/calendar/callback
```

