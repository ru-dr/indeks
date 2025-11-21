"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";

function SignInForm() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | React.ReactNode>("");
  const [loading, setLoading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmailOrUsername(decodeURIComponent(emailParam));
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "email-not-verified") {
      setError(
        <>
          <p>Please verify your email before accessing the dashboard.</p>
        </>,
      );
    }
  }, [searchParams]);

  const handleResendVerification = async (userEmail: string) => {
    setSendingVerification(true);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email: userEmail,
        callbackURL: "/auth/sign-in",
      });

      if (error) {
        toastManager.add({
          title: "Error",
          description: "Failed to send verification email. Please try again.",
          type: "error",
        });
        return;
      }

      toastManager.add({
        title: "Success!",
        description: "Verification email sent! Please check your inbox.",
        type: "success",
      });
      setError("");
    } catch {
      toastManager.add({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        type: "error",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isEmail = emailOrUsername.includes("@");

      const { data, error } = isEmail
        ? await authClient.signIn.email({
            email: emailOrUsername,
            password,
          })
        : await authClient.signIn.username({
            username: emailOrUsername,
            password,
          });

      if (error) {
        setError(error.message || "Failed to sign in");
        return;
      }

      if (data) {
        if (!data.user.emailVerified) {
          await authClient.signOut();

          setError(
            <>
              <p>Please verify your email before signing in.</p>
              <Button
                type="button"
                onClick={() => handleResendVerification(data.user.email)}
                variant="outline"
                className="w-full h-9 text-sm bg-indeks-orange/10 hover:bg-indeks-orange/20 text-indeks-orange border-indeks-orange/20"
                disabled={sendingVerification}
              >
                {sendingVerification
                  ? "Sending..."
                  : "Resend verification email"}
              </Button>
            </>,
          );
          return;
        }

        toastManager.add({
          title: "Success!",
          description: "Sign in successful. Redirecting...",
          type: "success",
        });
        
        const redirectPath = searchParams.get("redirect") || "/";
        router.push(redirectPath);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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

            <form onSubmit={handleSignIn} className="space-y-5">
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
                    htmlFor="emailOrUsername"
                    className="text-sm font-medium text-gray-200"
                  >
                    Email or Username
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="emailOrUsername"
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A]  placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="your@email.com or username"
                    />
                  </div>
                  <div className="text-right">
                    <Link
                      href="/auth/forgot-email"
                      className="text-xs text-gray-400 hover:text-indeks-blue transition-colors"
                    >
                      Forgot email?
                    </Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium ">
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-10 pr-10 bg-[#0D0D0D] border-[#2A2A2A]  placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
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
                  <div className="text-right">
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-gray-400 hover:text-indeks-blue transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                className="w-full h-10 bg-indeks-green text-indeks-black hover:bg-indeks-green/90 font-medium"
              >
                {loading ? "Signing in..." : "Sign in"}
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
                <Link href="/auth/sign-up">Create an account</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        // show a spinner in the center of the screen
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="h-8 w-8 text-indeks-blue" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
