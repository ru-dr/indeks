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
    { label: "Email notifications", description: "Receive email updates about your account", enabled: true },
    { label: "Product updates", description: "News about new features and improvements", enabled: true },
    { label: "Weekly reports", description: "Weekly analytics summary via email", enabled: false },
    { label: "Security alerts", description: "Notifications about security events", enabled: true },
  ];

  const securitySettings = [
    { label: "Two-Factor Authentication", value: "Enabled", icon: Lock },
    { label: "Password", value: "Last changed 45 days ago", icon: Key },
    { label: "Active Sessions", value: "3 devices", icon: Globe },
    { label: "Login History", value: "View recent activity", icon: Eye },
  ];

  const teamMembers = [
    { name: "John Doe", email: "john@example.com", role: "Owner", status: "Active" },
    { name: "Jane Smith", email: "jane@example.com", role: "Admin", status: "Active" },
    { name: "Bob Johnson", email: "bob@example.com", role: "Member", status: "Active" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <h3 className="text-2xl font-bold mt-2">3</h3>
              </div>
              <Users className="h-8 w-8 text-[var(--color-indeks-blue)]" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Keys</p>
                <h3 className="text-2xl font-bold mt-2">2</h3>
              </div>
              <Key className="h-8 w-8 text-[var(--color-indeks-green)]" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <h3 className="text-2xl font-bold mt-2">3</h3>
              </div>
              <Globe className="h-8 w-8 text-[var(--color-indeks-yellow)]" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">2FA Status</p>
                <h3 className="text-2xl font-bold mt-2">On</h3>
              </div>
              <Shield className="h-8 w-8 text-[var(--color-indeks-orange)]" />
            </div>
          </Card>
        </div>

        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[var(--color-indeks-blue)]" />
            <h3 className="text-lg font-semibold">Profile Information</h3>
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
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)]">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Security & Notifications */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[var(--color-indeks-green)]" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            <div className="space-y-3">
              {securitySettings.map((setting, index) => {
                const Icon = setting.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{setting.value}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4">Change Password</Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>
            <div className="space-y-4">
              {notificationSettings.map((setting, index) => (
                <div key={index} className="flex items-start justify-between py-3 border-b last:border-0">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                  </div>
                  <Switch defaultChecked={setting.enabled} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* API Keys */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[var(--color-indeks-blue)]" />
              <h3 className="text-lg font-semibold">API Keys</h3>
            </div>
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Create New Key
            </Button>
          </div>
          <div className="space-y-3">
            {apiKeys.map((api, index) => (
              <div key={index} className="p-4 rounded-lg border hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{api.name}</h4>
                      <Badge variant="success" className="text-xs">{api.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-3 py-1.5 rounded font-mono">{api.key}</code>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Copy className="h-3 w-3" /></Button>
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
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--color-indeks-orange)]" />
              <h3 className="text-lg font-semibold">Team Members</h3>
            </div>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge variant="success" className="text-xs">{member.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost">Edit</Button>
                        {member.role !== "Owner" && (
                          <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium">Export Account Data</p>
                <p className="text-xs text-muted-foreground mt-1">Download all your data in JSON format</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
