"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { roleDisplayNames, roleHierarchy, type Role } from "@/lib/permissions";
import { Clock, Mail, X, Users, UserPlus } from "lucide-react";

interface TeamMember {
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

interface TeamMembersProps {
  organizationId: string;
  members: TeamMember[];
  invitations?: Invitation[];
  currentUserId: string;
  currentUserRole: Role;
  onMembersChange?: () => void;
}

export function TeamMembers({
  organizationId,
  members,
  invitations: initialInvitations = [],
  currentUserId,
  currentUserRole,
  onMembersChange,
}: TeamMembersProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(
    null,
  );
  const [invitations, setInvitations] =
    useState<Invitation[]>(initialInvitations);

  // Sync invitations when prop changes
  useEffect(() => {
    setInvitations(initialInvitations);
  }, [initialInvitations]);

  const canManageMembers = ["owner", "admin"].includes(currentUserRole);
  const canChangeRoles = currentUserRole === "owner";

  const assignableRoles = roleHierarchy.filter((role) => {
    const currentIndex = roleHierarchy.indexOf(currentUserRole);
    const roleIndex = roleHierarchy.indexOf(role);
    return roleIndex < currentIndex;
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toastManager.add({ type: "error", title: "Email is required" });
      return;
    }

    const emailToInvite = inviteEmail.trim();
    setIsInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: emailToInvite,
        role: inviteRole,
        organizationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to send invitation",
        });
        return;
      }

      // Close dialog and reset form first
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      
      // Defer toast to avoid flushSync during React render
      setTimeout(() => {
        toastManager.add({
          type: "success",
          title: `Invitation sent to ${emailToInvite}`,
        });
      }, 0);
      
      onMembersChange?.();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    setRemovingMemberId(memberId);
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberEmail,
        organizationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to remove member",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Member removed" });
      onMembersChange?.();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to update role",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Role updated" });
      onMembersChange?.();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInviteId(invitationId);
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to cancel invitation",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Invitation cancelled" });
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setCancellingInviteId(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-indeks-green)]" />
          <h2 className="text-base sm:text-lg font-semibold">Team Members</h2>
        </div>
        {canManageMembers && (
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger
              render={(props) => (
                <Button {...props} size="sm" className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to add someone to your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite}>
                <div className="space-y-4 px-6 py-4">
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
                    <Select
                      value={inviteRole}
                      onValueChange={(value) => setInviteRole(value as Role)}
                      disabled={isInviting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleDisplayNames[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    disabled={isInviting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const memberRole = member.role as Role;
          const canRemove =
            canManageMembers &&
            !isCurrentUser &&
            roleHierarchy.indexOf(currentUserRole) >
              roleHierarchy.indexOf(memberRole);
          const canEdit =
            canChangeRoles && !isCurrentUser && memberRole !== "owner";

          return (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {member.user.image ? (
                    <img src={member.user.image} alt={member.user.name} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                      {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {member.user.name}
                    {isCurrentUser && (
                      <span className="text-muted-foreground ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-13 sm:ml-0">
                {canEdit ? (
                  <Select
                    value={memberRole}
                    onValueChange={(value) =>
                      handleUpdateRole(member.id, value as Role)
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleDisplayNames[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getRoleBadgeVariant(memberRole)}>
                    {roleDisplayNames[memberRole] || memberRole}
                  </Badge>
                )}

                {canRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRemoveMember(member.id, member.user.email)
                    }
                    disabled={removingMemberId === member.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {removingMemberId === member.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No team members yet
          </p>
        )}
      </div>

      {/* Pending Invitations */}
      {canManageMembers && pendingInvitations.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-dashed"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as{" "}
                      {roleDisplayNames[invitation.role as Role] ||
                        invitation.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-13 sm:ml-0">
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={cancellingInviteId === invitation.id}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    {cancellingInviteId === invitation.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
