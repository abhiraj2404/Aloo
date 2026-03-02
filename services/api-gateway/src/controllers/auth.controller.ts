import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import z from "zod";
import {CreateUserSchema, LoginUserSchema} from "@repo/types";

const secret = process.env.JWT_SECRET || "secret";


export const signup = async (req: Request, res: Response) => {
  const validation = z.safeParse(CreateUserSchema, req.body);
  if(!validation.success) throw new ApiError(400, "Invalid Input", [validation.error]);

  const {email , password, name} = validation.data;  
 
  const existingEmail = await prisma.user.findUnique({where: {email}}); // checking existing user 
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
  const validation = z.safeParse(LoginUserSchema, req.body);
  if(!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

  const { email, password } = validation.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "User does not exist.");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid Credentials. Password incorrect.");

  const token = jwt.sign(user.id, secret, {expiresIn: "7d"});

  // const decode = jwt.decode(token);
  // console.log("decode=", decode);

  // const verify = jwt.verify(token, secret);
  // console.log("verify=",verify)

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    sameSite: "strict" // prevents against CSRF attack 
  });
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
