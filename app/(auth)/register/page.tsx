"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Stethoscope, Eye, EyeOff, Loader2, Check, ArrowRight, Sparkles, Shield, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { registerSchema, type RegisterInput } from "@/lib/validators";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const passwordRequirements = [
    { met: password.length >= 8, text: "8+ characters" },
    { met: /[A-Z]/.test(password), text: "Uppercase" },
    { met: /[a-z]/.test(password), text: "Lowercase" },
    { met: /\d/.test(password), text: "Number" },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (error) {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft-sm group-hover:shadow-glow-primary transition-shadow duration-300">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <span className="font-display font-semibold text-2xl tracking-tight">MediBook</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-3">
          Create your account
        </h1>
        <p className="text-muted-foreground text-lg">
          Start your 14-day free trial. No credit card required.
        </p>
        {plan && (
          <Badge className="mt-4 bg-primary/10 text-primary border-0">
            Selected plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            placeholder="Dr. John Smith"
            {...register("fullName")}
            className="input-premium h-12"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive animate-fade-in">{errors.fullName.message}</p>
          )}
        </div>

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
          <Label htmlFor="specialty" className="text-sm font-medium">
            Specialty <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="specialty"
            placeholder="e.g., General Practitioner, Pediatrics"
            {...register("specialty")}
            className="input-premium h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
          {/* Password requirements */}
          <div className="flex flex-wrap gap-2 mt-3">
            {passwordRequirements.map((req, index) => (
              <div
                key={index}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  req.met
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Check className={`h-3 w-3 ${req.met ? "" : "opacity-40"}`} />
                {req.text}
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-base font-medium btn-premium bg-primary text-primary-foreground mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      {/* Terms */}
      <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary font-medium hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary font-medium hover:underline">
          Privacy Policy
        </Link>
      </p>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-4 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login Link */}
      <Link href="/login" className="block">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-base font-medium border-2"
        >
          Sign in instead
        </Button>
      </Link>
    </div>
  );
}

function RegisterFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-gray-200 mb-10" />
      <div className="h-10 bg-gray-200 rounded mb-3 w-56" />
      <div className="h-6 bg-gray-200 rounded mb-8 w-72" />
      <div className="space-y-5">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded mt-6" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 dot-pattern text-white/5" />
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px]" />

        {/* Content */}
        <div className="relative flex flex-col justify-center p-12 xl:p-20 text-white">
          <div className="max-w-lg">
            <Badge className="bg-white/10 text-white border-0 backdrop-blur-sm mb-8">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              14-Day Free Trial
            </Badge>

            <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-tight mb-6">
              Start managing your practice today
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Create your account in less than a minute and discover why thousands
              of healthcare professionals choose MediBook.
            </p>

            {/* Benefits */}
            <div className="mt-12 space-y-6">
              {[
                {
                  icon: Clock,
                  title: "Set up in minutes",
                  description: "No complex configuration required",
                },
                {
                  icon: Shield,
                  title: "Secure & compliant",
                  description: "HIPAA-ready infrastructure",
                },
                {
                  icon: BarChart3,
                  title: "Powerful insights",
                  description: "Track your practice performance",
                },
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{benefit.title}</h3>
                    <p className="text-white/70">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-3xl font-display font-bold">2,000+</p>
                  <p className="text-sm text-white/60">Active Doctors</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">50K+</p>
                  <p className="text-sm text-white/60">Appointments/Month</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">99.9%</p>
                  <p className="text-sm text-white/60">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-auto">
        <Suspense fallback={<RegisterFormFallback />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
