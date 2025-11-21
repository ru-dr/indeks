import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session from better-auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session exists, redirect to sign-in
  if (!session) {
    redirect("/auth/sign-in");
  }

  // If session exists but email is not verified, redirect to sign-in with message
  if (!session.user.emailVerified) {
    redirect("/auth/sign-in?error=email-not-verified");
  }

  return <>{children}</>;
}
