import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";

interface BaseTemplateProps {
  children: React.ReactNode;
}

export default function BaseTemplate({ children }: BaseTemplateProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        `}</style>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Section style={header}>
              <Img
                src="https://i.postimg.cc/jwDm9rkQ/image.png"
                alt="INDEKS"
                style={logo}
              />
            </Section>
            <Hr style={divider} />
            <Section style={content}>{children}</Section>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by INDEKS. If you didn&apos;t request this,
              please ignore this email.
            </Text>
            <Text style={footerText}>© 2025 INDEKS. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "transparent",
  fontFamily: "'Geist', sans-serif",
  fontOpticalSizing: "auto" as const,
  padding: "40px 20px",
};

const container = {
  margin: "0 auto",
  maxWidth: "480px",
};

const card = {
  backgroundColor: "#242424",
  border: "1px solid #2d2d2d",
  borderRadius: "12px",
  overflow: "hidden" as const,
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
};

const header = {
  padding: "32px 32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#242424",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const divider = {
  borderColor: "#2d2d2d",
  margin: "0",
  borderWidth: "1px 0 0 0",
};

const content = {
  padding: "32px",
  backgroundColor: "#242424",
};

const footer = {
  textAlign: "center" as const,
  padding: "32px 20px 0",
};

const footerText = {
  fontSize: "13px",
  color: "#737373",
  lineHeight: "20px",
  margin: "4px 0",
  fontFamily: "'Geist', sans-serif",
  fontOpticalSizing: "auto" as const,
};
