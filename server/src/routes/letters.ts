import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();

// Get all letters (filtered by role)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().slice(0, 10);

    let letters;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({ where: { id: user.partnerId! } });
      if (!mainUser) return res.json({ letters: [] });
      letters = await prisma.letter.findMany({
        where: {
          userId: mainUser.id,
          shared: true,
          OR: [{ sealed: false }, { unlockDate: { lte: today } }],
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      letters = await prisma.letter.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ letters });
  } catch {
    res.status(500).json({ error: "Failed to get letters" });
  }
});

// Create letter
router.post("/", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { content, unlockDate, shared = true, sealed } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });

    const letter = await prisma.letter.create({
      data: {
        userId: req.userId!,
        content,
        unlockDate: unlockDate || null,
        shared: shared === true,
        sealed: sealed === true || !!unlockDate,
      },
    });

    if (shared) {
      notifyPartner(prisma, req.userId!, partnerMsg("letter", user?.name || ""));
    }

    res.status(201).json({ letter });
  } catch {
    res.status(500).json({ error: "Failed to create letter" });
  }
});

// Update letter
router.patch("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, unlockDate, shared, sealed } = req.body;

    const existing = await prisma.letter.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    const letter = await prisma.letter.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(unlockDate !== undefined && { unlockDate }),
        ...(shared !== undefined && { shared }),
        ...(sealed !== undefined && { sealed }),
      },
    });

    res.json({ letter });
  } catch {
    res.status(500).json({ error: "Failed to update letter" });
  }
});

// Delete letter
router.delete("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.letter.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    await prisma.letter.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete letter" });
  }
});

export { router as letterRoutes };
