import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();

// Get all thoughts (filtered by role)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let thoughts;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({ where: { id: user.partnerId! } });
      if (!mainUser) return res.json({ thoughts: [] });
      thoughts = await prisma.thought.findMany({
        where: { userId: mainUser.id, shared: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      thoughts = await prisma.thought.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ thoughts });
  } catch {
    res.status(500).json({ error: "Failed to get thoughts" });
  }
});

// Create thought
router.post("/", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { content, mood, shared = true } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });

    const thought = await prisma.thought.create({
      data: {
        userId: req.userId!,
        content,
        mood: mood || "THOUGHTFUL",
        shared: shared === true,
      },
    });

    if (shared) {
      notifyPartner(prisma, req.userId!, partnerMsg("thought", user?.name || ""));
    }

    res.status(201).json({ thought });
  } catch {
    res.status(500).json({ error: "Failed to create thought" });
  }
});

// Update thought
router.patch("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, mood, shared } = req.body;

    const existing = await prisma.thought.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    const thought = await prisma.thought.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(mood !== undefined && { mood }),
        ...(shared !== undefined && { shared }),
      },
    });

    res.json({ thought });
  } catch {
    res.status(500).json({ error: "Failed to update thought" });
  }
});

// Delete thought
router.delete("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.thought.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    await prisma.thought.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete thought" });
  }
});

export { router as thoughtRoutes };
