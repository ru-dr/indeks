import { Button, Text, Heading, Section, Hr } from "@react-email/components";
import BaseTemplate from "./BaseTemplate";

interface UptimeAlertEmailProps {
  monitorName: string;
  monitorUrl: string;
  status: "down" | "up" | "degraded";
  errorMessage?: string;
  dashboardLink: string;
}

export default function UptimeAlertEmail({
  monitorName,
  monitorUrl,
  status,
  errorMessage,
  dashboardLink,
}: UptimeAlertEmailProps) {
  const statusConfig = {
    down: {
      title: "🔴 Monitor Down",
      color: "#ef4444",
      message: "is currently DOWN and unreachable.",
    },
    up: {
      title: "🟢 Monitor Recovered",
      color: "#06FFA5",
      message: "has recovered and is now operational.",
    },
    degraded: {
      title: "🟡 Monitor Degraded",
      color: "#eab308",
      message: "is experiencing degraded performance.",
    },
  };

  const config = statusConfig[status];

  return (
    <BaseTemplate>
      <Heading style={{ ...h1, color: config.color }}>{config.title}</Heading>
      
      <Text style={text}>
        Your monitor <strong>{monitorName}</strong> {config.message}
      </Text>

      <Section style={detailsBox}>
        <Text style={detailLabel}>Monitor</Text>
        <Text style={detailValue}>{monitorName}</Text>
        
        <Text style={detailLabel}>URL</Text>
        <Text style={detailValue}>{monitorUrl}</Text>
        
        {errorMessage && (
          <>
            <Text style={detailLabel}>Error</Text>
            <Text style={{ ...detailValue, color: "#ef4444" }}>{errorMessage}</Text>
          </>
        )}
      </Section>

      <Button href={dashboardLink} style={button}>
        View Dashboard
      </Button>

      <Hr style={hr} />

      <Text style={subtext}>
        You're receiving this because you have uptime alerts enabled. 
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
  wordBreak: "break-all" as const,
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
