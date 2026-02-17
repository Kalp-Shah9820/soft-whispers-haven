import { Express } from "express";
import { authRoutes } from "./auth";
import { userRoutes } from "./users";
import { dreamRoutes } from "./dreams";
import { thoughtRoutes } from "./thoughts";
import { letterRoutes } from "./letters";
import { moodRoutes } from "./moods";
import { settingsRoutes } from "./settings";
import { selfCareRoutes } from "./selfCare";
import { sharedRoutes } from "./shared";
import { testRoutes } from "./test";

export function setupRoutes(app: Express) {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/dreams", dreamRoutes);
  app.use("/api/thoughts", thoughtRoutes);
  app.use("/api/letters", letterRoutes);
  app.use("/api/moods", moodRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/self-care", selfCareRoutes);
  app.use("/api/shared", sharedRoutes);
  app.use("/api/test", testRoutes);
}
