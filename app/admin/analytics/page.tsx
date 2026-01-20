"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Stethoscope,
  Award,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    activeSubscriptions: number;
    newUsersThisMonth: number;
    appointmentsThisMonth: number;
  };
  subscriptionBreakdown: {
    plan: string;
    count: number;
    revenue: number;
  }[];
  monthlyGrowth: {
    month: string;
    users: number;
    appointments: number;
    revenue: number;
  }[];
  topDoctors: {
    id: string;
    name: string;
    appointments: number;
    patients: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/admin/analytics?days=${period}`);
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

    fetchAnalytics();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Analytics" description="Platform performance metrics" />
        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const overviewStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics?.overview.totalRevenue || 0),
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
      shadowColor: "shadow-emerald-500/20",
      change: "+12.5%",
    },
    {
      title: "Total Users",
      value: (analytics?.overview.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: "from-accent to-blue-500",
      shadowColor: "shadow-accent/20",
      subtext: `${analytics?.overview.newUsersThisMonth || 0} new this month`,
    },
    {
      title: "Active Doctors",
      value: analytics?.overview.totalDoctors || 0,
      icon: Stethoscope,
      color: "from-violet-500 to-purple-500",
      shadowColor: "shadow-violet-500/20",
      subtext: `${analytics?.overview.activeSubscriptions || 0} subscribed`,
    },
    {
      title: "Total Appointments",
      value: (analytics?.overview.totalAppointments || 0).toLocaleString(),
      icon: Calendar,
      color: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/20",
      subtext: `${analytics?.overview.appointmentsThisMonth || 0} this month`,
    },
  ];

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Platform Analytics"
        description="Monitor your platform's performance and growth"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44 input-premium">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map((stat, index) => (
            <div
              key={stat.title}
              className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                  {stat.subtext && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.subtext}</p>
                  )}
                  {stat.change && (
                    <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor} group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscription Breakdown */}
          <div className="card-premium">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Subscription Breakdown</CardTitle>
                  <CardDescription>Revenue by plan type</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {analytics?.subscriptionBreakdown && analytics.subscriptionBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analytics.subscriptionBreakdown.map((item) => {
                    const colors: Record<string, { bg: string; bar: string }> = {
                      free_trial: { bg: "bg-muted-foreground/20", bar: "bg-muted-foreground/40" },
                      premium: { bg: "bg-primary/20", bar: "bg-primary" },
                      advanced: { bg: "bg-violet-500/20", bar: "bg-violet-500" },
                    };
                    const config = colors[item.plan] || colors.free_trial;
                    const totalRevenue = analytics.subscriptionBreakdown.reduce(
                      (sum, i) => sum + i.revenue,
                      0
                    );
                    const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;

                    return (
                      <div key={item.plan} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {item.plan.replace("_", " ")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.count} users - {formatCurrency(item.revenue)}
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${config.bg}`}>
                          <div
                            className={`h-2 rounded-full ${config.bar} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <PieChart className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">No subscription data available</p>
                </div>
              )}
            </CardContent>
          </div>

          {/* Top Performing Doctors */}
          <div className="card-premium">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Top Performing Doctors</CardTitle>
                  <CardDescription>By appointment volume</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {analytics?.topDoctors && analytics.topDoctors.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topDoctors.slice(0, 5).map((doctor, index) => (
                    <div
                      key={doctor.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-display font-bold text-white ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                            : index === 1
                            ? "bg-gradient-to-br from-slate-400 to-gray-400"
                            : index === 2
                            ? "bg-gradient-to-br from-amber-700 to-orange-700"
                            : "bg-gradient-to-br from-primary/80 to-primary"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doctor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.patients} patients
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-primary">
                          {doctor.appointments}
                        </p>
                        <p className="text-xs text-muted-foreground">appointments</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">No doctor data available</p>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Monthly Growth Chart */}
        <div className="card-premium">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Monthly Growth</CardTitle>
                <CardDescription>Users, appointments, and revenue over time</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {analytics?.monthlyGrowth && analytics.monthlyGrowth.length > 0 ? (
              <div className="space-y-6">
                {/* Legend */}
                <div className="flex gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-accent" />
                    <span className="text-sm text-muted-foreground">Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">Appointments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500" />
                    <span className="text-sm text-muted-foreground">Revenue ($)</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-64 flex items-end justify-between gap-2">
                  {analytics.monthlyGrowth.map((month, index) => {
                    const maxUsers = Math.max(
                      ...analytics.monthlyGrowth.map((m) => m.users)
                    );
                    const maxAppointments = Math.max(
                      ...analytics.monthlyGrowth.map((m) => m.appointments)
                    );
                    const maxRevenue = Math.max(
                      ...analytics.monthlyGrowth.map((m) => m.revenue)
                    );

                    return (
                      <div
                        key={month.month}
                        className="flex-1 flex flex-col items-center gap-1 group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex gap-1 h-48 items-end">
                          <div
                            className="w-4 bg-gradient-to-t from-accent to-accent/60 rounded-t transition-all duration-300 group-hover:from-accent group-hover:to-accent/80"
                            style={{
                              height: `${maxUsers > 0 ? (month.users / maxUsers) * 100 : 0}%`,
                              minHeight: "4px",
                            }}
                            title={`${month.users} users`}
                          />
                          <div
                            className="w-4 bg-gradient-to-t from-primary to-primary/60 rounded-t transition-all duration-300 group-hover:from-primary group-hover:to-primary/80"
                            style={{
                              height: `${maxAppointments > 0 ? (month.appointments / maxAppointments) * 100 : 0}%`,
                              minHeight: "4px",
                            }}
                            title={`${month.appointments} appointments`}
                          />
                          <div
                            className="w-4 bg-gradient-to-t from-violet-500 to-violet-500/60 rounded-t transition-all duration-300 group-hover:from-violet-500 group-hover:to-violet-500/80"
                            style={{
                              height: `${maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0}%`,
                              minHeight: "4px",
                            }}
                            title={formatCurrency(month.revenue)}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{month.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No growth data available</p>
              </div>
            )}
          </CardContent>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium p-6 text-center group hover:shadow-soft-lg transition-all duration-300">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <p className="text-4xl font-display font-bold text-primary">
              {analytics?.overview.activeSubscriptions || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Active Subscriptions</p>
            <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
              {analytics?.overview.totalDoctors
                ? (
                    ((analytics.overview.activeSubscriptions || 0) /
                      analytics.overview.totalDoctors) *
                    100
                  ).toFixed(1)
                : 0}% conversion rate
            </Badge>
          </div>
          <div className="card-premium p-6 text-center group hover:shadow-soft-lg transition-all duration-300">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-accent" />
            </div>
            <p className="text-4xl font-display font-bold text-accent">
              {(analytics?.overview.totalPatients || 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Patients</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Across all doctors
            </p>
          </div>
          <div className="card-premium p-6 text-center group hover:shadow-soft-lg transition-all duration-300">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-7 w-7 text-violet-600" />
            </div>
            <p className="text-4xl font-display font-bold text-violet-600">
              {analytics?.overview.totalDoctors
                ? (
                    (analytics.overview.totalAppointments || 0) /
                    analytics.overview.totalDoctors
                  ).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Avg. Appointments/Doctor</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Platform average
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
