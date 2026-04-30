import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role, User } from "@prisma/client";
import { ApiError } from "../middleware/error.js";

export type AuthContext = {
  userId: string;
  role: Role;
};

export type AuthenticatedRequest = Request & {
  auth?: AuthContext;
};

const jwtSecret = () => process.env.JWT_SECRET ?? "dev-secret-change-before-production";

export function createToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ userId: user.id, role: user.role }, jwtSecret(), { expiresIn: "7d" });
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = jwt.verify(token, jwtSecret()) as AuthContext;
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (auth.role !== "ADMIN") {
    next(new ApiError(403, "Admin access required"));
    return;
  }
  next();
}

export function getAuth(req: Request): AuthContext {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  return auth;
}
