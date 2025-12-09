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

interface OrganizationSettingsProps {
  organization: Organization;
  onUpdate?: () => void;
}

export function OrganizationSettings({
  organization,
  onUpdate,
}: OrganizationSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasChanges = name !== organization.name || slug !== organization.slug;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastManager.add({
        type: "error",
        title: "Organization name is required",
      });
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
          title: error.message || "Failed to update organization",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Organization updated" });
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
        title: "Please type the organization name to confirm",
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
          title: error.message || "Failed to delete organization",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Organization deleted" });
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
      {/* Organization Info */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-[var(--color-indeks-blue)]" />
          <h2 className="text-base sm:text-lg font-semibold">
            Organization Settings
          </h2>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <Input
                id="org-slug"
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
              type="button"
              variant="outline"
              onClick={() => {
                setName(organization.name);
                setSlug(organization.slug);
              }}
              disabled={!hasChanges || isUpdating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isUpdating}
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
      <Card className="p-4 sm:p-6 border-red-500/50 dark:border-red-500/40">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 rounded-lg bg-red-500/15 dark:bg-red-500/20">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="text-xs text-muted-foreground">
              Irreversible actions
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-500/30 dark:border-red-500/25 bg-red-50 dark:bg-red-950/30">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Delete Organization
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Once you delete an organization, there is no going back. All
              projects and data associated with this organization will be
              permanently deleted.
            </p>
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white shadow-xs w-full sm:w-auto shrink-0">
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  organization <strong>{organization.name}</strong> and all
                  associated projects and data.
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
                  Delete Organization
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
}
