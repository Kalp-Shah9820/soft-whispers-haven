# Emotional Companion Backend

Full-stack backend implementation for the emotional companion app with persistent storage and WhatsApp notifications.

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Notifications**: Twilio WhatsApp API
- **Scheduling**: node-cron for automated reminders
- **Authentication**: JWT tokens

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Twilio account (for WhatsApp notifications)

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Install PostgreSQL if not already installed
# Create a new database
createdb emotional_companion

# Or using psql
psql -U postgres
CREATE DATABASE emotional_companion;
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Random secret string
# - TWILIO_*: Your Twilio credentials
# - FRONTEND_URL: Your frontend URL (default: http://localhost:5173)
```

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Start Backend Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3001` (or PORT from .env).

## 🔐 Authentication

The backend uses JWT tokens for authentication. Users register/login and receive a token that must be included in subsequent requests:

```
Authorization: Bearer <token>
```

### User Roles

- **MAIN_USER**: Full access to all features
- **PARTNER**: Read-only access to shared content only

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/link-partner` - Link partner to main user

### Dreams (`/api/dreams`)

- `GET /api/dreams` - Get all dreams (filtered by role)
- `GET /api/dreams/:id` - Get single dream
- `POST /api/dreams` - Create dream
- `PATCH /api/dreams/:id` - Update dream
- `DELETE /api/dreams/:id` - Delete dream

### Thoughts (`/api/thoughts`)

- `GET /api/thoughts` - Get all thoughts
- `POST /api/thoughts` - Create thought
- `PATCH /api/thoughts/:id` - Update thought
- `DELETE /api/thoughts/:id` - Delete thought

### Letters (`/api/letters`)

- `GET /api/letters` - Get all letters
- `POST /api/letters` - Create letter
- `PATCH /api/letters/:id` - Update letter
- `DELETE /api/letters/:id` - Delete letter

### Moods (`/api/moods`)

- `GET /api/moods/history` - Get mood history
- `GET /api/moods/today` - Get today's mood
- `POST /api/moods/log` - Log mood

### Settings (`/api/settings`)

- `GET /api/settings` - Get settings
- `PATCH /api/settings` - Update settings

### Self-Care (`/api/self-care`)

- `GET /api/self-care/:date` - Get self-care items for date
- `POST /api/self-care` - Create/update self-care items
- `PATCH /api/self-care/:id` - Update single item

### Shared Content (`/api/shared`)

- `GET /api/shared` - Get all shared content (partner only)

## 📲 WhatsApp Notifications

### Setup Twilio

1. Create a Twilio account
2. Get your Account SID and Auth Token
3. Set up WhatsApp sandbox (for testing) or get approved WhatsApp number
4. Add credentials to `.env`

### Notification Types

#### For Main User

- **Daily Motivation** (9 AM): Based on latest mood
- **Water Reminders**: Every 1-2 hours (configurable)
- **Skincare Reminders**: Morning (8 AM) and Evening (8 PM)
- **Period Care**: 2-3 days before expected cycle
- **Emotional Check-ins**: Based on "needs right now" state

#### For Partner

- **Sharing Notifications**: When main user shares content
- **Kindness Signals**: When mood is shared or needs change

## ⏰ Scheduled Jobs

The backend runs automated cron jobs:

- `0 9 * * *` - Daily motivation (9 AM)
- `0 * * * *` - Water reminders (hourly, filtered by settings)
- `0 8,20 * * *` - Skincare reminders (8 AM & 8 PM)
- `0 10 * * *` - Period care check (10 AM)
- `0 12,16,20 * * *` - Emotional check-ins (12 PM, 4 PM, 8 PM)

## 🔒 Privacy & Security

- **Role-based access control**: Partners can ONLY see shared content
- **JWT authentication**: Secure token-based auth
- **Database-level constraints**: Enforced privacy boundaries
- **Input validation**: Zod schemas (can be added)

## 🗄️ Database Schema

Key models:

- `User` - User accounts with roles and settings
- `Dream` - Dream entries with targets
- `Thought` - Thought entries
- `Letter` - Letters to self
- `MoodEntry` - Daily mood logs
- `SelfCareItem` - Self-care checklist items
- `Target` - Dream targets/steps

See `server/prisma/schema.prisma` for full schema.

## 🔄 Frontend Integration

The frontend uses API hooks in `src/lib/store-api.ts` that mirror the localStorage interface but sync with the backend.

To enable backend mode:

1. Set `VITE_API_URL` in frontend `.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

2. Update imports in components to use `store-api.ts` instead of `store.ts` (or create a wrapper that switches based on env)

## 🧪 Testing

```bash
# Run database migrations in test mode
npm run db:migrate

# Start server in development
npm run dev
```

## 📝 Environment Variables

See `server/.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT signing
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp number
- `FRONTEND_URL` - Frontend URL for CORS

## 🚨 Production Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Database**: Use connection pooling for production
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Add rate limiting middleware
5. **Error Logging**: Set up proper error logging (e.g., Sentry)
6. **Monitoring**: Monitor scheduled jobs and API health
7. **Backups**: Regular database backups
8. **Twilio**: Upgrade from sandbox to production WhatsApp number

## 📚 Additional Notes

- The backend is designed to be stateless (except for database)
- All timestamps are stored in UTC
- WhatsApp notifications gracefully degrade if Twilio is not configured
- The system supports multiple partners per main user (though UI assumes one)
