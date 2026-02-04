"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Bell, Search, Moon, Sun, Command, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications] = useState([
    {
      id: "1",
      title: "New appointment",
      message: "John Doe booked an appointment for tomorrow",
      time: "5 min ago",
      read: false,
      type: "appointment" as const,
    },
    {
      id: "2",
      title: "Appointment cancelled",
      message: "Jane Smith cancelled her appointment",
      time: "1 hour ago",
      read: false,
      type: "cancellation" as const,
    },
    {
      id: "3",
      title: "Subscription renewed",
      message: "Your premium subscription has been renewed",
      time: "2 days ago",
      read: true,
      type: "subscription" as const,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return "bg-primary/10 text-primary";
      case "cancellation":
        return "bg-destructive/10 text-destructive";
      case "subscription":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-18 px-4 lg:px-8">
        {/* Spacer for mobile menu button */}
        <div className="lg:hidden w-14" />

        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Search (hidden on mobile) */}
          <div className="hidden lg:flex relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search anything..."
              className={cn(
                "pl-10 pr-12 w-72 h-10 rounded-xl",
                "bg-muted/50 border-transparent",
                "focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10",
                "transition-all duration-200"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground">
              <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl hover:bg-muted/50"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse-soft">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b border-border">
                <div>
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have {unreadCount} unread messages
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 rounded-lg hover:bg-background"
                >
                  Mark all read
                </Button>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[360px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No new notifications
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex items-start gap-3 p-4 mx-2 rounded-xl cursor-pointer focus:bg-muted/50"
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          getNotificationIcon(notification.type)
                        )}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-medium",
                              !notification.read ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                            {notification.time}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="border-t border-border p-3 bg-muted/30">
                <Link href="/dashboard/notifications">
                  <Button
                    variant="ghost"
                    className="w-full h-9 rounded-xl text-sm font-medium hover:bg-background"
                  >
                    View all notifications
                  </Button>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Actions */}
          {actions && (
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-2 border-l border-border">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
