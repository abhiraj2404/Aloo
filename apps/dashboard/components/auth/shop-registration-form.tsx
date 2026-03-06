"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Logo } from "@/components/shared";
import { ShopService } from "@repo/api-sdk";

export function ShopRegistrationForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");//todo:apply bloom filter to check available shop name
  const [shopAddress, setShopAddress] = useState("");
  const [tableCount, setTableCount] = useState(1);

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
      
    try{
          const shop = await ShopService.createShop({name:shopName,address:shopAddress,totalTable:tableCount});
          console.log('[ShopRegistrationForm]',shop);
          router.push(`/dashboard/${shop.id}`)
    }
    catch(error){
        console.log('[ShopRegistrationForm]',error);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Logo className="text-red-500" />
        </div>
        <CardTitle className="text-xl font-bold">Setup Your Shop</CardTitle>
        <CardDescription>Configure your restaurant details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              placeholder="Enter shop name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopAddress">Address</Label>
            <Input
              id="shopAddress"
              placeholder="Enter shop address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tableCount">Number of Tables</Label>
            <Input
              id="tableCount"
              type="number"
              min={1}
              placeholder="Enter number of tables"
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
