import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import looger from "../utils/logger.js";
import {prisma} from "@repo/database";

export const createUser = async (req: Request, res: Response) => {

    const {email,password ,name} = req.body;
    
    const errors:any = {};
    if (!name) errors.name = "Name is required!"
    if (!email) errors.email = "Email is required!"
    if (!password) errors.password = "Password is required!"

    if (Object.keys(errors).length > 0) {
        throw new ApiError(400, "Invalid input!", errors)
    }
    // console.log("Creating user:", { name, email });
    const isUser = await prisma.user.findFirst({where:{email}});

    if(isUser){
        throw new ApiError(400,"User already exists!");
    }

    const user =  await prisma.user.create({
        data: {
            name,
            email,
            password
        }
    })

    
    res.status(201).json({ sucess:true , message: "User created", data:{ user } });
    looger.info('User created successfully', { userId:user.id, email:user.email});
}


export const getUserById = async (req: Request, res: Response) => {
    const userId = req?.params.id;
    if(!userId) throw new ApiError(400,"userId is required!");

    const user = await prisma.user.findUnique({where:{id:userId}});

    if(!user) throw new ApiError(400,"User does not exist!");


    res.status(200).json({success:true, data:user});
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