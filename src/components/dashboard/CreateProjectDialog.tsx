"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Building2 } from "lucide-react";
import { useListOrganizations, authClient } from "@/lib/auth-client";

interface CreateProjectDialogProps {
  onProjectCreated?: () => void;
}

export function CreateProjectDialog({
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    link: "",
    organizationId: "",
  });

  const {
    data: organizations,
    isPending: orgsLoading,
    refetch: refetchOrgs,
  } = useListOrganizations();

  // Get first org ID safely
  const firstOrgId = organizations?.[0]?.id ?? "";

  // Auto-select organization if user has exactly one
  useEffect(() => {
    if (organizations?.length === 1 && !formData.organizationId && firstOrgId) {
      setFormData((prev) => ({ ...prev, organizationId: firstOrgId }));
    }
  }, [organizations?.length, formData.organizationId, firstOrgId]);

  const createDefaultOrganization = async () => {
    setCreatingOrg(true);
    setError(null);

    try {
      const result = await authClient.organization.create({
        name: "My Workspace",
        slug: `workspace-${Date.now()}`,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to create workspace");
      }

      // Refetch organizations
      await refetchOrgs();

      // Set the new org as selected
      const newOrgId = result.data?.id;
      if (newOrgId) {
        setFormData((prev) => ({
          ...prev,
          organizationId: newOrgId,
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workspace",
      );
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // If no organization exists, create a default one first
    if (!organizations || organizations.length === 0) {
      setError("Please create a workspace first to organize your projects");
      setLoading(false);
      return;
    }

    if (!formData.organizationId) {
      setError("Please select a workspace for your project");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category || undefined,
          link: formData.link,
          organizationId: formData.organizationId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "",
          link: "",
          organizationId: organizations.length === 1 ? firstOrgId : "",
        });
        onProjectCreated?.();
      } else {
        setError(result.message || "Failed to create project");
      }
    } catch (err) {
      setError("An error occurred while creating the project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasOrganizations = organizations && organizations.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-3 sm:px-4 py-2 w-full sm:w-auto">
        <Plus className="mr-1 sm:mr-2 h-4 w-4" />
        <span className="hidden sm:inline">New Project</span>
        <span className="sm:hidden">New</span>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-sm">
              Add a new project to start tracking analytics
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4 px-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Organization Selection */}
            <div className="grid gap-2">
              <Label htmlFor="organization">Workspace *</Label>
              {orgsLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                  <Spinner className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Loading workspaces...
                  </span>
                </div>
              ) : !hasOrganizations ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-md border border-dashed bg-muted/30">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">No workspace found</p>
                      <p className="text-xs text-muted-foreground">
                        Create a workspace to organize your projects
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={createDefaultOrganization}
                    disabled={creatingOrg}
                  >
                    {creatingOrg ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workspace
                      </>
                    )}
                  </Button>
                </div>
              ) : organizations.length === 1 ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{organizations[0].name}</span>
                </div>
              ) : (
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizationId: value ?? "" })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id ?? ""}>
                        <div className="flex items-center gap-2">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt={org.name}
                              className="h-4 w-4 rounded"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          {org.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Projects are organized within workspaces for team collaboration
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Awesome Project"
                required
                disabled={loading || !hasOrganizations}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Website URL *</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="https://example.com"
                required
                disabled={loading || !hasOrganizations}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="E-commerce, Blog, etc."
                disabled={loading || !hasOrganizations}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your project..."
                rows={3}
                disabled={loading || !hasOrganizations}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !hasOrganizations || !formData.organizationId
              }
              className="w-full sm:w-auto"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
