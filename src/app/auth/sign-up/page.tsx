"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const hasSignedOut = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const isInviteFlow = redirectUrl?.startsWith("/invite/");

  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // Handle initial session check and sign out if needed
  useEffect(() => {
    async function initialize() {
      // Wait for session to load
      if (sessionLoading) return;

      // If user is logged in and this is an invite flow, sign them out (only once)
      if (session?.user && isInviteFlow && !hasSignedOut.current) {
        hasSignedOut.current = true;
        await authClient.signOut();
      }

      setInitializing(false);
    }
    initialize();
  }, [session, sessionLoading, isInviteFlow]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign out first to clear any existing session
      await authClient.signOut();

      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        username,
      });

      if (error) {
        setError(error.message || "Failed to sign up");
        return;
      }

      if (data) {
        // Sign out immediately after sign up to prevent auto-login with unverified email
        await authClient.signOut();

        toastManager.add({
          title: "Success!",
          description:
            "Account created! Please check your email to verify your account.",
          type: "success",
        });

        // Build the redirect URL
        const signInUrl = new URL("/auth/sign-in", window.location.origin);
        signInUrl.searchParams.set("email", email);
        signInUrl.searchParams.set("registered", "true");
        if (redirectUrl) {
          signInUrl.searchParams.set("redirect", redirectUrl);
        }

        // Use replace to prevent back button issues
        router.replace(signInUrl.pathname + signInUrl.search);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 flex h-1 z-10">
            <div className="flex-1 bg-indeks-blue"></div>
            <div className="flex-1 bg-indeks-yellow"></div>
            <div className="flex-1 bg-indeks-orange"></div>
            <div className="flex-1 bg-indeks-green"></div>
          </div>

          <CardContent className="p-6">
            <div className="mb-6 flex justify-center">
              <Image
                src="/assets/images/svgs/INDEKS-dark.svg"
                alt="INDEKS"
                width={180}
                height={32}
                priority
              />
            </div>

            {isInviteFlow && (
              <div className="mb-4 rounded-lg bg-indeks-blue/10 border border-indeks-blue/20 p-3">
                <p className="text-sm text-center text-indeks-blue">
                  Create an account to accept your team invitation
                </p>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-indeks-orange/10 border border-indeks-orange/20 p-3">
                  <div className="flex flex-col items-center text-center gap-2 text-sm text-indeks-orange">
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-200"
                  >
                    Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-200"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-200"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-200"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-10 pr-10 bg-[#0D0D0D] border-[#2A2A2A] placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Minimum 8 characters
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                className="w-full h-10 bg-indeks-green text-indeks-black hover:bg-indeks-green/90 font-medium"
              >
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="before:bg-border after:bg-border flex items-center gap-3 before:h-px before:flex-1 after:h-px after:flex-1">
                <span className="text-xs text-gray-400">or</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-[#2A2A2A] hover:bg-[#0D0D0D] hover:text-white"
              >
                <Link href={redirectUrl ? `/auth/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : "/auth/sign-in"}>
                  Already have an account?
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
