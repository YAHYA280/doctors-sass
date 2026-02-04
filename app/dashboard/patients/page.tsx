"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  appointmentCount: number;
  lastAppointment: string | null;
  formSubmissions: {
    id: string;
    formName: string;
    submittedAt: string;
    data: Record<string, any>;
  }[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);

      const response = await fetch(`/api/doctors/patients?${params}`);
      const data = await response.json();

      if (data.success) {
        setPatients(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsDialog(true);
  };

  const stats = {
    total: patients.length,
    active: patients.filter((p) => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return p.lastAppointment && new Date(p.lastAppointment) > lastMonth;
    }).length,
    forms: patients.reduce((acc, p) => acc + (p.formSubmissions?.length || 0), 0),
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Patients"
        description="View and manage your patient records"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-premium group hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="font-display text-3xl font-bold mt-1">{loading ? "-" : stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium group hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active (Last 30 days)</p>
                  <p className="font-display text-3xl font-bold text-success mt-1">{loading ? "-" : stats.active}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium group hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Form Submissions</p>
                  <p className="font-display text-3xl font-bold text-accent mt-1">{loading ? "-" : stats.forms}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
          />
        </div>

        {/* Patients List */}
        <Card className="card-premium overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">No patients found</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Patients will appear here after they book appointments
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {patients.map((patient, index) => (
                  <div
                    key={patient.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/30 transition-colors group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Patient Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                        <span className="font-display font-semibold text-primary text-lg">
                          {patient.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{patient.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Patient since {formatDate(patient.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex gap-2">
                        <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 px-2.5 py-1">
                          {patient.appointmentCount} visits
                        </Badge>
                        {patient.formSubmissions?.length > 0 && (
                          <Badge className="rounded-full bg-accent/10 text-accent border-accent/20 px-2.5 py-1">
                            {patient.formSubmissions.length} forms
                          </Badge>
                        )}
                      </div>

                      {/* Contact Icons */}
                      <div className="flex items-center gap-1">
                        {patient.phone && (
                          <a
                            href={`tel:${patient.phone}`}
                            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        <a
                          href={`mailto:${patient.email}`}
                          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                          <DropdownMenuItem
                            onClick={() => viewPatientDetails(patient)}
                            className="rounded-lg cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => window.location.href = `mailto:${patient.email}`}
                            className="rounded-lg cursor-pointer"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          {patient.phone && (
                            <DropdownMenuItem
                              onClick={() => window.location.href = `tel:${patient.phone}`}
                              className="rounded-lg cursor-pointer"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Patient
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 px-3">
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
              className="rounded-lg gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6 py-2">
              {/* Patient Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                  <span className="font-display font-bold text-primary text-xl">
                    {selectedPatient.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedPatient.fullName}</h3>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {selectedPatient.email}
                    </span>
                    {selectedPatient.phone && (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {selectedPatient.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedPatient.phone && (
                    <Button size="icon" variant="outline" className="rounded-lg h-9 w-9" asChild>
                      <a href={`tel:${selectedPatient.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="icon" variant="outline" className="rounded-lg h-9 w-9" asChild>
                    <a href={`mailto:${selectedPatient.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                  <p className="font-display text-2xl font-bold text-primary">{selectedPatient.appointmentCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 text-center">
                  <p className="font-display text-2xl font-bold text-accent">
                    {selectedPatient.formSubmissions?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Forms Submitted</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                  <p className="font-display text-sm font-semibold">
                    {selectedPatient.lastAppointment
                      ? formatDate(selectedPatient.lastAppointment)
                      : "Never"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Last Visit</p>
                </div>
              </div>

              {/* Form Submissions */}
              {selectedPatient.formSubmissions && selectedPatient.formSubmissions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Form Submissions
                  </h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-3 pr-4">
                      {selectedPatient.formSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{submission.formName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(submission.submittedAt)}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            {Object.entries(submission.data).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-muted-foreground capitalize min-w-[100px]">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span className="text-foreground">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
