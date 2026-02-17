# Frontend-Backend Integration Guide

This guide explains how to connect the existing frontend to the new backend API.

## Overview

The backend is designed to be a drop-in replacement for localStorage. The frontend can continue using the same hooks and interfaces, but data will be persisted in a database and synced across devices.

## Option 1: Gradual Migration (Recommended)

Create a wrapper that switches between localStorage and API based on environment:

### 1. Create a storage adapter (`src/lib/store-adapter.ts`)

```typescript
import { useDreams, useThoughts, useLetters, useMoodHistory, useSettings, useSelfCare, useEmotionalCheckin, useLastMoodCheck, useRole } from "./store";
import { useDreamsAPI, useThoughtsAPI, useLettersAPI, useMoodHistoryAPI, useSettingsAPI, useSelfCareAPI, useEmotionalCheckinAPI, useLastMoodCheckAPI, useRoleAPI } from "./store-api";

const USE_API = import.meta.env.VITE_STORAGE_MODE === "api";

export const useDreams = USE_API ? useDreamsAPI : useDreams;
export const useThoughts = USE_API ? useThoughtsAPI : useThoughts;
export const useLetters = USE_API ? useLettersAPI : useLetters;
export const useMoodHistory = USE_API ? useMoodHistoryAPI : useMoodHistory;
export const useSettings = USE_API ? useSettingsAPI : useSettings;
export const useSelfCare = USE_API ? useSelfCareAPI : useSelfCare;
export const useEmotionalCheckin = USE_API ? useEmotionalCheckinAPI : useEmotionalCheckin;
export const useLastMoodCheck = USE_API ? useLastMoodCheckAPI : useLastMoodCheck;
export const useRole = USE_API ? useRoleAPI : useRole;
```

### 2. Update imports in components

Change imports from:
```typescript
import { useDreams } from "@/lib/store";
```

To:
```typescript
import { useDreams } from "@/lib/store-adapter";
```

## Option 2: Direct API Integration

Replace all `store.ts` imports with `store-api.ts` imports throughout the codebase.

## Initial Setup Flow

### 1. User Registration/Login

Add an initialization component that handles first-time setup:

```typescript
// src/components/AuthInit.tsx
import { useEffect, useState } from "react";
import { authAPI } from "@/lib/api";
import { useSettings } from "@/lib/store-adapter";

export function AuthInit() {
  const [settings] = useSettings();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Try to get current user
        await authAPI.getMe();
        setInitialized(true);
      } catch {
        // Not logged in, register with current settings
        if (settings.identity.name) {
          await authAPI.register({
            name: settings.identity.name,
            phone: settings.identity.phone,
            role: "self",
          });
          setInitialized(true);
        }
      }
    }
    init();
  }, [settings]);

  if (!initialized) {
    return <div>Initializing...</div>;
  }

  return null;
}
```

### 2. Update App.tsx

```typescript
import { AuthInit } from "@/components/AuthInit";

function AppContent() {
  // ... existing code ...
  return (
    <>
      <AuthInit />
      <MoodCheckModal />
      {/* ... rest of app ... */}
    </>
  );
}
```

## Data Synchronization

The API-based hooks automatically sync data to the backend:

- **Reads**: Load from API on mount
- **Writes**: Immediately sync to API when state changes
- **Error Handling**: Falls back gracefully if API is unavailable

## Partner Linking

To link a partner:

1. Main user goes to Settings
2. Enters partner's phone number
3. Backend creates partner account and links them
4. Partner logs in with their phone number
5. Partner automatically sees shared content

## Migration Checklist

- [ ] Set up backend server (see README-BACKEND.md)
- [ ] Configure environment variables
- [ ] Create database and run migrations
- [ ] Test API endpoints
- [ ] Update frontend to use API hooks
- [ ] Test user registration/login flow
- [ ] Test data synchronization
- [ ] Test partner sharing
- [ ] Test WhatsApp notifications
- [ ] Deploy backend
- [ ] Update frontend production build

## Testing

### Local Development

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Set `VITE_STORAGE_MODE=api` in frontend `.env`
4. Test all features

### Production

1. Deploy backend to hosting (e.g., Railway, Render, Heroku)
2. Update `VITE_API_URL` to production backend URL
3. Build frontend: `npm run build`
4. Deploy frontend

## Troubleshooting

### API Connection Errors

- Check `VITE_API_URL` is correct
- Verify backend is running
- Check CORS settings in backend
- Check browser console for errors

### Authentication Errors

- Verify JWT token is being stored
- Check token expiration (default: 30 days)
- Ensure Authorization header is sent

### Data Not Syncing

- Check network tab for failed requests
- Verify user is authenticated
- Check backend logs for errors

## Rollback Plan

If issues occur, you can quickly rollback:

1. Set `VITE_STORAGE_MODE=local` in `.env`
2. Frontend will use localStorage again
3. No data loss (localStorage still works)

## Next Steps

1. Add error boundaries for API failures
2. Add loading states during API calls
3. Add optimistic updates for better UX
4. Add retry logic for failed requests
5. Add offline support with service workers
