"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { Users } from "lucide-react";

interface CreateTeamFormProps {
  onSuccess?: (team: { id: string; name: string; slug: string }) => void;
}

export function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);

    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastManager.add({ type: "error", title: "Team name is required" });
      return;
    }

    if (!slug.trim()) {
      toastManager.add({ type: "error", title: "Team slug is required" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: slugCheck } = await authClient.organization.checkSlug({
        slug,
      });

      if (slugCheck?.status === false) {
        toastManager.add({
          type: "error",
          title: "This slug is already taken",
        });
        return;
      }

      const { data, error } = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to create team",
        });
        return;
      }

      if (data) {
        toastManager.add({
          type: "success",
          title: "Team created successfully!",
        });

        await authClient.organization.setActive({
          organizationId: data.id,
        });

        onSuccess?.(data);
      }
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-[var(--color-indeks-blue)]" />
        <h2 className="text-base sm:text-lg font-semibold">Create a Team</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Awesome Team"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-slug">Team Slug</Label>
          <Input
            id="team-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="my-awesome-team"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Used in URLs and API references
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Create Team
          </Button>
        </div>
      </form>
    </Card>
  );
}
