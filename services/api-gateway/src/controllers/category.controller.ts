import type { Request, Response } from "express";   

export const createCategory=async(req: Request, res: Response)=>{
    
    res.status(201).json({ message: 'Category created successfully' });
}

export const getCategoryById=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Category details fetched successfully' });
}

export const updateCategory=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Category updated successfully' });
}

export const deleteCategory=async(req: Request, res: Response)=>{
    
    res.status(200).json({ message: 'Category deleted successfully' });
}