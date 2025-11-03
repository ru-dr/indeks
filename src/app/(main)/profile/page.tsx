"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, User, Lock, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username?: string | null;
  displayUsername?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center min-h-screen bg-[#0D0D0D] p-4 md:p-6 dark">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 relative overflow-hidden bg-[#1A1A1A] border-[#2A2A2A] shadow-lg">
          <div className="absolute top-0 left-0 right-0 flex h-1">
            <div className="flex-1 bg-indeks-blue"></div>
            <div className="flex-1 bg-indeks-yellow"></div>
            <div className="flex-1 bg-indeks-orange"></div>
            <div className="flex-1 bg-indeks-green"></div>
          </div>

          <CardContent className="p-6 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/images/svgs/INDEKS-dark.svg"
                  alt="INDEKS"
                  width={140}
                  height={25}
                  priority
                />
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="h-10 border-indeks-orange/20 bg-indeks-orange/10 text-indeks-orange hover:bg-indeks-orange/20 hover:text-indeks-orange hover:border-indeks-orange/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information Card */}
          <Card className="lg:col-span-2 bg-[#1A1A1A] border-[#2A2A2A] shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                <User className="h-5 w-5 text-indeks-blue" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-xs font-medium text-gray-400 mb-1.5">Name</p>
                <p className="text-sm ">{user?.name}</p>
              </div>
              {user?.username && (
                <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                  <p className="text-xs font-medium text-gray-400 mb-1.5">
                    Username
                  </p>
                  <p className="text-sm ">@{user?.username}</p>
                </div>
              )}
              {user?.displayUsername && (
                <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                  <p className="text-xs font-medium text-gray-400 mb-1.5">
                    Display Username
                  </p>
                  <p className="text-sm ">{user?.displayUsername}</p>
                </div>
              )}
              <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-xs font-medium text-gray-400 mb-1.5">
                  Email
                </p>
                <p className="text-sm ">{user?.email}</p>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-xs font-medium text-gray-400 mb-1.5">
                  User ID
                </p>
                <p className="text-xs  font-mono break-all">{user?.id}</p>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-xs font-medium text-gray-400 mb-1.5">
                  Email Verified
                </p>
                <div className="flex items-center gap-1.5 text-sm">
                  {user?.emailVerified ? (
                    <>
                      <Check className="h-4 w-4 text-indeks-green" />
                      <span className="text-indeks-green">Verified</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-indeks-orange" />
                      <span className="text-indeks-orange">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold ">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-10 border-indeks-blue/20 bg-indeks-blue/10 text-indeks-blue hover:bg-indeks-blue/20 hover:text-indeks-blue hover:border-indeks-blue/30 justify-start"
              >
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 border-indeks-green/20 bg-indeks-green/10 text-indeks-green hover:bg-indeks-green/20 hover:text-indeks-green hover:border-indeks-green/30 justify-start"
              >
                <Lock className="h-4 w-4 mr-2" />
                API Keys
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
