import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Resolve which user's shared data to show.
// • PARTNER  → sees their linked main user's shared data
// • MAIN_USER → previews their own shared data
async function resolveTargetUserId(req: AuthRequest): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return null;
  if (user.role === "PARTNER") return user.partnerId ?? null;
  return req.userId!;
}

// GET /api/shared
// Returns partner-visible content grouped by type.
router.get("/", async (req: AuthRequest, res) => {
  try {
    const targetUserId = await resolveTargetUserId(req);
    if (!targetUserId) {
      return res.json({ dreams: [], thoughts: [], letters: [], moods: [], selfCare: [] });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [dreams, thoughts, letters, moods, selfCare] = await Promise.all([
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
      prisma.selfCareItem.findMany({
        where: { userId: targetUserId, checked: true, date: today },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    res.json({ dreams, thoughts, letters, moods, selfCare });
  } catch (err) {
    console.error("[shared] GET /:", err);
    res.status(500).json({ error: "Failed to get shared content" });
  }
});

// GET /api/shared/feed
// Returns a single unified chronological feed of all partner-visible events,
// newest first. Each item has: { type, data, timestamp }.
router.get("/feed", async (req: AuthRequest, res) => {
  try {
    const targetUserId = await resolveTargetUserId(req);
    if (!targetUserId) {
      return res.json({ feed: [] });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [dreams, thoughts, letters, moods, selfCare] = await Promise.all([
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
        take: 20,
      }),
      prisma.selfCareItem.findMany({
        where: { userId: targetUserId, checked: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    // Normalise everything into a flat feed with a timestamp
    const feed: { type: string; data: any; timestamp: string }[] = [
      ...dreams.map((d) => ({ type: "dream", data: d, timestamp: d.createdAt.toISOString() })),
      ...thoughts.map((t) => ({ type: "thought", data: t, timestamp: t.createdAt.toISOString() })),
      ...letters.map((l) => ({ type: "letter", data: l, timestamp: l.createdAt.toISOString() })),
      ...moods.map((m) => ({ type: "mood", data: m, timestamp: new Date(m.date).toISOString() })),
      ...selfCare.map((s) => ({ type: "selfCare", data: s, timestamp: s.updatedAt.toISOString() })),
    ];

    // Sort newest first
    feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json({ feed });
  } catch (err) {
    console.error("[shared] GET /feed:", err);
    res.status(500).json({ error: "Failed to get shared feed" });
  }
});

export { router as sharedRoutes };
