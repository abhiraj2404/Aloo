import { apiClient } from "../client";
import { type CreateUserInput,type LoginUserInput } from "@repo/types";

export const AuthService = {
    signup: async(user:CreateUserInput)=>{
        const  res= await apiClient.post('/auth/signup',user);
        
        // console.log('signup',res);
        return res?.data;
    },
    login: async (user:LoginUserInput)=>{
      const res= await apiClient.post('/auth/login',user);
       return res?.data;
    },
    logout: async ()=>{
        const res = await apiClient.get('/auth/logout');
        return res;
    },
    me: async()=>{
        const res = await apiClient.get('/auth/me');
        return res?.data?.data?.user;
    }
}