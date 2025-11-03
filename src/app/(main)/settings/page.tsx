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

export default function SettingsPage() {
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
    {
      label: "Marketing emails",
      description: "Promotional content and offers",
      enabled: false,
    },
  ];

  const securitySettings = [
    {
      label: "Two-Factor Authentication",
      value: "Enabled",
      status: "success",
      icon: Lock,
    },
    {
      label: "Password",
      value: "Last changed 45 days ago",
      status: "warning",
      icon: Key,
    },
    {
      label: "Active Sessions",
      value: "3 devices",
      status: "default",
      icon: Globe,
    },
    {
      label: "Login History",
      value: "View recent activity",
      status: "default",
      icon: Eye,
    },
  ];

  const teamMembers = [
    {
      name: "John Doe",
      email: "john@example.com",
      role: "Owner",
      status: "Active",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Member",
      status: "Active",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
              <User className="h-5 w-5 text-[var(--color-indeks-blue)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Profile Information</h3>
              <p className="text-xs text-muted-foreground">
                Update your account profile and email address
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input type="email" defaultValue="john.doe@example.com" />
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
          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Security & API Keys in Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-green)]/10">
                <Shield className="h-5 w-5 text-[var(--color-indeks-green)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Security</h3>
                <p className="text-xs text-muted-foreground">
                  Manage your security settings
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {securitySettings.map((setting, index) => {
                const Icon = setting.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
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

          {/* Notification Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-yellow)]/10">
                <Bell className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  Configure notification preferences
                </p>
              </div>
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

        {/* API Keys Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
                  <Key className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">API Keys</h3>
                  <p className="text-xs text-muted-foreground">
                    Manage API keys for authentication and integrations
                  </p>
                </div>
              </div>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Create New Key
              </Button>
            </div>

            <div className="space-y-3 mt-6">
              {apiKeys.map((api, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{api.name}</h4>
                        <Badge variant="success" className="text-xs">
                          {api.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-3 py-1.5 rounded font-mono">
                          {api.key}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{api.created}</span>
                        <span>•</span>
                        <span>{api.lastUsed}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rotate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Team Management */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-indeks-orange)]/10">
                  <Users className="h-5 w-5 text-[var(--color-indeks-orange)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <p className="text-xs text-muted-foreground">
                    Manage team members and their permissions
                  </p>
                </div>
              </div>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden mt-4">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teamMembers.map((member, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="success" className="text-xs">
                          {member.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                          {member.role !== "Owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground">
                  Irreversible and destructive actions
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">Export Account Data</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download all your data in JSON format
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Delete Account
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
