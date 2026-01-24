"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import {
  Link2,
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  Eye,
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Globe,
  Palette,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyPagePage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl}/dr/${session?.user?.doctorSlug}`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/doctors/profile");
        const data = await response.json();

        if (data.success) {
          setDoctorData(data.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book an appointment with Dr. ${doctorData?.fullName}`,
          text: "Book your appointment online",
          url: bookingUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="My Page" description="Your public booking page" />
        <div className="p-4 lg:p-8 space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const tips = [
    {
      icon: MessageSquare,
      title: "Email signature",
      description: "Add your booking link to your email signature for easy access",
    },
    {
      icon: Globe,
      title: "Social media",
      description: "Share your link on social media profiles to reach more patients",
    },
    {
      icon: QrCode,
      title: "Business cards",
      description: "Include a QR code on your business cards for instant booking",
    },
    {
      icon: Palette,
      title: "Personalize",
      description: "Add a welcome message to make your page more inviting",
    },
    {
      icon: Calendar,
      title: "Stay updated",
      description: "Keep your availability current for better conversion rates",
    },
  ];

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="My Booking Page"
        description="Share your personalized booking link with patients"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Booking Link Card */}
        <div className="card-premium overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary via-primary to-primary/90 p-6 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-white">Your Booking Link</h3>
                  <p className="text-white/70 text-sm">Share this link with patients to let them book directly</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={bookingUrl}
                    readOnly
                    className="font-mono text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-20 h-12"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white h-12 px-4"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareLink}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white h-12 px-4"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Share</span>
                  </Button>
                  <Button
                    asChild
                    className="bg-white text-primary hover:bg-white/90 h-12 px-4"
                  >
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Visit</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-primary">
                  {doctorData?.patientCountThisMonth || 0}
                </p>
                <p className="text-sm text-muted-foreground">Patients this month</p>
              </div>
            </div>
          </div>
          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <Badge
                  className={`text-sm px-3 py-1 font-medium ${
                    doctorData?.subscriptionPlan === "free_trial"
                      ? "bg-muted text-muted-foreground"
                      : "bg-gradient-to-r from-primary to-primary/80 text-white border-0"
                  }`}
                >
                  {doctorData?.subscriptionPlan?.replace("_", " ").toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Current Plan</p>
              </div>
            </div>
          </div>
          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-emerald-600">
                  {doctorData?.daysRemaining || 0}
                </p>
                <p className="text-sm text-muted-foreground">Days remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Preview */}
        <div className="card-premium overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Page Preview</CardTitle>
                <CardDescription>This is how your booking page looks to patients</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-border/50">
              {/* Browser-like header */}
              <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 border-b border-border/30">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono truncate">
                    {bookingUrl}
                  </div>
                </div>
              </div>
              {/* Preview content */}
              <div
                className="h-28 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: doctorData?.brandColor || "#0A6847" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                <div className="relative text-center text-white">
                  <h3 className="font-display font-bold text-xl">Dr. {doctorData?.fullName}</h3>
                  {doctorData?.specialty && (
                    <p className="text-sm opacity-80 mt-1">{doctorData.specialty}</p>
                  )}
                </div>
              </div>
              <div className="p-6 bg-muted/20">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Clinic</span>
                    <p className="font-medium mt-0.5">{doctorData?.clinicName || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Address</span>
                    <p className="font-medium mt-0.5">{doctorData?.address || "Not set"}</p>
                  </div>
                </div>
                {doctorData?.welcomeMessage && (
                  <div className="mt-4 p-4 rounded-xl bg-background/80 border border-border/50">
                    <p className="text-muted-foreground text-sm italic leading-relaxed">
                      &ldquo;{doctorData.welcomeMessage}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>

        {/* Tips for Getting More Bookings */}
        <div className="card-premium">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Tips for Getting More Bookings</CardTitle>
                <CardDescription>Maximize your booking page visibility</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="group p-4 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 hover:shadow-soft-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <tip.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
