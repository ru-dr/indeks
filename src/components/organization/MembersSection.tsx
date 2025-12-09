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
import { roleDisplayNames, type Role } from "@/lib/permissions";
import { Users, UserPlus, Mail, Clock, X } from "lucide-react";

// Types
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

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  inviterId: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

// Utils
function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "owner": return "default";
    case "member": return "secondary";
    default: return "outline";
  }
}

interface MembersSectionProps {
  members: OrgMember[];
  pendingInvitations: Invitation[];
  activeOrg: Organization;
  currentUserId: string;
  currentUserRole: Role;
  isSystemAdmin: boolean;
  canManageMembers: boolean;
  canChangeRoles: boolean;
  assignableRoles: Role[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function MembersSection({
  members,
  pendingInvitations,
  activeOrg,
  currentUserId,
  currentUserRole,
  isSystemAdmin,
  canManageMembers,
  canChangeRoles,
  assignableRoles,
  isLoading,
  onRefresh,
}: MembersSectionProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);

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
        role: inviteRole as "owner" | "member" | "viewer",
        organizationId: activeOrg.id,
      });

      if (error) {
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteRole("member");
        setTimeout(() => {
          toastManager.add({ type: "error", title: error.message || "Failed to send invitation" });
        }, 100);
        return;
      }

      const emailSent = inviteEmail;
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
      onRefresh();
      setTimeout(() => {
        toastManager.add({ type: "success", title: `Invitation sent to ${emailSent}` });
      }, 100);
    } catch {
      setShowInviteDialog(false);
      setTimeout(() => {
        toastManager.add({ type: "error", title: "Something went wrong" });
      }, 100);
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
      onRefresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    if (!activeOrg) return;
    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId: activeOrg.id,
      });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to update role" });
        return;
      }

      toastManager.add({ type: "success", title: "Role updated" });
      onRefresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInviteId(invitationId);
    try {
      const { error } = await authClient.organization.cancelInvitation({ invitationId });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to cancel" });
        return;
      }

      toastManager.add({ type: "success", title: "Invitation cancelled" });
      onRefresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setCancellingInviteId(null);
    }
  };

  return (
    <div className="pb-6 border-b">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Members</h4>
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
                <DialogDescription>Send an invitation email.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteMember}>
                <DialogBody className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
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
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)} disabled={isInviting}>
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
                    Send
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
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const memberRole = member.role as Role;
            const canRemove = isSystemAdmin ? !isCurrentUser : (currentUserRole === "owner" && !isCurrentUser && memberRole !== "owner");
            const canEdit = isSystemAdmin ? !isCurrentUser : (currentUserRole === "owner" && !isCurrentUser && memberRole !== "owner");

            return (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
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
                  {canEdit && canChangeRoles ? (
                    <Select value={memberRole} onValueChange={(v) => handleUpdateRole(member.id, v as Role)}>
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
            <h5 className="text-xs font-medium text-muted-foreground">
              Pending Invitations ({pendingInvitations.length})
            </h5>
          </div>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-dashed">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {roleDisplayNames[inv.role as Role] || inv.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(inv.id)}
                    disabled={cancellingInviteId === inv.id}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    {cancellingInviteId === inv.id ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
