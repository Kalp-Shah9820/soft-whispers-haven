# Emotional Companion Backend

See [README-BACKEND.md](../README-BACKEND.md) in the root directory for full documentation.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

## Project Structure

```
server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── routes/               # API route handlers
│   │   ├── auth.ts
│   │   ├── dreams.ts
│   │   ├── thoughts.ts
│   │   ├── letters.ts
│   │   ├── moods.ts
│   │   ├── settings.ts
│   │   ├── selfCare.ts
│   │   ├── shared.ts
│   │   └── index.ts
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── services/
│   │   └── whatsapp.ts        # WhatsApp notification service
│   ├── jobs/
│   │   └── scheduler.ts       # Scheduled cron jobs
│   └── utils/
│       └── messages.ts        # Message templates
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```
