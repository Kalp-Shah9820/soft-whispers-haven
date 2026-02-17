import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "MAIN_USER" | "PARTNER";
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: "MAIN_USER" | "PARTNER";
    };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function requireMainUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== "MAIN_USER") {
    return res.status(403).json({ error: "Main user access required" });
  }
  next();
}

export function requirePartner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== "PARTNER") {
    return res.status(403).json({ error: "Partner access required" });
  }
  next();
}
