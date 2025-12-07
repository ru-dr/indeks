"use client";

import { useState } from "react";
import Image from "next/image";
import {
  authClient,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function TeamSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: activeOrg, isPending: activeOrgLoading } =
    useActiveOrganization();
  const { data: organizations, isPending: orgsLoading } =
    useListOrganizations();

  const isLoading = activeOrgLoading || orgsLoading;

  const handleSwitchTeam = async (orgId: string) => {
    await authClient.organization.setActive({
      organizationId: orgId,
    });
    setOpen(false);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Spinner className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => router.push("/settings?tab=team")}
      >
        Create Team
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {activeOrg?.name || "Select team..."}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-auto">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSwitchTeam(org.id)}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm hover:bg-muted transition-colors",
                activeOrg?.id === org.id && "bg-muted",
              )}
            >
              {org.logo && (
                <Image
                  src={org.logo}
                  alt={org.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded mr-2"
                />
              )}
              <span className="truncate">{org.name}</span>
              {activeOrg?.id === org.id && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-auto h-4 w-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="border-t p-1">
          <button
            onClick={() => {
              setOpen(false);
              router.push("/settings?tab=team");
            }}
            className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted transition-colors rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Create Team
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
