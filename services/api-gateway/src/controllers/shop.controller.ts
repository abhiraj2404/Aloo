import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { ApiError } from "../utils/ApiError";
import { ShopRole } from "@repo/database";
import type { SafeUser } from "@repo/types";

declare global {
    namespace Express {
        interface Request {
            user?: SafeUser
        }
    }
}

//shop + table 
export const createShop = async (req: Request, res: Response) => {
  const { name, address,totalTable } = req.body;

  const errors: any = {};
  if (!name) errors.name = "Name is required!";
  if (!address) errors.address = "Address is required!";
  if (!totalTable) errors.totalTable = "Number of tables  is required!";

  const userId=req?.user?.id;
  if (!userId) {
    throw new ApiError(400, "userId is required!");
  }


  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Invalid input!", errors);
  }

  //todo : have to check name of shop as it is unique 
  //todo : on frontend have to implement bloom filter to efficently check availbe shop name
  


  const shop  = await prisma.$transaction(async (tx)=>{

          
          // make an entry in shop table to register shop
          const shop = await tx.shop.create({
            // TODO : add error handler or Try-Catch over here, incorrect db constraint invocation can throw error
            data: {
              name: name,
              address: address,
            },
          });
          if(!shop.id) throw new ApiError(500,"Cannot able to create shop");

          const isTable = await tx.table.findFirst({ where: {shopId:shop.id} });
          if(isTable) throw new ApiError(400,"Tables already exists!");

          const tables = Array.from({length:totalTable}).map((_,i)=>({
             shopId:shop.id,
             tableNumber:i+1
          }))

          //entry in table
          await tx.table.createMany({data:tables});


          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            throw new ApiError(400, "User does not exist!");
          }

          // make an entry in ShopUser table to register owner
          const owner = await tx.shopUser.create({
            data: {
              userId: userId,
              shopId: shop.id,
              role: ShopRole.OWNER,
            },
          });

          // create an initial entry in the menu table
          const menu = await tx.menu.create({
            data: {
              shopId: shop.id,
            },
          });
          //todo: should we return menu or owner?
          return shop;

  }) 

  res
    .status(201)
    .json({
      message: "Shop created successfully with table. Owner registered successfully",
      data: { shop },
    });
};

export const getShopById = async (req: Request<{id: string}>, res: Response) => {
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
  const shopId = req.user?.shopMembership?.shopId;
  if(!shopId) throw new ApiError(400, "ShopId is required");

  res.status(200).json({ message: "Shop updated successfully" });
};

export const deleteShop = async (req: Request, res: Response) => {
  const shopId = req.user?.shopMembership?.shopId;
  if(!shopId) throw new ApiError(400, "ShopId is required");
  
  res.status(200).json({ message: "Shop deleted successfully" });
};
