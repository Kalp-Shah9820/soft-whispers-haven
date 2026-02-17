// Test endpoint for WhatsApp notifications
import { Router } from "express";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification, getWhatsAppStatus } from "../services/whatsapp";
import { PrismaClient } from "@prisma/client";

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

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const testMessage = message || "🧪 Test notification from Emotional Companion app!";

    const result = await sendWhatsAppNotification(phone, testMessage);

    if (result.success) {
      res.json({ 
        success: true, 
        message: "WhatsApp notification sent successfully",
        details: result.details
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        details: result.details
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
