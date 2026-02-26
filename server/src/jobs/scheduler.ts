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
const notifLog = (prisma as any).notificationLog;

const cronEnabled = (process.env.CRON_ENABLED || "").toLowerCase() === "true";

// ---------------------------------------------------------------------------
// Daily limits per notification type
// ---------------------------------------------------------------------------
const DAILY_LIMITS: Record<string, number> = {
  daily_motivation: 1,
  water: 8,
  skincare_am: 1,
  skincare_pm: 1,
  period: 4,   // 4 sends per day during active window
  emotional_checkin: 3,   // 3 nudges per day if no mood logged
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function currentHour(): number { return new Date().getHours(); }
function currentMinute(): number { return new Date().getMinutes(); }

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** How many times has this notification type been sent to this user today? */
async function countSentToday(userId: string, type: string): Promise<number> {
  try {
    return await notifLog.count({
      where: { userId, type, sentAt: { gte: startOfToday() } },
    });
  } catch {
    return 0;
  }
}

/** Returns true if we should skip (daily limit reached). */
async function limitReached(userId: string, type: string): Promise<boolean> {
  const limit = DAILY_LIMITS[type] ?? 1;
  return (await countSentToday(userId, type)) >= limit;
}

/** Record a send in the log. */
async function recordSend(userId: string, type: string): Promise<void> {
  try {
    await notifLog.create({ data: { userId, type } });
  } catch { /* non-critical */ }
}

async function sendToUser(phone: string, message: string): Promise<boolean> {
  const result = await sendWhatsAppNotification(phone, message);
  return result.success;
}

// ---------------------------------------------------------------------------
// 1. Daily Motivation — once per day at user-selected time
// ---------------------------------------------------------------------------
async function runDailyMotivationJob() {
  if (currentMinute() !== 0) return;
  const now = nowHHMM();

  const users = await prisma.user.findMany({
    where: { role: "MAIN_USER", phone: { not: null }, notificationsEnabled: true, showRest: true },
  });

  for (const user of users) {
    if (!user.phone) continue;
    const scheduledTime: string = (user as any).dailyMotivationTime ?? "08:00";
    if (now !== scheduledTime) continue;
    if (await limitReached(user.id, "daily_motivation")) continue;

    const latestMood = await prisma.moodEntry.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });
    const body = latestMood?.message || getDailyMessage();
    const sent = await sendToUser(
      user.phone,
      `Good morning, ${user.name || "love"} 🌅\n\n${body}`
    );
    if (sent) await recordSend(user.id, "daily_motivation");
  }
}

// ---------------------------------------------------------------------------
// 2. Water Reminder — per-user frequency, 9 AM–9 PM, max 8/day
// ---------------------------------------------------------------------------
async function runWaterReminderJob() {
  const hour = currentHour();
  if (currentMinute() !== 0) return;        // top of hour only
  if (hour < 8 || hour > 21) return;

  const users = await prisma.user.findMany({
    where: { role: "MAIN_USER", phone: { not: null }, notificationsEnabled: true, showWater: true },
  });

  for (const user of users) {
    if (!user.phone) continue;
    const freq: number = user.waterReminderFrequency ?? 2;
    if ((hour - 9) % freq !== 0) continue;   // respect per-user frequency
    if (await limitReached(user.id, "water")) continue;

    const sent = await sendToUser(user.phone, getWaterReminderMessage(user.name || undefined));
    if (sent) await recordSend(user.id, "water");
  }
}

// ---------------------------------------------------------------------------
// 3. Skincare — max 1 AM + 1 PM per day
// ---------------------------------------------------------------------------
async function runSkincareReminderJob() {
  if (currentMinute() !== 0) return;
  const now = nowHHMM();

  const users = await prisma.user.findMany({
    where: { role: "MAIN_USER", phone: { not: null }, notificationsEnabled: true, showSkincare: true },
  });

  for (const user of users) {
    if (!user.phone) continue;
    const morningTime: string = (user as any).skincareReminderTime ?? "08:00";
    const [morningHour] = morningTime.split(":").map(Number);
    const eveningTime = `${String((morningHour + 13) % 24).padStart(2, "0")}:00`;

    if (now === morningTime && !(await limitReached(user.id, "skincare_am"))) {
      const sent = await sendToUser(user.phone, getSkincareReminderMessage(true, user.name || undefined));
      if (sent) await recordSend(user.id, "skincare_am");
    } else if (now === eveningTime && !(await limitReached(user.id, "skincare_pm"))) {
      const sent = await sendToUser(user.phone, getSkincareReminderMessage(false, user.name || undefined));
      if (sent) await recordSend(user.id, "skincare_pm");
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Period Care — max 4/day during active window (D0–D5), every 4 hours
// ---------------------------------------------------------------------------
async function runPeriodCareReminderJob() {
  const hour = currentHour();
  if (currentMinute() !== 0) return;

  // Send at 09:00, 13:00, 17:00, 21:00
  const PERIOD_HOURS = [9, 13, 17, 21];
  if (!PERIOD_HOURS.includes(hour)) return;

  const users = await prisma.user.findMany({
    where: {
      role: "MAIN_USER",
      phone: { not: null },
      notificationsEnabled: true,
      showPeriod: true,
      periodStartDate: { not: null },
    },
  });

  const todayMidnight = startOfToday();

  for (const user of users) {
    if (!user.phone || !user.periodStartDate) continue;
    if ((user as any).periodReminderEnabled === false) continue;
    if (await limitReached(user.id, "period")) continue;

    const lastPeriod = new Date(user.periodStartDate);
    lastPeriod.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((todayMidnight.getTime() - lastPeriod.getTime()) / 86_400_000);
    if (daysSince < 0 || daysSince > 5) continue;

    // Pass how many we've already sent today so the message text rotates
    const sendCount = await countSentToday(user.id, "period");
    const sent = await sendToUser(user.phone, getPeriodCareMessage(user.name || undefined, sendCount));
    if (sent) await recordSend(user.id, "period");
  }
}

// ---------------------------------------------------------------------------
// 5. Emotional Check-in — max 3/day, only if mood NOT yet logged
// ---------------------------------------------------------------------------
async function runEmotionalCheckinJob() {
  if (currentMinute() !== 0) return;
  const hour = currentHour();

  // Send at user's selected time, then re-send at +2h and +4h if still no mood
  const users = await prisma.user.findMany({
    where: {
      role: "MAIN_USER",
      phone: { not: null },
      notificationsEnabled: true,
      currentNeed: { in: ["REST", "MOTIVATION", "SUPPORT", "SPACE"] },
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    if (!user.phone) continue;
    if ((user as any).emotionalCheckinEnabled === false) continue;
    if (await limitReached(user.id, "emotional_checkin")) continue;

    const baseHour = parseInt(((user as any).emotionalCheckinTime ?? "20:00").split(":")[0], 10);
    const allowedHours = [baseHour, (baseHour + 2) % 24, (baseHour + 4) % 24];
    if (!allowedHours.includes(hour)) continue;

    // Only nudge if mood not yet logged today
    const hasMoodToday = await prisma.moodEntry.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });
    if (hasMoodToday) continue;

    const sendCount = await countSentToday(user.id, "emotional_checkin");
    const sent = await sendToUser(
      user.phone,
      getEmotionalCheckinMessage(user.currentNeed, user.name || undefined, sendCount)
    );
    if (sent) await recordSend(user.id, "emotional_checkin");
  }
}

// ---------------------------------------------------------------------------
// Master: single per-minute cron — no immediate fire on startup
// ---------------------------------------------------------------------------
export function setupScheduledJobs() {
  if (!cronEnabled) {
    console.log("⛔ CRON disabled (CRON_ENABLED=true to enable).");
    return;
  }

  cron.schedule("* * * * *", async () => {
    await Promise.allSettled([
      runDailyMotivationJob(),
      runWaterReminderJob(),
      runSkincareReminderJob(),
      runPeriodCareReminderJob(),
      runEmotionalCheckinJob(),
    ]);
  });

  console.log("⏰ Scheduler started (per-minute, user-driven).");
}
