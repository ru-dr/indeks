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
    <div className="space-y-6">
      {/* Team Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Team Settings</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div>
            <Label htmlFor="team-slug">Team Slug</Label>
            <Input
              id="team-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used in URLs and API references
            </p>
          </div>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/50">
        <h2 className="text-lg font-semibold text-destructive mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete a team, there is no going back. All projects and data
          associated with this team will be permanently deleted.
        </p>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger>
            <Button variant="destructive">Delete Team</Button>
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
            <div className="px-6 py-4">
              <Label htmlFor="delete-confirm">
                Type <strong>{organization.name}</strong> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={organization.name}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogClose>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
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
      </Card>
    </div>
  );
}
