import type { NextFunction, Request, Response } from "express";
import type { SafeUser } from "@repo/types";
import { ApiError } from "../utils/ApiError";
import jwt ,{type JwtPayload} from "jsonwebtoken";
import { prisma } from "@repo/database";

// Express Request type does not contain user field so req.user gives error  
// Declaration merging to attach authenticated user to req
declare global {
    namespace Express {
        interface Request {
            user?: SafeUser
        }
    }
}

const secret = process.env.JWT_SECRET || "secret";

export const authMiddleware = async (req: Request, res: Response,next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) throw new ApiError(401, "Unauthorized - No token provided");

  const decode = jwt.verify(token, secret) as JwtPayload;
  const userId = decode.id;

  const user = await prisma.user.findUnique({ where: { id: userId }, include: {shopMembership: true} });
  if (!user) throw new ApiError(401, "Unauthorized - invalid token");

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    shopMembership: user.shopMembership
  }

  next();   
};
