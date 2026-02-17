import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get all letters (filtered by role)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date().toISOString().slice(0, 10);

    let letters;
    if (user.role === "PARTNER") {
      const mainUser = await prisma.user.findUnique({
        where: { id: user.partnerId! },
      });
      if (!mainUser) {
        return res.json({ letters: [] });
      }
      letters = await prisma.letter.findMany({
        where: {
          userId: mainUser.id,
          shared: true,
          OR: [
            { sealed: false },
            { unlockDate: { lte: today } },
          ],
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
  } catch (error: any) {
    console.error("Get letters error:", error);
    res.status(500).json({ error: "Failed to get letters" });
  }
});

// Create letter
router.post("/", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { content, unlockDate, shared = true, sealed } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const letter = await prisma.letter.create({
      data: {
        userId: req.userId!,
        content,
        unlockDate: unlockDate || null,
        shared: shared === true,
        sealed: sealed === true || !!unlockDate,
      },
    });

    // Notify partner if shared
    if (shared) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { partnerUsers: true },
      });

      if (user?.partnerUsers.length) {
        const partner = user.partnerUsers[0];
        if (partner.phone) {
          const result = await sendWhatsAppNotification(
            partner.phone,
            `She shared a new letter with you 💌`
          );
          if (!result.success) {
            console.error("Failed to notify partner:", result.error);
          }
        }
      }
    }

    res.status(201).json({ letter });
  } catch (error: any) {
    console.error("Create letter error:", error);
    res.status(500).json({ error: "Failed to create letter" });
  }
});

// Update letter
router.patch("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, unlockDate, shared, sealed } = req.body;

    const existing = await prisma.letter.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

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
  } catch (error: any) {
    console.error("Update letter error:", error);
    res.status(500).json({ error: "Failed to update letter" });
  }
});

// Delete letter
router.delete("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.letter.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.letter.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete letter error:", error);
    res.status(500).json({ error: "Failed to delete letter" });
  }
});

export { router as letterRoutes };
