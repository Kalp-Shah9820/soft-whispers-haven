import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";

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
  } catch {
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

    // Notify partner when currentNeed changes (real-time event)
    if (currentNeed !== undefined) {
      notifyPartner(prisma, req.userId!, partnerMsg("need", user.name || ""));
    }

    res.json({ settings: user });
  } catch {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Register for WhatsApp notifications: save names + phones, enable notifications, link partner
router.post("/notifications", async (req: AuthRequest, res) => {
  try {
    const { userPhone, partnerPhone, userName, partnerName } = req.body;

    const mainUserId = req.userId!;

    // Save main user name + phone and enable notifications
    const userPhoneTrimmed = typeof userPhone === "string" ? userPhone.trim() || null : null;
    await prisma.user.update({
      where: { id: mainUserId },
      data: {
        ...(userPhoneTrimmed !== undefined && { phone: userPhoneTrimmed }),
        ...(typeof userName === "string" && userName.trim() && { name: userName.trim() }),
        notificationsEnabled: true,
      },
    });

    // Save partner: update or create with real name and phone
    const partnerPhoneTrimmed = typeof partnerPhone === "string" ? partnerPhone.trim() || null : null;
    const resolvedPartnerName = typeof partnerName === "string" && partnerName.trim() ? partnerName.trim() : "Partner";

    const existingPartner = await prisma.user.findFirst({ where: { partnerId: mainUserId } });

    if (existingPartner) {
      await prisma.user.update({
        where: { id: existingPartner.id },
        data: {
          name: resolvedPartnerName,
          ...(partnerPhoneTrimmed !== undefined && { phone: partnerPhoneTrimmed }),
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      });
    } else if (partnerPhoneTrimmed || resolvedPartnerName !== "Partner") {
      await prisma.user.create({
        data: {
          name: resolvedPartnerName,
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
    res.status(500).json({ error: error?.message || "Failed to activate notifications" });
  }
});

export { router as settingsRoutes };
