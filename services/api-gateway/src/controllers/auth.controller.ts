import { prisma } from "@repo/database";
import type { Request, Response } from "express";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from 'bcrypt';

export const signup = async (req: Request, res: Response) => {
  const { email, name, password } = req.body; // TODO : use zod for safeparse

  // checking existing user 
  const existingEmail = await prisma.user.findUnique({where: {email}});
  if(existingEmail) throw new ApiError(400, "User with this email already exists");


  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });


  if (!user.id) throw new ApiError(500, "User not created successfully.");
  logger.info("User created successfully.", { user });

  // TODO : implement jwt 

  return res.status(201).json({
    success: true,
    message: "Signup successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
};


export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "User does not exist.");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid Credentials. Password incorrect.");
  // TODO : 1. add bcrypt
  //        2. add json web token and set res.cookie 

  return res.status(200).json({
    success: true,
    message: "User logged in successfully.",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
};
