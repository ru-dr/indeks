"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
import { Trash2 } from "lucide-react";

// Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface DangerZoneProps {
  activeOrg: Organization;
}

export function DangerZone({ activeOrg }: DangerZoneProps) {
  const router = useRouter();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOrganization = async () => {
    if (!activeOrg || deleteConfirmation !== activeOrg.name) {
      toastManager.add({ type: "error", title: "Please type the organization name to confirm" });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await authClient.organization.delete({ organizationId: activeOrg.id });

      if (error) {
        toastManager.add({ type: "error", title: error.message || "Failed to delete" });
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

  const handleCloseDialog = () => {
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="pt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-red-500/15 dark:bg-red-500/20">
          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Danger Zone</h4>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-500/30 dark:border-red-500/25 bg-red-50 dark:bg-red-950/30">
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Delete Organization</p>
          <p className="text-xs text-muted-foreground mt-1">
            Permanently delete this organization and all data
          </p>
        </div>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white shadow-xs w-full sm:w-auto shrink-0">
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{activeOrg.name}</strong> and all projects.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogBody className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <strong>{activeOrg.name}</strong> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={activeOrg.name}
              />
            </AlertDialogBody>
            <AlertDialogFooter>
              <AlertDialogClose
                onClick={handleCloseDialog}
                className="relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent"
              >
                Cancel
              </AlertDialogClose>
              <Button
                variant="destructive"
                onClick={handleDeleteOrganization}
                disabled={deleteConfirmation !== activeOrg.name || isDeleting}
              >
                {isDeleting && <Spinner className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
