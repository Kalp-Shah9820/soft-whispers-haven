import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest, requireMainUser } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get user profile
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Update user profile
router.patch("/profile", requireMainUser, async (req: AuthRequest, res) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export { router as userRoutes };
