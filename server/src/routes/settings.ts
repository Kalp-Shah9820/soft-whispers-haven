import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";
import { getPartnerPhones } from "../utils/notifications";

const router = Router();
const prisma = new PrismaClient();
router.use(requireMainUser);

// Get settings
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        globalSharing: true,
        showWater: true,
        showSkincare: true,
        showRest: true,
        showPeriod: true,
        hideEverything: true,
        periodStartDate: true,
        currentNeed: true,
        waterReminderFrequency: true,
        name: true,
        phone: true,
        partnerUsers: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const partner = user.partnerUsers[0];
    const settings = {
      globalSharing: user.globalSharing,
      showWater: user.showWater,
      showSkincare: user.showSkincare,
      showRest: user.showRest,
      showPeriod: user.showPeriod,
      hideEverything: user.hideEverything,
      periodStartDate: user.periodStartDate,
      currentNeed: user.currentNeed,
      waterReminderFrequency: user.waterReminderFrequency,
      identity: {
        name: user.name,
        phone: user.phone || "",
        partnerName: partner?.name || "",
        partnerPhone: partner?.phone || "",
      },
    };

    res.json({ settings });
  } catch (error: any) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Update settings
router.patch("/", async (req: AuthRequest, res) => {
  try {
    const {
      globalSharing,
      showWater,
      showSkincare,
      showRest,
      showPeriod,
      hideEverything,
      periodStartDate,
      currentNeed,
      waterReminderFrequency,
      identity,
    } = req.body;

    const updateData: any = {};

    if (globalSharing !== undefined) updateData.globalSharing = globalSharing;
    if (showWater !== undefined) updateData.showWater = showWater;
    if (showSkincare !== undefined) updateData.showSkincare = showSkincare;
    if (showRest !== undefined) updateData.showRest = showRest;
    if (showPeriod !== undefined) updateData.showPeriod = showPeriod;
    if (hideEverything !== undefined) updateData.hideEverything = hideEverything;
    if (periodStartDate !== undefined) updateData.periodStartDate = periodStartDate;
    if (currentNeed !== undefined) updateData.currentNeed = currentNeed;
    if (waterReminderFrequency !== undefined) updateData.waterReminderFrequency = waterReminderFrequency;
    if (identity?.name !== undefined) updateData.name = identity.name;
    if (identity?.phone !== undefined) updateData.phone = identity.phone || null;

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: updateData,
    });

    // Create or update linked partner when partner name/phone is provided
    if (identity?.partnerName !== undefined || identity?.partnerPhone !== undefined) {
      const existingPartner = await prisma.user.findFirst({
        where: { partnerId: req.userId! },
      });
      const partnerName = identity.partnerName ?? existingPartner?.name ?? "Partner";
      const partnerPhone = (identity.partnerPhone || "").trim() || null;

      if (existingPartner) {
        await prisma.user.update({
          where: { id: existingPartner.id },
          data: {
            name: partnerName,
            phone: partnerPhone,
            notificationsEnabled: true,
            onboardingCompleted: true,
          },
        });
      } else if (partnerPhone || partnerName !== "Partner") {
        // Create new partner user and link
        await prisma.user.create({
          data: {
            name: partnerName,
            phone: partnerPhone,
            role: "PARTNER",
            partnerId: req.userId!,
            notificationsEnabled: true,
            onboardingCompleted: true,
          },
        });
      }
    }

    // Notify partner only when MAIN_USER changes current need (event-based)
    if (currentNeed !== undefined) {
      const needMessages: Record<string, string> = {
        REST: "She might need extra rest today 🤍",
        SUPPORT: "She might need extra support today 💗",
        SPACE: "She might need some space today 🌊",
      };

      if (needMessages[currentNeed]) {
        const targets = await getPartnerPhones(prisma, req.userId!);

        for (const phone of targets) {
          const result = await sendWhatsAppNotification(phone, needMessages[currentNeed]);
          if (!result.success) {
            console.error("Failed to notify need-change recipient:", result.error, `(${phone})`);
          }
        }
      }
    }

    res.json({ settings: user });
  } catch (error: any) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Register for WhatsApp notifications: save phones, enable notifications, link partner
router.post("/notifications", async (req: AuthRequest, res) => {
  try {
    const { userPhone, partnerPhone } = req.body;

    const mainUserId = req.userId!;

    // Update current (main) user: save phone and enable notifications
    const userPhoneTrimmed = typeof userPhone === "string" ? userPhone.trim() || null : null;
    await prisma.user.update({
      where: { id: mainUserId },
      data: {
        phone: userPhoneTrimmed,
        notificationsEnabled: true,
      },
    });

    // Partner phone (optional): update or create linked partner
    const partnerPhoneTrimmed = typeof partnerPhone === "string" ? partnerPhone.trim() || null : null;
    const existingPartner = await prisma.user.findFirst({
      where: { partnerId: mainUserId },
    });

    if (existingPartner) {
      await prisma.user.update({
        where: { id: existingPartner.id },
        data: {
          phone: partnerPhoneTrimmed,
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      });
    } else if (partnerPhoneTrimmed) {
      await prisma.user.create({
        data: {
          name: "Partner",
          phone: partnerPhoneTrimmed,
          role: "PARTNER",
          partnerId: mainUserId,
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Activate notifications error:", error);
    res.status(500).json({ error: error?.message || "Failed to activate notifications" });
  }
});

export { router as settingsRoutes };
