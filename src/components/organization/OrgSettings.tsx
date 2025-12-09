"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { Settings, Save } from "lucide-react";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface OrgSettingsProps {
  activeOrg: Organization;
}

export function OrgSettings({ activeOrg }: OrgSettingsProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [originalOrgName, setOriginalOrgName] = useState("");
  const [originalOrgSlug, setOriginalOrgSlug] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (activeOrg?.name && activeOrg?.slug) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
      setOriginalOrgName(activeOrg.name);
      setOriginalOrgSlug(activeOrg.slug);
    }
  }, [activeOrg?.name, activeOrg?.slug]);

  const hasChanges = orgName !== originalOrgName || orgSlug !== originalOrgSlug;

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toastManager.add({
        type: "error",
        title: "Organization name is required",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await authClient.organization.update({
        data: { name: orgName.trim(), slug: orgSlug.trim() },
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to update",
        });
        return;
      }

      setOriginalOrgName(orgName.trim());
      setOriginalOrgSlug(orgSlug.trim());
      toastManager.add({ type: "success", title: "Organization updated" });
      router.refresh();
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setOrgName(originalOrgName);
    setOrgSlug(originalOrgSlug);
  };

  return (
    <div className="pb-6 border-b">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Organization Settings</h4>
      </div>
      <form onSubmit={handleUpdateOrganization}>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
              disabled={isUpdating}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={!hasChanges || isUpdating}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!hasChanges || isUpdating} size="sm">
            {isUpdating ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
