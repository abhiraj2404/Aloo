
"use client"
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardDescription } from "@repo/ui/components/card";
import { Logo } from "../shared";
import React, { useState } from "react";
import { MenuService } from "@repo/api-sdk";

export function AddCategoryForm() {

    const [name,setName] = useState("");
    const [error,setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        
        try{
             const res = await MenuService.addCategory(name);
             
             if(!res || res.success==false){
                let msg =res?.message || res?.error || "Internal server error !";
                setError(msg);
                return ;
             }

             //todo:toaster



        }
        catch(error:any){
            console.log(['addCategoryForm'],error.response);  
            const msg = error?.response?.data?.errors[0] || error?.response?.data?.message || "Internal server error!";
            setError(msg);
        }
    }
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <Logo className="text-red-500" />
                </div>
                <CardDescription>Add Category</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-600" >Category Title</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Add unique category"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    {error?<div className="text-xs text-red-400">{error}</div>:""}
            
                    <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
                       submit
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}