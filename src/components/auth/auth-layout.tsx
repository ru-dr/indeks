"use client";

import { ImpersonationBanner } from "@/components/auth";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner className="fixed top-0 left-0 right-0 z-50" />
      {children}
    </>
  );
}
