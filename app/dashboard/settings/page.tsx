"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Building,
  Palette,
  Bell,
  CreditCard,
  Save,
  Loader2,
  Crown,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { doctorProfileSchema, type DoctorProfileInput } from "@/lib/validators";
import { formatDate, cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DoctorProfileInput>({
    resolver: zodResolver(doctorProfileSchema),
  });

  const brandColor = watch("brandColor");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/doctors/profile");
        const data = await response.json();

        if (data.success) {
          setProfileData(data.data);
          reset({
            fullName: data.data.fullName,
            specialty: data.data.specialty || "",
            bio: data.data.bio || "",
            phone: data.data.phone || "",
            clinicName: data.data.clinicName || "",
            address: data.data.address || "",
            brandColor: data.data.brandColor || "#0A6847",
            welcomeMessage: data.data.welcomeMessage || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: DoctorProfileInput) => {
    setSaving(true);
    try {
      const response = await fetch("/api/doctors/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Profile updated successfully");
        setProfileData(result.data);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Settings" description="Manage your profile and preferences" />
        <div className="p-4 lg:p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full max-w-md rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "professional":
        return "bg-primary/10 text-primary border-primary/20";
      case "enterprise":
        return "bg-accent/10 text-accent border-accent/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Settings"
        description="Manage your profile and preferences"
      />

      <div className="p-4 lg:p-8">
        <Tabs defaultValue="profile">
          <TabsList className="mb-8 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft-sm">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="clinic" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft-sm">
              <Building className="h-4 w-4" />
              Clinic
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft-sm">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft-sm">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="profile" className="mt-0">
              <Card className="card-premium">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">Personal Information</CardTitle>
                      <CardDescription>Update your details shown on your booking page</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Dr. John Smith"
                        {...register("fullName")}
                        className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
                        error={!!errors.fullName}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-sm font-medium">Specialty</Label>
                      <Input
                        id="specialty"
                        placeholder="e.g., General Practitioner"
                        {...register("specialty")}
                        className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell patients about yourself, your experience, and your approach to care..."
                      rows={4}
                      {...register("bio")}
                      className="rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30 resize-none"
                    />
                    {errors.bio && (
                      <p className="text-sm text-destructive">{errors.bio.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 8900"
                      {...register("phone")}
                      className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clinic" className="mt-0">
              <Card className="card-premium">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">Clinic Information</CardTitle>
                      <CardDescription>Details about your practice location</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName" className="text-sm font-medium">Clinic Name</Label>
                    <Input
                      id="clinicName"
                      placeholder="City Medical Center"
                      {...register("clinicName")}
                      className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Medical Street, City, State, ZIP"
                      rows={3}
                      {...register("address")}
                      className="rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="mt-0">
              <Card className="card-premium">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Palette className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">Booking Page Branding</CardTitle>
                      <CardDescription>Customize how your booking page looks</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="brandColor" className="text-sm font-medium">Brand Color</Label>
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <Input
                          id="brandColor"
                          type="color"
                          className="w-16 h-16 p-1 cursor-pointer rounded-xl border-2 border-border/50"
                          {...register("brandColor")}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={brandColor || "#0A6847"}
                          readOnly
                          className="h-11 rounded-xl bg-muted/50 border-transparent font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Used for buttons and accents on your booking page
                        </p>
                      </div>
                    </div>
                    {/* Color Preview */}
                    <div className="mt-4 p-4 rounded-xl border border-border/50 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-3">Preview</p>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          className="rounded-lg"
                          style={{ backgroundColor: brandColor || "#0A6847" }}
                        >
                          Book Appointment
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg"
                          style={{ borderColor: brandColor || "#0A6847", color: brandColor || "#0A6847" }}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage" className="text-sm font-medium">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Welcome! Book your appointment online and I'll see you soon..."
                      rows={3}
                      {...register("welcomeMessage")}
                      className="rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30 resize-none"
                    />
                    {errors.welcomeMessage && (
                      <p className="text-sm text-destructive">{errors.welcomeMessage.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="mt-0">
              <Card className="card-premium">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">Subscription Details</CardTitle>
                      <CardDescription>Manage your subscription plan</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        profileData?.subscriptionPlan === "free_trial" ? "bg-warning/10" : "bg-primary/10"
                      )}>
                        {profileData?.subscriptionPlan === "free_trial" ? (
                          <Sparkles className="h-6 w-6 text-warning" />
                        ) : (
                          <Crown className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <Badge className={cn("mt-1 rounded-full px-3 py-1", getPlanColor(profileData?.subscriptionPlan || "free_trial"))}>
                          {profileData?.subscriptionPlan?.replace("_", " ").toUpperCase() || "FREE TRIAL"}
                        </Badge>
                      </div>
                    </div>
                    {profileData?.subscriptionPlan === "free_trial" && (
                      <Button className="rounded-xl gap-2 bg-primary text-white">
                        <Crown className="h-4 w-4" />
                        Upgrade Now
                      </Button>
                    )}
                  </div>

                  {/* Plan Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {profileData?.subscriptionEnd && (
                      <div className="p-5 rounded-xl border border-border/50 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          {profileData?.subscriptionPlan === "free_trial" ? (
                            <AlertCircle className="h-4 w-4 text-warning" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {profileData?.subscriptionPlan === "free_trial" ? "Trial ends on" : "Renews on"}
                          </p>
                        </div>
                        <p className="font-display text-xl font-bold">
                          {formatDate(profileData.subscriptionEnd)}
                        </p>
                        {profileData?.daysRemaining && (
                          <p className={cn(
                            "text-sm mt-1 font-medium",
                            profileData.daysRemaining <= 7 ? "text-warning" : "text-primary"
                          )}>
                            {profileData.daysRemaining} days remaining
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-5 rounded-xl border border-border/50 bg-card">
                      <p className="text-xs text-muted-foreground mb-2">Patients this month</p>
                      <p className="font-display text-3xl font-bold text-primary">
                        {profileData?.patientCountThisMonth || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Unique patients</p>
                    </div>
                  </div>

                  {/* Features */}
                  {profileData?.subscriptionPlan === "free_trial" && (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-sm">Upgrade to unlock more features</p>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          Unlimited appointments per month
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          WhatsApp notifications
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          Custom intake forms
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          Team management
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
