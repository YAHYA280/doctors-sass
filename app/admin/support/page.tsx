"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HeadphonesIcon,
  Search,
  MessageSquare,
  Check,
  Clock,
  AlertCircle,
  Send,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/tickets?${params}`);
      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, search]);

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Ticket status updated");
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Reply sent");
        setShowReplyDialog(false);
        setReplyMessage("");
        fetchTickets();
      }
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      open: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: AlertCircle,
      },
      in_progress: {
        className: "bg-accent/10 text-accent border-accent/20",
        icon: Clock,
      },
      resolved: {
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      },
      closed: {
        className: "bg-muted text-muted-foreground border-border",
        icon: XCircle,
      },
    };
    const statusConfig = config[status] || config.open;
    const Icon = statusConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 font-medium ${statusConfig.className}`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      urgent: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: AlertTriangle,
      },
      high: {
        className: "bg-amber-500/10 text-amber-700 border-amber-200",
        icon: AlertCircle,
      },
      medium: {
        className: "bg-accent/10 text-accent border-accent/20",
        icon: Clock,
      },
      low: {
        className: "bg-muted text-muted-foreground border-border",
        icon: Check,
      },
    };
    const priorityConfig = config[priority] || config.low;
    const Icon = priorityConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 font-medium capitalize ${priorityConfig.className}`}>
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const statsData = [
    {
      label: "Open",
      value: tickets.filter((t) => t.status === "open").length,
      icon: AlertCircle,
      color: "from-destructive/10 to-red-500/10",
      iconColor: "text-destructive",
    },
    {
      label: "In Progress",
      value: tickets.filter((t) => t.status === "in_progress").length,
      icon: Clock,
      color: "from-accent/10 to-blue-500/10",
      iconColor: "text-accent",
    },
    {
      label: "Resolved",
      value: tickets.filter((t) => t.status === "resolved").length,
      icon: CheckCircle2,
      color: "from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600",
    },
    {
      label: "High Priority",
      value: tickets.filter((t) => t.priority === "urgent" || t.priority === "high").length,
      icon: AlertTriangle,
      color: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Support Tickets"
        description="Manage customer support requests"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-premium"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 input-premium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-44 input-premium">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
        <div className="card-premium overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                <HeadphonesIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Support Tickets</CardTitle>
                <CardDescription>View and respond to customer inquiries</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No tickets found</h3>
                <p className="text-sm text-muted-foreground">
                  All caught up! There are no support tickets matching your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket, index) => (
                      <TableRow
                        key={ticket.id}
                        className="group cursor-pointer"
                        style={{ animationDelay: `${index * 0.02}s` }}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowReplyDialog(true);
                        }}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {ticket.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{ticket.user.email}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(ticket.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setShowReplyDialog(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reply to Ticket
            </DialogTitle>
            <DialogDescription>
              Review and respond to this support ticket
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-semibold">{selectedTicket.subject}</h4>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedTicket.message}
                </p>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    From: <span className="font-medium">{selectedTicket.user.email}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Update Status</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Reply</Label>
                <Textarea
                  placeholder="Type your reply to the customer..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="input-premium resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={sending || !replyMessage.trim()}
              className="btn-premium bg-primary text-primary-foreground gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
