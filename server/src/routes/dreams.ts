import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { notifyPartner } from "../services/notifyPartner";
import { partnerMsg } from "../utils/messages";

const router = Router();
const prisma = new PrismaClient();

// Get all dreams (filtered by role)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let dreams;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({ where: { id: user.partnerId! } });
      if (!mainUser) return res.json({ dreams: [] });
      dreams = await prisma.dream.findMany({
        where: { userId: mainUser.id, shared: true },
        include: { targets: { where: { shared: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      dreams = await prisma.dream.findMany({
        where: { userId: req.userId! },
        include: { targets: true },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ dreams });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get dreams" });
  }
});

// Get single dream
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    const dream = await prisma.dream.findUnique({ where: { id }, include: { targets: true } });

    if (!dream) return res.status(404).json({ error: "Dream not found" });
    if (user?.role === "PARTNER" && (!dream.shared || dream.userId !== user.partnerId))
      return res.status(403).json({ error: "Access denied" });
    if (user?.role === "MAIN_USER" && dream.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    res.json({ dream });
  } catch {
    res.status(500).json({ error: "Failed to get dream" });
  }
});

// Create dream
router.post("/", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { title, content, mood, shared = true, targets = [] } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });

    const dream = await prisma.dream.create({
      data: {
        userId: req.userId!,
        title: title || "Untitled Dream",
        content,
        mood: mood || "BLOSSOM",
        shared: shared === true,
        targets: {
          create: targets.map((t: any) => ({
            text: t.text,
            state: t.state || "STARTING",
            shared: t.shared !== false,
          })),
        },
      },
      include: { targets: true },
    });

    if (shared) {
      notifyPartner(prisma, req.userId!, partnerMsg("dream", user?.name || ""));
    }

    res.status(201).json({ dream });
  } catch {
    res.status(500).json({ error: "Failed to create dream" });
  }
});

// Update dream
router.patch("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood, shared, targets } = req.body;

    const existing = await prisma.dream.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: "Access denied" });

    const dream = await prisma.dream.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(mood !== undefined && { mood }),
        ...(shared !== undefined && { shared }),
      },
      include: { targets: true },
    });

    // Replace targets if provided
    if (targets !== undefined) {
      await prisma.target.deleteMany({ where: { dreamId: id } });
      if (targets.length > 0) {
        await prisma.target.createMany({
          data: targets.map((t: any) => ({
            dreamId: id,
            text: t.text,
            state: t.state || "STARTING",
            shared: t.shared !== false,
          })),
        });
      }
      const updated = await prisma.dream.findUnique({ where: { id }, include: { targets: true } });
      return res.json({ dream: updated });
    }

    res.json({ dream });
  } catch {
    res.status(500).json({ error: "Failed to update dream" });
  }
});

// Delete dream
router.delete("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    // Declare id FIRST — was a TDZ bug before (id used before const declaration)
    const { id } = req.params;

    if (!id || id === "undefined" || id === "null")
      return res.status(400).json({ error: "Dream id is required" });

    const ownedDream = await prisma.dream.findFirst({
      where: { id, userId: req.userId! },
      select: { id: true },
    });

    if (!ownedDream)
      return res.status(404).json({ error: "Dream not found" });

    await prisma.dream.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete dream" });
  }
});

export { router as dreamRoutes };
