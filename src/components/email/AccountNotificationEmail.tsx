import { Button, Text, Heading, Section, Hr } from "@react-email/components";
import BaseTemplate from "./BaseTemplate";

interface AccountNotificationEmailProps {
  userName: string;
  type:
    | "password_changed"
    | "email_changed"
    | "profile_updated"
    | "security_alert";
  details?: string;
  settingsLink: string;
}

export default function AccountNotificationEmail({
  userName,
  type,
  details,
  settingsLink,
}: AccountNotificationEmailProps) {
  const config = {
    password_changed: {
      title: "🔐 Password Changed",
      message: "Your password was successfully changed.",
      warning:
        "If you didn't make this change, please secure your account immediately by resetting your password.",
      color: "#06FFA5",
    },
    email_changed: {
      title: "📧 Email Updated",
      message: "Your email address has been updated.",
      warning:
        "If you didn't make this change, please contact support immediately.",
      color: "#00A8E8",
    },
    profile_updated: {
      title: "✨ Profile Updated",
      message: "Your profile information has been updated successfully.",
      warning: null,
      color: "#06FFA5",
    },
    security_alert: {
      title: "⚠️ Security Alert",
      message:
        details || "A security-related action was detected on your account.",
      warning: "If this wasn't you, please secure your account immediately.",
      color: "#ef4444",
    },
  };

  const c = config[type];

  return (
    <BaseTemplate>
      <Heading style={{ ...h1, color: c.color }}>{c.title}</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>{c.message}</Text>

      {c.warning && (
        <Section style={warningBox}>
          <Text style={warningText}>⚠️ {c.warning}</Text>
        </Section>
      )}

      <Button href={settingsLink} style={button}>
        View Account Settings
      </Button>

      <Hr style={hr} />

      <Text style={subtext}>
        You&apos;re receiving this because you have account notifications
        enabled. You can manage your preferences in settings.
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

const warningBox = {
  backgroundColor: "rgba(239, 68, 68, 0.15)",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  borderLeft: "4px solid #ef4444",
};

const warningText = {
  color: "#FFF5E1",
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
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
