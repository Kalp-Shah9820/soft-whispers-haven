import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";
import { getDailyMessage } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get mood history (filtered by role)
router.get("/history", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let moodEntries;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({
        where: { id: user.partnerId! },
      });
      if (!mainUser) {
        return res.json({ moods: [] });
      }
      moodEntries = await prisma.moodEntry.findMany({
        where: {
          userId: mainUser.id,
          shared: true,
        },
        orderBy: { date: "desc" },
      });
    } else {
      moodEntries = await prisma.moodEntry.findMany({
        where: { userId: req.userId! },
        orderBy: { date: "desc" },
      });
    }

    res.json({ moods: moodEntries });
  } catch (error: any) {
    console.error("Get mood history error:", error);
    res.status(500).json({ error: "Failed to get mood history" });
  }
});

// Log mood
router.post("/log", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { mood, shared } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    const message = getDailyMessage();

    // Upsert mood entry (one per day)
    const moodEntry = await prisma.moodEntry.upsert({
      where: {
        userId_date: {
          userId: req.userId!,
          date: today,
        },
      },
      update: {
        mood,
        shared: shared !== false && user?.globalSharing,
        message,
      },
      create: {
        userId: req.userId!,
        mood,
        date: today,
        shared: shared !== false && user?.globalSharing,
        message,
      },
    });

    // Notify partner if shared
    if (moodEntry.shared && user) {
      const partner = await prisma.user.findFirst({
        where: { partnerId: req.userId! },
      });

      if (partner?.phone) {
        const result = await sendWhatsAppNotification(
          partner.phone,
          `She shared her mood with you today ${moodEntry.mood}`
        );
        if (!result.success) {
          console.error("Failed to notify partner:", result.error);
        }
      }
    }

    res.json({ mood: moodEntry });
  } catch (error: any) {
    console.error("Log mood error:", error);
    res.status(500).json({ error: "Failed to log mood" });
  }
});

// Get today's mood
router.get("/today", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const userId = user.role === "PARTNER" ? user.partnerId! : req.userId!;

    const moodEntry = await prisma.moodEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    res.json({ mood: moodEntry });
  } catch (error: any) {
    console.error("Get today mood error:", error);
    res.status(500).json({ error: "Failed to get today's mood" });
  }
});

export { router as moodRoutes };
