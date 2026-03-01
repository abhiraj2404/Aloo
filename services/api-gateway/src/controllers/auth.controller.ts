import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import z from "zod";
import {CreateUserSchema, LoginUserSchema} from "@repo/types";

export const signup = async (req: Request, res: Response) => {
  const validation = z.safeParse(CreateUserSchema, req.body);
  console.log(validation);
  if(!validation.success) throw new ApiError(400, "Validation failed", [validation.error]);

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
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "User does not exist.");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid Credentials. Password incorrect.");
  // TODO :
  //        2. add json web token and set res.cookie 

  const secret = process.env.JWT_SECRET || "secret";
  console.log("sercret=", secret);
  const token = jwt.sign(user.id, secret);
  console.log("token=", token);

  // const decode = jwt.decode(token);
  // console.log("decode=", decode);

  // const verify = jwt.verify(token, secret);
  // console.log("verify=",verify)

  res.cookie("jwt", token);
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
