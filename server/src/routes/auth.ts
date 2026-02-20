import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Private-app bootstrap: ensure a MAIN_USER exists and return a JWT.
// Used by the frontend to transparently "log in" without any UI.
router.post("/bootstrap", async (req, res) => {
  try {
    // Try to find an existing main user
    let user = await prisma.user.findFirst({
      where: { role: "MAIN_USER" },
    });

    if (!user) {
      // Create a gentle default main user.
      const name = req.body?.name?.trim() || "Love";
      user = await prisma.user.create({
        data: {
          name,
          phone: null,
          role: "MAIN_USER",
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "365d" }
    );

    res.json({ user, token });
  } catch (error: any) {
    console.error("Bootstrap auth error:", error);
    res.status(500).json({ error: "Failed to bootstrap authentication" });
  }
});

// Legacy-style register (no longer used in normal flow, kept for compatibility)
router.post("/register", async (req, res) => {
  try {
    const { name, phone, role, partnerId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Check if user already exists (by phone if provided)
    let user;
    if (phone) {
      user = await prisma.user.findFirst({
        where: { phone },
      });
    }

    if (user) {
      // Generate token for existing user
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
      );
      return res.json({ user, token });
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        name,
        phone: phone || null,
        role: role === "partner" ? "PARTNER" : "MAIN_USER",
        partnerId: partnerId || null,
        notificationsEnabled: true,
        onboardingCompleted: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.json({ user, token });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login (by phone or name)
router.post("/login", async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone && !name) {
      return res.status(400).json({ error: "Phone or name is required" });
    }

    const user = await prisma.user.findFirst({
      where: phone ? { phone } : { name },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.json({ user, token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        partner: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Link partner to main user
router.post("/link-partner", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { partnerPhone } = req.body;

    if (!partnerPhone) {
      return res.status(400).json({ error: "Partner phone is required" });
    }

    const mainUser = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!mainUser || mainUser.role !== "MAIN_USER") {
      return res.status(403).json({ error: "Only main users can link partners" });
    }

    // Find or create partner
    let partner = await prisma.user.findFirst({
      where: { phone: partnerPhone },
    });

    if (!partner) {
      partner = await prisma.user.create({
        data: {
          name: req.body.partnerName || "Partner",
          phone: partnerPhone,
          role: "PARTNER",
          partnerId: mainUser.id,
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      });
    } else {
      // Update existing partner
      partner = await prisma.user.update({
        where: { id: partner.id },
        data: {
          partnerId: mainUser.id,
          role: "PARTNER",
        },
      });
    }

    res.json({ partner });
  } catch (error: any) {
    console.error("Link partner error:", error);
    res.status(500).json({ error: "Failed to link partner" });
  }
});

export { router as authRoutes };
