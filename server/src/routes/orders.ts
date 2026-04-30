import { Router } from "express";
import { z } from "zod";
import { authenticate, getAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeOrder } from "../utils/serializers.js";

export const orderRoutes = Router();

const checkoutSchema = z.object({
  shippingName: z.string().min(2).optional(),
  shippingPhone: z.string().optional(),
  shippingAddress: z.string().min(4).optional()
});

const orderInclude = {
  items: true
};

orderRoutes.use(authenticate);

orderRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const orders = await prisma.order.findMany({
      where: { userId: auth.userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map(serializeOrder));
  })
);

orderRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: auth.userId },
      include: orderInclude
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    res.json(serializeOrder(order));
  })
);

orderRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const payload = checkoutSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: auth.userId },
      include: { product: true }
    });
    if (!cartItems.length) {
      throw new ApiError(400, "Your cart is empty");
    }

    const total = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity }
          },
          data: {
            stockQuantity: { decrement: item.quantity }
          }
        });

        if (stockUpdate.count === 0) {
          throw new ApiError(400, `${item.product.name} is no longer available in that quantity`);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: auth.userId,
          total,
          shippingName: payload.shippingName ?? user.name,
          shippingPhone: payload.shippingPhone ?? user.phone,
          shippingAddress: payload.shippingAddress ?? user.address ?? "Address not provided",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              brand: item.product.brand,
              unitPrice: item.product.price,
              quantity: item.quantity
            }))
          }
        },
        include: orderInclude
      });

      await tx.cartItem.deleteMany({ where: { userId: auth.userId } });
      return createdOrder;
    });

    res.status(201).json(serializeOrder(order));
  })
);
