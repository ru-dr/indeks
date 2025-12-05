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
import { Route } from "lucide-react";
import Link from "next/link";

export default function JourneysPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Route className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Journeys Coming Soon</EmptyTitle>
            <EmptyDescription>
              Track and visualize user journeys across your application.
              Understand how users navigate through your site and identify
              opportunities to improve their experience.
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
