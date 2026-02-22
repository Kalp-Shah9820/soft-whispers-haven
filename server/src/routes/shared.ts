import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
// No requirePartner — both MAIN_USER and PARTNER can view shared content:
// • PARTNER  → sees their linked main user's shared data
// • MAIN_USER → sees their own shared data (preview of what partner sees)

router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Determine whose data to show
    const targetUserId =
      user.role === "PARTNER"
        ? user.partnerId   // partner sees main user's data
        : req.userId!;     // main user previews their own shared data

    if (!targetUserId) {
      return res.json({ dreams: [], thoughts: [], letters: [], moods: [] });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [dreams, thoughts, letters, moods] = await Promise.all([
      prisma.dream.findMany({
        where: { userId: targetUserId, shared: true },
        include: { targets: { where: { shared: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.thought.findMany({
        where: { userId: targetUserId, shared: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.letter.findMany({
        where: {
          userId: targetUserId,
          shared: true,
          OR: [{ sealed: false }, { unlockDate: { lte: today } }],
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.moodEntry.findMany({
        where: { userId: targetUserId, shared: true },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

    res.json({ dreams, thoughts, letters, moods });
  } catch {
    res.status(500).json({ error: "Failed to get shared content" });
  }
});

export { router as sharedRoutes };
