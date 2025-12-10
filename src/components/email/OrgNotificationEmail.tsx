import { Button, Text, Heading, Section, Hr } from "@react-email/components";
import BaseTemplate from "./BaseTemplate";

interface OrgNotificationEmailProps {
  userName: string;
  type: "member_joined" | "member_left" | "role_changed";
  memberName: string;
  orgName: string;
  newRole?: string;
  settingsLink: string;
}

export default function OrgNotificationEmail({
  userName,
  type,
  memberName,
  orgName,
  newRole,
  settingsLink,
}: OrgNotificationEmailProps) {
  const config = {
    member_joined: {
      title: "👋 New Team Member",
      message: `${memberName} has joined your organization "${orgName}".`,
      color: "#06FFA5",
      icon: "🎉",
    },
    member_left: {
      title: "👤 Member Left",
      message: `${memberName} has left your organization "${orgName}".`,
      color: "#f97316",
      icon: "👋",
    },
    role_changed: {
      title: "🔄 Role Updated",
      message: `${memberName}'s role in "${orgName}" has been changed to ${newRole}.`,
      color: "#00A8E8",
      icon: "🔑",
    },
  };

  const c = config[type];

  return (
    <BaseTemplate>
      <Heading style={{ ...h1, color: c.color }}>{c.title}</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Section style={eventBox}>
        <Text style={{ ...eventIcon }}>{c.icon}</Text>
        <Text style={eventText}>{c.message}</Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Organization</Text>
        <Text style={detailValue}>{orgName}</Text>
        
        <Text style={detailLabel}>Member</Text>
        <Text style={detailValue}>{memberName}</Text>
        
        {newRole && (
          <>
            <Text style={detailLabel}>New Role</Text>
            <Text style={detailValue}>{newRole}</Text>
          </>
        )}
      </Section>

      <Button href={settingsLink} style={button}>
        View Organization
      </Button>

      <Hr style={hr} />

      <Text style={subtext}>
        You&apos;re receiving this because you&apos;re an admin of this organization.
        You can manage your notification preferences in settings.
      </Text>
    </BaseTemplate>
  );
}

const h1 = {
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

const eventBox = {
  backgroundColor: "rgba(6, 255, 165, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const eventIcon = {
  fontSize: "32px",
  margin: "0 0 8px 0",
};

const eventText = {
  color: "#FFF5E1",
  fontSize: "15px",
  lineHeight: "22px",
  margin: 0,
};

const detailsBox = {
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};

const detailLabel = {
  color: "#FFF5E1",
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "8px 0 4px 0",
  opacity: 0.7,
};

const detailValue = {
  color: "#FFF5E1",
  fontSize: "14px",
  margin: "0 0 12px 0",
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

const hr = {
  borderColor: "rgba(255, 255, 255, 0.1)",
  margin: "24px 0",
};

const subtext = {
  color: "#FFF5E1",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "20px 0 0 0",
  opacity: 0.6,
  textAlign: "center" as const,
};
