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
import { getMainUserPhones } from "../utils/notifications";

const prisma = new PrismaClient();
const isDevelopment = process.env.NODE_ENV === "development";

// Development mode: run all jobs every 2 minutes
const DEV_SCHEDULE = "*/2 * * * *";

// Production schedules - individual constants to avoid TypeScript errors
const dailyMotivationSchedule = isDevelopment ? DEV_SCHEDULE : "0 9 * * *";
const waterReminderSchedule = isDevelopment ? DEV_SCHEDULE : "0 */2 * * *";
const skincareSchedule = isDevelopment ? DEV_SCHEDULE : "0 9,21 * * *";
const periodCareSchedule = isDevelopment ? DEV_SCHEDULE : "0 10 * * *";
const emotionalCheckinSchedule = isDevelopment ? DEV_SCHEDULE : "0 20 * * *";

// Daily motivation job
async function runDailyMotivationJob() {
  console.log("🌅 Running daily motivation job...");
  let messagesSent = 0;
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
      },
    });

    console.log(`   Candidates found (daily motivation): ${users.length}`);

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
        const targets = await getMainUserPhones(prisma, user.id);

        for (const phone of targets) {
          const result = await sendWhatsAppNotification(
            phone,
            `Good morning, ${user.name || "love"} 🌅\n\n${message}`
          );

          if (result.success) {
            messagesSent += 1;
          } else {
            console.error(`   Failed for user ${user.name} (${phone}): ${result.error}`);
          }
        }
      } catch (error: any) {
        console.error(`   Error sending to user ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Daily motivation job error:", error);
  } finally {
    console.log(`🌅 Daily motivation job finished. Messages sent: ${messagesSent}`);
  }
}

// Water reminders job
async function runWaterReminderJob() {
  console.log("💧 Running water reminder check...");
  let messagesSent = 0;
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        showWater: true,
      },
    });

    console.log(`   Candidates found (water): ${users.length}`);

    const now = new Date();
    const currentHour = now.getHours();

    // Only send between 9 AM and 9 PM, every 2 hours (9, 11, 13, ..., 21)
    // Skip this check in development mode
    if (!isDevelopment) {
      if (currentHour < 9 || currentHour > 21) {
        return;
      }
      if ((currentHour - 9) % 2 !== 0) {
        return;
      }
    }

    for (const user of users) {
      if (!user.phone) continue;

      try {
        const targets = await getMainUserPhones(prisma, user.id);

        for (const phone of targets) {
          const result = await sendWhatsAppNotification(
            phone,
            getWaterReminderMessage(user.name || undefined)
          );
          if (result.success) {
            messagesSent += 1;
          } else {
            console.error(`   Failed for user ${user.name} (${phone}): ${result.error}`);
          }
        }
      } catch (error: any) {
        console.error(`   Error sending water reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Water reminder job error:", error);
  } finally {
    console.log(`💧 Water reminder job finished. Messages sent: ${messagesSent}`);
  }
}

// Skincare reminders job
async function runSkincareReminderJob() {
  console.log("🧴 Running skincare reminder job...");
  let messagesSent = 0;
  try {
    const isMorning = new Date().getHours() < 12;

    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        showSkincare: true,
      },
    });

    console.log(`   Candidates found (skincare): ${users.length}`);

    for (const user of users) {
      if (!user.phone) continue;

      try {
        const targets = await getMainUserPhones(prisma, user.id);

        for (const phone of targets) {
          const result = await sendWhatsAppNotification(
            phone,
            getSkincareReminderMessage(isMorning, user.name || undefined)
          );
          if (result.success) {
            messagesSent += 1;
          } else {
            console.error(`   Failed for user ${user.name} (${phone}): ${result.error}`);
          }
        }
      } catch (error: any) {
        console.error(`   Error sending skincare reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Skincare reminder job error:", error);
  } finally {
    console.log(`🧴 Skincare reminder job finished. Messages sent: ${messagesSent}`);
  }
}

// Period care reminders job
async function runPeriodCareReminderJob() {
  console.log("🌺 Running period care reminder job...");
  let messagesSent = 0;
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

    console.log(`   Candidates found (period care): ${users.length}`);

    for (const user of users) {
      if (!user.phone || !user.periodStartDate) continue;

      const lastPeriod = new Date(user.periodStartDate);
      const daysSince = Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Typical cycle is 28 days, remind 2-3 days before
      // In development mode, always send if user has periodStartDate set
      if (isDevelopment || (daysSince >= 25 && daysSince <= 27)) {
        try {
          const targets = await getMainUserPhones(prisma, user.id);

          for (const phone of targets) {
            const result = await sendWhatsAppNotification(
              phone,
              getPeriodCareMessage(user.name || undefined)
            );
            if (result.success) {
              messagesSent += 1;
            } else {
              console.error(`   Failed for user ${user.name} (${phone}): ${result.error}`);
            }
          }
        } catch (error: any) {
          console.error(`   Error sending period care reminder to ${user.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Period care reminder job error:", error);
  } finally {
    console.log(`🌺 Period care reminder job finished. Messages sent: ${messagesSent}`);
  }
}

// Emotional check-in job
async function runEmotionalCheckinJob() {
  console.log("💛 Running emotional check-in job...");
  let messagesSent = 0;
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

    console.log(`   Candidates found (emotional check-in): ${users.length}`);

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
      // In development mode, send even without mood logged
      if (isDevelopment || (todayMood && user.currentNeed !== "GENTLE_REMINDERS")) {
        try {
          const targets = await getMainUserPhones(prisma, user.id);

          for (const phone of targets) {
            const result = await sendWhatsAppNotification(
              phone,
              getEmotionalCheckinMessage(user.currentNeed, user.name || undefined)
            );
            if (result.success) {
              messagesSent += 1;
            } else {
              console.error(`   Failed for user ${user.name} (${phone}): ${result.error}`);
            }
          }
        } catch (error: any) {
          console.error(`   Error sending emotional check-in to ${user.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Emotional check-in job error:", error);
  } finally {
    console.log(`💛 Emotional check-in job finished. Messages sent: ${messagesSent}`);
  }
}

export function setupScheduledJobs() {
  if (isDevelopment) {
    console.log("🔧 Development mode: All jobs will run every 2 minutes");
  }

  // Daily motivation job
  cron.schedule(dailyMotivationSchedule, runDailyMotivationJob);
  console.log(`✅ Daily motivation job scheduled (${dailyMotivationSchedule})`);

  // Water reminders job
  cron.schedule(waterReminderSchedule, runWaterReminderJob);
  console.log(`✅ Water reminder job scheduled (${waterReminderSchedule})`);

  // Skincare reminders job
  cron.schedule(skincareSchedule, runSkincareReminderJob);
  console.log(`✅ Skincare reminder job scheduled (${skincareSchedule})`);

  // Period care reminders job
  cron.schedule(periodCareSchedule, runPeriodCareReminderJob);
  console.log(`✅ Period reminder job scheduled (${periodCareSchedule})`);

  // Emotional check-in job
  cron.schedule(emotionalCheckinSchedule, runEmotionalCheckinJob);
  console.log(`✅ Emotional check-in job scheduled (${emotionalCheckinSchedule})`);

  console.log("⏰ All scheduled jobs initialized and registered");
}
