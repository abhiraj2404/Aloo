import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/database";

// Express Request type does not contain user field so req.user gives error  
//type declaration (declaration merging) so that we can add req.user field in middleware 
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string,
                email: string,
                name: string,
                shopMembership: object | null
            }
        }
    }
}

const secret = process.env.JWT_SECRET || "secret";

export const authMiddleware = async (req: Request, res: Response,next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) throw new ApiError(401, "Unauthorized - No token provided");

  const decode = jwt.verify(token, secret);
  const userId = decode as string;

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
