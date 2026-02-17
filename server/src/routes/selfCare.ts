import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireMainUser);

// Get self-care items for a date
router.get("/:date", async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    const items = await prisma.selfCareItem.findMany({
      where: {
        userId: req.userId!,
        date,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ items });
  } catch (error: any) {
    console.error("Get self-care items error:", error);
    res.status(500).json({ error: "Failed to get self-care items" });
  }
});

// Create or update self-care items
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    // Delete existing items for the dates
    const dates = [...new Set(items.map((i: any) => i.date))];
    await prisma.selfCareItem.deleteMany({
      where: {
        userId: req.userId!,
        date: { in: dates },
      },
    });

    // Create new items
    const created = await prisma.selfCareItem.createMany({
      data: items.map((item: any) => ({
        userId: req.userId!,
        label: item.label,
        category: item.category,
        checked: item.checked || false,
        date: item.date,
      })),
    });

    res.json({ items: created });
  } catch (error: any) {
    console.error("Create self-care items error:", error);
    res.status(500).json({ error: "Failed to create self-care items" });
  }
});

// Update single self-care item
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;

    const existing = await prisma.selfCareItem.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const item = await prisma.selfCareItem.update({
      where: { id },
      data: { checked },
    });

    // Notify partner when she completes a self-care task
    if (checked === true) {
      const partner = await prisma.user.findFirst({
        where: { partnerId: req.userId! },
      });
      if (partner?.phone) {
        const result = await sendWhatsAppNotification(
          partner.phone,
          `She took care of herself: ${existing.label} 💚`
        );
        if (!result.success) {
          console.error("Failed to notify partner of self-care completion:", result.error);
        }
      }
    }

    res.json({ item });
  } catch (error: any) {
    console.error("Update self-care item error:", error);
    res.status(500).json({ error: "Failed to update self-care item" });
  }
});

export { router as selfCareRoutes };
