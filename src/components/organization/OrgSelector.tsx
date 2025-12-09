"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

function getOrgInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface OrgSelectorProps {
  organizations: Organization[];
  activeOrgId: string | undefined;
  onSwitchOrg: (orgId: string) => void;
}

export function OrgSelector({
  organizations,
  activeOrgId,
  onSwitchOrg,
}: OrgSelectorProps) {
  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 pb-6 border-b">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Select Organization
      </p>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => onSwitchOrg(org.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
              activeOrgId === org.id
                ? "border-[var(--color-indeks-green)] bg-[var(--color-indeks-green)]/5"
                : "hover:bg-muted/50"
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[var(--color-indeks-blue)]/10 text-[var(--color-indeks-blue)] text-sm">
                {getOrgInitials(org.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{org.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {org.slug}
              </p>
            </div>
            {activeOrgId === org.id && (
              <Badge variant="success" className="text-xs shrink-0">
                Active
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
