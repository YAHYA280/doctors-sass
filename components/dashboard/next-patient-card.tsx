"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  User,
  FileText,
  ArrowRight,
  Play,
  CalendarClock,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime, cn } from "@/lib/utils";

interface NextPatientData {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  duration: number;
  status: string;
  reason: string | null;
  notes: string | null;
  patient: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    medicalHistory?: {
      conditions?: string[];
      allergies?: string[];
      medications?: string[];
      notes?: string;
    } | null;
  };
}

interface NextPatientCardProps {
  data: NextPatientData | null;
  loading?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getTimeUntil(appointmentDate: string, timeSlot: string): string {
  const now = new Date();
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const appointmentTime = new Date(appointmentDate);
  appointmentTime.setHours(hours, minutes, 0, 0);

  const diffMs = appointmentTime.getTime() - now.getTime();

  if (diffMs < 0) {
    return "Starting now";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `in ${diffHours}h ${remainingMinutes}m`;
    }
    return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }
  if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  }
  return "Starting now";
}

function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
}

export function NextPatientCard({ data, loading = false }: NextPatientCardProps) {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!data) return;

    const updateCountdown = () => {
      setCountdown(getTimeUntil(data.appointmentDate, data.timeSlot));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <Card className="card-premium overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="card-premium overflow-hidden border-dashed border-2 border-muted-foreground/30 bg-muted/40 dark:bg-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">
              No Upcoming Appointments
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your schedule is clear. New appointments will appear here as patients book them.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appointmentIsToday = isToday(data.appointmentDate);
  const statusColor = data.status === "confirmed"
    ? "bg-success/10 text-success border-success/20"
    : "bg-warning/10 text-warning border-warning/20";

  return (
    <Card className="card-premium overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <CardContent className="p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-foreground">Next Patient</span>
          </div>
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", statusColor)}>
            {data.status}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Patient Info */}
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft">
              <span className="font-display text-xl font-bold text-white">
                {getInitials(data.patient.fullName)}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-semibold text-foreground truncate">
                {data.patient.fullName}
              </h3>

              {/* Time Info */}
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {appointmentIsToday ? "Today" : formatDate(data.appointmentDate)} at{" "}
                    <span className="font-medium text-foreground">{formatTime(data.timeSlot)}</span>
                  </span>
                </div>
                {countdown && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-xs font-medium",
                      appointmentIsToday && countdown.includes("minute")
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-primary/10 text-primary border-primary/30"
                    )}
                  >
                    {countdown}
                  </Badge>
                )}
              </div>

              {/* Reason */}
              {data.reason && (
                <div className="flex items-start gap-1.5 mt-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {data.reason}
                  </p>
                </div>
              )}

              {/* Medical Alerts */}
              {data.patient.medicalHistory?.allergies &&
               data.patient.medicalHistory.allergies.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                    Allergies: {data.patient.medicalHistory.allergies.join(", ")}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
            <Link href={`/dashboard/patients?id=${data.patient.id}`}>
              <Button
                variant="outline"
                className="gap-2 h-11 px-5 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              >
                <User className="h-4 w-4" />
                View Patient
              </Button>
            </Link>
            <Link href={`/dashboard/appointments?id=${data.id}`}>
              <Button className="gap-2 h-11 px-5 bg-primary hover:bg-primary/90 shadow-soft">
                <Play className="h-4 w-4" />
                Start Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NextPatientCardSkeleton() {
  return <NextPatientCard data={null} loading={true} />;
}
