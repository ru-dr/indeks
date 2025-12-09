import { createAccessControl } from "better-auth/plugins/access";

/**
 * INDEKS ROLE SYSTEM
 * 
 * There are TWO separate role systems:
 * 
 * 1. ADMIN (Platform Level) - HIGHEST AUTHORITY
 *    - Stored in: user.role = "admin"
 *    - Has: FULL control over EVERYTHING - all organizations, all users, 
 *           all projects, global analytics, can override any permission
 *    - This is for Indeks platform administrators
 *    - Supersedes ALL org/team roles including owner
 * 
 * 2. ORGANIZATION/TEAM ROLES (Org & Team Level)
 *    - Stored in: member.role (for orgs), teamMember inherits from member.role
 *    - Roles: owner, member, viewer
 *    - owner: Full control over their organization/team
 *    - member: Can work on projects, limited management
 *    - viewer: Read-only access
 * 
 * HIERARCHY: viewer < member < owner < ADMIN (platform)
 * 
 * ADMIN has god-mode access - can do anything an owner can do
 * plus system-level operations across ALL organizations
 */

export const statement = {
  // Organization-level resources
  organization: ["create", "read", "update", "delete", "manage-billing", "view-all"],
  member: ["create", "read", "update", "delete", "manage-roles"],
  invitation: ["create", "cancel", "view"],
  team: ["create", "read", "update", "delete"],

  // Project resources
  project: ["create", "read", "update", "delete", "view-analytics", "manage-access"],

  // Analytics resources
  analytics: ["view", "export", "configure", "view-global"],

  // Settings resources
  settings: ["view", "update", "manage-api-keys", "danger-zone"],

  // System-level permissions (for platform admins only - ADMIN role)
  system: [
    "full-access",           // Can do anything
    "view-all-users", 
    "manage-users", 
    "view-all-orgs", 
    "manage-orgs", 
    "view-global-analytics",
    "impersonate",
    "manage-billing-global",
    "manage-system-settings",
  ],
} as const;

export const ac = createAccessControl(statement);

/**
 * Viewer role - read-only access
 * Can view projects and analytics but cannot modify anything
 * Valid for both org and team contexts
 */
export const viewer = ac.newRole({
  organization: ["read"],
  member: ["read"],
  invitation: ["view"],
  team: ["read"],
  project: ["read", "view-analytics"],
  analytics: ["view"],
  settings: ["view"],
});

/**
 * Member role - can work on projects
 * Can create/update projects, export analytics, but cannot manage org
 * Valid for both org and team contexts
 */
export const member = ac.newRole({
  organization: ["read"],
  member: ["read"],
  invitation: ["create", "view"],
  team: ["read"],
  project: ["create", "read", "update", "view-analytics"],
  analytics: ["view", "export"],
  settings: ["view", "update"],
});

/**
 * Owner role - full control over the organization/team
 * Can do everything including delete org and manage all members
 * Valid for both org and team contexts
 */
export const owner = ac.newRole({
  organization: ["create", "read", "update", "delete", "manage-billing"],
  member: ["create", "read", "update", "delete", "manage-roles"],
  invitation: ["create", "cancel", "view"],
  team: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete", "view-analytics", "manage-access"],
  analytics: ["view", "export", "configure"],
  settings: ["view", "update", "manage-api-keys", "danger-zone"],
});

/**
 * Admin role - PLATFORM SUPER ADMIN with FULL ACCESS
 * Has all permissions of owner PLUS system-level permissions
 * Can access and manage ANY organization, user, or resource
 * This is the highest authority in the system
 */
export const admin = ac.newRole({
  // All owner permissions
  organization: ["create", "read", "update", "delete", "manage-billing", "view-all"],
  member: ["create", "read", "update", "delete", "manage-roles"],
  invitation: ["create", "cancel", "view"],
  team: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete", "view-analytics", "manage-access"],
  analytics: ["view", "export", "configure", "view-global"],
  settings: ["view", "update", "manage-api-keys", "danger-zone"],
  
  // System-level permissions (ADMIN ONLY)
  system: [
    "full-access",
    "view-all-users",
    "manage-users",
    "view-all-orgs",
    "manage-orgs",
    "view-global-analytics",
    "impersonate",
    "manage-billing-global",
    "manage-system-settings",
  ],
});

/**
 * All roles in the system
 * Used by better-auth organization plugin
 */
export const roles = {
  viewer,
  member,
  owner,
  admin,
};

/**
 * Role hierarchy (lowest to highest)
 * ADMIN is the highest and has full control over everything
 */
export const roleHierarchy = ["viewer", "member", "owner", "admin"] as const;
export type Role = (typeof roleHierarchy)[number];

/**
 * Roles available for organization/team members
 * Admin is NOT assignable at org level - it's a platform-level role
 */
export const orgRoles = ["viewer", "member", "owner"] as const;
export type OrgRole = (typeof orgRoles)[number];

export const roleDisplayNames: Record<Role, string> = {
  viewer: "Viewer",
  member: "Member",
  owner: "Owner",
  admin: "Admin",
};

export const roleDescriptions: Record<Role, string> = {
  viewer: "Read-only access to projects and analytics",
  member: "Can create and work on projects, invite members",
  owner: "Full organization access including danger zone operations",
  admin: "Platform super admin with full control over all organizations and users",
};

/**
 * Check if a role has at least the permissions of another role
 */
export function isRoleAtLeast(userRole: Role | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  if (userRoleIndex === -1) return false;
  
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if user is a platform admin
 */
export function isAdmin(role: Role | string | null): boolean {
  return role === "admin";
}

/**
 * Get the effective role for a user
 * If user is platform admin, they have full access regardless of org role
 */
export function getEffectiveRole(userRole: string | null, orgRole: OrgRole | null): Role {
  // Platform admin always has highest role
  if (userRole === "admin") return "admin";
  
  // Otherwise use org role
  return orgRole || "viewer";
}
