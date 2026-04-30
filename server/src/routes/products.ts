import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeProduct } from "../utils/serializers.js";

export const productRoutes = Router();

function textVariants(value: string) {
  const trimmed = value.trim();
  const title = trimmed
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return [...new Set([trimmed, title, trimmed.toUpperCase(), trimmed.toLowerCase()])];
}

productRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const { make, model, year, category, keyword } = req.query;
    const filters: Prisma.ProductWhereInput[] = [];

    if (make) {
      filters.push({ OR: textVariants(String(make)).map((value) => ({ compatibleMakes: { has: value } })) });
    }
    if (model) {
      filters.push({ OR: textVariants(String(model)).map((value) => ({ compatibleModels: { has: value } })) });
    }
    if (year) {
      const yearNumber = Number(year);
      if (Number.isInteger(yearNumber)) {
        filters.push({ compatibleYears: { has: yearNumber } });
      }
    }
    if (category) {
      const categoryText = String(category);
      filters.push({
        category: {
          OR: [
            { id: categoryText },
            { slug: categoryText },
            { name: { contains: categoryText, mode: "insensitive" } }
          ]
        }
      });
    }
    if (keyword) {
      const search = String(keyword);
      filters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    const products = await prisma.product.findMany({
      where: filters.length ? { AND: filters } : undefined,
      include: { category: true },
      orderBy: { name: "asc" }
    });

    res.json(products.map(serializeProduct));
  })
);

productRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    res.json(serializeProduct(product));
  })
);
