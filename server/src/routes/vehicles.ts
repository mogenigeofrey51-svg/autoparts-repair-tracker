import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, getAuth, requireCustomer, type AuthContext } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeRepair, serializeVehicle } from "../utils/serializers.js";

export const vehicleRoutes = Router();

const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  registrationNumber: z.string().min(1),
  vin: z.string().min(1),
  engineNumber: z.string().min(1),
  mileage: z.coerce.number().int().nonnegative(),
  fuelType: z.string().min(1),
  transmissionType: z.string().min(1),
  notes: z.string().optional().nullable()
});

const repairSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dateOfRepair: z.coerce.date(),
  mileageAtRepair: z.coerce.number().int().nonnegative(),
  partsUsed: z.array(z.string()).default([]),
  mechanicName: z.string().min(1),
  cost: z.coerce.number().nonnegative(),
  receiptUrl: z.string().optional().nullable(),
  nextServiceDate: z.coerce.date().optional().nullable()
});

const vehicleInclude = {
  repairs: { orderBy: { dateOfRepair: "desc" } }
} satisfies Prisma.VehicleInclude;

function vehicleWhere(id: string, auth: AuthContext): Prisma.VehicleWhereInput {
  return { id, userId: auth.userId };
}

async function ensureVehicle(id: string, auth: AuthContext) {
  const vehicle = await prisma.vehicle.findFirst({
    where: vehicleWhere(id, auth),
    include: vehicleInclude
  });
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }
  return vehicle;
}

vehicleRoutes.use(authenticate, requireCustomer);

vehicleRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: auth.userId },
      include: vehicleInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json(vehicles.map(serializeVehicle));
  })
);

vehicleRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const payload = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({
      data: {
        ...payload,
        userId: auth.userId
      },
      include: vehicleInclude
    });
    res.status(201).json(serializeVehicle(vehicle));
  })
);

vehicleRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const vehicle = await ensureVehicle(req.params.id, getAuth(req));
    res.json(serializeVehicle(vehicle));
  })
);

vehicleRoutes.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    await ensureVehicle(req.params.id, auth);
    const payload = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: payload,
      include: vehicleInclude
    });
    res.json(serializeVehicle(vehicle));
  })
);

vehicleRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    await ensureVehicle(req.params.id, auth);
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

vehicleRoutes.get(
  "/:vehicleId/repairs",
  asyncHandler(async (req, res) => {
    const vehicle = await ensureVehicle(req.params.vehicleId, getAuth(req));
    res.json(vehicle.repairs.map(serializeRepair));
  })
);

vehicleRoutes.post(
  "/:vehicleId/repairs",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    await ensureVehicle(req.params.vehicleId, auth);
    const payload = repairSchema.parse(req.body);
    const repair = await prisma.repairRecord.create({
      data: {
        ...payload,
        vehicleId: req.params.vehicleId
      }
    });
    res.status(201).json(serializeRepair(repair));
  })
);

vehicleRoutes.patch(
  "/repairs/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const repair = await prisma.repairRecord.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true }
    });
    if (!repair || repair.vehicle.userId !== auth.userId) {
      throw new ApiError(404, "Repair record not found");
    }

    const payload = repairSchema.partial().parse(req.body);
    const updated = await prisma.repairRecord.update({
      where: { id: req.params.id },
      data: payload
    });
    res.json(serializeRepair(updated));
  })
);

vehicleRoutes.delete(
  "/repairs/:id",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const repair = await prisma.repairRecord.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true }
    });
    if (!repair || repair.vehicle.userId !== auth.userId) {
      throw new ApiError(404, "Repair record not found");
    }

    await prisma.repairRecord.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
