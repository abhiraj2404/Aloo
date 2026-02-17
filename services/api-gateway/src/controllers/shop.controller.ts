import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { ApiError } from "../utils/ApiError.js";
import { ShopRole } from "@repo/database";

export const createShop = async (req: Request, res: Response) => {
  const { name, address, userId } = req.body;

  const errors: any = {};
  if (!name) errors.name = "Name is required!";
  if (!address) errors.address = "Address is required!";
  if (!userId) errors.userId = "userId is required!"; // TODO : remove userId from request body when auth is setup, userid will be inferred from the auth token

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Invalid input!", errors);
  }

  // TODO : use transaction for ATOMIC changes, all changes happen or none of then does
  // make an entry in shop table to register shop
  const shop = await prisma.Shop.create({
    // TODO : add error handler or Try-Catch over here, incorrect db constraint invocation can throw error
    data: {
      name: name,
      address: address,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(400, "User does not exist!");
  }

  // make an entry in ShopUser table to register owner
  const owner = await prisma.ShopUser.create({
    data: {
      userId: userId,
      shopId: shop.id,
      role: ShopRole.OWNER,
    },
  });

  // create an initial entry in the menu table
  const menu = await prisma.menu.create({
    data: {
      shopId: shop.id,
    },
  });

  res
    .status(201)
    .json({
      message: "Shop created successfully. Owner registered successfully",
      data: { shop, owner, menu },
    });
};

export const getShopById = async (req: Request, res: Response) => {
  const shopId = req.params.id;
  if (!shopId) throw new ApiError(400, "shopId is required!");

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      menu: {
        include: {
          categories: {
            include: { items: true },
          },
        },
      },
      tables: true,
    },
  });
  if (!shop) throw new ApiError(400, "Shop does not exist");

  res
    .status(200)
    .json({ message: "Shop details fetched successfully", data: { shop } });
};

export const updateShop = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Shop updated successfully" });
};

export const deleteShop = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Shop deleted successfully" });
};
