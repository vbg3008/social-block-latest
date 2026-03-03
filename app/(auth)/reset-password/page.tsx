"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/api/auth/reset-password", payload);
    },
    onSuccess: (data: any) => {
      toast.success(data.data.message || "Password successfully reset");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reset password");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.password,
    });
  };

  const isLoading = resetPasswordMutation.isPending;

  if (!token) {
    return (
      <Card className="border-0 shadow-none bg-transparent w-full">
        <CardHeader className="space-y-1 text-center pb-8">
          <CardTitle className="text-2xl text-center text-destructive">Invalid Link</CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or missing the required security token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center flex-col space-y-4">
          <Button className="w-full font-bold" onClick={() => router.push("/forgot-password")}>
            Request a new link
          </Button>
          <Link href="/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none bg-transparent w-full">
      <CardHeader className="space-y-1 text-center pb-8">
        <CardTitle className="text-2xl text-center">Set new password</CardTitle>
        <CardDescription className="text-center">
          Please type your new password below. Make sure it is at least 6 characters long.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password"
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full font-bold" type="submit" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center w-full"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
