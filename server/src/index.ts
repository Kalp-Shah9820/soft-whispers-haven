import "dotenv/config";
import express from "express";
import cors from "cors";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { setupScheduledJobs } from "./jobs/scheduler";
import { getWhatsAppStatus } from "./services/whatsapp";
import { authenticateToken } from "./middleware/auth";

import { authRoutes } from "./routes/auth";
import { testRoutes } from "./routes/test";
import { userRoutes } from "./routes/users";
import { dreamRoutes } from "./routes/dreams";
import { thoughtRoutes } from "./routes/thoughts";
import { letterRoutes } from "./routes/letters";
import { moodRoutes } from "./routes/moods";
import { settingsRoutes } from "./routes/settings";
import { selfCareRoutes } from "./routes/selfCare";
import { sharedRoutes } from "./routes/shared";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Allow localhost + private LAN IPs during development so Vite can run on any port/host.
// In production, prefer setting FRONTEND_URL (comma-separated) to restrict origins.
function isDevAllowedOrigin(origin: string): boolean {
  // Matches http://localhost:*, http://127.0.0.1:* and typical private LAN ranges.
  // Explicitly allow common Vite dev server ports (5173, 8080, 3000, etc.)
  const devOriginRegex =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/i;
  return devOriginRegex.test(origin);
}

// Log WhatsApp status at startup (summary only)
const whatsappStatus = getWhatsAppStatus();
if (!whatsappStatus.configured) {
  console.warn("📱 WhatsApp not configured — notifications will be skipped.");
}

// Middleware
const explicitAllowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);

      if (explicitAllowedOrigins.includes(origin)) return callback(null, true);

      if (NODE_ENV !== "production" && isDevAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.disable("x-powered-by");
app.use(express.json());

// Startup backfill: existing users were created before notification fields existed,
// so their columns are genuinely NULL in the DB. Prisma's type-safe updateMany
// cannot filter on NULL for non-nullable fields, so we use raw SQL instead.
// Safe to run on every startup — only touches rows where the field IS NULL.
async function backfillUserNotificationFlags() {
  try {
    // Use a single UPDATE … WHERE notificationsEnabled IS NULL so it's idempotent.
    // Coalesce each column so already-set values are never overwritten.
    const result = await prisma.$executeRaw`
      UPDATE "User"
      SET
        "notificationsEnabled"   = COALESCE("notificationsEnabled",   true),
        "onboardingCompleted"    = COALESCE("onboardingCompleted",    true),
        "showWater"              = COALESCE("showWater",              true),
        "showRest"               = COALESCE("showRest",               true),
        "showSkincare"           = COALESCE("showSkincare",           true),
        "showPeriod"             = COALESCE("showPeriod",             true),
        "periodReminderEnabled"  = COALESCE("periodReminderEnabled",  true),
        "emotionalCheckinEnabled"= COALESCE("emotionalCheckinEnabled",true),
        "waterReminderFrequency" = COALESCE("waterReminderFrequency", 1)
      WHERE "notificationsEnabled" IS NULL
    `;
    console.log(`✅ Notification defaults backfilled — ${result} user(s) updated`);
  } catch (error: any) {
    // Never crash the server over a backfill
    console.error("⚠️  Notification defaults backfill skipped:", error?.message ?? error);
  }
}


backfillUserNotificationFlags();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
const api = Router();

// Public API
api.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
api.use("/auth", authRoutes);
api.use("/test", testRoutes);

// Protected API
api.use(authenticateToken);
api.use("/users", userRoutes);
api.use("/dreams", dreamRoutes);
api.use("/thoughts", thoughtRoutes);
api.use("/letters", letterRoutes);
api.use("/moods", moodRoutes);
api.use("/settings", settingsRoutes);
api.use("/self-care", selfCareRoutes);
api.use("/shared", sharedRoutes);

app.use("/api", api);

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last)
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start scheduled jobs
setupScheduledJobs();

// Start server
app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT} (${NODE_ENV})`);
});
