import { Button, Text, Heading } from "@react-email/components";
import BaseTemplate from "./BaseTemplate";

interface TeamInvitationEmailProps {
  inviterName: string;
  teamName: string;
  inviteLink: string;
  role: string;
}

export default function TeamInvitationEmail({
  inviterName,
  teamName,
  inviteLink,
  role,
}: TeamInvitationEmailProps) {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <BaseTemplate>
      <Heading style={h1}>You&apos;re Invited!</Heading>
      <Text style={text}>
        <strong>{inviterName}</strong> has invited you to join{" "}
        <strong>{teamName}</strong> on INDEKS as a{" "}
        <strong>{roleDisplay}</strong>.
      </Text>
      <Text style={text}>
        INDEKS is a powerful web analytics platform that helps teams understand
        their users and improve their websites.
      </Text>
      <Button href={inviteLink} style={button}>
        Accept Invitation
      </Button>
      <Text style={text}>Or copy and paste this link into your browser:</Text>
      <Text style={link}>{inviteLink}</Text>
      <Text style={subtext}>
        This invitation will expire in 7 days. If you don&apos;t want to join
        this team, you can safely ignore this email.
      </Text>
    </BaseTemplate>
  );
}

const h1 = {
  color: "#FFF5E1",
  fontSize: "26px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0 0 20px 0",
  lineHeight: "1.3",
};

const text = {
  color: "#FFF5E1",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#06FFA5",
  borderRadius: "8px",
  color: "#242424",
  display: "block",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "14px 32px",
  margin: "28px auto",
  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
};

const link = {
  color: "#00A8E8",
  fontSize: "13px",
  wordBreak: "break-all" as const,
  margin: "12px 0",
};

const subtext = {
  color: "#FFF5E1",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "20px 0 0 0",
  opacity: 0.8,
};
