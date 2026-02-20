import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";
import { getDailyMessage } from "../utils/messages";
import { getPartnerPhones } from "../utils/notifications";

const router = Router();
const prisma = new PrismaClient();

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

    // Notify partner only (event-based relationship update)
    if (moodEntry.shared && user) {
      try {
        const targets = await getPartnerPhones(prisma, req.userId!);
        if (targets.length > 0) {
          console.log("Partner found");
          console.log(`Sending partner notification: mood (to ${targets.length} recipient(s))`);

          for (const phone of targets) {
            const result = await sendWhatsAppNotification(
              phone,
              "😊 Your partner shared how they are feeling."
            );
            if (result.success) {
              console.log("Notification sent successfully");
            } else {
              console.error("Failed to notify mood recipient:", result.error, `(${phone})`);
            }
          }
        }
      } catch (error: any) {
        console.error("Error sending partner notification (mood):", error.message);
        // Don't crash if partner is missing
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
