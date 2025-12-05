"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type InvitationStatus =
  | "loading"
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "error";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const { data, error } = await authClient.organization.getInvitation({
          id: invitationId,
        });

        if (error || !data) {
          setStatus("error");
          return;
        }

        // Check if expired
        if (new Date(data.expiresAt) < new Date()) {
          setStatus("expired");
          return;
        }

        if (data.status !== "pending") {
          setStatus(data.status as InvitationStatus);
          return;
        }

        setInvitation(data as Invitation);
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
      // Redirect to sign in with return URL
      router.push(`/auth/sign-in?redirect=/invite/${invitationId}`);
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to accept invitation");
        return;
      }

      toast.success(`You've joined ${invitation?.organization.name}!`);
      setStatus("accepted");

      // Set the organization as active and redirect
      if (invitation?.organization.id) {
        await authClient.organization.setActive({
          organizationId: invitation.organization.id,
        });
      }

      router.push("/projects");
    } catch {
      toast.error("Something went wrong");
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
        toast.error(error.message || "Failed to reject invitation");
        return;
      }

      toast.success("Invitation declined");
      setStatus("rejected");
      router.push("/");
    } catch {
      toast.error("Something went wrong");
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
            Welcome to {invitation?.organization.name}!
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

  // Pending invitation
  const roleDisplay =
    invitation?.role.charAt(0).toUpperCase() + invitation?.role.slice(1);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md p-8">
        <div className="text-center mb-6">
          {invitation?.organization.logo && (
            <img
              src={invitation.organization.logo}
              alt={invitation.organization.name}
              className="w-16 h-16 rounded-full mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-semibold mb-2">
            Join {invitation?.organization.name}
          </h1>
          <p className="text-muted-foreground">
            <strong>{invitation?.inviter.name}</strong> has invited you to join
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
