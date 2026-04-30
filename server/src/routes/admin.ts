import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser, serializeOrder, serializeProduct, serializeRepair, serializeVehicle } from "../utils/serializers.js";

export const adminRoutes = Router();

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable()
});

const productSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  brand: z.string().min(1),
  compatibleMakes: z.array(z.string()).default([]),
  compatibleModels: z.array(z.string()).default([]),
  compatibleYears: z.array(z.coerce.number().int()).default([]),
  price: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative(),
  description: z.string().min(4),
  imageUrl: z.string().optional().nullable()
});

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

const paymentStatusSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus)
});

adminRoutes.use(authenticate, requireAdmin);

adminRoutes.get(
  "/users",
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

adminRoutes.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" }
    });
    res.json(products.map(serializeProduct));
  })
);

adminRoutes.post(
  "/products",
  asyncHandler(async (req, res) => {
    const payload = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: payload,
      include: { category: true }
    });
    res.status(201).json(serializeProduct(product));
  })
);

adminRoutes.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const payload = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: payload,
      include: { category: true }
    });
    res.json(serializeProduct(product));
  })
);

adminRoutes.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

adminRoutes.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const payload = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: payload });
    res.status(201).json(category);
  })
);

adminRoutes.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const payload = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: payload
    });
    res.json(category);
  })
);

adminRoutes.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

adminRoutes.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: { items: true, user: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map(serializeOrder));
  })
);

adminRoutes.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const payload = statusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: payload.status },
      include: { items: true, user: true }
    });
    res.json(serializeOrder(order));
  })
);

adminRoutes.patch(
  "/orders/:id/payment",
  asyncHandler(async (req, res) => {
    const payload = paymentStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: payload.paymentStatus,
        paidAt: payload.paymentStatus === "PAID" ? new Date() : null
      },
      include: { items: true, user: true }
    });
    res.json(serializeOrder(order));
  })
);

adminRoutes.post(
  "/orders/:id/release",
  asyncHandler(async (req, res) => {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (existing.paymentStatus !== "PAID") {
      res.status(400).json({ message: "Only paid orders can be released" });
      return;
    }
    if (existing.status === "CANCELLED") {
      res.status(400).json({ message: "Cancelled orders cannot be released" });
      return;
    }
    if (existing.status === "DELIVERED") {
      res.status(400).json({ message: "Completed orders cannot be released" });
      return;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: existing.status === "PENDING" ? "PROCESSING" : existing.status,
        releasedAt: existing.releasedAt ?? new Date()
      },
      include: { items: true, user: true }
    });
    res.json(serializeOrder(order));
  })
);

adminRoutes.get(
  "/vehicles",
  asyncHandler(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany({
      include: { repairs: { orderBy: { dateOfRepair: "desc" } }, user: true },
      orderBy: { updatedAt: "desc" }
    });
    res.json(vehicles.map((vehicle) => ({ ...serializeVehicle(vehicle), user: publicUser(vehicle.user) })));
  })
);

adminRoutes.get(
  "/repairs",
  asyncHandler(async (_req, res) => {
    const repairs = await prisma.repairRecord.findMany({
      include: {
        vehicle: {
          include: { user: true }
        }
      },
      orderBy: { dateOfRepair: "desc" }
    });
    res.json(
      repairs.map((repair) => ({
        ...serializeRepair(repair),
        vehicle: {
          ...repair.vehicle,
          user: publicUser(repair.vehicle.user)
        }
      }))
    );
  })
);
