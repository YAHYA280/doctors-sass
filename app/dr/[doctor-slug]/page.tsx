"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Stethoscope,
  Check,
  Loader2,
  ChevronRight,
  Sparkles,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { bookingSchema, type BookingInput } from "@/lib/validators";
import { formatTime, getInitials, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DoctorProfile {
  slug: string;
  fullName: string;
  specialty?: string;
  bio?: string;
  profileImage?: string;
  clinicName?: string;
  address?: string;
  brandColor: string;
  welcomeMessage?: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface AvailabilitySlot {
  time: string;
  isAvailable: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const doctorSlug = params["doctor-slug"] as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editLink, setEditLink] = useState("");
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await fetch(`/api/booking/${doctorSlug}`);
        const data = await response.json();

        if (data.success) {
          setDoctor(data.data.doctor);
          if (data.data.form?.fields) {
            setFormFields(data.data.form.fields);
          }
        } else {
          toast.error(data.error || "Doctor not found");
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error("Failed to load booking page");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorSlug]);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const response = await fetch(
          `/api/booking/available-slots?doctorSlug=${doctorSlug}&date=${dateStr}`
        );
        const data = await response.json();

        if (data.success) {
          setAvailableSlots(data.data.slots || []);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, doctorSlug]);

  const onSubmit = async (data: BookingInput) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/booking/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          doctorSlug,
          appointmentDate: selectedDate.toISOString().split("T")[0],
          timeSlot: selectedTime,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setEditLink(result.data.editLink);
        toast.success("Appointment booked successfully!");
      } else {
        toast.error(result.error || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred while booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <BookingPageSkeleton />;
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="card-premium max-w-md w-full animate-fade-in">
          <CardContent className="pt-8 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold mb-3">Page Not Found</h1>
            <p className="text-muted-foreground leading-relaxed">
              This booking page doesn&apos;t exist or is currently unavailable.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ backgroundColor: doctor.brandColor + "08" }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-30"
          style={{ backgroundColor: doctor.brandColor }}
        />

        <Card className="card-premium max-w-md w-full relative z-10 animate-fade-in">
          <CardContent className="pt-10 pb-8 text-center">
            {/* Success icon with animation */}
            <div className="relative mb-8">
              <div
                className="h-24 w-24 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: doctor.brandColor + "15" }}
              >
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center animate-bounce"
                  style={{ backgroundColor: doctor.brandColor }}
                >
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              {/* Decorative rings */}
              <div
                className="absolute inset-0 h-24 w-24 mx-auto rounded-full animate-ping opacity-20"
                style={{ backgroundColor: doctor.brandColor }}
              />
            </div>

            <h1 className="font-display text-3xl font-semibold mb-3">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your appointment with Dr. {doctor.fullName} has been successfully scheduled.
            </p>

            {/* Appointment summary card */}
            <div
              className="rounded-2xl p-6 mb-8 text-left"
              style={{ backgroundColor: doctor.brandColor + "08" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: doctor.brandColor + "20" }}
                >
                  <CalendarIcon className="h-5 w-5" style={{ color: doctor.brandColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointment Date</p>
                  <p className="font-semibold">
                    {selectedDate && formatDate(selectedDate.toISOString())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: doctor.brandColor + "20" }}
                >
                  <Clock className="h-5 w-5" style={{ color: doctor.brandColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Slot</p>
                  <p className="font-semibold" style={{ color: doctor.brandColor }}>
                    {selectedTime && formatTime(selectedTime)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              You will receive a confirmation via WhatsApp shortly.
              Save the link below to manage your appointment.
            </p>

            {editLink && (
              <Button
                className="w-full h-12 rounded-xl text-base font-medium"
                style={{ backgroundColor: doctor.brandColor }}
                onClick={() => window.open(editLink, "_blank")}
              >
                Manage Appointment
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Header */}
      <header
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${doctor.brandColor} 0%, ${doctor.brandColor}dd 100%)`
        }}
      >
        {/* Background patterns */}
        <div className="absolute inset-0 dot-pattern text-white/5" />
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px]" />

        <div className="container max-w-5xl mx-auto px-4 py-12 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-white">
            {/* Avatar */}
            <Avatar className="h-28 w-28 border-4 border-white/20 shadow-2xl ring-4 ring-white/10">
              <AvatarImage src={doctor.profileImage || ""} />
              <AvatarFallback className="text-3xl bg-white/20 text-white font-display">
                {getInitials(doctor.fullName)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Verified Doctor
                </Badge>
              </div>
              <h1 className="font-display text-4xl font-semibold mb-2">
                Dr. {doctor.fullName}
              </h1>
              {doctor.specialty && (
                <p className="text-xl text-white/80 mb-4">{doctor.specialty}</p>
              )}
              {doctor.clinicName && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-white/70">
                  <MapPin className="h-4 w-4" />
                  <span>{doctor.clinicName}</span>
                </div>
              )}
              {doctor.welcomeMessage && (
                <p className="mt-4 text-white/80 max-w-xl leading-relaxed">
                  {doctor.welcomeMessage}
                </p>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex md:flex-col gap-4 md:gap-2 text-center md:text-right">
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-display font-bold">15+</p>
                <p className="text-xs text-white/60">Years Exp.</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-display font-bold">4.9</p>
                <p className="text-xs text-white/60">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Step Indicator */}
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                step >= 1
                  ? "text-white shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
              style={step >= 1 ? { backgroundColor: doctor.brandColor } : {}}
            >
              {step > 1 ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <span className={cn(
              "font-medium hidden sm:block",
              step >= 1 ? "text-foreground" : "text-muted-foreground"
            )}>
              Select Date & Time
            </span>
          </div>
          <div
            className={cn(
              "h-1 w-16 rounded-full transition-all duration-300",
              step >= 2 ? "" : "bg-muted"
            )}
            style={step >= 2 ? { backgroundColor: doctor.brandColor } : {}}
          />
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                step >= 2
                  ? "text-white shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
              style={step >= 2 ? { backgroundColor: doctor.brandColor } : {}}
            >
              2
            </div>
            <span className={cn(
              "font-medium hidden sm:block",
              step >= 2 ? "text-foreground" : "text-muted-foreground"
            )}>
              Your Details
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <Card className={cn(
              "card-premium transition-all duration-300",
              step === 2 && "opacity-60"
            )}>
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: doctor.brandColor + "15" }}
                  >
                    <CalendarIcon className="h-5 w-5" style={{ color: doctor.brandColor }} />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg">Select Date & Time</CardTitle>
                    <CardDescription>Choose your preferred appointment slot</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Calendar */}
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                        setStep(1);
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-xl border-2 border-border p-4"
                    />
                  </div>

                  {/* Time slots */}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {selectedDate ? (
                        <>Available Times - {formatDate(selectedDate.toISOString())}</>
                      ) : (
                        "Select a date first"
                      )}
                    </h4>

                    {!selectedDate ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Please select a date to view available time slots</p>
                      </div>
                    ) : loadingSlots ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} className="h-12 rounded-xl" />
                        ))}
                      </div>
                    ) : availableSlots.filter((s) => s.isAvailable).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No available slots for this date</p>
                        <p className="text-sm mt-1">Please try another date</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto scrollbar-premium pr-2">
                        {availableSlots
                          .filter((slot) => slot.isAvailable)
                          .map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              className={cn(
                                "h-12 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                                selectedTime === slot.time
                                  ? "text-white border-transparent shadow-lg scale-[1.02]"
                                  : "bg-background border-border hover:border-primary/30 hover:bg-muted/50"
                              )}
                              style={
                                selectedTime === slot.time
                                  ? { backgroundColor: doctor.brandColor }
                                  : {}
                              }
                            >
                              {formatTime(slot.time)}
                            </button>
                          ))}
                      </div>
                    )}

                    {selectedDate && selectedTime && step === 1 && (
                      <Button
                        className="w-full mt-6 h-12 rounded-xl text-base font-medium"
                        onClick={() => setStep(2)}
                        style={{ backgroundColor: doctor.brandColor }}
                      >
                        Continue to Booking Form
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className={cn(
              "card-premium transition-all duration-300 sticky top-6",
              step === 1 && "opacity-60 pointer-events-none"
            )}>
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: doctor.brandColor + "15" }}
                  >
                    <User className="h-5 w-5" style={{ color: doctor.brandColor }} />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg">Your Information</CardTitle>
                    <CardDescription>Complete the booking form</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      {...register("fullName")}
                      className="input-premium h-12"
                      error={!!errors.fullName}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive animate-fade-in">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber" className="text-sm font-medium">
                      WhatsApp Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsappNumber"
                        placeholder="+1 234 567 8900"
                        className="input-premium h-12 pl-11"
                        {...register("whatsappNumber")}
                        error={!!errors.whatsappNumber}
                      />
                    </div>
                    {errors.whatsappNumber && (
                      <p className="text-sm text-destructive animate-fade-in">
                        {errors.whatsappNumber.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      We&apos;ll send confirmation via WhatsApp
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="input-premium h-12 pl-11"
                        {...register("email")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Reason for Visit <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Please describe your symptoms or reason for the appointment"
                      rows={4}
                      {...register("reason")}
                      className="input-premium resize-none"
                      error={!!errors.reason}
                    />
                    {errors.reason && (
                      <p className="text-sm text-destructive animate-fade-in">
                        {errors.reason.message}
                      </p>
                    )}
                  </div>

                  {/* Booking Summary */}
                  {selectedDate && selectedTime && (
                    <div
                      className="rounded-xl p-4 border-2"
                      style={{
                        backgroundColor: doctor.brandColor + "08",
                        borderColor: doctor.brandColor + "20"
                      }}
                    >
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" style={{ color: doctor.brandColor }} />
                        Booking Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">
                            {formatDate(selectedDate.toISOString())}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium" style={{ color: doctor.brandColor }}>
                            {formatTime(selectedTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Doctor</span>
                          <span className="font-medium">Dr. {doctor.fullName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-medium btn-premium"
                    disabled={submitting || !selectedDate || !selectedTime}
                    style={{ backgroundColor: doctor.brandColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <Check className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <span>Powered by <span className="font-semibold text-foreground">MediBook</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Secure & HIPAA Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header skeleton */}
      <header className="bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="space-y-3 flex-1 text-center md:text-left">
              <Skeleton className="h-6 w-32 mx-auto md:mx-0" />
              <Skeleton className="h-10 w-64 mx-auto md:mx-0" />
              <Skeleton className="h-5 w-48 mx-auto md:mx-0" />
            </div>
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card className="card-premium">
              <CardHeader className="border-b border-border bg-muted/30">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <Skeleton className="h-[300px] flex-1 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-12 rounded-xl" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="card-premium">
              <CardHeader className="border-b border-border bg-muted/30">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
