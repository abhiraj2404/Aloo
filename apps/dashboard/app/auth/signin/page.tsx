"use client"

import { SigninForm } from "@/components/auth";
import { useRouter } from "next/navigation";
import { AuthService } from "@repo/api-sdk";
import { useEffect } from "react";

export default function SigninPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await AuthService.me();

        if (user) {
          router.replace(`/dashboard/${user.shopId}`);
        }
      } catch {}
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SigninForm />
    </div>
  );
}