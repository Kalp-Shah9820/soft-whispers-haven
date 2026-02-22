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

const cronEnabled = (process.env.CRON_ENABLED || "").toLowerCase() === "true";

// Real production schedules (server local time)
const dailyMotivationSchedule = "0 9 * * *"; // 9:00 AM
const emotionalCheckinSchedule = "0 20 * * *"; // 8:00 PM
const skincareMorningSchedule = "0 8 * * *"; // 8:00 AM
const skincareEveningSchedule = "0 21 * * *"; // 9:00 PM
const waterReminderSchedule = "0 9-21/2 * * *"; // every 2 hours between 9 AM–9 PM
const periodCareSchedule = "0 10 * * *"; // 10:00 AM

// Daily motivation job
async function runDailyMotivationJob() {
  console.log("🌅 Running daily motivation job...");
  let messagesSent = 0;
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        notificationsEnabled: true,
        showRest: true,
      },
    });

    console.log(`   Candidates found (daily motivation): ${users.length}`);

    for (const user of users) {
      if (!user.phone || !user.notificationsEnabled || !user.showRest) {
        console.log(`   Skipping user ${user.name || user.id} - notifications disabled or showRest=false`);
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
          console.log(`[Daily Motivation] User: ${user.id}, Phone: ${phone}, Name: ${user.name || "N/A"}`);
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
        notificationsEnabled: true,
        showWater: true,
      },
    });

    console.log(`   Candidates found (water): ${users.length}`);

    // Safety guard (cron should already enforce this)
    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour > 21) return;
    if ((currentHour - 9) % 2 !== 0) return;

    for (const user of users) {
      if (!user.phone || !user.notificationsEnabled || !user.showWater) continue;

      try {
        const targets = await getMainUserPhones(prisma, user.id);

        for (const phone of targets) {
          console.log(`[Water Reminder] User: ${user.id}, Phone: ${phone}, Name: ${user.name || "N/A"}`);
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
async function runSkincareReminderJob(isMorning: boolean) {
  console.log(`🧴 Running skincare reminder job (${isMorning ? "morning" : "evening"})...`);
  let messagesSent = 0;
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "MAIN_USER",
        phone: { not: null },
        notificationsEnabled: true,
        showSkincare: true,
      },
    });

    console.log(`   Candidates found (skincare): ${users.length}`);

    for (const user of users) {
      if (!user.phone || !user.notificationsEnabled || !user.showSkincare) continue;

      try {
        const targets = await getMainUserPhones(prisma, user.id);

        for (const phone of targets) {
          console.log(
            `[Skincare Reminder:${isMorning ? "AM" : "PM"}] User: ${user.id}, Phone: ${phone}, Name: ${
              user.name || "N/A"
            }`
          );
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
        notificationsEnabled: true,
        showPeriod: true,
        periodStartDate: { not: null },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`   Candidates found (period care): ${users.length}`);

    for (const user of users) {
      if (!user.phone || !user.notificationsEnabled || !user.showPeriod || !user.periodStartDate) continue;

      const lastPeriod = new Date(user.periodStartDate);
      const daysSinceStart = Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Period care: only if periodStartDate is within the last 5 days (inclusive)
      if (daysSinceStart >= 0 && daysSinceStart <= 5) {
        try {
          const targets = await getMainUserPhones(prisma, user.id);

          for (const phone of targets) {
            console.log(`[Period Care Reminder] User: ${user.id}, Phone: ${phone}, Name: ${user.name || "N/A"}`);
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
        notificationsEnabled: true,
        currentNeed: {
          in: ["REST", "MOTIVATION", "SUPPORT", "SPACE"],
        },
      },
    });

    console.log(`   Candidates found (emotional check-in): ${users.length}`);

    for (const user of users) {
      if (!user.phone || !user.notificationsEnabled) continue;

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
          const targets = await getMainUserPhones(prisma, user.id);

          for (const phone of targets) {
            console.log(`[Emotional Check-in] User: ${user.id}, Phone: ${phone}, Name: ${user.name || "N/A"}`);
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
  if (!cronEnabled) {
    console.log("⛔ CRON is disabled (set CRON_ENABLED=true to enable scheduled jobs).");
    return;
  }

  // Daily motivation job
  cron.schedule(dailyMotivationSchedule, runDailyMotivationJob);
  console.log(`✅ Daily motivation job scheduled (${dailyMotivationSchedule})`);

  // Water reminders job
  cron.schedule(waterReminderSchedule, runWaterReminderJob);
  console.log(`✅ Water reminder job scheduled (${waterReminderSchedule})`);

  // Skincare reminders jobs (morning + evening)
  cron.schedule(skincareMorningSchedule, () => runSkincareReminderJob(true));
  console.log(`✅ Skincare reminder job scheduled (${skincareMorningSchedule})`);

  cron.schedule(skincareEveningSchedule, () => runSkincareReminderJob(false));
  console.log(`✅ Skincare reminder job scheduled (${skincareEveningSchedule})`);

  // Period care reminders job
  cron.schedule(periodCareSchedule, runPeriodCareReminderJob);
  console.log(`✅ Period reminder job scheduled (${periodCareSchedule})`);

  // Emotional check-in job
  cron.schedule(emotionalCheckinSchedule, runEmotionalCheckinJob);
  console.log(`✅ Emotional check-in job scheduled (${emotionalCheckinSchedule})`);

  console.log("⏰ All scheduled jobs initialized and registered");
}
