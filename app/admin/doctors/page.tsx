"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Stethoscope,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Doctor {
  id: string;
  slug: string;
  fullName: string;
  specialty: string | null;
  phone: string | null;
  clinicName: string | null;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  email: string;
  appointmentCount: number;
  patientCount: number;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/doctors?${params}`);
      const data = await response.json();

      if (data.success) {
        setDoctors(data.data);
        setTotalPages(data.pagination.totalPages);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, search]);

  const getPlanBadge = (plan: string) => {
    const config: Record<string, string> = {
      advanced: "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 border-violet-200",
      premium: "bg-gradient-to-r from-primary/10 to-emerald-500/10 text-primary border-primary/20",
      free_trial: "bg-muted text-muted-foreground border-border",
    };

    return (
      <Badge variant="outline" className={`font-medium capitalize ${config[plan] || config.free_trial}`}>
        {plan.replace("_", " ")}
      </Badge>
    );
  };

  const statsData = [
    {
      label: "Total Doctors",
      value: stats.total,
      icon: Stethoscope,
      color: "from-primary/10 to-emerald-500/10",
      iconColor: "text-primary",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      color: "from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: XCircle,
      color: "from-destructive/10 to-red-500/10",
      iconColor: "text-destructive",
    },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Doctors" description="Manage platform doctors" />
        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
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
        title="Doctor Management"
        description="View and manage all registered doctors"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
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
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-premium"
            />
          </div>
        </div>

        {/* Doctors Table */}
        <div className="card-premium overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">All Doctors</CardTitle>
                <CardDescription>Registered doctors and their practice details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {doctors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No doctors found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Doctor</TableHead>
                      <TableHead className="font-semibold">Specialty</TableHead>
                      <TableHead className="font-semibold">Plan</TableHead>
                      <TableHead className="font-semibold">Patients</TableHead>
                      <TableHead className="font-semibold">Appointments</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Joined</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor, index) => (
                      <TableRow
                        key={doctor.id}
                        className="group"
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                              <span className="font-display font-bold text-primary">
                                {doctor.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{doctor.fullName}</p>
                              <p className="text-sm text-muted-foreground">{doctor.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{doctor.specialty || "Not set"}</span>
                        </TableCell>
                        <TableCell>{getPlanBadge(doctor.subscriptionPlan)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {doctor.patientCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {doctor.appointmentCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doctor.isActive ? (
                            <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1.5 bg-destructive/10 text-destructive border-destructive/20">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doctor.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dr/${doctor.slug}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </div>
  );
}
