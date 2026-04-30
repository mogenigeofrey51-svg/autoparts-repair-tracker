import { Router } from "express";
import { z } from "zod";
import { authenticate, getAuth, requireAdmin } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/serializers.js";

export const userRoutes = Router();

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressLatitude: z.coerce.number().optional().nullable(),
  addressLongitude: z.coerce.number().optional().nullable()
});

userRoutes.use(authenticate);

userRoutes.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.json(publicUser(user));
  })
);

userRoutes.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const payload = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: payload
    });
    res.json(publicUser(user));
  })
);

userRoutes.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { vehicles: true, orders: true }
        }
      }
    });
    res.json(users.map(publicUser));
  })
);
