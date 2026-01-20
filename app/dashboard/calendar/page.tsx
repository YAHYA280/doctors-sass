"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarX,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

interface TimeSlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blockForm, setBlockForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/doctors/availability");
      const data = await response.json();

      if (data.success) {
        setAvailability(data.data.availability || []);
        setBlockedSlots(data.data.blockedSlots || []);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    setAvailability([
      ...availability,
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        isActive: true,
      },
    ]);
  };

  const updateTimeSlot = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const removeTimeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/doctors/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Availability saved");
        fetchAvailability();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const blockDate = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch("/api/doctors/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block",
          date: selectedDate.toISOString().split("T")[0],
          startTime: blockForm.startTime,
          endTime: blockForm.endTime,
          reason: blockForm.reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Time blocked successfully");
        setShowBlockDialog(false);
        setSelectedDate(undefined);
        setBlockForm({ startTime: "09:00", endTime: "17:00", reason: "" });
        fetchAvailability();
      } else {
        toast.error(data.error || "Failed to block time");
      }
    } catch (error) {
      toast.error("Failed to block time");
    }
  };

  const unblockSlot = async (slotId: string) => {
    try {
      const response = await fetch("/api/doctors/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedSlotId: slotId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Block removed");
        fetchAvailability();
      } else {
        toast.error(data.error || "Failed to remove block");
      }
    } catch (error) {
      toast.error("Failed to remove block");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Calendar" description="Manage your availability" />
        <div className="p-4 lg:p-8 space-y-6">
          <Skeleton className="h-80 rounded-2xl" />
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
        title="Calendar & Availability"
        description="Set your working hours and block specific times"
        actions={
          <Button
            onClick={addTimeSlot}
            className="rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Time Slot
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Weekly Availability */}
        <Card className="card-premium">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Weekly Availability</CardTitle>
                <CardDescription>Set your regular working hours for each day</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {availability.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">No availability set</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                  Add time slots for when you're available to see patients
                </p>
                <Button onClick={addTimeSlot} className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {availability.map((slot, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-wrap items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                      slot.isActive
                        ? "bg-muted/30 border-border/50"
                        : "bg-muted/10 border-border/30 opacity-60"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={slot.isActive}
                        onCheckedChange={(checked) =>
                          updateTimeSlot(index, "isActive", checked)
                        }
                      />
                      <Badge className={cn(
                        "rounded-lg px-2 py-1 text-xs font-medium",
                        slot.isActive
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {slot.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <Select
                      value={slot.dayOfWeek.toString()}
                      onValueChange={(value) =>
                        updateTimeSlot(index, "dayOfWeek", parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-36 h-10 rounded-xl bg-background border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "startTime", e.target.value)
                        }
                        className="w-32 h-10 rounded-xl bg-background border-border/50"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "endTime", e.target.value)
                        }
                        className="w-32 h-10 rounded-xl bg-background border-border/50"
                      />
                    </div>

                    <Select
                      value={slot.slotDuration.toString()}
                      onValueChange={(value) =>
                        updateTimeSlot(index, "slotDuration", parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-28 h-10 rounded-xl bg-background border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(index)}
                      className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
                  <Button
                    onClick={saveAvailability}
                    disabled={saving}
                    className="rounded-xl gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Availability
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Block Time Off */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-premium">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Block Time Off</CardTitle>
                  <CardDescription>Select dates to block for time off</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) setShowBlockDialog(true);
                }}
                disabled={(date) => date < new Date()}
                className="rounded-xl border border-border/50"
              />
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <CalendarX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Blocked Times</CardTitle>
                  <CardDescription>Your scheduled time off</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {blockedSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <CalendarX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No blocked times</p>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Select a date from the calendar to block time off
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-premium pr-2">
                  {blockedSlots.map((slot, index) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10 group hover:bg-destructive/10 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(slot.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.reason && (
                            <p className="text-xs text-muted-foreground/70 mt-1">{slot.reason}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unblockSlot(slot.id)}
                        className="h-9 w-9 rounded-lg opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Block Time Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Block Time Off</DialogTitle>
            <DialogDescription>
              This time will be unavailable for patient bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs text-muted-foreground">Selected Date</Label>
              <p className="font-display text-lg font-semibold mt-1">
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={blockForm.startTime}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, startTime: e.target.value })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={blockForm.endTime}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, endTime: e.target.value })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason (optional)</Label>
              <Input
                placeholder="e.g., Vacation, Training, Holiday"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBlockDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={blockDate} className="rounded-xl gap-2">
              <CalendarX className="h-4 w-4" />
              Block Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
