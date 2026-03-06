import { apiClient } from "../client";
import { type CreateUserInput } from "@repo/types";

export const AuthService = {
    signup: async(user:CreateUserInput)=>{
        const  res= await apiClient.post('/auth/signup',user);
        
        console.log('signup',res);
        return res?.data;
    }
}