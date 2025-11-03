"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <div className={cn("hidden md:block", sidebarOpen && "block")}>
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
