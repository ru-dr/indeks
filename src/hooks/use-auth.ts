"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Role,
  OrgRole,
  roleHierarchy,
  statement,
  isRoleAtLeast as checkRoleAtLeast,
  getEffectiveRole,
} from "@/lib/permissions";

type Resource = keyof typeof statement;
type Action<R extends Resource> = (typeof statement)[R][number];

type PermissionCheck = {
  [K in Resource]?: Action<K>[];
};

/**
 * Hook to get the current user's session and role information
 *
 * Role hierarchy: viewer < member < owner < admin
 *
 * - Platform admin (user.role === "admin") has FULL control over everything
 * - Org roles (owner, member, viewer) are stored in member.role
 */
export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const user = session?.user;

  const platformRole = user?.role as string | null;

  const orgRole =
    (activeOrg?.members?.find((m) => m.userId === user?.id)?.role as OrgRole) ||
    null;

  const role = getEffectiveRole(platformRole, orgRole) as Role;

  const isPlatformAdmin = platformRole === "admin";

  const isRoleAtLeast = useCallback(
    (requiredRole: Role): boolean => {
      if (isPlatformAdmin) return true;

      return checkRoleAtLeast(role, requiredRole);
    },
    [role, isPlatformAdmin],
  );

  return {
    session,
    user,
    role,
    orgRole,
    platformRole,
    isLoading: isPending,
    isAuthenticated: !!session,
    isAdmin: isPlatformAdmin,
    isOwner: role === "owner" || isPlatformAdmin,
    isMember: isRoleAtLeast("member"),
    isViewer: isRoleAtLeast("viewer"),
    isRoleAtLeast,
    error,
    activeOrganization: activeOrg,
  };
}

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permissions: PermissionCheck) {
  const { role, isAdmin } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkPermissions = async () => {
      if (isAdmin) {
        if (isMounted) {
          setHasPermission(true);
          setIsLoading(false);
        }
        return;
      }

      if (!role) {
        if (isMounted) {
          setHasPermission(false);
          setIsLoading(false);
        }
        return;
      }

      const adminRole =
        role === "owner" || role === "member" || role === "viewer"
          ? "admin"
          : (role as "user" | "admin");

      const result = authClient.admin.checkRolePermission({
        permissions: permissions as Record<string, string[]>,
        role: adminRole,
      });

      if (isMounted) {
        setHasPermission(result);
        setIsLoading(false);
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [role, permissions, isAdmin]);

  return { hasPermission, isLoading };
}

/**
 * Hook to check if the current user has a specific role
 */
export function useRole(requiredRole: Role) {
  const { isRoleAtLeast, isLoading } = useAuth();

  return {
    hasRole: isRoleAtLeast(requiredRole),
    isLoading,
  };
}

/**
 * Hook to get list of users (admin only)
 */
export function useUsers(options?: {
  limit?: number;
  offset?: number;
  searchValue?: string;
  searchField?: "email" | "name";
}) {
  const [users, setUsers] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: options?.limit ?? 100,
          offset: options?.offset ?? 0,
          searchValue: options?.searchValue,
          searchField: options?.searchField ?? "email",
          searchOperator: "contains",
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setUsers(result.data?.users ?? []);
      setTotal(result.data?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch users"));
    } finally {
      setIsLoading(false);
    }
  }, [
    options?.limit,
    options?.offset,
    options?.searchValue,
    options?.searchField,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, total, isLoading, error, refetch: fetchUsers };
}

/**
 * Hook for admin operations
 * Only platform admins can use these
 */
export function useAdminActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setRole = useCallback(async (userId: string, role: Role | Role[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const adminRole = Array.isArray(role)
        ? (role.map((r) => (r === "admin" ? "admin" : "user")) as (
            | "user"
            | "admin"
          )[])
        : ((role === "admin" ? "admin" : "user") as "user" | "admin");

      const result = await authClient.admin.setRole({
        userId,
        role: adminRole,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to set role");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const banUser = useCallback(
    async (
      userId: string,
      options?: { banReason?: string; banExpiresIn?: number },
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await authClient.admin.banUser({
          userId,
          banReason: options?.banReason,
          banExpiresIn: options?.banExpiresIn,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        return result.data;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to ban user");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const unbanUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.admin.unbanUser({
        userId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to unban user");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.admin.removeUser({
        userId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to remove user");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const impersonateUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.admin.impersonateUser({
        userId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to impersonate user");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopImpersonating = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.admin.stopImpersonating();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to stop impersonating");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    setRole,
    banUser,
    unbanUser,
    removeUser,
    impersonateUser,
    stopImpersonating,
    isLoading,
    error,
  };
}
