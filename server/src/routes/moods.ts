import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";
import { getDailyMessage } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();

// Get mood history (filtered by role)
router.get("/history", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let moodEntries;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({ where: { id: user.partnerId! } });
      if (!mainUser) return res.json({ moods: [] });
      moodEntries = await prisma.moodEntry.findMany({
        where: { userId: mainUser.id, shared: true },
        orderBy: { date: "desc" },
      });
    } else {
      moodEntries = await prisma.moodEntry.findMany({
        where: { userId: req.userId! },
        orderBy: { date: "desc" },
      });
    }

    res.json({ moods: moodEntries });
  } catch {
    res.status(500).json({ error: "Failed to get mood history" });
  }
});

// Log mood (upsert — one per day)
router.post("/log", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { mood, shared } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    if (!mood) return res.status(400).json({ error: "Mood is required" });

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    const message = getDailyMessage();
    const isShared = shared !== false && !!user?.globalSharing;

    const moodEntry = await prisma.moodEntry.upsert({
      where: { userId_date: { userId: req.userId!, date: today } },
      update: { mood, shared: isShared, message },
      create: { userId: req.userId!, mood, date: today, shared: isShared, message },
    });

    // Notify partner when mood is shared
    if (isShared && user) {
      notifyPartner(prisma, req.userId!, partnerMsg("mood", user.name || ""));
    }

    res.json({ mood: moodEntry });
  } catch {
    res.status(500).json({ error: "Failed to log mood" });
  }
});

// Get today's mood
router.get("/today", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().slice(0, 10);
    const userId = user.role === "PARTNER" ? user.partnerId! : req.userId!;

    const moodEntry = await prisma.moodEntry.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    res.json({ mood: moodEntry });
  } catch {
    res.status(500).json({ error: "Failed to get today's mood" });
  }
});

export { router as moodRoutes };
