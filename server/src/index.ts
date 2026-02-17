import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupRoutes } from "./routes";
import { setupScheduledJobs } from "./jobs/scheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
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
