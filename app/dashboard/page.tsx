"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Activity,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { NextPatientCard } from "@/components/dashboard/next-patient-card";

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

interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  patient: {
    fullName: string;
    phone?: string;
  };
}

export default function DoctorDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [nextPatient, setNextPatient] = useState<NextPatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextPatientLoading, setNextPatientLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [doctorName, setDoctorName] = useState<string>("");

  const bookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dr/${session?.user?.doctorSlug}`
    : "";

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Booking link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchNextPatient = async () => {
      try {
        const res = await fetch("/api/doctors/appointments/next");
        const data = await res.json();
        if (data.success && data.data) {
          setNextPatient(data.data);
        }
      } catch (error) {
        console.error("Error fetching next patient:", error);
      } finally {
        setNextPatientLoading(false);
      }
    };

    fetchNextPatient();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile and all appointments in parallel
        const [profileRes, allAppointmentsRes, recentAppointmentsRes] = await Promise.all([
          fetch("/api/doctors/profile"),
          fetch("/api/doctors/appointments?limit=1000"),
          fetch("/api/doctors/appointments?limit=5"),
        ]);

        const profileData = await profileRes.json();
        const allAppointmentsData = await allAppointmentsRes.json();
        const recentData = await recentAppointmentsRes.json();

        if (profileData.success) {
          setDoctorName(profileData.data.fullName || "");
        }

        if (recentData.success) {
          setRecentAppointments(recentData.data);
        }

        const allAppts = allAppointmentsData.success ? allAppointmentsData.data : [];

        const today = new Date().toISOString().split("T")[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const todayAppointments = allAppts.filter(
          (a: Appointment) => a.appointmentDate === today
        );
        const weekAppointments = allAppts.filter(
          (a: Appointment) => a.appointmentDate >= weekAgo
        );

        setStats({
          totalPatients: profileData.success ? (profileData.data.patientCountThisMonth || 0) : 0,
          appointmentsToday: todayAppointments.length,
          appointmentsThisWeek: weekAppointments.length,
          pendingAppointments: allAppts.filter((a: Appointment) => a.status === "pending").length,
          completedAppointments: allAppts.filter((a: Appointment) => a.status === "completed").length,
          cancelledAppointments: allAppts.filter((a: Appointment) => a.status === "cancelled").length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "confirmed":
        return "bg-primary/10 text-primary border-primary/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Dashboard"
        description={`Welcome back${doctorName ? `, Dr. ${doctorName}` : ""}`}
      />

      <div className="p-4 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-6 lg:p-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/20 rounded-full blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Your Practice Dashboard</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-2">
                Good {getGreeting()}{doctorName ? `, Dr. ${doctorName}` : ""}
              </h2>
              <p className="text-white/80 max-w-lg">
                You have <span className="font-semibold text-white">{stats?.appointmentsToday || 0} appointments</span> today
                and <span className="font-semibold text-white">{stats?.pendingAppointments || 0} pending</span> reviews.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/appointments">
                <Button className="bg-white text-primary hover:bg-white/90 shadow-soft-lg gap-2 h-11 px-5">
                  <Calendar className="h-4 w-4" />
                  View Appointments
                </Button>
              </Link>
              <Link href={`/dr/${session?.user?.doctorSlug}`} target="_blank">
                <Button variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2 h-11 px-5">
                  <ExternalLink className="h-4 w-4" />
                  Booking Page
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Next Patient Card */}
        <NextPatientCard data={nextPatient} loading={nextPatientLoading} />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today's Appointments"
            value={loading ? "-" : stats?.appointmentsToday.toString() || "0"}
            icon={<CalendarCheck className="h-5 w-5" />}
            loading={loading}
            color="primary"
          />
          <StatsCard
            title="Total Patients"
            value={loading ? "-" : stats?.totalPatients.toString() || "0"}
            subtitle="This month"
            icon={<Users className="h-5 w-5" />}
            loading={loading}
            color="accent"
          />
          <StatsCard
            title="Pending Review"
            value={loading ? "-" : stats?.pendingAppointments.toString() || "0"}
            subtitle="Needs action"
            icon={<Clock className="h-5 w-5" />}
            loading={loading}
            color="warning"
          />
          <StatsCard
            title="This Week"
            value={loading ? "-" : stats?.appointmentsThisWeek.toString() || "0"}
            subtitle="Appointments"
            icon={<Activity className="h-5 w-5" />}
            loading={loading}
            color="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Appointments - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="card-premium overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/40">
                <div>
                  <CardTitle className="font-display text-lg">Recent Appointments</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">Your latest patient appointments</p>
                </div>
                <Link href="/dashboard/appointments">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary/80">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="divide-y divide-border">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                      <CalendarX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground mb-1">No appointments yet</p>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Share your booking page to start receiving appointments from patients
                    </p>
                    <Button variant="outline" className="mt-4 gap-2" onClick={copyBookingLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy Booking Link"}
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentAppointments.map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                            <span className="font-display font-semibold text-primary text-sm">
                              {appointment.patient.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{appointment.patient.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.timeSlot)}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", getStatusStyles(appointment.status))}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            {/* Status Summary */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">Appointment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  icon={<CheckCircle className="h-5 w-5" />}
                  label="Completed"
                  value={loading ? "-" : stats?.completedAppointments || 0}
                  color="success"
                  loading={loading}
                />
                <StatusRow
                  icon={<AlertCircle className="h-5 w-5" />}
                  label="Pending Review"
                  value={loading ? "-" : stats?.pendingAppointments || 0}
                  color="warning"
                  loading={loading}
                />
                <StatusRow
                  icon={<CalendarX className="h-5 w-5" />}
                  label="Cancelled"
                  value={loading ? "-" : stats?.cancelledAppointments || 0}
                  color="destructive"
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-premium bg-gradient-to-br from-primary/5 via-card to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/calendar" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span>Manage Calendar</span>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </Button>
                </Link>
                <Link href="/dashboard/patients" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <span>View Patients</span>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </Button>
                </Link>
                <Link href="/dashboard/analytics" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <span>View Analytics</span>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  loading,
  trend,
  trendUp,
  color = "primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  loading: boolean;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 text-primary border-primary/20",
    accent: "from-accent/10 to-accent/5 text-accent border-accent/20",
    success: "from-success/10 to-success/5 text-success border-success/20",
    warning: "from-warning/10 to-warning/5 text-warning border-warning/20",
    destructive: "from-destructive/10 to-destructive/5 text-destructive border-destructive/20",
  };

  return (
    <Card className="card-premium overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {loading ? (
              <>
                <Skeleton className="h-9 w-20 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <p className="font-display text-3xl font-bold text-foreground mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
                )}
                {trend && (
                  <div className={cn(
                    "inline-flex items-center gap-1 mt-2 text-xs font-medium",
                    trendUp ? "text-success" : "text-destructive"
                  )}>
                    <ArrowUpRight className={cn("h-3.5 w-3.5", !trendUp && "rotate-180")} />
                    {trend} from last week
                  </div>
                )}
              </>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br border transition-transform duration-300 group-hover:scale-110",
            colorClasses[color]
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "success" | "warning" | "destructive";
  loading: boolean;
}) {
  const colorClasses = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colorClasses[color])}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-8" />
      ) : (
        <span className="font-display text-xl font-bold text-foreground">{value}</span>
      )}
    </div>
  );
}
