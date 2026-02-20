"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Globe,
  Save,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Placeholder for settings save logic
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Settings saved successfully");
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Platform Settings"
        description="Configure platform-wide settings and preferences"
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* General Settings */}
        <div className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">General</CardTitle>
                <CardDescription>Platform name and branding</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input defaultValue="MediBook" className="input-premium" />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input defaultValue="support@medibook.com" className="input-premium" />
              </div>
            </div>
          </CardContent>
        </div>

        {/* Security Settings */}
        <div className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Security</CardTitle>
                <CardDescription>Authentication and access control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Email Verification</p>
                <p className="text-sm text-muted-foreground">New users must verify their email before accessing the platform</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-lock Inactive Accounts</p>
                <p className="text-sm text-muted-foreground">Disable accounts after 90 days of inactivity</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </div>

        {/* Notification Settings */}
        <div className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                <CardDescription>Email and system notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New User Registration</p>
                <p className="text-sm text-muted-foreground">Get notified when a new doctor registers</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Support Ticket Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for new support tickets</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Subscription Events</p>
                <p className="text-sm text-muted-foreground">Get notified for subscription changes and cancellations</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </div>

        {/* Database Settings */}
        <div className="card-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">System</CardTitle>
                <CardDescription>Database and system information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Environment</p>
                <p className="font-display font-semibold">
                  {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Framework</p>
                <p className="font-display font-semibold">Next.js 14</p>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
