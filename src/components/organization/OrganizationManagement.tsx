"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast";
import { roleHierarchy, type Role } from "@/lib/permissions";
import { Building2, Plus } from "lucide-react";

import { OrgSelector } from "./OrgSelector";
import { OrgSettings } from "./OrgSettings";
import {
  MembersSection,
  type OrgMember,
  type Invitation,
} from "./MembersSection";
import { TeamsSection, type Team, type TeamMember } from "./TeamsSection";
import { DangerZone, type Organization } from "./DangerZone";

interface FullOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
  members: OrgMember[];
  invitations: Invitation[];
}

interface ActiveMember {
  id: string;
  role: Role;
  userId: string;
  organizationId: string;
  createdAt: Date;
}

function useFullOrganization(organizationId: string, refreshKey: number = 0) {
  const [data, setData] = useState<FullOrganization | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetch() {
      setIsPending(true);
      try {
        const { data } = await authClient.organization.getFullOrganization({
          query: { organizationId },
        });
        setData(data as FullOrganization | null);
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

function useActiveMember(organizationId: string | undefined) {
  const [data, setData] = useState<ActiveMember | null>(null);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    async function fetch() {
      const { data } = await authClient.organization.getActiveMember({});
      setData(data as ActiveMember | null);
    }
    fetch();
  }, [organizationId]);

  return { data };
}

function useTeams(activeOrgId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!activeOrgId) return;
    setTeamsLoading(true);
    try {
      const { data } = await authClient.organization.listTeams({
        query: { organizationId: activeOrgId },
      });
      setTeams((data as Team[]) || []);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setTeamsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) {
      loadTeams();
    }
  }, [activeOrgId, loadTeams]);

  return { teams, teamsLoading, loadTeams };
}

function useTeamMembers(activeOrgId: string | undefined, teams: Team[]) {
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>(
    {},
  );
  const [teamMembersLoading, setTeamMembersLoading] = useState<
    Record<string, boolean>
  >({});

  const loadTeamMembers = useCallback(
    async (teamId: string) => {
      if (!activeOrgId) return;

      setTeamMembersLoading((prev) => ({ ...prev, [teamId]: true }));
      try {
        const response = await fetch(
          `/api/v1/organizations/${activeOrgId}/teams/${teamId}/members`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setTeamMembers((prev) => ({ ...prev, [teamId]: result.data }));
        } else {
          setTeamMembers((prev) => ({ ...prev, [teamId]: [] }));
        }
      } catch (error) {
        console.error("[loadTeamMembers] Exception:", error);
        setTeamMembers((prev) => ({ ...prev, [teamId]: [] }));
      } finally {
        setTeamMembersLoading((prev) => ({ ...prev, [teamId]: false }));
      }
    },
    [activeOrgId],
  );

  useEffect(() => {
    if (activeOrgId) {
      setTeamMembers({});
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (teams.length > 0 && activeOrgId) {
      teams.forEach((team) => {
        if (!teamMembers[team.id]) {
          loadTeamMembers(team.id);
        }
      });
    }
  }, [teams, activeOrgId, teamMembers, loadTeamMembers]);

  return { teamMembers, teamMembersLoading, loadTeamMembers };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OrganizationManagement() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: orgLoading } =
    authClient.useActiveOrganization();
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();

  const isSystemAdmin = session?.user?.role === "admin";
  const activeOrgId = activeOrg?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const { data: fullOrg, isPending: fullOrgLoading } = useFullOrganization(
    activeOrg?.id || "",
    refreshKey,
  );
  const { data: activeMember } = useActiveMember(activeOrgId);
  const { teams, teamsLoading, loadTeams } = useTeams(activeOrgId);
  const { teamMembers, teamMembersLoading, loadTeamMembers } = useTeamMembers(
    activeOrgId,
    teams,
  );

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const currentUserRole = (activeMember?.role as Role) || "viewer";
  const canManageMembers = isSystemAdmin || currentUserRole === "owner";
  const canChangeRoles = isSystemAdmin || currentUserRole === "owner";
  const canDeleteOrg = isSystemAdmin || currentUserRole === "owner";

  const assignableRoles = roleHierarchy.filter((role) => {
    if (isSystemAdmin) return true;
    if (role === "owner") return false;
    return currentUserRole === "owner";
  });

  const members: OrgMember[] = fullOrg?.members || [];
  const invitations: Invitation[] = fullOrg?.invitations || [];
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const handleSwitchOrg = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh();
  };

  const handleCreateNameChange = (value: string) => {
    setCreateName(value);
    if (!createSlug || createSlug === generateSlug(createName)) {
      setCreateSlug(generateSlug(value));
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toastManager.add({
        type: "error",
        title: "Organization name is required",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: slugCheck } = await authClient.organization.checkSlug({
        slug: createSlug,
      });
      if (slugCheck?.status === false) {
        toastManager.add({
          type: "error",
          title: "This slug is already taken",
        });
        setIsCreating(false);
        return;
      }

      const { data, error } = await authClient.organization.create({
        name: createName.trim(),
        slug: createSlug.trim(),
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to create organization",
        });
        return;
      }

      if (data) {
        await authClient.organization.setActive({ organizationId: data.id });
        toastManager.add({ type: "success", title: "Organization created!" });
        setShowCreateDialog(false);
        setCreateName("");
        setCreateSlug("");
        router.refresh();
      }
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsCreating(false);
    }
  };

  if (orgLoading || orgsLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-blue)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold">
            Organization Management
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage your organization settings, members, and teams
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage your projects.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization}>
              <DialogBody className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dialog-org-name">Organization Name</Label>
                  <Input
                    id="dialog-org-name"
                    value={createName}
                    onChange={(e) => handleCreateNameChange(e.target.value)}
                    placeholder="My Awesome Organization"
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialog-org-slug">Slug</Label>
                  <Input
                    id="dialog-org-slug"
                    value={createSlug}
                    onChange={(e) =>
                      setCreateSlug(e.target.value.toLowerCase())
                    }
                    placeholder="my-awesome-org"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">Used in URLs</p>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Spinner className="h-4 w-4 mr-2" />}Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <OrgSelector
        organizations={(organizations || []) as Organization[]}
        activeOrgId={activeOrgId}
        onSwitchOrg={handleSwitchOrg}
      />

      {(!organizations || organizations.length === 0) && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No organizations yet.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      )}

      {activeOrg && (
        <div className="space-y-6">
          <OrgSettings activeOrg={activeOrg as Organization} />
          <MembersSection
            members={members}
            pendingInvitations={pendingInvitations}
            activeOrg={activeOrg as Organization}
            currentUserId={session?.user?.id || ""}
            currentUserRole={currentUserRole}
            isSystemAdmin={isSystemAdmin}
            canManageMembers={canManageMembers}
            canChangeRoles={canChangeRoles}
            assignableRoles={assignableRoles}
            isLoading={fullOrgLoading}
            onRefresh={handleRefresh}
          />
          <TeamsSection
            teams={teams}
            teamMembers={teamMembers}
            teamMembersLoading={teamMembersLoading}
            members={members}
            activeOrg={activeOrg as Organization}
            canManageMembers={canManageMembers}
            isLoading={teamsLoading}
            onLoadTeams={loadTeams}
            onLoadTeamMembers={loadTeamMembers}
          />
          {canDeleteOrg && <DangerZone activeOrg={activeOrg as Organization} />}
        </div>
      )}
    </Card>
  );
}
