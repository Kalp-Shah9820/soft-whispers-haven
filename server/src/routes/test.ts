// Test endpoint for WhatsApp notifications
import { Router } from "express";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification, getWhatsAppStatus } from "../services/whatsapp";
import { PrismaClient } from "@prisma/client";
import { getUserAndPartnerPhones } from "../utils/notifications";

const router = Router();
const prisma = new PrismaClient();

// Public: check if WhatsApp is configured (no auth)
router.get("/whatsapp-status", (req, res) => {
  const status = getWhatsAppStatus();
  res.json(status);
});

router.use(authenticateToken);
router.use(requireMainUser);

// Test WhatsApp notification
router.post("/whatsapp", async (req: AuthRequest, res) => {
  try {
    const { phone, message } = req.body;

    const testMessage = message || "🧪 Test notification from Emotional Companion app!";

    // Collect all target phones:
    // - Explicit phone from request body (for manual testing)
    // - Current main user's phone (if set)
    // - Linked partner's phone (if set)
    const dbPhones = await getUserAndPartnerPhones(prisma, req.userId!);
    const targets = new Set<string>();

    if (phone) {
      targets.add(phone);
    }
    for (const p of dbPhones) {
      targets.add(p);
    }

    if (targets.size === 0) {
      return res.status(400).json({
        error: "No phone numbers available for test notification. Set your phone (and optionally partner phone) in settings or provide a phone in the request body.",
      });
    }

    const results = [];
    for (const target of targets) {
      const result = await sendWhatsAppNotification(target, testMessage);
      results.push({ to: target, ...result });
    }

    const anySuccess = results.some((r) => r.success);

    if (anySuccess) {
      res.json({
        success: true,
        message: "WhatsApp test notification sent",
        details: results,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send WhatsApp test notification to any recipient",
        details: results,
      });
    }
  } catch (error: any) {
    console.error("Test WhatsApp error:", error);
    res.status(500).json({ error: "Failed to send test notification", details: error.message });
  }
});

// Get user's phone number for testing
router.get("/phone", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { phone: true, name: true },
    });

    res.json({ 
      phone: user?.phone || null,
      name: user?.name || null,
      message: user?.phone
        ? "Phone number found. Use POST /api/test/whatsapp with your phone number to test."
        : "No phone number set. Update your phone in settings first."
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get phone number" });
  }
});

export { router as testRoutes };
