"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Users,
  Check,
  X,
  Clock,
  ChevronRight,
  Settings,
  Inbox,
  Server,
  Building2,
  UserPlus,
  CheckCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// Notification types
type NotificationType =
  | "team_invitation"
  | "uptime_down"
  | "uptime_up"
  | "uptime_degraded"
  | "account_update"
  | "account_security"
  | "org_member_joined"
  | "org_member_left"
  | "org_role_changed";

type NotificationCategory = "account" | "uptime" | "organization" | "invitations";

type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  projectId: string | null;
  organizationId: string | null;
  invitationId: string | null;
  actionData: string | null;
  actionUrl: string | null;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  expiresAt: string | null;
}

interface NotificationCount {
  total: number;
  notifications: number;
  invitations: number;
}

// Icon mapping
const notificationIcons: Record<NotificationType, typeof Bell> = {
  team_invitation: UserPlus,
  uptime_down: Server,
  uptime_up: Server,
  uptime_degraded: Server,
  account_update: Users,
  account_security: Shield,
  org_member_joined: Building2,
  org_member_left: Building2,
  org_role_changed: Building2,
};

// Color mapping
const notificationColors: Record<NotificationType, string> = {
  team_invitation: "var(--color-indeks-green)",
  uptime_down: "var(--destructive)",
  uptime_up: "var(--color-indeks-green)",
  uptime_degraded: "var(--color-indeks-yellow)",
  account_update: "var(--color-indeks-blue)",
  account_security: "var(--destructive)",
  org_member_joined: "var(--color-indeks-blue)",
  org_member_left: "var(--color-indeks-orange)",
  org_role_changed: "var(--color-indeks-blue)",
};

// Category labels
const categoryLabels: Record<NotificationCategory, string> = {
  account: "Account",
  uptime: "Uptime",
  organization: "Organization",
  invitations: "Invitations",
};

// Category icons
const categoryIcons: Record<NotificationCategory, typeof Bell> = {
  account: Users,
  uptime: Server,
  organization: Building2,
  invitations: UserPlus,
};

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState<NotificationCount>({ total: 0, notifications: 0, invitations: 0 });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | "all">("all");

  const { data: session } = authClient.useSession();

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/notifications/all", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setNotifications(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const fetchCount = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/v1/notifications/count", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCount(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchCount();
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user, fetchCount]);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchNotifications();
    }
  }, [isOpen, session?.user, fetchNotifications]);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingId(`inv_${invitationId}`);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to accept invitation",
        });
        return;
      }

      const notification = notifications.find((n) => n.invitationId === invitationId);
      const actionData = notification?.actionData ? JSON.parse(notification.actionData) : null;

      toastManager.add({
        type: "success",
        title: `You've joined ${actionData?.organizationName ?? "the team"}!`,
      });

      setNotifications((prev) => prev.filter((n) => n.invitationId !== invitationId));
      setCount((prev) => ({ ...prev, total: prev.total - 1, invitations: prev.invitations - 1 }));

      if (actionData?.organizationId) {
        await authClient.organization.setActive({
          organizationId: actionData.organizationId,
        });
      }
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingId(`inv_${invitationId}`);
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to decline invitation",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Invitation declined" });
      setNotifications((prev) => prev.filter((n) => n.invitationId !== invitationId));
      setCount((prev) => ({ ...prev, total: prev.total - 1, invitations: prev.invitations - 1 }));
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (notificationId.startsWith("inv_")) return;

    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setCount((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        notifications: Math.max(0, prev.notifications - 1),
      }));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/v1/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount((prev) => ({ ...prev, notifications: 0 }));
      toastManager.add({ type: "success", title: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    if (notificationId.startsWith("inv_")) return;

    setProcessingId(notificationId);
    try {
      await fetch(`/api/v1/notifications/${notificationId}/dismiss`, {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setCount((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        notifications: Math.max(0, prev.notifications - 1),
      }));
    } catch (error) {
      console.error("Failed to dismiss:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatExpiresIn = (expiresAt: string | null) => {
    if (!expiresAt) return null;

    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return "Expiring soon";
  };

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const groupedNotifications = filteredNotifications.reduce(
    (acc, notification) => {
      const category = notification.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(notification);
      return acc;
    },
    {} as Record<NotificationCategory, Notification[]>
  );

  const unreadCount = count.total;

  const renderNotificationItem = (notification: Notification) => {
    const Icon = notificationIcons[notification.type] || Bell;
    const color = notificationColors[notification.type] || "var(--color-indeks-blue)";
    const isInvitation = notification.type === "team_invitation";
    const isProcessing = processingId === notification.id;

    return (
      <div
        key={notification.id}
        className={cn(
          "px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer group relative border-b last:border-0",
          !notification.isRead && "bg-muted/30",
          isProcessing && "opacity-60 pointer-events-none"
        )}
        onClick={() => !isInvitation && handleNotificationAction(notification)}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-2.5 rounded-xl shrink-0 shadow-sm"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className={cn("text-sm leading-none", !notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
                {notification.title}
              </p>
              {!notification.isRead && !isInvitation && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-0.5" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                {formatTimeAgo(notification.createdAt)}
              </span>
              {notification.expiresAt && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Clock className="h-3 w-3" />
                  {formatExpiresIn(notification.expiresAt)}
                </span>
              )}
              {notification.priority === "urgent" && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                  Urgent
                </Badge>
              )}
              {notification.priority === "high" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-[var(--color-indeks-orange)] text-[var(--color-indeks-orange)]">
                  High
                </Badge>
              )}
            </div>
          </div>
          {!isInvitation && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Invitation actions */}
        {isInvitation && notification.invitationId && (
          <div className="flex items-center gap-3 mt-4 pl-[52px]">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRejectInvitation(notification.invitationId!);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <>
                  Decline
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs flex-1 bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)] shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptInvitation(notification.invitationId!);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <>
                  Accept
                </>
              )}
            </Button>
          </div>
        )}

        {/* Action button for non-invitation notifications */}
        {!isInvitation && notification.actionUrl && (
          <div className="mt-3 pl-[52px]">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs w-full justify-between group/btn"
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationAction(notification);
              }}
            >
              View Details
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="inline-flex items-center justify-center h-9 w-9 relative rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center shadow-sm ring-1 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverPopup align="end" className="w-[360px] sm:w-[420px] p-0 m-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {count.notifications > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setIsOpen(false);
                router.push("/settings");
              }}
              title="Notification Settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto">
          <Button
            variant={activeFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          {(Object.keys(categoryLabels) as NotificationCategory[]).map((category) => {
            const hasNotifications = notifications.some((n) => n.category === category);
            if (!hasNotifications) return null;
            const CategoryIcon = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={activeFilter === category ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => setActiveFilter(category)}
              >
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryLabels[category]}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-h-[450px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-3 rounded-full bg-muted mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No {activeFilter === "all" ? "" : activeFilter} notifications
              </p>
            </div>
          ) : activeFilter === "all" ? (
            <div>
              {(Object.keys(groupedNotifications) as NotificationCategory[]).map((category) => (
                <div key={category}>
                  <div className="px-4 py-2 bg-muted/50 sticky top-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      {(() => {
                        const CategoryIcon = categoryIcons[category];
                        return <CategoryIcon className="h-3.5 w-3.5" />;
                      })()}
                      {categoryLabels[category]}
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        {groupedNotifications[category].length}
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y">
                    {groupedNotifications[category].map(renderNotificationItem)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(renderNotificationItem)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs justify-between text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsOpen(false);
              router.push("/settings");
            }}
          >
            Manage notification settings
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
