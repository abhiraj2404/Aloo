"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Logo } from "@/components/shared";
import { ShopService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

export function ShopRegistrationForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");//todo:apply bloom filter to check available shop name
  const [shopAddress, setShopAddress] = useState("");
  const [tableCount, setTableCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try{
          const shop = await ShopService.createShop({name:shopName,address:shopAddress,totalTable:tableCount});
          console.log('[ShopRegistrationForm]',shop);
          success("Shop created successfully!");
          router.push(`/dashboard/${shop.id}`)
    }
    catch(err){
        console.log('[ShopRegistrationForm]',err);
        toastError("Failed to create shop");
    }
    finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
