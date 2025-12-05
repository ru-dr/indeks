"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Role, roleHierarchy, statement } from "@/lib/permissions";

// Type for permission resources
type Resource = keyof typeof statement;
type Action<R extends Resource> = (typeof statement)[R][number];

// Permission check type
type PermissionCheck = {
  [K in Resource]?: Action<K>[];
};

/**
 * Hook to get the current user's session and role information
 */
export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();

  const user = session?.user;
  const role = (user?.role as Role) || null;

  const isRoleAtLeast = useCallback(
    (requiredRole: Role): boolean => {
      if (!role) return false;

      const userRoleIndex = roleHierarchy.indexOf(role);
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

      if (userRoleIndex === -1) return false;

      return userRoleIndex >= requiredRoleIndex;
    },
    [role],
  );

  return {
    session,
    user,
    role,
    isLoading: isPending,
    isAuthenticated: !!session,
    isAdmin: isRoleAtLeast("admin"),
    isOwner: role === "owner",
    isMember: isRoleAtLeast("member"),
    isViewer: isRoleAtLeast("viewer"),
    isRoleAtLeast,
    error,
  };
}

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permissions: PermissionCheck) {
  const { role } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!role) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    // Use the client-side checkRolePermission for synchronous checking
    const result = authClient.admin.checkRolePermission({
      permissions: permissions as Record<string, string[]>,
      role,
    });

    setHasPermission(result);
    setIsLoading(false);
  }, [role, permissions]);

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
 */
export function useAdminActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setRole = useCallback(async (userId: string, role: Role | Role[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.admin.setRole({
        userId,
        role,
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
