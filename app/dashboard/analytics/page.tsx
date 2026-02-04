"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    totalPatients: number;
    newPatientsThisMonth: number;
    averageAppointmentsPerDay: number;
    completionRate: number;
  };
  trends: {
    appointmentsByMonth: { month: string; count: number }[];
    appointmentsByDay: { day: string; count: number }[];
    appointmentsByStatus: { status: string; count: number }[];
  };
  topMetrics: {
    busiestDay: string;
    busiestTime: string;
    averageWaitTime: number;
    returningPatientRate: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("30");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/analytics?days=${period}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const stats = [
    {
      title: "Total Appointments",
      value: analytics?.overview.totalAppointments || 0,
      icon: Calendar,
      color: "primary" as const,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Completed",
      value: analytics?.overview.completedAppointments || 0,
      icon: CheckCircle,
      color: "success" as const,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Cancelled",
      value: analytics?.overview.cancelledAppointments || 0,
      icon: XCircle,
      color: "destructive" as const,
      trend: "-5%",
      trendUp: false,
    },
    {
      title: "Total Patients",
      value: analytics?.overview.totalPatients || 0,
      icon: Users,
      color: "accent" as const,
      trend: "+15%",
      trendUp: true,
    },
  ];

  const colorClasses = {
    primary: "from-primary/10 to-primary/5 text-primary border-primary/20",
    success: "from-success/10 to-success/5 text-success border-success/20",
    destructive: "from-destructive/10 to-destructive/5 text-destructive border-destructive/20",
    accent: "from-accent/10 to-accent/5 text-accent border-accent/20",
    warning: "from-warning/10 to-warning/5 text-warning border-warning/20",
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Analytics" description="Track your practice performance" />
        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Analytics"
        description="Track your practice performance and patient trends"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="rounded-lg gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Period Selector */}
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 h-10 rounded-xl bg-muted/50 border-transparent">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.title}
              className="card-premium group hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-display text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <div className={cn(
                      "inline-flex items-center gap-1 mt-2 text-xs font-medium",
                      stat.trendUp ? "text-success" : "text-destructive"
                    )}>
                      <ArrowUpRight className={cn("h-3.5 w-3.5", !stat.trendUp && "rotate-180")} />
                      {stat.trend} from last period
                    </div>
                  </div>
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br border transition-transform duration-300 group-hover:scale-110",
                    colorClasses[stat.color]
                  )}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Performance Metrics</CardTitle>
                  <CardDescription className="text-xs">Key performance indicators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <MetricRow
                label="Completion Rate"
                value={`${analytics?.overview.completionRate?.toFixed(1) || 0}%`}
                status={(analytics?.overview.completionRate || 0) >= 80 ? "good" : "warning"}
                statusText={(analytics?.overview.completionRate || 0) >= 80 ? "Good" : "Needs Improvement"}
              />
              <MetricRow
                label="Avg. Appointments/Day"
                value={analytics?.overview.averageAppointmentsPerDay?.toFixed(1) || "0"}
                icon={<Calendar className="h-5 w-5 text-muted-foreground/50" />}
              />
              <MetricRow
                label="New Patients This Month"
                value={analytics?.overview.newPatientsThisMonth || 0}
                icon={<Users className="h-5 w-5 text-muted-foreground/50" />}
              />
              <MetricRow
                label="Returning Patient Rate"
                value={`${analytics?.topMetrics.returningPatientRate?.toFixed(1) || 0}%`}
                status="good"
              />
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Busiest Times</CardTitle>
                  <CardDescription className="text-xs">When patients book most</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Busiest Day</p>
                  <p className="font-display text-xl font-bold capitalize">
                    {analytics?.topMetrics.busiestDay || "N/A"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Peak Hour</p>
                  <p className="font-display text-xl font-bold">
                    {analytics?.topMetrics.busiestTime || "N/A"}
                  </p>
                </div>
              </div>

              {analytics?.trends.appointmentsByDay && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">Weekly Distribution</p>
                  {analytics.trends.appointmentsByDay.map((day, index) => {
                    const maxCount = Math.max(...analytics.trends.appointmentsByDay.map(d => d.count));
                    const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div key={day.day} className="flex items-center gap-3" style={{ animationDelay: `${index * 50}ms` }}>
                        <span className="w-12 text-xs font-medium text-muted-foreground capitalize">{day.day.slice(0, 3)}</span>
                        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs font-medium text-foreground text-right">{day.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointment Status Breakdown */}
        {analytics?.trends.appointmentsByStatus && analytics.trends.appointmentsByStatus.length > 0 && (
          <Card className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-success" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Status Breakdown</CardTitle>
                  <CardDescription className="text-xs">Distribution of appointment outcomes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {analytics.trends.appointmentsByStatus.map((item, index) => {
                  const statusColors: Record<string, string> = {
                    pending: "from-warning/10 to-warning/5 text-warning border-warning/20",
                    scheduled: "from-accent/10 to-accent/5 text-accent border-accent/20",
                    confirmed: "from-primary/10 to-primary/5 text-primary border-primary/20",
                    completed: "from-success/10 to-success/5 text-success border-success/20",
                    cancelled: "from-destructive/10 to-destructive/5 text-destructive border-destructive/20",
                    no_show: "from-warning/10 to-warning/5 text-warning border-warning/20",
                  };
                  return (
                    <div
                      key={item.status}
                      className={cn(
                        "p-5 rounded-xl bg-gradient-to-br border transition-all duration-300 hover:-translate-y-1",
                        statusColors[item.status] || "from-muted/50 to-muted/30 border-border"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <p className="font-display text-3xl font-bold">{item.count}</p>
                      <p className="text-sm capitalize mt-1">{item.status.replace("_", " ")}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trend */}
        {analytics?.trends.appointmentsByMonth && analytics.trends.appointmentsByMonth.length > 0 && (
          <Card className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Monthly Trend</CardTitle>
                  <CardDescription className="text-xs">Appointments over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-72 flex items-end justify-between gap-2">
                {analytics.trends.appointmentsByMonth.map((month, index) => {
                  const maxCount = Math.max(...analytics.trends.appointmentsByMonth.map(m => m.count));
                  const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={month.month}
                      className="flex-1 flex flex-col items-center gap-2 group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="text-sm font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {month.count}
                      </span>
                      <div className="w-full relative">
                        <div
                          className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-lg transition-all duration-500 hover:from-primary/90 hover:to-primary/60"
                          style={{ height: `${Math.max(height * 2.4, 12)}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{month.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  status,
  statusText,
  icon,
}: {
  label: string;
  value: string | number;
  status?: "good" | "warning";
  statusText?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
      {status && (
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          status === "good" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
        )}>
          {status === "good" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {statusText}
        </div>
      )}
      {icon && icon}
    </div>
  );
}
