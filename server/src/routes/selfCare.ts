import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();
router.use(requireMainUser);

// Get self-care items for a date
router.get("/:date", async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;
    const items = await prisma.selfCareItem.findMany({
      where: { userId: req.userId!, date },
      orderBy: { createdAt: "asc" },
    });
    res.json({ items });
  } catch {
    res.status(500).json({ error: "Failed to get self-care items" });
  }
});

// Create or replace self-care items for given dates
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "Items array is required" });

    const dates = [...new Set(items.map((i: any) => i.date))];
    await prisma.selfCareItem.deleteMany({ where: { userId: req.userId!, date: { in: dates } } });

    // createMany doesn't return rows — use a findMany after to return real IDs
    await prisma.selfCareItem.createMany({
      data: items.map((item: any) => ({
        userId: req.userId!,
        label: item.label,
        category: item.category,
        checked: item.checked || false,
        date: item.date,
      })),
    });

    const created = await prisma.selfCareItem.findMany({
      where: { userId: req.userId!, date: { in: dates } },
      orderBy: { createdAt: "asc" },
    });

    res.json({ items: created });
  } catch {
    res.status(500).json({ error: "Failed to create self-care items" });
  }
});

// Update single self-care item (toggle checked)
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;

    const existing = await prisma.selfCareItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    const item = await prisma.selfCareItem.update({ where: { id }, data: { checked } });

    // Only notify partner when an item is checked (not unchecked)
    if (checked === true) {
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });
      notifyPartner(prisma, req.userId!, partnerMsg("selfcare", user?.name || ""));
    }

    res.json({ item });
  } catch {
    res.status(500).json({ error: "Failed to update self-care item" });
  }
});

export { router as selfCareRoutes };
