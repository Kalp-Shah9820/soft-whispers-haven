import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requirePartner } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
router.use(requirePartner);

// Get all shared content
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user || !user.partnerId) {
      return res.status(404).json({ error: "Partner relationship not found" });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [dreams, thoughts, letters, moods] = await Promise.all([
      prisma.dream.findMany({
        where: {
          userId: user.partnerId,
          shared: true,
        },
        include: {
          targets: {
            where: { shared: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.thought.findMany({
        where: {
          userId: user.partnerId,
          shared: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.letter.findMany({
        where: {
          userId: user.partnerId,
          shared: true,
          OR: [
            { sealed: false },
            { unlockDate: { lte: today } },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.moodEntry.findMany({
        where: {
          userId: user.partnerId,
          shared: true,
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

    res.json({
      dreams,
      thoughts,
      letters,
      moods,
    });
  } catch (error: any) {
    console.error("Get shared content error:", error);
    res.status(500).json({ error: "Failed to get shared content" });
  }
});

export { router as sharedRoutes };
