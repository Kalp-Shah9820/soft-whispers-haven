import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendWhatsAppNotification } from "../services/whatsapp";
import {
  getDailyMessage,
  getWaterReminderMessage,
  getSkincareReminderMessage,
  getPeriodCareMessage,
  getEmotionalCheckinMessage,
} from "../utils/messages";

const prisma = new PrismaClient();

// Daily motivation at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("🌅 Running daily motivation job...");
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
      },
    });

    for (const user of users) {
      if (!user.phone) {
        console.log(`   Skipping user ${user.name || user.id} - no phone number`);
        continue;
      }

      try {
        // Get latest mood for personalized message
        const latestMood = await prisma.moodEntry.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });

        const message = latestMood?.message || getDailyMessage();
        const result = await sendWhatsAppNotification(
          user.phone,
          `Good morning, ${user.name || "love"} 🌅\n\n${message}`
        );
        
        if (!result.success) {
          console.error(`   Failed for user ${user.name}: ${result.error}`);
        }
      } catch (error: any) {
        console.error(`   Error sending to user ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Daily motivation job error:", error);
  }
});

// Water reminders (every hour, but only for users with water reminders enabled)
cron.schedule("0 * * * *", async () => {
  console.log("💧 Running water reminder check...");
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        showWater: true,
      },
    });

    const now = new Date();
    const currentHour = now.getHours();

    // Only send between 8 AM and 10 PM
    if (currentHour < 8 || currentHour >= 22) {
      return;
    }

    for (const user of users) {
      if (!user.phone) continue;

      try {
        // Check if it's time for a reminder based on frequency
        const reminderHour = user.waterReminderFrequency || 2;
        if (currentHour % reminderHour === 0) {
          const result = await sendWhatsAppNotification(
            user.phone,
            getWaterReminderMessage(user.name || undefined)
          );
          if (!result.success) {
            console.error(`   Failed for user ${user.name}: ${result.error}`);
          }
        }
      } catch (error: any) {
        console.error(`   Error sending water reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Water reminder job error:", error);
  }
});

// Skincare reminders (morning at 8 AM, evening at 8 PM)
cron.schedule("0 8,20 * * *", async () => {
  console.log("🧴 Running skincare reminder job...");
  try {
    const isMorning = new Date().getHours() === 8;

    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        showSkincare: true,
      },
    });

    for (const user of users) {
      if (!user.phone) continue;

      try {
        const result = await sendWhatsAppNotification(
          user.phone,
          getSkincareReminderMessage(isMorning, user.name || undefined)
        );
        if (!result.success) {
          console.error(`   Failed for user ${user.name}: ${result.error}`);
        }
      } catch (error: any) {
        console.error(`   Error sending skincare reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Skincare reminder job error:", error);
  }
});

// Period care reminders (check daily at 10 AM)
cron.schedule("0 10 * * *", async () => {
  console.log("🌺 Running period care reminder job...");
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        showPeriod: true,
        periodStartDate: { not: null },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      if (!user.phone || !user.periodStartDate) continue;

      const lastPeriod = new Date(user.periodStartDate);
      const daysSince = Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Typical cycle is 28 days, remind 2-3 days before
      if (daysSince >= 25 && daysSince <= 27) {
        try {
          const result = await sendWhatsAppNotification(
            user.phone,
            getPeriodCareMessage(user.name || undefined)
          );
          if (!result.success) {
            console.error(`   Failed for user ${user.name}: ${result.error}`);
          }
        } catch (error: any) {
          console.error(`   Error sending period care reminder to ${user.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Period care reminder job error:", error);
  }
});

// Emotional check-in followups (check every 4 hours during day)
cron.schedule("0 12,16,20 * * *", async () => {
  console.log("💛 Running emotional check-in job...");
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        currentNeed: {
          in: ["REST", "MOTIVATION", "SUPPORT", "SPACE"],
        },
      },
    });

    for (const user of users) {
      if (!user.phone) continue;

      // Only send once per day per need type
      const today = new Date().toISOString().slice(0, 10);
      const todayMood = await prisma.moodEntry.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
      });

      // Only send if mood was logged today and need is set
      if (todayMood && user.currentNeed !== "GENTLE_REMINDERS") {
        try {
          const result = await sendWhatsAppNotification(
            user.phone,
            getEmotionalCheckinMessage(user.currentNeed, user.name || undefined)
          );
          if (!result.success) {
            console.error(`   Failed for user ${user.name}: ${result.error}`);
          }
        } catch (error: any) {
          console.error(`   Error sending emotional check-in to ${user.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Emotional check-in job error:", error);
  }
});

export function setupScheduledJobs() {
  console.log("⏰ Scheduled jobs initialized");
}
