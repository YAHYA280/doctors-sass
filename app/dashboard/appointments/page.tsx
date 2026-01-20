"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  Filter,
  Check,
  X,
  Clock,
  MoreHorizontal,
  Phone,
  Mail,
  CalendarX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate, formatTime, cn } from "@/lib/utils";

interface Appointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes?: string;
  reason?: string;
  patient: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/doctors/appointments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const updateStatus = async () => {
    if (!selectedAppointment || !newStatus) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/doctors/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          status: newStatus,
          cancelReason: newStatus === "cancelled" ? cancelReason : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Appointment ${newStatus}`);
        setShowStatusDialog(false);
        fetchAppointments();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update appointment");
    } finally {
      setUpdating(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.patient.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return {
          badge: "bg-warning/10 text-warning border-warning/20",
          icon: <AlertCircle className="h-4 w-4" />,
          iconBg: "bg-warning/10 text-warning",
        };
      case "confirmed":
        return {
          badge: "bg-primary/10 text-primary border-primary/20",
          icon: <CheckCircle className="h-4 w-4" />,
          iconBg: "bg-primary/10 text-primary",
        };
      case "cancelled":
        return {
          badge: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <XCircle className="h-4 w-4" />,
          iconBg: "bg-destructive/10 text-destructive",
        };
      case "completed":
        return {
          badge: "bg-success/10 text-success border-success/20",
          icon: <Check className="h-4 w-4" />,
          iconBg: "bg-success/10 text-success",
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground",
          icon: <Clock className="h-4 w-4" />,
          iconBg: "bg-muted text-muted-foreground",
        };
    }
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Appointments"
        description="Manage your patient appointments"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "primary" },
            { label: "Pending", value: stats.pending, color: "warning" },
            { label: "Confirmed", value: stats.confirmed, color: "primary" },
            { label: "Completed", value: stats.completed, color: "success" },
            { label: "Cancelled", value: stats.cancelled, color: "destructive" },
          ].map((stat) => (
            <Card key={stat.label} className="card-premium">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn(
                  "font-display text-2xl font-bold mt-1",
                  stat.color === "warning" && "text-warning",
                  stat.color === "success" && "text-success",
                  stat.color === "destructive" && "text-destructive",
                  stat.color === "primary" && "text-foreground"
                )}>
                  {loading ? "-" : stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary/30"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-muted/50 border-transparent">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
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
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <CalendarX className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">No appointments found</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {search ? "Try adjusting your search terms" : "No appointments match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredAppointments.map((apt, index) => {
                  const statusStyles = getStatusStyles(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/30 transition-colors group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Patient Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                          <span className="font-display font-semibold text-primary text-lg">
                            {apt.patient.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{apt.patient.fullName}</p>
                          {apt.reason && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {apt.reason}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(apt.appointmentDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(apt.timeSlot)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Badge className={cn("rounded-full px-3 py-1.5 text-xs font-medium border", statusStyles.badge)}>
                          {statusStyles.icon}
                          <span className="ml-1.5 capitalize">{apt.status}</span>
                        </Badge>

                        {/* Contact Icons */}
                        <div className="flex items-center gap-1">
                          {apt.patient.phone && (
                            <a
                              href={`tel:${apt.patient.phone}`}
                              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Phone className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                          {apt.patient.whatsappNumber && (
                            <a
                              href={`https://wa.me/${apt.patient.whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                          {apt.patient.email && (
                            <a
                              href={`mailto:${apt.patient.email}`}
                              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                            {apt.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setNewStatus("confirmed");
                                  setShowStatusDialog(true);
                                }}
                                className="rounded-lg cursor-pointer"
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                Confirm
                              </DropdownMenuItem>
                            )}
                            {(apt.status === "pending" || apt.status === "confirmed") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setNewStatus("completed");
                                  setShowStatusDialog(true);
                                }}
                                className="rounded-lg cursor-pointer"
                              >
                                <Check className="h-4 w-4 mr-2 text-primary" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {apt.status !== "cancelled" && apt.status !== "completed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    setNewStatus("cancelled");
                                    setCancelReason("");
                                    setShowStatusDialog(true);
                                  }}
                                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {newStatus === "cancelled"
                ? "Cancel Appointment"
                : newStatus === "confirmed"
                ? "Confirm Appointment"
                : "Complete Appointment"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "cancelled"
                ? "This action cannot be undone."
                : "The patient will be notified of this update."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedAppointment && (
              <div className="bg-muted/50 p-4 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                    <span className="font-display font-semibold text-primary">
                      {selectedAppointment.patient.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedAppointment.patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.timeSlot)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {newStatus === "cancelled" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for cancellation</Label>
                <Textarea
                  placeholder="Optional: Provide a reason for the cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={updateStatus}
              disabled={updating}
              variant={newStatus === "cancelled" ? "destructive" : "default"}
              className="rounded-xl gap-2"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
