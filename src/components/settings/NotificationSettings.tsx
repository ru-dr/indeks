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
  Server,
  Building2,
  UserPlus,
} from "lucide-react";

interface NotificationPreferences {
  emailAccountUpdates: boolean;
  inAppAccountUpdates: boolean;
  emailUptimeAlerts: boolean;
  inAppUptimeAlerts: boolean;
  emailOrgUpdates: boolean;
  inAppOrgUpdates: boolean;
  emailTeamInvitations: boolean;
  inAppTeamInvitations: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailAccountUpdates: true,
  inAppAccountUpdates: true,
  emailUptimeAlerts: true,
  inAppUptimeAlerts: true,
  emailOrgUpdates: true,
  inAppOrgUpdates: true,
  emailTeamInvitations: true,
  inAppTeamInvitations: true,
};

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Bell;
  emailKey: keyof NotificationPreferences;
  inAppKey: keyof NotificationPreferences;
  color: string;
}

const notificationCategories: NotificationCategory[] = [
  {
    id: "account",
    title: "Account Updates",
    description: "Password changes, security alerts, and profile updates",
    icon: Users,
    emailKey: "emailAccountUpdates",
    inAppKey: "inAppAccountUpdates",
    color: "#facc15",
  },
  {
    id: "uptime",
    title: "Uptime Alerts",
    description: "Site down/up notifications and performance degradation",
    icon: Server,
    emailKey: "emailUptimeAlerts",
    inAppKey: "inAppUptimeAlerts",
    color: "#ef4444",
  },
  {
    id: "org",
    title: "Organization Updates",
    description: "Member joins, leaves, and role changes",
    icon: Building2,
    emailKey: "emailOrgUpdates",
    inAppKey: "inAppOrgUpdates",
    color: "#3b82f6",
  },
  {
    id: "invitations",
    title: "Team Invitations",
    description: "Invitations to join organizations and teams",
    icon: UserPlus,
    emailKey: "emailTeamInvitations",
    inAppKey: "inAppTeamInvitations",
    color: "#10b981",
  },
];

export function NotificationSettings() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
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
              Choose how you want to be notified for different events
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Header row - hidden on mobile */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-4 px-4 pb-2 border-b">
          <div className="text-sm font-medium text-muted-foreground">
            Notification Type
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Email
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" />
            In-App
          </div>
        </div>

        {/* Notification categories */}
        <div className="space-y-1">
          {notificationCategories.map((category) => (
            <NotificationRow
              key={category.id}
              category={category}
              preferences={preferences}
              saving={saving}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Info text */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Email notifications will be sent to your registered email address.
            In-app notifications appear in the notification center at the top of
            the page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationRowProps {
  category: NotificationCategory;
  preferences: NotificationPreferences;
  saving: string | null;
  onToggle: (key: keyof NotificationPreferences) => void;
}

function NotificationRow({
  category,
  preferences,
  saving,
  onToggle,
}: NotificationRowProps) {
  const Icon = category.icon;
  const isEmailSaving = saving === category.emailKey;
  const isInAppSaving = saving === category.inAppKey;

  return (
    <div className="p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Desktop layout */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px] gap-4 items-center">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: category.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{category.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {category.description}
            </p>
          </div>
        </div>

        {/* Email toggle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {isEmailSaving && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Spinner className="h-4 w-4" />
              </div>
            )}
            <Switch
              checked={preferences[category.emailKey]}
              onCheckedChange={() => onToggle(category.emailKey)}
              disabled={isEmailSaving}
              className={cn(isEmailSaving && "opacity-0")}
            />
          </div>
        </div>

        {/* In-App toggle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {isInAppSaving && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Spinner className="h-4 w-4" />
              </div>
            )}
            <Switch
              checked={preferences[category.inAppKey]}
              onCheckedChange={() => onToggle(category.inAppKey)}
              disabled={isInAppSaving}
              className={cn(isInAppSaving && "opacity-0")}
            />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: category.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{category.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          </div>
        </div>

        {/* Toggles row */}
        <div className="flex items-center justify-between pl-11">
          {/* Email toggle */}
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Email</span>
            <div className="relative ml-1">
              {isEmailSaving && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
              <Switch
                checked={preferences[category.emailKey]}
                onCheckedChange={() => onToggle(category.emailKey)}
                disabled={isEmailSaving}
                className={cn(isEmailSaving && "opacity-0")}
              />
            </div>
          </div>

          {/* In-App toggle */}
          <div className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">In-App</span>
            <div className="relative ml-1">
              {isInAppSaving && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
              <Switch
                checked={preferences[category.inAppKey]}
                onCheckedChange={() => onToggle(category.inAppKey)}
                disabled={isInAppSaving}
                className={cn(isInAppSaving && "opacity-0")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
