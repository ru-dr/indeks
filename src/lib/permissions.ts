import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define custom permissions for Indeks
 *
 * Default organization plugin statements:
 * - organization: ["update", "delete"]
 * - member: ["create", "update", "delete"]
 * - invitation: ["create", "cancel"]
 */
export const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],

  project: ["create", "read", "update", "delete", "view-analytics"],

  analytics: ["view", "export", "configure"],

  settings: ["view", "update", "manage-api-keys", "danger-zone"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Viewer role - read-only access to projects and analytics
 * No org-level permissions
 */
export const viewer = ac.newRole({
  project: ["read", "view-analytics"],
  analytics: ["view"],
  settings: ["view"],
});

/**
 * Member role - can work on projects but limited management
 * No org-level permissions
 */
export const member = ac.newRole({
  project: ["read", "update", "view-analytics"],
  analytics: ["view", "export"],
  settings: ["view", "update"],
});

/**
 * Admin role - can manage users and has elevated permissions
 */
export const admin = ac.newRole({
  project: ["create", "read", "update", "delete", "view-analytics"],
  analytics: ["view", "export", "configure"],
  settings: ["view", "update", "manage-api-keys"],

  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

/**
 * Owner role - team owner with full access to everything
 */
export const owner = ac.newRole({
  project: ["create", "read", "update", "delete", "view-analytics"],
  analytics: ["view", "export", "configure"],
  settings: ["view", "update", "manage-api-keys", "danger-zone"],

  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

export const roles = {
  viewer,
  member,
  admin,
  owner,
};

export const roleHierarchy = ["viewer", "member", "admin", "owner"] as const;
export type Role = (typeof roleHierarchy)[number];

export const roleDisplayNames: Record<Role, string> = {
  viewer: "Viewer",
  member: "Member",
  admin: "Admin",
  owner: "Owner",
};

export const roleDescriptions: Record<Role, string> = {
  viewer: "Read-only access to projects and analytics",
  member: "Can work on projects with limited management",
  admin: "Full project control and can invite/remove members",
  owner: "Full team access including danger zone operations",
};
