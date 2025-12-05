"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  User,
  Shield,
  Bell,
  Key,
  Lock,
  Copy,
  RefreshCw,
  Trash2,
  Save,
  ChevronRight,
  Download,
  Globe,
  Users,
  Eye,
} from "lucide-react";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGate, AdminOnly, OwnerOnly } from "@/components/auth";
import { useAuth, useAdminActions } from "@/hooks/use-auth";
import { roleDisplayNames, roleHierarchy, Role } from "@/lib/permissions";
import { useState } from "react";

export default function SettingsPage() {
  const { user, role, isAdmin, isOwner } = useAuth();
  const {
    setRole,
    removeUser,
    isLoading: isAdminActionLoading,
  } = useAdminActions();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const apiKeys = [
    {
      name: "Production API Key",
      key: "ind_prod_••••••••••••4a2f",
      created: "Created Jan 15, 2025",
      lastUsed: "Last used 2 hours ago",
      status: "Active",
    },
    {
      name: "Development API Key",
      key: "ind_dev_••••••••••••8b9c",
      created: "Created Oct 8, 2024",
      lastUsed: "Last used 3 days ago",
      status: "Active",
    },
  ];

  const notificationSettings = [
    {
      label: "Email notifications",
      description: "Receive email updates about your account",
      enabled: true,
    },
    {
      label: "Product updates",
      description: "News about new features and improvements",
      enabled: true,
    },
    {
      label: "Weekly reports",
      description: "Weekly analytics summary via email",
      enabled: false,
    },
    {
      label: "Security alerts",
      description: "Notifications about security events",
      enabled: true,
    },
  ];

  const securitySettings = [
    { label: "Two-Factor Authentication", value: "Enabled", icon: Lock },
    { label: "Password", value: "Last changed 45 days ago", icon: Key },
    { label: "Active Sessions", value: "3 devices", icon: Globe },
    { label: "Login History", value: "View recent activity", icon: Eye },
  ];

  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "owner" as Role,
      status: "Active",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "admin" as Role,
      status: "Active",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "member" as Role,
      status: "Active",
    },
  ];

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await setRole(userId, newRole);
      setEditingMemberId(null);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      await removeUser(userId);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          {role && (
            <Badge variant="outline" className="w-fit">
              Role: {roleDisplayNames[role]}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Team Members
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                  3
                </h3>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  API Keys
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                  2
                </h3>
              </div>
              <Key className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Active Sessions
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                  3
                </h3>
              </div>
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  2FA Status
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                  On
                </h3>
              </div>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-orange)]" />
            </div>
          </Card>
        </div>

        {/* Profile Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[var(--color-indeks-blue)]" />
            <h3 className="text-base sm:text-lg font-semibold">
              Profile Information
            </h3>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input defaultValue={user?.name || "John Doe"} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                defaultValue={user?.email || "john.doe@example.com"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input defaultValue="Los Pollos Hermanos" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Zone</label>
              <Input defaultValue="UTC-05:00 Eastern Time" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-4 sm:mt-6 pt-4 border-t">
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)] w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Security & Notifications */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[var(--color-indeks-green)]" />
              <h3 className="text-base sm:text-lg font-semibold">Security</h3>
            </div>
            <div className="space-y-3">
              {securitySettings.map((setting, index) => {
                const Icon = setting.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {setting.value}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Change Password
            </Button>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-base sm:text-lg font-semibold">
                Notifications
              </h3>
            </div>
            <div className="space-y-4">
              {notificationSettings.map((setting, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <Switch defaultChecked={setting.enabled} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* API Keys - Only visible to Admin+ */}
        <RoleGate requiredRole="admin">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-base sm:text-lg font-semibold">API Keys</h3>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Key className="h-4 w-4 mr-2" />
                Create New Key
              </Button>
            </div>
            <div className="space-y-3">
              {apiKeys.map((api, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium text-sm sm:text-base">
                          {api.name}
                        </h4>
                        <Badge variant="success" className="text-xs">
                          {api.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded font-mono truncate max-w-[200px] sm:max-w-none">
                          {api.key}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{api.created}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{api.lastUsed}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                      >
                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Rotate</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Revoke</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </RoleGate>

        {/* Team Members - Only visible to Admin+ */}
        <RoleGate requiredRole="admin">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--color-indeks-orange)]" />
                <h3 className="text-base sm:text-lg font-semibold">
                  Team Members
                </h3>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Users className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[500px] px-4 sm:px-0">
                <Frame className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingMemberId === member.id && isOwner ? (
                              <Select
                                defaultValue={member.role}
                                onValueChange={(value) =>
                                  handleRoleChange(member.id, value as Role)
                                }
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleHierarchy.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {roleDisplayNames[r]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {roleDisplayNames[member.role]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success" className="text-xs">
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <OwnerOnly>
                                {member.role !== "owner" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 sm:px-3"
                                    onClick={() =>
                                      setEditingMemberId(
                                        editingMemberId === member.id
                                          ? null
                                          : member.id,
                                      )
                                    }
                                    disabled={isAdminActionLoading}
                                  >
                                    {editingMemberId === member.id
                                      ? "Cancel"
                                      : "Edit"}
                                  </Button>
                                )}
                              </OwnerOnly>
                              {member.role !== "owner" && (
                                <AdminOnly>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive h-8 px-2 sm:px-3"
                                    onClick={() =>
                                      handleRemoveMember(member.id)
                                    }
                                    disabled={isAdminActionLoading}
                                  >
                                    Remove
                                  </Button>
                                </AdminOnly>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Frame>
              </div>
            </div>
          </Card>
        </RoleGate>

        {/* Danger Zone - Only visible to Owner */}
        <OwnerOnly>
          <Card className="p-4 sm:p-6 border-destructive/50">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h3 className="text-base sm:text-lg font-semibold text-destructive">
                Danger Zone
              </h3>
            </div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">Export Account Data</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download all your data in JSON format
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Delete Account
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </OwnerOnly>
      </div>
    </DashboardLayout>
  );
}
