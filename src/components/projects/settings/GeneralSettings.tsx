"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, FileText, Tag, Power, Save } from "lucide-react";
import type { Project } from "./ProjectSettings";

const CATEGORIES = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "portfolio", label: "Portfolio" },
  { value: "landing", label: "Landing Page" },
  { value: "webapp", label: "Web App" },
  { value: "mobile", label: "Mobile App" },
  { value: "other", label: "Other" },
];

interface GeneralSettingsProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  canEdit: boolean;
}

export function GeneralSettings({
  project,
  onProjectUpdate,
  canEdit,
}: GeneralSettingsProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [link, setLink] = useState(project.link);
  const [category, setCategory] = useState(project.category || "");
  const [isActive, setIsActive] = useState(project.isActive);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    title !== project.title ||
    description !== (project.description || "") ||
    link !== project.link ||
    category !== (project.category || "") ||
    isActive !== project.isActive;

  const handleSave = async () => {
    if (!title.trim()) {
      toastManager.add({ type: "error", title: "Title is required" });
      return;
    }
    if (!link.trim()) {
      toastManager.add({ type: "error", title: "Website URL is required" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          link: link.trim(),
          category: category || null,
          isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update project");
      }

      onProjectUpdate(result.data);
      toastManager.add({ type: "success", title: "Project updated" });
    } catch (error) {
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Project Name *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Project"
            disabled={!canEdit || saving}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="link" className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Website URL *
          </Label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com"
            disabled={!canEdit || saving}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Category
          </Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value ?? "")}
            disabled={!canEdit || saving}
          >
            <SelectTrigger>
              <SelectValue>Select a category</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your project..."
            rows={3}
            disabled={!canEdit || saving}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Power
              className={`h-5 w-5 shrink-0 ${isActive ? "text-green-500" : "text-muted-foreground"}`}
            />
            <div>
              <p className="font-medium text-sm sm:text-base">Project Status</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isActive
                  ? "Actively tracking analytics"
                  : "Analytics tracking paused"}
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={!canEdit || saving}
            className="ml-8 sm:ml-0"
          />
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      {!canEdit && (
        <p className="text-sm text-muted-foreground text-center py-4 border-t">
          You don&apos;t have permission to edit project settings.
        </p>
      )}
    </div>
  );
}
