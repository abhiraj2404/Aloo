"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { ShopRegistrationForm } from "./shop-registration-form";
import { Logo } from "@/components/shared";
import { AuthService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const [step, setStep] = useState<"signup" | "shop">("signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error,setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if(formData.password!==formData.confirmPassword){
      toastError('Password do not match!');
      return ;
    }
    setIsLoading(true);
    try{
        const data= await AuthService.signup(formData);
        // console.log('[SignupForm]',data);
        success("Account created successfully!");
        setStep("shop");
    }
    catch(err:any){
        // console.log('[signupForm]',err.response?.data);
        const msg = err?.response?.data?.error || err?.response?.data?.message || "Internal server error!";
        toastError(msg);
    }
    finally {
      setIsLoading(false);
    }
      
  };

  if (step === "shop") {
    return <ShopRegistrationForm  />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Logo className="text-red-500" />
        </div>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
            />
            {error?<div className="text-xs text-red-400">{error}</div>:""}
          </div>
          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-red-500 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
