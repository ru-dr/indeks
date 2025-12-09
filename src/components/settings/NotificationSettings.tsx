"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Bell,
  Mail,
  Monitor,
  Users,
  Shield,
  TrendingUp,
  FileText,
  Sparkles,
  Activity,
  Server,
  Bug,
} from "lucide-react";

interface NotificationPreferences {
  
  emailAccountUpdates: boolean;
  emailSecurityAlerts: boolean;
  emailWeeklyReports: boolean;
  emailProductUpdates: boolean;
  emailUsageAlerts: boolean;
  emailOrgActivity: boolean;
  
  inAppTeamInvitations: boolean;
  inAppUptimeAlerts: boolean;
  inAppErrorAlerts: boolean;
  inAppUsageAlerts: boolean;
  inAppSecurityAlerts: boolean;
  inAppOrgActivity: boolean;
  inAppProductUpdates: boolean;
  inAppWeeklyReports: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailAccountUpdates: true,
  emailSecurityAlerts: true,
  emailWeeklyReports: false,
  emailProductUpdates: true,
  emailUsageAlerts: true,
  emailOrgActivity: false,
  inAppTeamInvitations: true,
  inAppUptimeAlerts: true,
  inAppErrorAlerts: true,
  inAppUsageAlerts: true,
  inAppSecurityAlerts: true,
  inAppOrgActivity: true,
  inAppProductUpdates: true,
  inAppWeeklyReports: false,
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/notifications/preferences", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPreferences({ ...defaultPreferences, ...result.data });
        }
      }
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    setSaving(key);

    
    setPreferences((prev) => ({ ...prev, [key]: newValue }));

    try {
      const response = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [key]: newValue }),
      });

      if (!response.ok) {
        
        setPreferences((prev) => ({ ...prev, [key]: !newValue }));
        toastManager.add({
          type: "error",
          title: "Failed to update preference",
        });
      }
    } catch (error) {
      console.error("Failed to update preference:", error);
      
      setPreferences((prev) => ({ ...prev, [key]: !newValue }));
      toastManager.add({
        type: "error",
        title: "Failed to update preference",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-indeks-yellow)]/10">
            <Bell className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
          </div>
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose what updates you receive via email and in-app
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Email Notifications</h4>
          </div>
          <div className="rounded-lg border divide-y">
            <NotificationToggle
              icon={Users}
              title="Account Updates"
              description="Important account-related emails"
              checked={preferences.emailAccountUpdates}
              onChange={() => handleToggle("emailAccountUpdates")}
              loading={saving === "emailAccountUpdates"}
            />
            <NotificationToggle
              icon={Shield}
              title="Security Alerts"
              description="Suspicious activity and security issues"
              checked={preferences.emailSecurityAlerts}
              onChange={() => handleToggle("emailSecurityAlerts")}
              loading={saving === "emailSecurityAlerts"}
              important
            />
            <NotificationToggle
              icon={TrendingUp}
              title="Usage Alerts"
              description="When approaching plan limits"
              checked={preferences.emailUsageAlerts}
              onChange={() => handleToggle("emailUsageAlerts")}
              loading={saving === "emailUsageAlerts"}
            />
            <NotificationToggle
              icon={FileText}
              title="Weekly Reports"
              description="Analytics summary every week"
              checked={preferences.emailWeeklyReports}
              onChange={() => handleToggle("emailWeeklyReports")}
              loading={saving === "emailWeeklyReports"}
            />
            <NotificationToggle
              icon={Sparkles}
              title="Product Updates"
              description="New features and improvements"
              checked={preferences.emailProductUpdates}
              onChange={() => handleToggle("emailProductUpdates")}
              loading={saving === "emailProductUpdates"}
            />
            <NotificationToggle
              icon={Activity}
              title="Organization Activity"
              description="Team member actions and changes"
              checked={preferences.emailOrgActivity}
              onChange={() => handleToggle("emailOrgActivity")}
              loading={saving === "emailOrgActivity"}
            />
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">In-App Notifications</h4>
          </div>
          <div className="rounded-lg border divide-y">
            <NotificationToggle
              icon={Users}
              title="Team Invitations"
              description="Pending organization invites"
              checked={preferences.inAppTeamInvitations}
              onChange={() => handleToggle("inAppTeamInvitations")}
              loading={saving === "inAppTeamInvitations"}
              highlighted
            />
            <NotificationToggle
              icon={Server}
              title="Uptime Alerts"
              description="Site down/up notifications"
              checked={preferences.inAppUptimeAlerts}
              onChange={() => handleToggle("inAppUptimeAlerts")}
              loading={saving === "inAppUptimeAlerts"}
              important
            />
            <NotificationToggle
              icon={Bug}
              title="Error Alerts"
              description="Error spikes and issues"
              checked={preferences.inAppErrorAlerts}
              onChange={() => handleToggle("inAppErrorAlerts")}
              loading={saving === "inAppErrorAlerts"}
              important
            />
            <NotificationToggle
              icon={TrendingUp}
              title="Usage Alerts"
              description="Approaching plan limits"
              checked={preferences.inAppUsageAlerts}
              onChange={() => handleToggle("inAppUsageAlerts")}
              loading={saving === "inAppUsageAlerts"}
            />
            <NotificationToggle
              icon={Shield}
              title="Security Alerts"
              description="Security-related notifications"
              checked={preferences.inAppSecurityAlerts}
              onChange={() => handleToggle("inAppSecurityAlerts")}
              loading={saving === "inAppSecurityAlerts"}
              important
            />
            <NotificationToggle
              icon={Activity}
              title="Organization Activity"
              description="Team member actions"
              checked={preferences.inAppOrgActivity}
              onChange={() => handleToggle("inAppOrgActivity")}
              loading={saving === "inAppOrgActivity"}
            />
            <NotificationToggle
              icon={Sparkles}
              title="Product Updates"
              description="New features announcements"
              checked={preferences.inAppProductUpdates}
              onChange={() => handleToggle("inAppProductUpdates")}
              loading={saving === "inAppProductUpdates"}
            />
            <NotificationToggle
              icon={FileText}
              title="Weekly Reports"
              description="Analytics summaries in-app"
              checked={preferences.inAppWeeklyReports}
              onChange={() => handleToggle("inAppWeeklyReports")}
              loading={saving === "inAppWeeklyReports"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationToggleProps {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
  important?: boolean;
  highlighted?: boolean;
}

function NotificationToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  loading,
  important,
  highlighted,
}: NotificationToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 transition-colors hover:bg-muted/50",
        highlighted && "bg-[var(--color-indeks-blue)]/5 hover:bg-[var(--color-indeks-blue)]/10",
        important && "bg-orange-500/5 hover:bg-orange-500/10"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner className="h-4 w-4" />
          </div>
        )}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={loading}
          className={loading ? "opacity-0" : ""}
        />
      </div>
    </div>
  );
}
