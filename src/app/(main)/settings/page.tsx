"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Bell,
  Key,
  Lock,
  Trash2,
  Save,
  Download,
  Check,
  Calendar,
  Link as LinkIcon,
  AtSign,
  Camera,
} from "lucide-react";
import { OwnerOnly } from "@/components/auth";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { roleDisplayNames } from "@/lib/permissions";
import { useState, useCallback, useEffect } from "react";
import { OrganizationManagement } from "@/components/organization/OrganizationManagement";
import { toastManager } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

const timezones = [
  { value: "UTC-05:00", label: "Eastern Time (UTC-05:00)" },
  { value: "UTC-06:00", label: "Central Time (UTC-06:00)" },
  { value: "UTC-07:00", label: "Mountain Time (UTC-07:00)" },
  { value: "UTC-08:00", label: "Pacific Time (UTC-08:00)" },
  { value: "UTC+00:00", label: "UTC (UTC+00:00)" },
  { value: "UTC+01:00", label: "Central European (UTC+01:00)" },
  { value: "UTC+05:30", label: "India Standard Time (UTC+05:30)" },
  { value: "UTC+09:00", label: "Japan Standard Time (UTC+09:00)" },
];

export default function SettingsPage() {
  const { user, role } = useAuth();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    image: "",
    username: "",
    displayUsername: "",
    organizationId: "",
  });
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    image: "",
    username: "",
    displayUsername: "",
  });
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    productUpdates: true,
    weeklyReports: false,
    securityAlerts: true,
    usageAlerts: true,
    orgActivity: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch profile from our custom API
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await fetch("/api/v1/profile", {
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const profile = result.data;
            setProfileForm((prev) => ({
              ...prev,
              name: profile.name || "",
              email: profile.email || "",
              image: profile.image || "",
              username: profile.username || "",
              displayUsername: profile.displayUsername || "",
            }));
            setOriginalProfile({
              name: profile.name || "",
              image: profile.image || "",
              username: profile.username || "",
              displayUsername: profile.displayUsername || "",
            });
            setImageUrlInput(profile.image || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (activeOrg) {
      setProfileForm((prev) => ({
        ...prev,
        organizationId: activeOrg.id,
      }));
    }
  }, [activeOrg]);

  const handleNotificationChange = useCallback(
    (key: keyof typeof notifications) => {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const handleImageUrlChange = (url: string) => {
    setImageUrlInput(url);
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      setProfileForm((prev) => ({ ...prev, image: url }));
    } else if (!url) {
      setProfileForm((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleApplyImageUrl = () => {
    if (imageUrlInput && (imageUrlInput.startsWith("http://") || imageUrlInput.startsWith("https://"))) {
      setProfileForm((prev) => ({ ...prev, image: imageUrlInput }));
      setShowImageUrlInput(false);
      toastManager.add({ type: "success", title: "Image URL applied" });
    } else if (!imageUrlInput) {
      setProfileForm((prev) => ({ ...prev, image: "" }));
      setShowImageUrlInput(false);
    } else {
      toastManager.add({ type: "error", title: "Please enter a valid URL starting with http:// or https://" });
    }
  };

  const handleOrganizationChange = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      setProfileForm((prev) => ({ ...prev, organizationId: orgId }));
      toastManager.add({ type: "success", title: "Organization updated" });
    } catch {
      toastManager.add({ type: "error", title: "Failed to update organization" });
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const updateData: { name?: string; image?: string; username?: string; displayUsername?: string } = {};

      if (profileForm.name !== originalProfile.name) {
        updateData.name = profileForm.name;
      }

      if (profileForm.image !== originalProfile.image) {
        updateData.image = profileForm.image;
      }

      if (profileForm.username !== originalProfile.username) {
        updateData.username = profileForm.username;
        updateData.displayUsername = profileForm.displayUsername || profileForm.username;
      }

      if (Object.keys(updateData).length === 0) {
        toastManager.add({ type: "info", title: "No changes to save" });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        toastManager.add({ type: "error", title: result.message || "Failed to update profile" });
        return;
      }

      setOriginalProfile({
        name: profileForm.name,
        image: profileForm.image,
        username: profileForm.username,
        displayUsername: profileForm.displayUsername,
      });

      toastManager.add({ type: "success", title: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  };

  const userInitials = profileForm.name
    ? profileForm.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const hasChanges =
    profileForm.name !== originalProfile.name ||
    profileForm.image !== originalProfile.image ||
    profileForm.username !== originalProfile.username;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account, security, and preferences
            </p>
          </div>
          {role && (
            <Badge variant="outline" className="w-fit">
              {roleDisplayNames[role]}
            </Badge>
          )}
        </div>

        {/* Profile Section - Reorganized */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-blue)]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Profile Information</h3>
              <p className="text-xs text-muted-foreground">Update your personal details and avatar</p>
            </div>
          </div>

          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              {/* Profile Header - Avatar and Basic Info */}
              <div className="flex flex-col lg:flex-row gap-6 pb-6 border-b">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                      {profileForm.image ? (
                        <AvatarImage src={profileForm.image} alt={profileForm.name || "Profile"} />
                      ) : null}
                      <AvatarFallback className="text-2xl sm:text-3xl bg-[var(--color-indeks-blue)]/10 text-[var(--color-indeks-blue)]">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  {showImageUrlInput && (
                    <div className="w-full max-w-xs space-y-2">
                      <Input
                        value={imageUrlInput}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowImageUrlInput(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" className="flex-1" onClick={handleApplyImageUrl}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Summary */}
                <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold">{profileForm.name || "Your Name"}</h2>
                  {profileForm.username && (
                    <p className="text-base text-muted-foreground flex items-center justify-center lg:justify-start gap-1 mt-1">
                      <AtSign className="h-4 w-4" />
                      {profileForm.displayUsername || profileForm.username}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{profileForm.email}</p>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mt-3">
                    {user?.emailVerified && (
                      <Badge variant="success" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {user?.createdAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Member since{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="pt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Edit Profile</h4>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                          setProfileForm((prev) => ({
                            ...prev,
                            username: value,
                            displayUsername: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                          }));
                        }}
                        placeholder="username"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profileForm.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Active Organization</Label>
                    {(() => {
                      const orgItems = organizations?.map((org) => ({ label: org.name, value: org.id })) || [];
                      const selectedOrg = orgItems.find((item) => item.value === profileForm.organizationId) || null;
                      return (
                        <Select
                          value={selectedOrg}
                          onValueChange={(val: { label: string; value: string } | null) => {
                            if (val) handleOrganizationChange(val.value);
                          }}
                        >
                          <SelectTrigger id="organization">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectPopup alignItemWithTrigger={false}>
                            {orgItems.map((item) => (
                              <SelectItem key={item.value} value={item}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectPopup>
                        </Select>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        name: originalProfile.name,
                        image: originalProfile.image,
                        username: originalProfile.username,
                        displayUsername: originalProfile.displayUsername,
                      }));
                      setImageUrlInput(originalProfile.image);
                    }}
                    disabled={!hasChanges}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading || !hasChanges}
                    className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)] w-full sm:w-auto"
                  >
                    {isLoading ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Security Section */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-green)]/10">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-green)]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Two-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground">Extra security for your account</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {twoFactorEnabled ? "2FA is enabled" : "Enable 2FA"}
                </span>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account is protected with two-factor authentication"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-blue)]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Password</h3>
                <p className="text-xs text-muted-foreground">Manage your password</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Change Password</span>
                <Badge variant="outline" className="text-xs">Set</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Update your password to keep your account secure
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Change Password
              </Button>
            </div>
          </Card>
        </div>

        {/* Notifications Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-lg bg-[var(--color-indeks-yellow)]/10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-yellow)]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground">Choose what updates you receive</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Email Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Account Updates</p>
                    <p className="text-xs text-muted-foreground">Receive updates about your account</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={() => handleNotificationChange("emailNotifications")}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Security Alerts</p>
                    <p className="text-xs text-muted-foreground">Important security notifications</p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={() => handleNotificationChange("securityAlerts")}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Weekly Reports</p>
                    <p className="text-xs text-muted-foreground">Analytics summary via email</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={() => handleNotificationChange("weeklyReports")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Product & Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Product Updates</p>
                    <p className="text-xs text-muted-foreground">News about new features</p>
                  </div>
                  <Switch
                    checked={notifications.productUpdates}
                    onCheckedChange={() => handleNotificationChange("productUpdates")}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Usage Alerts</p>
                    <p className="text-xs text-muted-foreground">When approaching limits</p>
                  </div>
                  <Switch
                    checked={notifications.usageAlerts}
                    onCheckedChange={() => handleNotificationChange("usageAlerts")}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Organization Activity</p>
                    <p className="text-xs text-muted-foreground">Updates from organization members</p>
                  </div>
                  <Switch
                    checked={notifications.orgActivity}
                    onCheckedChange={() => handleNotificationChange("orgActivity")}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Organization Management Section */}
        <OrganizationManagement />

        {/* Danger Zone - Only visible to Owner */}
        <OwnerOnly>
          <Card className="p-4 sm:p-6 border-destructive/50">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">Irreversible actions</p>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">Export Account Data</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download all your data in JSON format
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow-xs hover:bg-destructive/90 w-full sm:w-auto">
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and
                        remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogBody className="space-y-2">
                      <Label htmlFor="delete-confirm">
                        Type <strong>delete my account</strong> to confirm
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="delete my account"
                      />
                    </AlertDialogBody>
                    <AlertDialogFooter>
                      <AlertDialogClose
                        onClick={() => {
                          setDeleteConfirmation("");
                          setIsDeleteDialogOpen(false);
                        }}
                        className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </AlertDialogClose>
                      <Button variant="destructive" disabled={deleteConfirmation !== "delete my account"}>
                        Delete Account
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </OwnerOnly>
      </div>
    </DashboardLayout>
  );
}
