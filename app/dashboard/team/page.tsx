"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import {
  Users,
  Plus,
  MoreHorizontal,
  Mail,
  Trash2,
  Crown,
  Shield,
  UserCog,
  Loader2,
  Sparkles,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SUBSCRIPTION_PLANS } from "@/constants/plans";

interface TeamMember {
  id: string;
  email: string;
  role: "admin" | "staff" | "viewer";
  status: "pending" | "active" | "inactive";
  invitedAt: string;
  joinedAt: string | null;
  user?: {
    id: string;
    email: string;
  };
}

export default function TeamPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "staff" as "admin" | "staff" | "viewer",
  });

  const subscriptionPlan = (session?.user as any)?.subscriptionPlan || "free_trial";
  const planLimits = SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS]?.limits;
  const maxTeamMembers: number = planLimits?.maxTeamMembers ?? 0;
  const canAddMembers = maxTeamMembers === -1 || teamMembers.length < maxTeamMembers;

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/doctors/team");
      const data = await response.json();

      if (data.success) {
        setTeamMembers(data.data);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch("/api/doctors/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Invitation sent!");
        setShowInviteDialog(false);
        setInviteForm({ email: "", role: "staff" });
        fetchTeamMembers();
      } else {
        toast.error(data.error || "Failed to send invitation");
      }
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch("/api/doctors/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Role updated");
        fetchTeamMembers();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const response = await fetch(`/api/doctors/team?memberId=${memberId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Team member removed");
        fetchTeamMembers();
      } else {
        toast.error(data.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      admin: {
        className: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-200",
        icon: Crown
      },
      staff: {
        className: "bg-gradient-to-r from-accent/10 to-blue-500/10 text-accent border-accent/20",
        icon: UserCog
      },
      viewer: {
        className: "bg-gradient-to-r from-muted to-muted text-muted-foreground border-border",
        icon: Shield
      },
    };
    const roleConfig = config[role] || config.viewer;
    const Icon = roleConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 font-medium ${roleConfig.className}`}>
        <Icon className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      active: {
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
        icon: CheckCircle2
      },
      pending: {
        className: "bg-amber-500/10 text-amber-700 border-amber-200",
        icon: Clock
      },
      inactive: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: Shield
      },
    };
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 ${statusConfig.className}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader title="Team" description="Manage your team members" />
        <div className="p-4 lg:p-8 space-y-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const roleDescriptions = [
    {
      role: "Admin",
      icon: Crown,
      color: "from-amber-500 to-yellow-500",
      shadowColor: "shadow-amber-500/20",
      description: "Full access to all features including team management, billing, and settings",
    },
    {
      role: "Staff",
      icon: UserCog,
      color: "from-accent to-blue-500",
      shadowColor: "shadow-accent/20",
      description: "Can manage appointments, patients, and forms. Cannot access billing or team settings",
    },
    {
      role: "Viewer",
      icon: Shield,
      color: "from-slate-500 to-gray-500",
      shadowColor: "shadow-slate-500/20",
      description: "Read-only access to appointments and patient information",
    },
  ];

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Team Management"
        description="Invite and manage your team members"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Plan Info Card */}
        <div className="card-premium overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary via-primary to-primary/90 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Team Members</p>
                  <p className="text-3xl font-display font-bold text-white">
                    {teamMembers.length}
                    <span className="text-white/60 text-lg font-normal ml-1">
                      / {maxTeamMembers === -1 ? "Unlimited" : maxTeamMembers}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!canAddMembers && maxTeamMembers !== -1 && (
                  <Badge className="bg-white/10 text-white border-white/20">
                    Limit Reached
                  </Badge>
                )}
                {canAddMembers && (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="bg-white text-primary hover:bg-white/90 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>
            </div>
            {!canAddMembers && (
              <p className="text-white/60 text-sm mt-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade your plan to add more team members
              </p>
            )}
          </div>
        </div>

        {/* Team Members Table */}
        <div className="card-premium overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Team Members</CardTitle>
                <CardDescription>People who can access your dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teamMembers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No team members yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Invite team members to help manage your practice and appointments
                </p>
                {canAddMembers && (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="btn-premium bg-primary text-primary-foreground gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Your First Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Member</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Invited</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member, index) => (
                      <TableRow
                        key={member.id}
                        className="group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{member.email}</p>
                              {member.joinedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Joined {formatDate(member.joinedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(member.invitedAt)}
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
                                onClick={() => updateMemberRole(member.id, "admin")}
                                disabled={member.role === "admin"}
                                className="gap-2"
                              >
                                <Crown className="h-4 w-4 text-amber-600" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateMemberRole(member.id, "staff")}
                                disabled={member.role === "staff"}
                                className="gap-2"
                              >
                                <UserCog className="h-4 w-4 text-accent" />
                                Make Staff
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateMemberRole(member.id, "viewer")}
                                disabled={member.role === "viewer"}
                                className="gap-2"
                              >
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => removeMember(member.id)}
                                className="text-destructive focus:text-destructive gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </div>

        {/* Role Descriptions */}
        <div className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-base font-semibold">Role Permissions</CardTitle>
            <CardDescription>Understanding what each role can do</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {roleDescriptions.map((role, index) => (
                <div
                  key={role.role}
                  className="group p-5 rounded-2xl border border-border bg-gradient-to-br from-background to-muted/20 hover:shadow-soft-md hover:border-primary/20 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg ${role.shadowColor} group-hover:scale-110 transition-transform`}>
                    <role.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-display font-semibold text-lg mb-2">{role.role}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on your practice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value: "admin" | "staff" | "viewer") =>
                  setInviteForm({ ...inviteForm, role: value })
                }
              >
                <SelectTrigger className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="py-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <div>
                        <span className="font-medium">Admin</span>
                        <span className="text-muted-foreground ml-2">- Full access</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff" className="py-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-accent" />
                      <div>
                        <span className="font-medium">Staff</span>
                        <span className="text-muted-foreground ml-2">- Manage appointments & patients</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer" className="py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Viewer</span>
                        <span className="text-muted-foreground ml-2">- Read-only access</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={inviteMember}
              disabled={inviting}
              className="btn-premium bg-primary text-primary-foreground gap-2"
            >
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
