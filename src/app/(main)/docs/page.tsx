"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Documentation Coming Soon</EmptyTitle>
            <EmptyDescription>
              Comprehensive guides, API references, and tutorials to help you 
              get the most out of INDEKS. Learn how to integrate analytics, 
              set up tracking, and analyze your data.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/" />}>
              Back to Dashboard
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </DashboardLayout>
  );
}
