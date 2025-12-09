import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthLayout } from "@/components/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[MainLayout] Checking session...");

  const reqHeaders = await headers();
  console.log("[MainLayout] Cookie header:", reqHeaders.get("cookie"));

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  console.log(
    "[MainLayout] Session result:",
    session
      ? { userId: session.user.id, emailVerified: session.user.emailVerified }
      : null,
  );

  if (!session) {
    console.log("[MainLayout] No session, redirecting to sign-in");
    redirect("/auth/sign-in");
  }

  if (!session.user.emailVerified) {
    console.log("[MainLayout] Email not verified, redirecting");
    redirect("/auth/sign-in?error=email-not-verified");
  }

  console.log("[MainLayout] Session valid, rendering layout");
  return <AuthLayout>{children}</AuthLayout>;
}
