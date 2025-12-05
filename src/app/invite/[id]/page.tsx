"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";

type InvitationStatus =
  | "loading"
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "error";

// Match the actual API response structure
interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  inviterId: string;
  inviterEmail: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });

        if (error || !data) {
          setStatus("error");
          return;
        }

        if (new Date(data.expiresAt) < new Date()) {
          setStatus("expired");
          return;
        }

        if (data.status !== "pending") {
          setStatus(data.status as InvitationStatus);
          return;
        }

        setInvitation(data as InvitationData);
        setStatus("pending");
      } catch {
        setStatus("error");
      }
    }

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  const handleAccept = async () => {
    if (!session) {
      router.push(`/auth/sign-in?redirect=/invite/${invitationId}`);
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to accept invitation",
        });
        return;
      }

      toastManager.add({
        type: "success",
        title: `You've joined ${invitation?.organizationName ?? "the team"}!`,
      });
      setStatus("accepted");

      if (invitation?.organizationId) {
        await authClient.organization.setActive({
          organizationId: invitation.organizationId,
        });
      }

      router.push("/projects");
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        toastManager.add({
          type: "error",
          title: error.message || "Failed to reject invitation",
        });
        return;
      }

      toastManager.add({ type: "success", title: "Invitation declined" });
      setStatus("rejected");
      router.push("/");
    } catch {
      toastManager.add({ type: "error", title: "Something went wrong" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">
            This invitation link is invalid or has already been used.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Invitation Expired</h1>
          <p className="text-muted-foreground mb-6">
            This invitation has expired. Please ask the team owner to send a new
            invitation.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">
            Welcome to {invitation?.organizationName ?? "the team"}!
          </h1>
          <p className="text-muted-foreground mb-6">
            You&apos;ve successfully joined the team.
          </p>
          <Button onClick={() => router.push("/projects")}>
            Go to Projects
          </Button>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Invitation Declined</h1>
          <p className="text-muted-foreground mb-6">
            You&apos;ve declined this invitation.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const roleDisplay = invitation
    ? invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)
    : "";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Join {invitation?.organizationName ?? "the team"}
          </h1>
          <p className="text-muted-foreground">
            <strong>{invitation?.inviterEmail}</strong> has invited you to join
            their team as a <strong>{roleDisplay}</strong>.
          </p>
        </div>

        {!session && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              You need to sign in or create an account to accept this
              invitation.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReject}
            disabled={isProcessing}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Spinner className="h-4 w-4" />
            ) : session ? (
              "Accept Invitation"
            ) : (
              "Sign in to Accept"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
