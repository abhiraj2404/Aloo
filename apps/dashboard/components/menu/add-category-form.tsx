
"use client"
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardDescription } from "@repo/ui/components/card";
import { Logo } from "../shared";
import React, { useState } from "react";
import { MenuService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

type AddCategoryFormProps = {
  onSuccess?: () => void;
};

export function AddCategoryForm({ onSuccess }: AddCategoryFormProps) {

    const [name,setName] = useState("");
    const [error,setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { success, error: toastError } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        setIsLoading(true);
        try{
             const res = await MenuService.addCategory(name);
             
             if(!res || res.success==false){
                let msg =res?.message || res?.error || "Internal server error !";
                toastError(msg);
                return ;
             }

             setName("");
             setError("");
             success("Category added successfully!");
             onSuccess?.();



        }
        catch(err:any){
            console.log(['addCategoryForm'],err.response);  
            const msg = err?.response?.data?.errors[0] || err?.response?.data?.message || "Internal server error!";
            toastError(msg);
        }
        finally {
          setIsLoading(false);
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
                            disabled={isLoading}
                        />
                    </div>
                    {error?<div className="text-xs text-red-400">{error}</div>:""}
            
                    <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={isLoading}>
                       {isLoading ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Adding...
                         </>
                       ) : (
                         "Submit"
                       )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}