"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import { AlertTriangle, Trash2, Database } from "lucide-react";
import type { Project } from "./ProjectSettings";

interface DangerZoneProps {
  project: Project;
  onProjectDelete: () => void;
}

export function DangerZone({ project, onProjectDelete }: DangerZoneProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmText = project.title;
  const canDelete = deleteConfirmText === confirmText;

  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete project");
      }

      toastManager.add({
        type: "success",
        title: "Project deleted",
        description: "All associated data has been removed",
      });

      onProjectDelete();
    } catch (error) {
      toastManager.add({
        type: "error",
        title:
          error instanceof Error ? error.message : "Failed to delete project",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">Danger Zone</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        These actions are irreversible. Please proceed with caution.
      </p>

      {/* Delete Analytics Data */}
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">Delete Analytics Data</h4>
            <p className="text-sm text-muted-foreground">
              Remove all collected analytics data for this project. The project
              and its settings will remain intact.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/50 hover:bg-destructive/10"
          disabled
        >
          Clear Analytics Data
          <span className="ml-2 text-xs text-muted-foreground">
            (Coming soon)
          </span>
        </Button>
      </div>

      {/* Delete Project */}
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">Delete Project</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete this project and all associated data including
              analytics, team access, and settings. This action cannot be
              undone.
            </p>
          </div>
        </div>

        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) setDeleteConfirmText("");
          }}
        >
          <AlertDialogTrigger
            render={(props) => (
              <Button {...props} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            )}
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Project Permanently?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    This will permanently delete{" "}
                    <span className="font-semibold text-foreground">
                      {project.title}
                    </span>{" "}
                    and all of its data:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>All analytics data and metrics</li>
                    <li>Team member access and permissions</li>
                    <li>API keys and integrations</li>
                    <li>Project settings and configuration</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="px-6 pb-4 space-y-2">
              <Label htmlFor="confirm-delete">
                Type{" "}
                <span className="font-mono font-semibold">{confirmText}</span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter project name"
                disabled={deleting}
                className="font-mono"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogClose
                render={(props) => (
                  <Button {...props} variant="outline" disabled={deleting}>
                    Cancel
                  </Button>
                )}
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
              >
                {deleting && <Spinner className="h-4 w-4 mr-2" />}
                Delete Forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Warning */}
      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
        <p className="font-medium text-yellow-600 dark:text-yellow-500">
          ⚠️ Warning
        </p>
        <p className="text-muted-foreground mt-1">
          Deleting a project is permanent and cannot be recovered. Make sure you
          have exported any data you need before proceeding.
        </p>
      </div>
    </div>
  );
}
