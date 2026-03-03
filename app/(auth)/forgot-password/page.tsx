"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      return await api.post("/api/auth/forgot-password", payload);
    },
    onSuccess: (data: any) => {
      toast.success("Recovery email sent");
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to send recovery email");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email });
  };

  const isLoading = forgotPasswordMutation.isPending;

  if (submitted) {
    return (
      <Card className="border-0 shadow-none bg-transparent w-full">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center mt-2">
            We have sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button 
            className="w-full font-bold" 
            variant="outline"
            onClick={() => setSubmitted(false)}
          >
            Didn&apos;t receive the email? Try again
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
        <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email"
              placeholder="m@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full font-bold" type="submit" disabled={isLoading}>
            {isLoading ? "Sending link..." : "Send reset link"}
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
