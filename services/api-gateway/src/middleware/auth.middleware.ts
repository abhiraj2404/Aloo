import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/database";

const secret = process.env.JWT_SECRET || "secret";

export const authMiddleware = async (req: Request, res: Response,next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) throw new ApiError(401, "Unauthorized - No token provided");

  const decode = jwt.verify(token, secret);
  const userId = decode as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "Unauthorized - invalid token");

  next();   
};
