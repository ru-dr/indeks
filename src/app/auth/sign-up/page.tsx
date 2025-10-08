"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message || "Failed to sign up");
        return;
      }

      if (data) {
        alert("Sign up successful! You can now sign in.");
        router.push("/auth/sign-in");
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

            <form onSubmit={handleSignUp} className="space-y-5">
              {error && (
                <div className="p-3 text-sm rounded-lg bg-indeks-orange/10 text-indeks-orange border border-indeks-orange/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{error}</span>
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
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="Your name"
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
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
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
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-10 bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-gray-500 focus:border-indeks-blue focus:ring-indeks-blue focus-visible:ring-1"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Minimum 8 characters
                  </p>
                </div>
              </div>

              <Button
                type="submit"
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
                className="w-full h-10 border-[#2A2A2A] text-white hover:bg-[#0D0D0D] hover:text-white"
                asChild
              >
                <Link href="/auth/sign-in">Already have an account?</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
