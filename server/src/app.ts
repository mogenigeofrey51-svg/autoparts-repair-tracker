import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { cartRoutes } from "./routes/cart.js";
import { categoryRoutes } from "./routes/categories.js";
import { orderRoutes } from "./routes/orders.js";
import { productRoutes } from "./routes/products.js";
import { userRoutes } from "./routes/users.js";
import { vehicleRoutes } from "./routes/vehicles.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

dotenv.config();

export const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    credentials: true
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Ride254" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

const clientDistCandidates = [path.resolve(process.cwd(), "../client/dist"), path.resolve(process.cwd(), "client/dist")];
const clientDistPath = clientDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
const clientIndexPath = clientDistPath ? path.join(clientDistPath, "index.html") : "";

if (process.env.NODE_ENV === "production" && clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(clientIndexPath);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
