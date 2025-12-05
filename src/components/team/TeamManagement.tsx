"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamMembers } from "./TeamMembers";
import { TeamSettings } from "./TeamSettings";
import type { Role } from "@/lib/permissions";

function useFullOrganization(organizationId: string) {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetch() {
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
  }, [organizationId]);

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
  const { data: fullOrg, isPending } = useFullOrganization(organizationId);
  const { data: activeMember } = useActiveMember();

  if (isPending) {
    return (
      <Card className="p-6">
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
      currentUserId={currentUserId}
      currentUserRole={(activeMember?.role as Role) || "viewer"}
      onMembersChange={() => {
        window.location.reload();
      }}
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
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">Create Your Team</h1>
          <p className="text-muted-foreground">
            Create a team to collaborate with others on your analytics projects.
          </p>
        </div>
        <CreateTeamForm
          onSuccess={() => {
            router.refresh();
          }}
        />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Select a Team</h2>
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
                className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-muted-foreground">{org.slug}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
