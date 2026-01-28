import type { Request, Response } from "express";

export const createItem=async(req: Request, res: Response)=>{
    
    res.status(201).json({ message: 'Item created successfully' });
}   

export const getItemById=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Item details fetched successfully' });
}   

export const updateItem=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Item updated successfully' });
}

export const deleteItem=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Item deleted successfully' });
}