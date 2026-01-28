import type { Request, Response } from "express";

export const createTable=async(req: Request, res: Response)=>{
    res.status(201).json({ message: 'Table created successfully' });
}

export const getTableById=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Table details fetched successfully' });
}


export const updateTable=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Table updated successfully' });
}

export const deleteTable=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Table deleted successfully' });
}