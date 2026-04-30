import { Router } from "express";
import { z } from "zod";
import { authenticate, getAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeCartItem } from "../utils/serializers.js";

export const cartRoutes = Router();

const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1)
});

const quantitySchema = z.object({
  quantity: z.coerce.number().int().min(1)
});

const cartInclude = {
  product: {
    include: {
      category: true
    }
  }
};

cartRoutes.use(authenticate);

cartRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: auth.userId },
      include: cartInclude,
      orderBy: { createdAt: "desc" }
    });
    res.json(cartItems.map(serializeCartItem));
  })
);

cartRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const payload = cartSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId: payload.productId
        }
      }
    });
    const desiredQuantity = (existing?.quantity ?? 0) + payload.quantity;
    if (product.stockQuantity < desiredQuantity) {
      throw new ApiError(400, "Requested quantity is not available");
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId: payload.productId
        }
      },
      update: {
        quantity: desiredQuantity
      },
      create: {
        userId: auth.userId,
        productId: payload.productId,
        quantity: payload.quantity
      },
      include: cartInclude
    });

    res.status(201).json(serializeCartItem(cartItem));
  })
);

cartRoutes.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const payload = quantitySchema.parse(req.body);
    const existing = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: auth.userId },
      include: { product: true }
    });
    if (!existing) {
      throw new ApiError(404, "Cart item not found");
    }
    if (existing.product.stockQuantity < payload.quantity) {
      throw new ApiError(400, "Requested quantity is not available");
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity: payload.quantity },
      include: cartInclude
    });

    res.json(serializeCartItem(cartItem));
  })
);

cartRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const existing = await prisma.cartItem.findFirst({ where: { id: req.params.id, userId: auth.userId } });
    if (!existing) {
      throw new ApiError(404, "Cart item not found");
    }
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

cartRoutes.delete(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    await prisma.cartItem.deleteMany({ where: { userId: auth.userId } });
    res.status(204).send();
  })
);
