"use client";

import { useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
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
import { toastManager } from "@/components/ui/toast";
import {
  Plus,
  Trash2,
  UserPlus,
  X,
  UsersRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface OrgMember {
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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface TeamsSectionProps {
  teams: Team[];
  teamMembers: Record<string, TeamMember[]>;
  teamMembersLoading: Record<string, boolean>;
  members: OrgMember[];
  activeOrg: Organization;
  canManageMembers: boolean;
  isLoading: boolean;
  onLoadTeams: () => void;
  onLoadTeamMembers: (teamId: string) => void;
}

export function TeamsSection({
  teams,
  teamMembers,
  teamMembersLoading,
  members,
  activeOrg,
  canManageMembers,
  isLoading,
  onLoadTeams,
  onLoadTeamMembers,
}: TeamsSectionProps) {
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedTeamForMember, setSelectedTeamForMember] =
    useState<Team | null>(null);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("");
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [removingTeamMemberId, setRemovingTeamMemberId] = useState<
    string | null
  >(null);

  const handleToggleTeam = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
      if (!teamMembers[teamId]) {
        onLoadTeamMembers(teamId);
      }
    }
  };

  const handleOpenAddMemberDialog = async (team: Team) => {
    setSelectedTeamForMember(team);
    setSelectedMemberToAdd("");
    if (!teamMembers[team.id]) {
      onLoadTeamMembers(team.id);
    }
    setShowAddMemberDialog(true);
  };

  const getAvailableMembersForTeam = (teamId: string) => {
    const currentTeamMembers = teamMembers[teamId] || [];
    const teamMemberUserIds = new Set(
      currentTeamMembers.map((tm) => tm.userId),
    );
    return members.filter((member) => !teamMemberUserIds.has(member.userId));
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
          toastManager.add({
            type: "error",
            title: error.message || "Failed to create team",
          });
        }, 100);
        return;
      }

      if (data) {
        setShowCreateTeamDialog(false);
        setCreateTeamName("");
        onLoadTeams();
        setTimeout(() => {
          toastManager.add({ type: "success", title: "Team created!" });
        }, 100);
      }
    } catch {
      setShowCreateTeamDialog(false);
      setCreateTeamName("");
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 100);
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
        toastManager.add({
          type: "error",
          title: error.message || "Failed to delete team",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Team deleted" });
      onLoadTeams();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForMember || !selectedMemberToAdd) {
      toastManager.add({ type: "error", title: "Please select a member" });
      return;
    }

    setIsAddingTeamMember(true);
    const teamId = selectedTeamForMember.id;

    try {
      const { error } = await authClient.organization.addTeamMember({
        teamId,
        userId: selectedMemberToAdd,
      });

      if (error) {
        setShowAddMemberDialog(false);
        setSelectedTeamForMember(null);
        setSelectedMemberToAdd("");
        setTimeout(() => {
          toastManager.add({
            type: "error",
            title: error.message || "Failed to add member to team",
          });
        }, 100);
        return;
      }

      setShowAddMemberDialog(false);
      setSelectedTeamForMember(null);
      setSelectedMemberToAdd("");

      onLoadTeamMembers(teamId);

      setTimeout(() => {
        toastManager.add({ type: "success", title: "Member added to team" });
      }, 100);
    } catch {
      setShowAddMemberDialog(false);
      setSelectedTeamForMember(null);
      setSelectedMemberToAdd("");
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 100);
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
        toastManager.add({
          type: "error",
          title: error.message || "Failed to remove member",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Member removed from team" });
      onLoadTeamMembers(teamId);
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setRemovingTeamMemberId(null);
    }
  };

  return (
    <div className="pb-6 border-b">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Teams</h4>
          <Badge variant="outline" className="text-xs">
            {teams.length}
          </Badge>
        </div>
        {canManageMembers && (
          <Dialog
            open={showCreateTeamDialog}
            onOpenChange={setShowCreateTeamDialog}
          >
            <DialogTrigger
              render={(props) => (
                <Button {...props} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Team
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
                <DialogDescription>
                  Create a team to group members.
                </DialogDescription>
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateTeamDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingTeam}>
                    {isCreatingTeam && <Spinner className="h-4 w-4 mr-2" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
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
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors text-left cursor-pointer"
                  onClick={() => handleToggleTeam(team.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleTeam(team.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-indeks-blue)]/10 flex items-center justify-center">
                      <UsersRound className="h-4 w-4 text-[var(--color-indeks-blue)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentTeamMembers.length} member
                        {currentTeamMembers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageMembers && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddMemberDialog(team);
                          }}
                          className="h-8 px-2"
                          title="Add member"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
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
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
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
                                {tm.user?.image ? (
                                  <Image
                                    src={tm.user.image}
                                    alt={tm.user?.name || ""}
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {tm.user?.name?.charAt(0)?.toUpperCase() ||
                                      "?"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {tm.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tm.user?.email || ""}
                                </p>
                              </div>
                            </div>
                            {canManageMembers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveTeamMember(team.id, tm.userId)
                                }
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
                        No members in this team
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
          <p className="text-xs text-muted-foreground mt-1">
            Create teams to organize members
          </p>
        </div>
      )}

      {/* Add Team Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Member to {selectedTeamForMember?.name}
            </DialogTitle>
            <DialogDescription>
              Select an organization member to add.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTeamMember}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-member-select">Select Member</Label>
                {selectedTeamForMember &&
                getAvailableMembersForTeam(selectedTeamForMember.id).length >
                  0 ? (
                  <Select
                    value={selectedMemberToAdd}
                    onValueChange={(value) =>
                      setSelectedMemberToAdd(value ?? "")
                    }
                    disabled={isAddingTeamMember}
                  >
                    <SelectTrigger>
                      <SelectValue aria-placeholder="Select a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTeamForMember &&
                        getAvailableMembersForTeam(
                          selectedTeamForMember.id,
                        ).map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.user.name} ({member.user.email})
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
                disabled={
                  isAddingTeamMember ||
                  !selectedMemberToAdd ||
                  (selectedTeamForMember
                    ? getAvailableMembersForTeam(selectedTeamForMember.id)
                        .length === 0
                    : true)
                }
              >
                {isAddingTeamMember && <Spinner className="h-4 w-4 mr-2" />}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
