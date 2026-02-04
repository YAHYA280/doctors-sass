"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { IS_MOCK_MODE } from "@/lib/mock-data";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  CreditCard,
  BarChart3,
  HeadphonesIcon,
  Link2,
  UserCircle,
  UsersRound,
  ChevronDown,
  Sparkles,
  Crown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: "primary" | "destructive" | "success" | "warning";
}

const doctorMenuItems: SidebarItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { title: "Patients", href: "/dashboard/patients", icon: Users },
  { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { title: "Forms", href: "/dashboard/forms", icon: FileText },
  { title: "My Page", href: "/dashboard/my-page", icon: Link2 },
  { title: "Team", href: "/dashboard/team", icon: UsersRound },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminMenuItems: SidebarItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { title: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

interface DashboardSidebarProps {
  variant: "doctor" | "admin";
}

export function DashboardSidebar({ variant }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { session } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = variant === "admin" ? adminMenuItems : doctorMenuItems;
  const basePath = variant === "admin" ? "/admin" : "/dashboard";

  const userEmail = session?.user?.email || "";
  const userName = variant === "doctor"
    ? session?.user?.doctorSlug?.replace(/-/g, " ") || userEmail
    : "Admin";

  const getBadgeClasses = (color?: string) => {
    switch (color) {
      case "destructive":
        return "bg-destructive/10 text-destructive";
      case "success":
        return "bg-success/10 text-success";
      case "warning":
        return "bg-warning/10 text-warning";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <aside className="fixed top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border lg:block hidden">
        <div className="h-18 flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-semibold text-xl tracking-tight">MediBook</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              {variant === "admin" ? "Admin Portal" : "Doctor Portal"}
            </span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl transition-all duration-300",
          "bg-white/80 backdrop-blur-xl border border-border shadow-soft-sm",
          "hover:bg-white hover:shadow-soft active:scale-95"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity duration-300",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-72 transition-all duration-300 ease-out lg:translate-x-0",
          "bg-gradient-to-b from-card via-card to-card/95",
          "border-r border-border",
          isMobileOpen ? "translate-x-0 shadow-soft-xl" : "-translate-x-full"
        )}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="h-18 flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary/30">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-xl tracking-tight">MediBook</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {variant === "admin" ? "Admin Portal" : "Doctor Portal"}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6">
            <nav className="px-4 space-y-1.5">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href ||
                  (item.href !== basePath && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-soft-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    style={{
                      animationDelay: mounted ? `${index * 50}ms` : undefined,
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}

                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )} />

                    <span className="flex-1">{item.title}</span>

                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        isActive ? "bg-white/20 text-white" : getBadgeClasses(item.badgeColor)
                      )}>
                        {item.badge}
                      </span>
                    )}

                    {!isActive && (
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-200" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Upgrade Card (only for doctor variant) */}
            {variant === "doctor" && (
              <div className="mx-4 mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Upgrade Plan</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Unlock advanced features and grow your practice.
                </p>
                <Link
                  href="/dashboard/settings?tab=billing"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  View Plans
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-border bg-muted/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-background/80 transition-all duration-200 group">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-all duration-200 group-hover:ring-primary/30">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate capitalize">
                      {userName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (IS_MOCK_MODE) {
                      window.location.href = "/";
                    } else {
                      import("next-auth/react").then(({ signOut }) => {
                        signOut({ callbackUrl: "/" });
                      });
                    }
                  }}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
}
