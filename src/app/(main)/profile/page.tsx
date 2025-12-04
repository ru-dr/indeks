"use client";

import { authClient } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut,
  User,
  Mail,
  Shield,
  Check,
  X,
  Key,
  Calendar,
  Clock,
  Settings,
  Edit,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username?: string | null;
  displayUsername?: string | null;
  createdAt?: Date;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await authClient.getSession();
      if (data?.user?.name) {
        setUserName(data.user.name);
      }
    };
    loadUser();
  }, []);

  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await authClient.getSession();

      if (!data) {
        router.push("/auth/sign-in");
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/sign-in");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your profile information and account settings
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-destructive hover:bg-destructive/10 w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarFallback className="text-xl sm:text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{user?.name}</h2>
                  {user?.username && (
                    <p className="text-muted-foreground mt-1">
                      @{user?.username}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{user?.email}</span>
                </div>
                {user?.emailVerified ? (
                  <Badge variant="success" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-[var(--color-indeks-orange)]"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>

              {user?.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since {user.createdAt.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Personal Information */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-blue)]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
                <p className="text-xs text-muted-foreground">
                  Your account details
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <Input value={user?.name} readOnly className="bg-muted/50" />
              </div>

              {user?.username && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <Input
                    value={`@${user?.username}`}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
              )}

              {user?.displayUsername && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Display Name
                  </label>
                  <Input
                    value={user?.displayUsername}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <Input value={user?.email} readOnly className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <Input
                  value={user?.id}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Account Security */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 rounded-lg bg-[var(--color-indeks-green)]/10">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-green)]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Account Security</h3>
                <p className="text-xs text-muted-foreground">
                  Security and verification status
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Email Verification
                    </span>
                  </div>
                  {user?.emailVerified ? (
                    <Badge variant="success" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.emailVerified
                    ? "Your email address has been verified"
                    : "Verify your email to unlock all features"}
                </p>
                {!user?.emailVerified && (
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Send Verification Email
                  </Button>
                )}
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Password</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Set
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Last changed recently
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Change Password
                </Button>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Active Session</span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  This device is currently signed in
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 sm:p-4 hover:border-primary/50"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2 text-[var(--color-indeks-blue)]" />
              <span className="font-medium text-xs sm:text-sm">Account Settings</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Manage preferences
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 sm:p-4 hover:border-primary/50"
              onClick={() => router.push("/settings")}
            >
              <Key className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2 text-[var(--color-indeks-green)]" />
              <span className="font-medium text-xs sm:text-sm">API Keys</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Manage integrations
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 sm:p-4 hover:border-primary/50"
              onClick={() => router.push("/settings")}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2 text-[var(--color-indeks-yellow)]" />
              <span className="font-medium text-xs sm:text-sm">Security</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                2FA & passwords
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 sm:p-4 hover:border-primary/50"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2 text-[var(--color-indeks-orange)]" />
              <span className="font-medium text-xs sm:text-sm">Edit Profile</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Update information
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
