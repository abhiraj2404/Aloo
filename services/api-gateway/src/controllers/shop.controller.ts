import type { Request, Response } from "express";


export const createShop=async(req: Request, res: Response)=>{
    
    res.status(201).json({ message: 'Shop created successfully' });
}

export const getShopById=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Shop details fetched successfully' });
}

export const updateShop=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Shop updated successfully' });
}

export const deleteShop=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Shop deleted successfully' });
}