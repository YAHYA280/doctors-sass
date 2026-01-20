"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Stethoscope, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Login successful!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-2.5 mb-12 group">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft-sm group-hover:shadow-glow-primary transition-shadow duration-300">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <span className="font-display font-semibold text-2xl tracking-tight">MediBook</span>
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-3">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-lg">
          Sign in to your account to continue managing your practice.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="doctor@example.com"
            {...register("email")}
            className="input-premium h-12"
          />
          {errors.email && (
            <p className="text-sm text-destructive animate-fade-in">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              className="input-premium h-12 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive animate-fade-in">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-base font-medium btn-premium bg-primary text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-4 text-muted-foreground">
            New to MediBook?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <Link href="/register" className="block">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-base font-medium border-2 group"
        >
          Create an account
          <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-gray-200 mb-12" />
      <div className="h-10 bg-gray-200 rounded mb-3 w-48" />
      <div className="h-6 bg-gray-200 rounded mb-10 w-72" />
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 dot-pattern text-white/5" />
        <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px]" />

        {/* Content */}
        <div className="relative flex flex-col justify-center p-12 xl:p-20 text-white">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm font-medium">2,000+ doctors trust us</span>
            </div>

            <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-tight mb-6">
              Manage your practice with confidence
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Join thousands of healthcare professionals who streamline their daily operations,
              improve patient care, and grow their practice with MediBook.
            </p>

            {/* Feature highlights */}
            <div className="mt-12 space-y-4">
              {[
                "Smart appointment scheduling",
                "Automated patient reminders",
                "Comprehensive analytics dashboard",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
