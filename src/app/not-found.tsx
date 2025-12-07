"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Visual */}
        <div className="relative">
          <div className="text-[120px] font-bold leading-none text-[var(--color-indeks-blue)]">
            404
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            might have been moved or deleted.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/analytics"
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/reports"
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              Reports
            </Link>
            <Link
              href="/settings"
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
