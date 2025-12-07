"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Save } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

interface TeamSettingsProps {
  organization: Organization;
  onUpdate?: () => void;
}

export function TeamSettings({ organization, onUpdate }: TeamSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastManager.add({ type: "error", title: "Team name is required" });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await authClient.organization.update({
        data: {
          name: name.trim(),
          slug: slug.trim(),
        },
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to update team",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Team updated" });
      onUpdate?.();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== organization.name) {
      toastManager.add({
        type: "error",
        title: "Please type the team name to confirm",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await authClient.organization.delete({
        organizationId: organization.id,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to delete team",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Team deleted" });
      setIsDialogOpen(false);
      router.push("/projects");
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    setDeleteConfirmation("");
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Team Info */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-[var(--color-indeks-blue)]" />
          <h2 className="text-base sm:text-lg font-semibold">Team Settings</h2>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-slug">Team Slug</Label>
              <Input
                id="team-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and API references
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 sm:p-6 border-destructive/50">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-base sm:text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div>
            <p className="text-sm font-medium">Delete Team</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once you delete a team, there is no going back. All projects and
              data associated with this team will be permanently deleted.
            </p>
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto shrink-0">
              Delete Team
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Team</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  team <strong>{organization.name}</strong> and all associated
                  projects and data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="delete-confirm">
                  Type <strong>{organization.name}</strong> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={organization.name}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogClose
                  className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50"
                  onClick={handleDialogClose}
                >
                  Cancel
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={
                    deleteConfirmation !== organization.name || isDeleting
                  }
                >
                  {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                  Delete Team
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
}
