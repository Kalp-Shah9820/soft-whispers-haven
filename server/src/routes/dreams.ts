import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireMainUser } from "../middleware/auth";
import { sendWhatsAppNotification } from "../services/whatsapp";
import { getPartnerInfo } from "../utils/notifications";

const router = Router();
const prisma = new PrismaClient();
// Note: authenticateToken is applied globally in server/src/index.ts at api.use(authenticateToken)

// Get all dreams (filtered by role)
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let dreams;
    if (user.role === "PARTNER") {
      // Partner can only see shared dreams from their main user
      const mainUser = await prisma.user.findUnique({
        where: { id: user.partnerId! },
      });
      if (!mainUser) {
        return res.json({ dreams: [] });
      }
      dreams = await prisma.dream.findMany({
        where: {
          userId: mainUser.id,
          shared: true,
        },
        include: {
          targets: {
            where: { shared: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Main user sees all their dreams
      dreams = await prisma.dream.findMany({
        where: { userId: req.userId! },
        include: {
          targets: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ dreams });
  } catch (error: any) {
    console.error("Get dreams error:", error);
    res.status(500).json({ error: "Failed to get dreams" });
  }
});

// Get single dream
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    const dream = await prisma.dream.findUnique({
      where: { id },
      include: { targets: true },
    });

    if (!dream) {
      return res.status(404).json({ error: "Dream not found" });
    }

    // Privacy check
    if (user?.role === "PARTNER" && (!dream.shared || dream.userId !== user.partnerId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (user?.role === "MAIN_USER" && dream.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ dream });
  } catch (error: any) {
    console.error("Get dream error:", error);
    res.status(500).json({ error: "Failed to get dream" });
  }
});

// Create dream
router.post("/", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { title, content, mood, shared = true, targets = [] } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

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
      include: {
        targets: true,
      },
    });

    // Notify partner only (event-based relationship update)
    if (shared) {
      try {
        const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });
        const partnerInfo = await getPartnerInfo(prisma, req.userId!);
        if (partnerInfo) {
          console.log("Partner found");
          console.log(`[Partner Notification: Dream] User: ${req.userId!}, Partner Phone: ${partnerInfo.phone}, Partner Name: ${partnerInfo.name}`);
          console.log(`Sending partner notification: dream`);

          const result = await sendWhatsAppNotification(
            partnerInfo.phone,
            `🌙 ${user?.name || "Your partner"} shared a new dream with you.`
          );
          if (result.success) {
            console.log("Notification sent successfully");
          } else {
            console.error("Failed to notify dream recipient:", result.error, `(${partnerInfo.phone})`);
          }
        }
      } catch (error: any) {
        console.error("Error sending partner notification (dream):", error.message);
        // Don't crash if partner is missing
      }
    }

    res.status(201).json({ dream });
  } catch (error: any) {
    console.error("Create dream error:", error);
    res.status(500).json({ error: "Failed to create dream" });
  }
});

// Update dream
router.patch("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood, shared, targets } = req.body;

    // Verify ownership
    const existing = await prisma.dream.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const dream = await prisma.dream.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(mood !== undefined && { mood }),
        ...(shared !== undefined && { shared }),
      },
      include: {
        targets: true,
      },
    });

    // Update targets if provided
    if (targets) {
      // Delete existing targets
      await prisma.target.deleteMany({
        where: { dreamId: id },
      });

      // Create new targets
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

      // Reload dream with targets
      const updated = await prisma.dream.findUnique({
        where: { id },
        include: { targets: true },
      });
      return res.json({ dream: updated });
    }

    res.json({ dream });
  } catch (error: any) {
    console.error("Update dream error:", error);
    res.status(500).json({ error: "Failed to update dream" });
  }
});

// Delete dream
router.delete("/:id", requireMainUser, async (req: AuthRequest, res) => {
  try {
    // STEP 3: Log Express route params
    console.log("[DELETE /dreams/:id] ===== BACKEND DELETE FLOW TRACE =====");
    console.log("[DELETE /dreams/:id] 1. req.params:", req.params);
    console.log("[DELETE /dreams/:id] 2. req.params.id:", req.params.id);
    console.log("[DELETE /dreams/:id] 3. req.userId:", req.userId);
    console.log("[DELETE /dreams/:id] 4. req.userRole:", req.userRole);
    
    // Log received id for debugging
    console.log(`[DELETE /dreams/:id] Received delete request for dream id: "${id}"`);
    
    const { id } = req.params;
    
    if (!id || id === "undefined" || id === "null") {
      console.error(`[DELETE /dreams/:id] 5. Invalid id parameter: ${id}`);
      return res.status(400).json({ error: "Dream id is required" });
    }
    
    if (!req.userId) {
      console.error(`[DELETE /dreams/${id}] 6. No userId in request - auth middleware failed`);
      return res.status(401).json({ error: "Authentication required" });
    }

    // STEP 4: Log Prisma query details
    console.log(`[DELETE /dreams/${id}] 7. Querying database with:`, {
      id: id,
      userId: req.userId,
      query: "findFirst({ where: { id, userId } })"
    });

    // Only delete if it belongs to the logged-in user.
    // If it's not theirs (or doesn't exist), return 404 (not 403) to avoid client retry/toast loops.
    const ownedDream = await prisma.dream.findFirst({
      where: { id, userId: req.userId },
      select: { id: true, userId: true },
    });

    console.log(`[DELETE /dreams/${id}] 8. Prisma query result:`, ownedDream);

    if (!ownedDream) {
      // Check if dream exists at all (for debugging)
      const anyDream = await prisma.dream.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      console.log(`[DELETE /dreams/${id}] 9. Dream exists in DB?`, !!anyDream);
      if (anyDream) {
        console.log(`[DELETE /dreams/${id}] 10. Dream belongs to userId: ${anyDream.userId}, requester userId: ${req.userId}`);
        console.log(`[DELETE /dreams/${id}] 11. Ownership mismatch! Dream.userId (${anyDream.userId}) !== req.userId (${req.userId})`);
      }
      console.log(`[DELETE /dreams/${id}] 12. Returning 404 - Dream not found or doesn't belong to user`);
      return res.status(404).json({ error: "Dream not found" });
    }

    await prisma.dream.delete({ where: { id } });
    console.log(`[DELETE /dreams/${id}] 13. Successfully deleted dream for user ${req.userId}`);
    return res.json({ success: true });
  } catch (error: any) {
    console.error(`[DELETE /dreams/${req.params.id}] 14. Error:`, error);
    res.status(500).json({ error: "Failed to delete dream" });
  }
});

export { router as dreamRoutes };
