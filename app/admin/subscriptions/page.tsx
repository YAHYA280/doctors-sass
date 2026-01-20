"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Search,
  MoreHorizontal,
  DollarSign,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface Subscription {
  id: string;
  doctorId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  doctor: {
    id: string;
    fullName: string;
    user: {
      email: string;
    };
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trialing: 0,
    cancelled: 0,
    mrr: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, [page, search, planFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (subscriptionId: string, days: number) => {
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action: "extend_trial",
          days,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Trial extended by ${days} days`);
        fetchSubscriptions();
      } else {
        toast.error(data.error || "Failed to extend trial");
      }
    } catch (error) {
      toast.error("Failed to extend trial");
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action: "cancel",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Subscription cancelled");
        fetchSubscriptions();
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-700 border-amber-200">
          <AlertTriangle className="h-3 w-3" />
          Cancelling
        </Badge>
      );
    }

    const config: Record<string, { className: string; icon: any }> = {
      active: {
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      },
      trialing: {
        className: "bg-accent/10 text-accent border-accent/20",
        icon: Clock,
      },
      past_due: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: AlertTriangle,
      },
      cancelled: {
        className: "bg-muted text-muted-foreground border-border",
        icon: XCircle,
      },
      incomplete: {
        className: "bg-amber-500/10 text-amber-700 border-amber-200",
        icon: AlertTriangle,
      },
    };
    const statusConfig = config[status] || config.cancelled;
    const Icon = statusConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 font-medium capitalize ${statusConfig.className}`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const config: Record<string, { className: string; icon?: any }> = {
      free_trial: {
        className: "bg-muted text-muted-foreground border-border",
      },
      premium: {
        className: "bg-gradient-to-r from-primary/10 to-emerald-500/10 text-primary border-primary/20",
        icon: Sparkles,
      },
      advanced: {
        className: "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 border-violet-200",
        icon: Sparkles,
      },
    };
    const planConfig = config[plan] || config.free_trial;
    const Icon = planConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 font-medium capitalize ${planConfig.className}`}>
        {Icon && <Icon className="h-3 w-3" />}
        {plan.replace("_", " ")}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statsData = [
    {
      label: "Total",
      value: stats.total,
      icon: CreditCard,
      color: "from-primary/10 to-emerald-500/10",
      iconColor: "text-primary",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      color: "from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600",
    },
    {
      label: "Trialing",
      value: stats.trialing,
      icon: RefreshCw,
      color: "from-accent/10 to-blue-500/10",
      iconColor: "text-accent",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "from-destructive/10 to-red-500/10",
      iconColor: "text-destructive",
    },
    {
      label: "MRR",
      value: formatCurrency(stats.mrr),
      icon: DollarSign,
      color: "from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600",
      isRevenue: true,
    },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Subscriptions" description="Manage platform subscriptions" />
        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Subscriptions"
        description="Manage and monitor platform subscriptions"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {statsData.map((stat, index) => (
            <div
              key={stat.label}
              className="card-premium p-5 group hover:shadow-soft-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-display font-bold ${stat.isRevenue ? 'text-emerald-600' : ''}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-premium"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full sm:w-44 input-premium">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free_trial">Free Trial</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 input-premium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions Table */}
        <div className="card-premium overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">All Subscriptions</CardTitle>
                <CardDescription>Manage doctor subscriptions and billing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {subscriptions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No subscriptions found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Doctor</TableHead>
                      <TableHead className="font-semibold">Plan</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Period End</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription, index) => {
                      const daysLeft = Math.max(
                        0,
                        Math.ceil(
                          (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      );

                      return (
                        <TableRow
                          key={subscription.id}
                          className="group"
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <span className="font-display font-bold text-primary">
                                  {subscription.doctor.fullName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{subscription.doctor.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subscription.doctor.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                          <TableCell>
                            {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{formatDate(subscription.currentPeriodEnd)}</p>
                              {subscription.plan === "free_trial" && (
                                <p className={`text-xs ${daysLeft <= 3 ? 'text-destructive' : daysLeft <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                  {daysLeft} days left
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubscription(subscription);
                                    setShowDetailsDialog(true);
                                  }}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {subscription.plan === "free_trial" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleExtendTrial(subscription.id, 7)}
                                      className="gap-2"
                                    >
                                      <Calendar className="h-4 w-4 text-accent" />
                                      Extend Trial +7 days
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleExtendTrial(subscription.id, 14)}
                                      className="gap-2"
                                    >
                                      <Calendar className="h-4 w-4 text-accent" />
                                      Extend Trial +14 days
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleCancelSubscription(subscription.id)}
                                      className="text-destructive focus:text-destructive gap-2"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Cancel Subscription
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 px-4">
              <span className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Details
            </DialogTitle>
            <DialogDescription>
              View and manage subscription information
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{selectedSubscription.doctor.fullName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium text-sm">{selectedSubscription.doctor.user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Plan</Label>
                  <div>{getPlanBadge(selectedSubscription.plan)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>
                    {getStatusBadge(
                      selectedSubscription.status,
                      selectedSubscription.cancelAtPeriodEnd
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Period Start</Label>
                  <p className="font-medium text-sm">
                    {formatDate(selectedSubscription.currentPeriodStart)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Period End</Label>
                  <p className="font-medium text-sm">
                    {formatDate(selectedSubscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              {selectedSubscription.stripeSubscriptionId && (
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground">Stripe Subscription ID</Label>
                  <p className="font-mono text-sm mt-1 bg-muted/50 px-3 py-2 rounded-lg">
                    {selectedSubscription.stripeSubscriptionId}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
