import type { Request, Response } from "express";
import { prisma } from "@repo/database";


export const createShop=async(req: Request, res: Response)=>{
    const {name, address, userId} = req.body;

    // make an entry in shop table to register shop
    const shop = await prisma.Shop.create({
        data: {
            name: name,
            address: address
        }
    })

    console.log(shop);

    // make an entry in ShopUser table to register owner 
    // const owner = await prisma.ShopUser.create({
    //         data: {
    //             userId: userId,
    //             shopId: shop.id,
    //             role: 'OWNER'    // TODO : import enum ShopUser type and add enum
    //         }
    // })

    res.status(201).json({ message: 'Shop created successfully', data: shop });
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