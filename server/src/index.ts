import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupRoutes } from "./routes";
import { setupScheduledJobs } from "./jobs/scheduler";
import { getWhatsAppStatus } from "./services/whatsapp";

dotenv.config();

const app = express();
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
  const devOriginRegex =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/i;
  return devOriginRegex.test(origin);
}

// Log WhatsApp status at startup
const whatsappStatus = getWhatsAppStatus();
if (whatsappStatus.configured) {
  console.log("📱 " + whatsappStatus.message);
} else {
  console.log("📱 WhatsApp: NOT CONFIGURED — " + whatsappStatus.message);
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
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
setupRoutes(app);

// Start scheduled jobs
setupScheduledJobs();

// Start server
app.listen(PORT, () => {
  console.log(`🌸 Backend server running on port ${PORT}`);
});
