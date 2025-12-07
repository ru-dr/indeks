"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
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
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Edit3,
  Eye,
  Trash2,
  Mail,
  Building2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { Project } from "./ProjectSettings";
import type { ProjectRole } from "@/server/controllers/projects.controller";

interface AccessMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: ProjectRole;
  isOwner: boolean;
  grantedAt: Date | null;
}

interface TeamAccessProps {
  project: Project;
  currentUserId: string;
  userRole: ProjectRole;
}

const ROLE_OPTIONS: {
  value: "admin" | "member" | "viewer";
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "admin",
    label: "Admin",
    icon: <Shield className="h-4 w-4" />,
    description: "Can manage project settings and team members",
  },
  {
    value: "member",
    label: "member",
    icon: <Edit3 className="h-4 w-4" />,
    description: "Can view and export analytics data",
  },
  {
    value: "viewer",
    label: "Viewer",
    icon: <Eye className="h-4 w-4" />,
    description: "Read-only access to analytics",
  },
];

export function TeamAccess({
  project,
  currentUserId,
  userRole,
}: TeamAccessProps) {
  const [members, setMembers] = useState<AccessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">(
    "viewer",
  );
  const [inviting, setInviting] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManageTeam = userRole === "owner" || userRole === "admin";
  const isOrgProject = !!project.organizationId;

  const fetchAccess = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/projects/${project.id}/access`);
      if (response.ok) {
        const result = await response.json();
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch access list:", error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toastManager.add({ type: "error", title: "Email is required" });
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add member");
      }

      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      fetchAccess();

      setTimeout(() => {
        toastManager.add({
          type: "success",
          title: "Member added successfully",
        });
      }, 0);
    } catch (error) {
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to add member",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (accessId: string) => {
    setRemovingId(accessId);
    try {
      const response = await fetch(
        `/api/v1/projects/${project.id}/access/${accessId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to remove member");
      }

      fetchAccess();
      toastManager.add({ type: "success", title: "Member removed" });
    } catch (error) {
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to remove",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (
    accessId: string,
    newRole: "admin" | "member" | "viewer",
  ) => {
    try {
      const response = await fetch(
        `/api/v1/projects/${project.id}/access/${accessId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to update role");
      }

      fetchAccess();
      toastManager.add({ type: "success", title: "Role updated" });
    } catch (error) {
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to update role",
      });
    }
  };

  const getRoleBadge = (role: ProjectRole, isOwner: boolean) => {
    if (isOwner || role === "owner") {
      return (
        <Badge variant="default" className="gap-1">
          <Crown className="h-3 w-3" />
          Owner
        </Badge>
      );
    }

    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return (
      <Badge variant="outline" className="gap-1">
        {roleOption?.icon}
        {roleOption?.label || role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Section */}
      {isOrgProject && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
            <h3 className="font-semibold">Organization</h3>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Building2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Organization Project</p>
              <p className="text-sm text-muted-foreground mt-1">
                This project belongs to an organization. Team members are
                managed through organization settings. All organization members
                have access to this project based on their org role.
              </p>
            </div>
            <Link href="/settings?tab=team">
              <Button variant="outline" size="sm" className="shrink-0">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Manage Org
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Team Members Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-indeks-green)]" />
            <h3 className="font-semibold">Team Members</h3>
            <Badge variant="secondary">{members.length}</Badge>
          </div>

          {canManageTeam && !isOrgProject && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger
                render={(props) => (
                  <Button {...props} size="sm" className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              />
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Grant access to this project by entering their email
                      address. User must have an existing Indeks account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 px-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="teammate@example.com"
                        disabled={inviting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) =>
                          setInviteRole(v as "admin" | "member" | "viewer")
                        }
                        disabled={inviting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                {role.icon}
                                <span>{role.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {
                          ROLE_OPTIONS.find((r) => r.value === inviteRole)
                            ?.description
                        }
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                      disabled={inviting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting && <Spinner className="h-4 w-4 mr-2" />}
                      Add Member
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;

            const canModify =
              canManageTeam &&
              !member.isOwner &&
              !isCurrentUser &&
              !isOrgProject;

            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {member.image && (
                      <AvatarImage src={member.image} alt={member.name || ""} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {member.name?.charAt(0)?.toUpperCase() ||
                        member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.name || member.email}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-2">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  {canModify ? (
                    <Select
                      value={member.role}
                      onValueChange={(v) =>
                        handleRoleChange(
                          member.id,
                          v as "admin" | "member" | "viewer",
                        )
                      }
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    getRoleBadge(member.role, member.isOwner)
                  )}

                  {canModify && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      {removingId === member.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-sm">No team members yet</p>
              {canManageTeam && !isOrgProject && (
                <p className="text-xs mt-1">
                  Click &quot;Add Member&quot; to invite someone to collaborate
                </p>
              )}
              {isOrgProject && (
                <p className="text-xs mt-1">
                  Add members to your organization to give them access
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="pt-4 border-t space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Role Permissions
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex items-start gap-2">
            <Crown className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <span className="font-medium">Owner</span>
              <span className="text-muted-foreground ml-2">
                — Full access including project deletion
              </span>
            </div>
          </div>
          {ROLE_OPTIONS.map((role) => (
            <div key={role.value} className="flex items-start gap-2">
              <span className="mt-0.5 text-muted-foreground shrink-0">
                {role.icon}
              </span>
              <div>
                <span className="font-medium">{role.label}</span>
                <span className="text-muted-foreground ml-2">
                  — {role.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
