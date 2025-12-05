"use client";

import { ReactNode } from "react";
import { useAuth, useRole, usePermission } from "@/hooks/use-auth";
import { Role, statement } from "@/lib/permissions";

type Resource = keyof typeof statement;
type Action<R extends Resource> = (typeof statement)[R][number];

type PermissionCheck = {
  [K in Resource]?: Action<K>[];
};

interface RoleGateProps {
  children: ReactNode;
  requiredRole: Role;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * Component that only renders children if user has the required role
 */
export function RoleGate({
  children,
  requiredRole,
  fallback = null,
  showLoading = false,
}: RoleGateProps) {
  const { hasRole, isLoading } = useRole(requiredRole);

  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-muted h-8 rounded" />;
  }

  if (isLoading) {
    return null;
  }

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionGateProps {
  children: ReactNode;
  permissions: PermissionCheck;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * Component that only renders children if user has the required permissions
 */
export function PermissionGate({
  children,
  permissions,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermission(permissions);

  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-muted h-8 rounded" />;
  }

  if (isLoading) {
    return null;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component that only renders for admin users
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RoleGate requiredRole="admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

interface OwnerOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component that only renders for owner users
 */
export function OwnerOnly({ children, fallback = null }: OwnerOnlyProps) {
  return (
    <RoleGate requiredRole="owner" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

interface MemberOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component that only renders for member+ users
 */
export function MemberOnly({ children, fallback = null }: MemberOnlyProps) {
  return (
    <RoleGate requiredRole="member" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

interface AuthenticatedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders for authenticated users
 */
export function AuthenticatedOnly({
  children,
  fallback = null,
}: AuthenticatedOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ImpersonationBannerProps {
  className?: string;
}

/**
 * Banner shown when an admin is impersonating a user
 */
export function ImpersonationBanner({ className }: ImpersonationBannerProps) {
  const { session } = useAuth();

  const isImpersonating =
    session?.session &&
    "impersonatedBy" in session.session &&
    session.session.impersonatedBy;

  if (!isImpersonating) {
    return null;
  }

  return (
    <div
      className={`bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-medium ${className}`}
    >
      You are currently impersonating this user.{" "}
      <button
        onClick={async () => {
          const { authClient } = await import("@/lib/auth-client");
          await authClient.admin.stopImpersonating();
          window.location.reload();
        }}
        className="underline font-semibold hover:no-underline"
      >
        Stop impersonating
      </button>
    </div>
  );
}
