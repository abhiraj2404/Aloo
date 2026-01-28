import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import looger from "../utils/logger.js";


export const createUser = async (req: Request, res: Response) => {
    
    res.status(201).json({ message: "User created" });
    looger.info('User created successfully', { userId: '123', email: ''});
}


export const getUserById = async (req: Request, res: Response) => {
    const userId = req?.params.id;
    if(userId=='1') throw new ApiError(400,"throwing a error test");
    // res.status(200).json({ message: `User data for ID: ${userId}` });
}

export const updateUser = async (req: Request, res: Response) => {
    const userId = req?.params.id;
    res.status(200).json({ message: `User with ID: ${userId} updated` });
}

export const deleteUser = async (req: Request, res: Response) => {
    const userId = req?.params.id;
    let b=1/0;
    res.status(200).json({ message: `User with ID: ${userId} deleted` });
}