"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  CreditCard,
  DollarSign,
  Calendar,
  HeadphonesIcon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface AdminStats {
  overview: {
    totalUsers: number;
    totalDoctors: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    totalAppointments: number;
    openTickets: number;
    userGrowth: number;
  };
  subscriptionBreakdown: {
    plan: string;
    count: number;
  }[];
  revenueHistory: {
    month: string;
    revenue: number;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/analytics");
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.overview.totalUsers || 0,
      icon: Users,
      color: "from-primary to-primary/80",
      shadowColor: "shadow-primary/20",
      trend: stats?.overview.userGrowth,
    },
    {
      title: "Total Doctors",
      value: stats?.overview.totalDoctors || 0,
      icon: Stethoscope,
      color: "from-accent to-blue-500",
      shadowColor: "shadow-accent/20",
    },
    {
      title: "Active Subscriptions",
      value: stats?.overview.activeSubscriptions || 0,
      icon: CreditCard,
      color: "from-violet-500 to-purple-500",
      shadowColor: "shadow-violet-500/20",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats?.overview.monthlyRevenue || 0),
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
      shadowColor: "shadow-emerald-500/20",
      isRevenue: true,
    },
  ];

  const quickActions = [
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/subscriptions", label: "View Subscriptions", icon: CreditCard },
    { href: "/admin/support", label: "Support Tickets", badge: stats?.overview.openTickets },
    { href: "/admin/analytics", label: "View Analytics", icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Admin Dashboard"
        description="Platform overview and analytics"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/10 text-white border-0 backdrop-blur-sm">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-semibold text-white mb-2">
                Platform Control Center
              </h2>
              <p className="text-white/70 max-w-lg">
                Monitor your platform's health, manage users, and track revenue all in one place.
              </p>
            </div>
            <Link href="/admin/analytics">
              <Button className="bg-white text-primary hover:bg-white/90 gap-2">
                <BarChart3 className="h-4 w-4" />
                View Full Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="card-premium p-6">
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
            : statsCards.map((stat, index) => (
                <div
                  key={stat.title}
                  className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-3xl font-display font-bold ${stat.isRevenue ? 'text-emerald-600' : ''}`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        {stat.trend !== undefined && (
                          <Badge
                            className={`text-xs ${
                              stat.trend >= 0
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}
                            variant="outline"
                          >
                            {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                          </Badge>
                        )}
                      </div>
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

        {/* Secondary Stats Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscription Distribution */}
          <div className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Subscription Distribution</CardTitle>
                  <CardDescription>Active subscriptions by plan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.subscriptionBreakdown.map((item) => {
                    const colors: Record<string, { bg: string; text: string }> = {
                      advanced: { bg: 'bg-violet-500', text: 'text-violet-700' },
                      premium: { bg: 'bg-primary', text: 'text-primary' },
                      free_trial: { bg: 'bg-muted-foreground/30', text: 'text-muted-foreground' },
                    };
                    const config = colors[item.plan] || colors.free_trial;
                    const total = stats?.subscriptionBreakdown.reduce((sum, i) => sum + i.count, 0) || 1;
                    const percentage = (item.count / total) * 100;

                    return (
                      <div key={item.plan} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${config.bg}`} />
                            <span className="font-medium capitalize">
                              {item.plan.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {item.count}
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${config.bg} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* Quick Actions */}
          <div className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {action.icon && <action.icon className="h-4 w-4 text-muted-foreground" />}
                      {action.label}
                    </span>
                    {action.badge ? (
                      <Badge variant="destructive" className="animate-pulse-soft">
                        {action.badge}
                      </Badge>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold">
                  {loading ? '-' : (stats?.overview.totalAppointments || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HeadphonesIcon className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold">
                  {loading ? '-' : stats?.overview.openTickets || 0}
                </p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 group hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  (stats?.overview.userGrowth || 0) >= 0
                    ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10'
                    : 'bg-gradient-to-br from-destructive/10 to-red-500/10'
                }`}
              >
                {(stats?.overview.userGrowth || 0) >= 0 ? (
                  <TrendingUp className="h-7 w-7 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-destructive" />
                )}
              </div>
              <div>
                <p
                  className={`text-3xl font-display font-bold ${
                    (stats?.overview.userGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  {loading ? '-' : `${stats?.overview.userGrowth || 0}%`}
                </p>
                <p className="text-sm text-muted-foreground">User Growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue History */}
        {stats?.revenueHistory && stats.revenueHistory.length > 0 && (
          <div className="card-premium">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Revenue History</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 flex items-end justify-between gap-2">
                {stats.revenueHistory.map((item, index) => {
                  const maxRevenue = Math.max(...stats.revenueHistory.map((r) => r.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <div className="relative w-full">
                        <div
                          className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all duration-300 group-hover:from-primary group-hover:to-primary/80"
                          style={{ height: `${Math.max(height, 5)}%`, minHeight: '12px' }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
