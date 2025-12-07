"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamMembers } from "./TeamMembers";
import { TeamSettings } from "./TeamSettings";
import type { Role } from "@/lib/permissions";
import { Building2 } from "lucide-react";

function useFullOrganization(organizationId: string, refreshKey: number = 0) {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetch() {
      setIsPending(true);
      try {
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId },
        });
        setData(data);
      } finally {
        setIsPending(false);
      }
    }
    if (organizationId) {
      fetch();
    }
  }, [organizationId, refreshKey]);

  return { data, isPending };
}

function useActiveMember() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await authClient.organization.getActiveMember({});
      setData(data);
    }
    fetch();
  }, []);

  return { data };
}

function TeamMembersWrapper({
  organizationId,
  currentUserId,
}: {
  organizationId: string;
  currentUserId: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: fullOrg, isPending } = useFullOrganization(
    organizationId,
    refreshKey,
  );
  const { data: activeMember } = useActiveMember();

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isPending) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      </Card>
    );
  }

  if (!fullOrg) {
    return null;
  }

  return (
    <TeamMembers
      organizationId={organizationId}
      members={fullOrg.members || []}
      invitations={fullOrg.invitations || []}
      currentUserId={currentUserId}
      currentUserRole={(activeMember?.role as Role) || "viewer"}
      onMembersChange={handleRefresh}
    />
  );
}

export function TeamManagement() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: orgLoading } =
    authClient.useActiveOrganization();
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();

  if (orgLoading || orgsLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </Card>
    );
  }

  if (!organizations || organizations.length === 0) {
    return <CreateTeamForm onSuccess={() => router.refresh()} />;
  }

  if (!activeOrg) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
          <h2 className="text-base sm:text-lg font-semibold">Select a Team</h2>
        </div>
        <div className="space-y-2">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={async () => {
                await authClient.organization.setActive({
                  organizationId: org.id,
                });
                router.refresh();
              }}
              className="w-full p-3 sm:p-4 text-left rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-muted-foreground">{org.slug}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Could add a dialog here for creating new team
            }}
          >
            Create New Team
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <TeamSettings
        organization={activeOrg}
        onUpdate={() => router.refresh()}
      />

      <TeamMembersWrapper
        organizationId={activeOrg.id}
        currentUserId={session?.user?.id || ""}
      />
    </div>
  );
}
