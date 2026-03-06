import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import type { ShopRole } from "@repo/types";

export const authorizedRoles = (...roles: ShopRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.shopMembership?.role;
        if(!userRole) throw new ApiError(403, "Forbidden");

        if(!roles.includes(userRole)) throw new ApiError(403, "Forbidden");

        next();
    }  
}