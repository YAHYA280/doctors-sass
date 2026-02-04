"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Stethoscope,
  Shield,
  CalendarDays,
  Building2,
  Info,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AppointmentData {
  id: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  canModify: boolean;
  modifyDeadline: string;
  doctor: {
    fullName: string;
    specialty: string | null;
    clinicName: string | null;
    address: string | null;
    phone: string | null;
    brandColor: string;
  };
  patient: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  availableSlots?: {
    date: string;
    slots: string[];
  }[];
}

export default function ManageAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/booking/manage?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setAppointment(data.data);
      } else {
        setError(data.error || "Appointment not found");
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      setError("Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/booking/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason: cancelReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Appointment cancelled successfully");
        setShowCancelDialog(false);
        fetchAppointment();
      } else {
        toast.error(data.error || "Failed to cancel appointment");
      }
    } catch (error) {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setRescheduling(true);
    try {
      const response = await fetch("/api/booking/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newDate: selectedDate,
          newTime: selectedTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Appointment rescheduled successfully");
        setShowRescheduleDialog(false);
        fetchAppointment();
      } else {
        toast.error(data.error || "Failed to reschedule appointment");
      }
    } catch (error) {
      toast.error("Failed to reschedule appointment");
    } finally {
      setRescheduling(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, {
      label: string;
      variant: "default" | "success" | "destructive" | "secondary" | "warning";
      icon: any;
      bgColor: string;
      textColor: string;
    }> = {
      scheduled: {
        label: "Scheduled",
        variant: "default",
        icon: Clock,
        bgColor: "bg-primary/10",
        textColor: "text-primary"
      },
      confirmed: {
        label: "Confirmed",
        variant: "success",
        icon: CheckCircle,
        bgColor: "bg-success/10",
        textColor: "text-success"
      },
      completed: {
        label: "Completed",
        variant: "secondary",
        icon: CheckCircle,
        bgColor: "bg-muted",
        textColor: "text-muted-foreground"
      },
      cancelled: {
        label: "Cancelled",
        variant: "destructive",
        icon: XCircle,
        bgColor: "bg-destructive/10",
        textColor: "text-destructive"
      },
      no_show: {
        label: "No Show",
        variant: "destructive",
        icon: AlertTriangle,
        bgColor: "bg-warning/10",
        textColor: "text-warning"
      },
    };
    return configs[status] || configs.scheduled;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="bg-gradient-to-br from-primary to-primary/80 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <Skeleton className="h-8 w-64 mx-auto bg-white/20" />
            <Skeleton className="h-5 w-48 mx-auto mt-2 bg-white/20" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 -mt-6">
          <Card className="card-premium">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="card-premium max-w-md w-full animate-fade-in">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-warning" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-3">Unable to Load Appointment</h2>
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              This link may have expired or the appointment may no longer exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) return null;

  const brandColor = appointment.doctor.brandColor || "#0A6847";
  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Header */}
      <header
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
        }}
      >
        {/* Background patterns */}
        <div className="absolute inset-0 dot-pattern text-white/5" />
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px]" />

        <div className="max-w-2xl mx-auto px-4 py-12 relative text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
            <Stethoscope className="h-4 w-4" />
            <span className="text-sm font-medium">MediBook</span>
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">Manage Your Appointment</h1>
          <p className="text-white/80">with Dr. {appointment.doctor.fullName}</p>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 -mt-4 space-y-6 animate-fade-in">
        {/* Status Card */}
        <Card className="card-premium overflow-hidden">
          <div
            className="h-2"
            style={{ backgroundColor: brandColor }}
          />
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center",
                  statusConfig.bgColor
                )}>
                  <StatusIcon className={cn("h-7 w-7", statusConfig.textColor)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointment Status</p>
                  <Badge
                    variant={statusConfig.variant}
                    className="mt-1 text-sm px-3 py-1"
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {appointment.canModify && appointment.status !== "cancelled" && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none rounded-xl"
                    onClick={() => setShowRescheduleDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 sm:flex-none rounded-xl"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {appointment.canModify && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5" />
                <span>You can modify this appointment until {formatDateTime(appointment.modifyDeadline)}</span>
              </div>
            )}

            {!appointment.canModify && appointment.status !== "cancelled" && (
              <div className="mt-4 flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>The modification window has passed. Please contact the clinic directly for changes.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: brandColor + "15" }}
              >
                <CalendarDays className="h-5 w-5" style={{ color: brandColor }} />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Appointment Details</CardTitle>
                <CardDescription>Your scheduled visit information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: brandColor + "08" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" style={{ color: brandColor }} />
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
                <p className="font-semibold text-lg">{formatDate(appointment.date)}</p>
              </div>
              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: brandColor + "08" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" style={{ color: brandColor }} />
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
                <p className="font-semibold text-lg" style={{ color: brandColor }}>
                  {appointment.time}
                </p>
              </div>
            </div>

            {appointment.notes && (
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                <p className="text-sm font-medium text-accent mb-1 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Notes from Clinic
                </p>
                <p className="text-sm text-accent/80">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Info */}
        <Card className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: brandColor + "15" }}
              >
                <Stethoscope className="h-5 w-5" style={{ color: brandColor }} />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Doctor Information</CardTitle>
                <CardDescription>Your healthcare provider</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-display text-xl font-semibold"
                style={{ backgroundColor: brandColor }}
              >
                {appointment.doctor.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-lg">Dr. {appointment.doctor.fullName}</p>
                {appointment.doctor.specialty && (
                  <Badge variant="secondary" className="mt-1">{appointment.doctor.specialty}</Badge>
                )}
              </div>
            </div>

            {(appointment.doctor.clinicName || appointment.doctor.address) && (
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  {appointment.doctor.clinicName && (
                    <p className="font-medium">{appointment.doctor.clinicName}</p>
                  )}
                  {appointment.doctor.address && (
                    <p className="text-sm text-muted-foreground mt-1">{appointment.doctor.address}</p>
                  )}
                </div>
              </div>
            )}

            {appointment.doctor.phone && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <a
                  href={`tel:${appointment.doctor.phone}`}
                  className="text-primary font-medium hover:underline"
                >
                  {appointment.doctor.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Info */}
        <Card className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: brandColor + "15" }}
              >
                <User className="h-5 w-5" style={{ color: brandColor }} />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Your Information</CardTitle>
                <CardDescription>Patient details on file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-display text-lg font-semibold text-primary">
                {appointment.patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-lg">{appointment.patient.fullName}</p>
                <p className="text-sm text-muted-foreground">Patient</p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{appointment.patient.email}</span>
              </div>
              {appointment.patient.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{appointment.patient.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your data is secure and HIPAA compliant</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by <span className="font-semibold">MediBook</span>
          </p>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="dialog-premium sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl">Cancel Appointment</DialogTitle>
                <DialogDescription>This action cannot be undone</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: brandColor + "08" }}
            >
              <p className="font-semibold">
                {formatDate(appointment.date)} at {appointment.time}
              </p>
              <p className="text-sm text-muted-foreground">
                with Dr. {appointment.doctor.fullName}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason for cancellation (optional)</Label>
              <Textarea
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input-premium resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="rounded-xl"
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-xl"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="dialog-premium sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: brandColor + "15" }}
              >
                <Edit className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <DialogTitle className="font-display text-xl">Reschedule Appointment</DialogTitle>
                <DialogDescription>Select a new date and time</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Current appointment</p>
              <p className="font-semibold">
                {formatDate(appointment.date)} at {appointment.time}
              </p>
            </div>

            {appointment.availableSlots && appointment.availableSlots.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select New Date</Label>
                  <Select value={selectedDate} onValueChange={(value) => {
                    setSelectedDate(value);
                    setSelectedTime("");
                  }}>
                    <SelectTrigger className="input-premium h-12">
                      <SelectValue placeholder="Choose a date" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointment.availableSlots.map((slot) => (
                        <SelectItem key={slot.date} value={slot.date}>
                          {formatDate(slot.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select New Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="input-premium h-12">
                        <SelectValue placeholder="Choose a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointment.availableSlots
                          .find((s) => s.date === selectedDate)
                          ?.slots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <div
                    className="p-4 rounded-xl border-2"
                    style={{
                      backgroundColor: brandColor + "08",
                      borderColor: brandColor + "20"
                    }}
                  >
                    <p className="text-sm text-muted-foreground mb-1">New appointment</p>
                    <p className="font-semibold" style={{ color: brandColor }}>
                      {formatDate(selectedDate)} at {selectedTime}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No available slots at the moment</p>
                <p className="text-sm mt-1">Please contact the clinic directly.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRescheduleDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduling || !selectedDate || !selectedTime}
              className="rounded-xl"
              style={{ backgroundColor: brandColor }}
            >
              {rescheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reschedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
