import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import looger from "../utils/logger";
import { prisma } from "@repo/database";

export const getUserById = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(400, "userId is required!");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(400, "User does not exist!");

    res.status(200).json({ success: true, message: "User details fetched successfully.", data: {user} });
}

export const updateUser = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    res.status(200).json({ message: `User with ID: ${userId} updated` });
}

export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    res.status(200).json({ message: `User with ID: ${userId} deleted` });
}