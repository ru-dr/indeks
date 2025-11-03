import { Button, Text, Heading } from "@react-email/components";
import BaseTemplate from "./BaseTemplate";

interface ResetPasswordEmailProps {
  url: string;
}

export default function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
  return (
    <BaseTemplate>
      <Heading style={h1}>Reset Your Password</Heading>
      <Text style={text}>
        We received a request to reset your password for your INDEKS account.
        Click the button below to create a new password.
      </Text>
      <Button href={url} style={button}>
        Reset Password
      </Button>
      <Text style={text}>Or copy and paste this link into your browser:</Text>
      <Text style={link}>{url}</Text>
      <Text style={subtext}>
        This reset link will expire in 1 hour. If you didn&apos;t request this
        reset, please ignore this email.
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
  color: "#d4d4d4",
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
  color: "#a3a3a3",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "20px 0 0 0",
};
