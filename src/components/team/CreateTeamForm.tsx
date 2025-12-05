"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

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
      toast.error("Team name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Team slug is required");
      return;
    }

    setIsLoading(true);
    try {
      const { data: slugCheck } = await authClient.organization.checkSlug({
        slug,
      });

      if (slugCheck?.status === false) {
        toast.error("This slug is already taken");
        return;
      }

      const { data, error } = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (error) {
        toast.error(error.message || "Failed to create team");
        return;
      }

      if (data) {
        toast.success("Team created successfully!");

        await authClient.organization.setActive({
          organizationId: data.id,
        });

        onSuccess?.(data);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Create a Team</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Awesome Team"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="team-slug">Team Slug</Label>
          <Input
            id="team-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="my-awesome-team"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used in URLs and API references
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Create Team
        </Button>
      </form>
    </Card>
  );
}
