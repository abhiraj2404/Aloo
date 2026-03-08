"use client";
import { AddItemForm } from "@/components/menu/add-item-form"
import { MenuService } from "@repo/api-sdk"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@repo/ui/components/dialog"
export default function Page(){
    const [categories,setCategories] = useState([]);
    
    useEffect(()=>{

       const getCategory=async()=>{ 
        try{
             const res = await  MenuService.getCategories();
             if(!res || res.success===false){
                //set toaster 
                console.log('uanble to get category');
                return ;
             }
             console.log('cat',res);
             setCategories(res.data);
        }catch(e:any){
           console.log(e.response);
        }
       }
       getCategory();
    },[])

      return (
            <div className="min-h-screen flex justify-center items-center">
               <Dialog defaultOpen>
                  <DialogTrigger className="hidden" />
                  <DialogContent className="border-0 bg-transparent p-0 shadow-none">
                     <AddItemForm categories={categories}/>
                  </DialogContent>
               </Dialog>
            </div>
      )
}