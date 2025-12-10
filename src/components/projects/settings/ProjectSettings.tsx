"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPortal,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsPanel, TabsList, TabsTab } from "@/components/ui/tabs";
import { Settings, Users, Key, AlertTriangle, X } from "lucide-react";
import { GeneralSettings } from "./GeneralSettings";
import { TeamAccess } from "./TeamAccess";
import { ApiKeySettings } from "./ApiKeySettings";
import { DangerZone } from "./DangerZone";
import { cn } from "@/lib/utils";
import type { ProjectRole } from "@/server/controllers/projects.controller";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  link: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
  userId: string;
  userRole?: ProjectRole;
}

interface ProjectSettingsProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate: (project: Project) => void;
  onProjectDelete: () => void;
  currentUserId: string;
}

export function ProjectSettings({
  project,
  open,
  onOpenChange,
  onProjectUpdate,
  onProjectDelete,
  currentUserId,
}: ProjectSettingsProps) {
  const [activeTab, setActiveTab] = useState<string | null>("general");
  const userRole = project.userRole || "viewer";
  const isOwner = userRole === "owner";
  const canManage = isOwner || userRole === "admin" || userRole === "member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        {/* Custom viewport for vertical centering */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup
            className={cn(
              "relative flex max-h-[90vh] sm:max-h-[85vh] w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl flex-col rounded-2xl border bg-popover text-popover-foreground shadow-lg",
              "transition-all duration-200 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Project Settings</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                  Manage settings for {project.title}
                </DialogDescription>
              </div>
              <DialogClose className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-70 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring ml-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            {/* Content with Tabs */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                orientation="vertical"
                className="flex flex-col sm:flex-row h-full"
              >
                {/* Tabs Navigation - Horizontal on mobile, Sidebar on desktop */}
                <div className="shrink-0 border-b sm:border-b-0 sm:border-r bg-muted/30 p-2 sm:p-3 sm:w-48 overflow-x-auto">
                  <TabsList className="flex sm:flex-col w-full bg-transparent p-0 gap-1">
                    <TabsTab
                      value="general"
                      className={cn(
                        "flex-1 sm:flex-none sm:w-full justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap",
                        "hover:bg-accent hover:text-accent-foreground",
                        "data-[active]:bg-accent data-[active]:text-accent-foreground",
                      )}
                    >
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      General
                    </TabsTab>
                    <TabsTab
                      value="team"
                      className={cn(
                        "flex-1 sm:flex-none sm:w-full justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap",
                        "hover:bg-accent hover:text-accent-foreground",
                        "data-[active]:bg-accent data-[active]:text-accent-foreground",
                      )}
                    >
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Team
                    </TabsTab>
                    <TabsTab
                      value="api"
                      className={cn(
                        "flex-1 sm:flex-none sm:w-full justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap",
                        "hover:bg-accent hover:text-accent-foreground",
                        "data-[active]:bg-accent data-[active]:text-accent-foreground",
                      )}
                    >
                      <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      API
                    </TabsTab>
                    {isOwner && (
                      <TabsTab
                        value="danger"
                        className={cn(
                          "flex-1 sm:flex-none sm:w-full justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap",
                          "hover:bg-destructive/10 hover:text-destructive",
                          "data-[active]:bg-destructive/10 data-[active]:text-destructive",
                          "text-destructive/80",
                        )}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Danger
                      </TabsTab>
                    )}
                  </TabsList>
                </div>

                {/* Panel Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <ScrollArea className="h-full max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-5rem)]">
                    <div className="p-4 sm:p-6">
                      <TabsPanel value="general">
                        <GeneralSettings
                          project={project}
                          onProjectUpdate={onProjectUpdate}
                          canEdit={canManage}
                        />
                      </TabsPanel>

                      <TabsPanel value="team">
                        <TeamAccess
                          project={project}
                          currentUserId={currentUserId}
                          userRole={userRole}
                        />
                      </TabsPanel>

                      <TabsPanel value="api">
                        <ApiKeySettings
                          project={project}
                          onProjectUpdate={onProjectUpdate}
                          canManage={canManage}
                        />
                      </TabsPanel>

                      {isOwner && (
                        <TabsPanel value="danger">
                          <DangerZone
                            project={project}
                            onProjectDelete={onProjectDelete}
                          />
                        </TabsPanel>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
