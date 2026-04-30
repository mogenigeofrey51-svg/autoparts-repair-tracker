import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { authenticate, createToken, getAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/serializers.js";

export const authRoutes = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1)
});

authRoutes.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const payload = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        phone: payload.phone,
        address: payload.address
      }
    });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  })
);

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const matches = await bcrypt.compare(payload.password, user.passwordHash);
    if (!matches) {
      throw new ApiError(401, "Invalid email or password");
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  })
);

authRoutes.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.json(publicUser(user));
  })
);
