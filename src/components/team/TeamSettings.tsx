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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Team name is required");
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
        toast.error(error.message || "Failed to update team");
        return;
      }

      toast.success("Team updated");
      onUpdate?.();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== organization.name) {
      toast.error("Please type the team name to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await authClient.organization.delete({
        organizationId: organization.id,
      });

      if (error) {
        toast.error(error.message || "Failed to delete team");
        return;
      }

      toast.success("Team deleted");
      router.push("/projects");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
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
            <div className="py-4">
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
              <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={
                  deleteConfirmation !== organization.name || isDeleting
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
