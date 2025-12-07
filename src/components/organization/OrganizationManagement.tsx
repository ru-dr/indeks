"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import { roleDisplayNames, roleHierarchy, type Role } from "@/lib/permissions";
import {
  Building2,
  Plus,
  Settings,
  Save,
  Trash2,
  Users,
  UserPlus,
  Mail,
  Clock,
  X,
  UsersRound,
} from "lucide-react";

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  inviterId: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

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

export function OrganizationManagement() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: orgLoading } = authClient.useActiveOrganization();
  const { data: organizations, isPending: orgsLoading } = authClient.useListOrganizations();
  
  // Check if current user is a SYSTEM admin (not org admin)
  const isSystemAdmin = session?.user?.role === "admin";
  
  const activeOrgId = activeOrg?.id;

  const [refreshKey, setRefreshKey] = useState(0);
  const { data: fullOrg, isPending: fullOrgLoading } = useFullOrganization(
    activeOrg?.id || "",
    refreshKey
  );
  const { data: activeMember } = useActiveMember();

  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [isInviting, setIsInviting] = useState(false);

  
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);

  
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsLoadedForOrg, setTeamsLoadedForOrg] = useState<string | null>(null);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  // Team members state
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [teamMembersLoading, setTeamMembersLoading] = useState<Record<string, boolean>>({});
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("");
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [removingTeamMemberId, setRemovingTeamMemberId] = useState<string | null>(null);

  const currentUserRole = (activeMember?.role as Role) || "viewer";
  const canManageMembers = ["owner", "admin"].includes(currentUserRole);
  const canChangeRoles = currentUserRole === "owner" || isSystemAdmin;

  // Filter assignable roles:
  // - Regular owners can only assign roles BELOW their level (viewer, member)
  // - Only SYSTEM admins can assign the "admin" org role
  const assignableRoles = roleHierarchy.filter((role) => {
    // "admin" org role can only be assigned by system admins
    if (role === "admin" && !isSystemAdmin) {
      return false;
    }
    // "owner" role cannot be assigned (must transfer ownership separately)
    if (role === "owner") {
      return false;
    }
    // For non-system admins, can only assign roles below their level
    if (!isSystemAdmin) {
      const currentIndex = roleHierarchy.indexOf(currentUserRole);
      const roleIndex = roleHierarchy.indexOf(role);
      return roleIndex < currentIndex;
    }
    // System admins can assign any role except owner
    return true;
  });

  
  useEffect(() => {
    if (activeOrg?.name && activeOrg?.slug) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
    }
  }, [activeOrg?.name, activeOrg?.slug]);

  
  useEffect(() => {
    if (activeOrgId && activeOrgId !== teamsLoadedForOrg) {
      loadTeams();
      setTeamsLoadedForOrg(activeOrgId);
    }
  }, [activeOrgId, teamsLoadedForOrg]);

  const loadTeams = async () => {
    if (!activeOrgId) return;
    setTeamsLoading(true);
    try {
      const { data } = await authClient.organization.listTeams({
        query: { organizationId: activeOrgId },
      });
      setTeams(data || []);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    setTeamMembersLoading((prev) => ({ ...prev, [teamId]: true }));
    try {
      const { data } = await authClient.organization.listTeamMembers({
        query: { teamId },
      });
      setTeamMembers((prev) => ({ ...prev, [teamId]: data || [] }));
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setTeamMembersLoading((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const handleToggleTeam = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
      if (!teamMembers[teamId]) {
        loadTeamMembers(teamId);
      }
    }
  };

  const handleOpenAddMemberDialog = (team: Team) => {
    setSelectedTeamForMember(team);
    setSelectedMemberToAdd("");
    setShowAddMemberDialog(true);
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForMember || !selectedMemberToAdd) {
      toastManager.add({ type: "error", title: "Please select a member" });
      return;
    }

    setIsAddingTeamMember(true);
    try {
      const { error } = await authClient.organization.addTeamMember({
        teamId: selectedTeamForMember.id,
        userId: selectedMemberToAdd,
      });

      if (error) {
        setShowAddMemberDialog(false);
        setSelectedTeamForMember(null);
        setSelectedMemberToAdd("");
        setTimeout(() => {
          toastManager.add({ type: "error", title: error.message || "Failed to add member to team" });
        }, 0);
        return;
      }

      const teamId = selectedTeamForMember.id;
      setShowAddMemberDialog(false);
      setSelectedTeamForMember(null);
      setSelectedMemberToAdd("");
      loadTeamMembers(teamId);
      setTimeout(() => {
        toastManager.add({ type: "success", title: "Member added to team" });
      }, 0);
    } catch {
      setShowAddMemberDialog(false);
      setSelectedTeamForMember(null);
      setSelectedMemberToAdd("");
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 0);
    } finally {
      setIsAddingTeamMember(false);
    }
  };

  const handleRemoveTeamMember = async (teamId: string, userId: string) => {
    setRemovingTeamMemberId(userId);
    try {
      const { error } = await authClient.organization.removeTeamMember({
        teamId,
        userId,
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to remove member from team" });
        return;
      }

      toastManager.add({ type: "success", title: "Member removed from team" });
      loadTeamMembers(teamId);
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setRemovingTeamMemberId(null);
    }
  };

  // Get org members who are not already in the selected team
  const getAvailableMembersForTeam = (teamId: string) => {
    const currentTeamMembers = teamMembers[teamId] || [];
    const teamMemberUserIds = new Set(currentTeamMembers.map((tm) => tm.userId));
    return members.filter((member) => !teamMemberUserIds.has(member.userId));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
      toastManager.add({ type: "error", title: "Organization name is required" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: slugCheck } = await authClient.organization.checkSlug({ slug: createSlug });
      if (slugCheck?.status === false) {
        toastManager.add({ type: "error", title: "This slug is already taken" });
        setIsCreating(false);
        return;
      }

      const { data, error } = await authClient.organization.create({
        name: createName.trim(),
        slug: createSlug.trim(),
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to create organization" });
        return;
      }

      if (data) {
        await authClient.organization.setActive({ organizationId: data.id });
        toastManager.add({ type: "success", title: "Organization created successfully!" });
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

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toastManager.add({ type: "error", title: "Organization name is required" });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await authClient.organization.update({
        data: { name: orgName.trim(), slug: orgSlug.trim() },
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to update organization" });
        return;
      }

      toastManager.add({ type: "success", title: "Organization updated" });
      router.refresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeOrg) {
      toastManager.add({ type: "error", title: "Email is required" });
      return;
    }

    setIsInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: activeOrg.id,
      });

      if (error) {
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteRole("member");
        setTimeout(() => {
          toastManager.add({ type: "error", title: error.message || "Failed to send invitation" });
        }, 0);
        return;
      }

      const emailSent = inviteEmail;
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        toastManager.add({ type: "success", title: `Invitation sent to ${emailSent}` });
      }, 0);
    } catch {
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 0);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!activeOrg) return;
    setRemovingMemberId(memberId);
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberEmail,
        organizationId: activeOrg.id,
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to remove member" });
        return;
      }

      toastManager.add({ type: "success", title: "Member removed" });
      setRefreshKey((k) => k + 1);
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    if (!activeOrg) return;
    try {
      // Use our custom API for role updates with server-side validation
      // This ensures only system admins can assign "admin" role
      const response = await fetch(`/api/v1/organization/members/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          role: newRole,
          organizationId: activeOrg.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toastManager.add({ type: "error", title: result.message || "Failed to update role" });
        return;
      }

      toastManager.add({ type: "success", title: "Role updated" });
      setRefreshKey((k) => k + 1);
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInviteId(invitationId);
    try {
      const { error } = await authClient.organization.cancelInvitation({ invitationId });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to cancel invitation" });
        return;
      }

      toastManager.add({ type: "success", title: "Invitation cancelled" });
      setRefreshKey((k) => k + 1);
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setCancellingInviteId(null);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!activeOrg || deleteConfirmation !== activeOrg.name) {
      toastManager.add({ type: "error", title: "Please type the organization name to confirm" });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await authClient.organization.delete({ organizationId: activeOrg.id });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to delete organization" });
        return;
      }

      toastManager.add({ type: "success", title: "Organization deleted" });
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTeamName.trim() || !activeOrg) {
      toastManager.add({ type: "error", title: "Team name is required" });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const { data, error } = await authClient.organization.createTeam({
        name: createTeamName.trim(),
        organizationId: activeOrg.id,
      });

      if (error) {
        setShowCreateTeamDialog(false);
        setCreateTeamName("");
        setTimeout(() => {
          toastManager.add({ type: "error", title: error.message || "Failed to create team" });
        }, 0);
        return;
      }

      if (data) {
        setShowCreateTeamDialog(false);
        setCreateTeamName("");
        setTeamsLoadedForOrg(null);
        loadTeams();
        setTimeout(() => {
          toastManager.add({ type: "success", title: "Team created successfully!" });
        }, 0);
      }
    } catch {
      setShowCreateTeamDialog(false);
      setCreateTeamName("");
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 0);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!activeOrg) return;
    try {
      const { error } = await authClient.organization.removeTeam({
        teamId,
        organizationId: activeOrg.id,
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to delete team" });
        return;
      }

      toastManager.add({ type: "success", title: "Team deleted" });
      setTeamsLoadedForOrg(null); 
      loadTeams();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh();
  };

  const getOrgInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner": return "default";
      case "admin": return "secondary";
      default: return "outline";
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

  const members: OrgMember[] = fullOrg?.members || [];
  const invitations: Invitation[] = fullOrg?.invitations || [];
  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[var(--color-indeks-blue)]/10">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-indeks-blue)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold">Organization Management</h3>
          <p className="text-xs text-muted-foreground">
            Manage your organization settings, members, and teams
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Organization
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage your projects and collaborate with others.
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
                  <Label htmlFor="dialog-org-slug">Organization Slug</Label>
                  <Input
                    id="dialog-org-slug"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                    placeholder="my-awesome-org"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">Used in URLs and API references</p>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Spinner className="h-4 w-4 mr-2" />}
                  Create Organization
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Selector */}
      {organizations && organizations.length > 0 && (
        <div className="mb-6 pb-6 border-b">
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Organization
          </Label>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  activeOrg?.id === org.id
                    ? "border-[var(--color-indeks-green)] bg-[var(--color-indeks-green)]/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[var(--color-indeks-blue)]/10 text-[var(--color-indeks-blue)] text-sm">
                    {getOrgInitials(org.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{org.slug}</p>
                </div>
                {activeOrg?.id === org.id && (
                  <Badge variant="success" className="text-xs shrink-0">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No organizations state */}
      {(!organizations || organizations.length === 0) && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No organizations yet. Create your first organization to get started.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      )}

      {/* Active Organization Management */}
      {activeOrg && (
        <div className="space-y-6">
          {/* Organization Settings Section */}
          <div className="pb-6 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Organization Settings</h4>
            </div>
            <form onSubmit={handleUpdateOrganization}>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Organization Slug</Label>
                  <Input
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={isUpdating} size="sm">
                  {isUpdating ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Members Section */}
          <div className="pb-6 border-b">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Organization Members</h4>
                <Badge variant="outline" className="text-xs">{members.length}</Badge>
              </div>
              {canManageMembers && (
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger
                    render={(props) => (
                      <Button {...props} size="sm" variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    )}
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Member</DialogTitle>
                      <DialogDescription>Send an invitation to add someone to your organization.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember}>
                      <DialogBody className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="teammate@example.com"
                            disabled={isInviting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as Role)} disabled={isInviting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => (
                                <SelectItem key={role} value={role}>{roleDisplayNames[role]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </DialogBody>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)} disabled={isInviting}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isInviting}>
                          {isInviting && <Spinner className="h-4 w-4 mr-2" />}
                          Send Invitation
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {fullOrgLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isCurrentUser = member.userId === session?.user?.id;
                  const memberRole = member.role as Role;
                  const canRemove = canManageMembers && !isCurrentUser && roleHierarchy.indexOf(currentUserRole) > roleHierarchy.indexOf(memberRole);
                  const canEdit = canChangeRoles && !isCurrentUser && memberRole !== "owner";

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {member.user.image ? (
                            <Image src={member.user.image} alt={member.user.name} width={36} height={36} className="rounded-full" />
                          ) : (
                            <AvatarFallback className="text-sm">
                              {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {member.user.name}
                            {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-12 sm:ml-0">
                        {canEdit ? (
                          <Select value={memberRole} onValueChange={(value) => handleUpdateRole(member.id, value as Role)}>
                            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => (
                                <SelectItem key={role} value={role}>{roleDisplayNames[role]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(memberRole)} className="text-xs">
                            {roleDisplayNames[memberRole] || memberRole}
                          </Badge>
                        )}
                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, member.user.email)}
                            disabled={removingMemberId === member.id}
                            className="text-destructive hover:text-destructive h-8 px-2"
                          >
                            {removingMemberId === member.id ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="text-muted-foreground text-center py-4 text-sm">No members yet</p>
                )}
              </div>
            )}

            {/* Pending Invitations */}
            {canManageMembers && pendingInvitations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h5 className="text-xs font-medium text-muted-foreground">Pending Invitations ({pendingInvitations.length})</h5>
                </div>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-dashed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{invitation.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited as {roleDisplayNames[invitation.role as Role] || invitation.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-12 sm:ml-0">
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={cancellingInviteId === invitation.id}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        >
                          {cancellingInviteId === invitation.id ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Teams Section */}
          <div className="pb-6 border-b">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Teams</h4>
                <Badge variant="outline" className="text-xs">{teams.length}</Badge>
              </div>
              {canManageMembers && (
                <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
                  <DialogTrigger
                    render={(props) => (
                      <Button {...props} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    )}
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>Create a team within your organization to group members.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam}>
                      <DialogBody className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="team-name">Team Name</Label>
                          <Input
                            id="team-name"
                            value={createTeamName}
                            onChange={(e) => setCreateTeamName(e.target.value)}
                            placeholder="Engineering"
                            disabled={isCreatingTeam}
                          />
                        </div>
                      </DialogBody>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowCreateTeamDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreatingTeam}>
                          {isCreatingTeam && <Spinner className="h-4 w-4 mr-2" />}
                          Create Team
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {teamsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : teams.length > 0 ? (
              <div className="space-y-2">
                {teams.map((team) => {
                  const isExpanded = expandedTeamId === team.id;
                  const currentTeamMembers = teamMembers[team.id] || [];
                  const isLoadingMembers = teamMembersLoading[team.id];

                  return (
                    <div key={team.id} className="rounded-lg border overflow-hidden">
                      <div
                        className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleToggleTeam(team.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[var(--color-indeks-blue)]/10 flex items-center justify-center">
                            <UsersRound className="h-4 w-4 text-[var(--color-indeks-blue)]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {currentTeamMembers.length > 0
                                ? `${currentTeamMembers.length} member${currentTeamMembers.length !== 1 ? "s" : ""}`
                                : "No members"}
                              {" · "}
                              Created {new Date(team.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddMemberDialog(team);
                              }}
                              className="h-8 px-2"
                              title="Add member to team"
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          )}
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team.id);
                              }}
                              className="text-destructive hover:text-destructive h-8 px-2"
                              title="Delete team"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          <svg
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-3">
                          {isLoadingMembers ? (
                            <div className="flex items-center justify-center py-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          ) : currentTeamMembers.length > 0 ? (
                            <div className="space-y-2">
                              {currentTeamMembers.map((tm) => (
                                <div
                                  key={tm.id}
                                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      {tm.user.image ? (
                                        <Image src={tm.user.image} alt={tm.user.name} width={28} height={28} className="rounded-full" />
                                      ) : (
                                        <AvatarFallback className="text-xs">
                                          {tm.user.name?.charAt(0)?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{tm.user.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{tm.user.email}</p>
                                    </div>
                                  </div>
                                  {canManageMembers && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveTeamMember(team.id, tm.userId)}
                                      disabled={removingTeamMemberId === tm.userId}
                                      className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                    >
                                      {removingTeamMemberId === tm.userId ? (
                                        <Spinner className="h-3 w-3" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No members in this team yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border rounded-lg border-dashed bg-muted/20">
                <UsersRound className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No teams yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create teams to organize members into groups</p>
              </div>
            )}
          </div>

          {/* Add Team Member Dialog */}
          <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member to {selectedTeamForMember?.name}</DialogTitle>
                <DialogDescription>
                  Select an organization member to add to this team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTeamMember}>
                <DialogBody className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-member-select">Select Member</Label>
                    {selectedTeamForMember && getAvailableMembersForTeam(selectedTeamForMember.id).length > 0 ? (
                      <Select
                        value={selectedMemberToAdd}
                        onValueChange={setSelectedMemberToAdd}
                        disabled={isAddingTeamMember}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTeamForMember && getAvailableMembersForTeam(selectedTeamForMember.id).map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              <div className="flex items-center gap-2">
                                <span>{member.user.name}</span>
                                <span className="text-muted-foreground">({member.user.email})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        All organization members are already in this team.
                      </p>
                    )}
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMemberDialog(false)}
                    disabled={isAddingTeamMember}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingTeamMember || !selectedMemberToAdd || (selectedTeamForMember ? getAvailableMembersForTeam(selectedTeamForMember.id).length === 0 : true)}
                  >
                    {isAddingTeamMember && <Spinner className="h-4 w-4 mr-2" />}
                    Add to Team
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Danger Zone */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium">Delete Organization</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete this organization and all associated data
                </p>
              </div>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow-xs hover:bg-destructive/90 w-full sm:w-auto shrink-0">
                  Delete Organization
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete <strong>{activeOrg.name}</strong> and all associated projects and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogBody className="space-y-2">
                    <Label htmlFor="delete-org-confirm">Type <strong>{activeOrg.name}</strong> to confirm</Label>
                    <Input
                      id="delete-org-confirm"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={activeOrg.name}
                    />
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose
                      onClick={() => { setDeleteConfirmation(""); setIsDeleteDialogOpen(false); }}
                      className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
                    >
                      Cancel
                    </AlertDialogClose>
                    <Button variant="destructive" onClick={handleDeleteOrganization} disabled={deleteConfirmation !== activeOrg.name || isDeleting}>
                      {isDeleting && <Spinner className="h-4 w-4 mr-2" />}
                      Delete Organization
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
