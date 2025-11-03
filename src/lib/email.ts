import Plunk from '@plunk/node';
import { render } from "@react-email/render";
import VerificationEmail from "@/components/email/VerificationEmail";
import ResetPasswordEmail from "@/components/email/ResetPasswordEmail";

const plunk = new Plunk(process.env.PLUNK_API_KEY!);

interface User {
  id: string;
  email: string;
  name: string;
}

export const emailService = {
  sendEmail: ({ to, subject, html }: { to: string; subject: string; html: string }) => {
    plunk.emails.send({ to, subject, body: html }).catch(console.error);
  },
  sendVerificationEmail: async ({ user, url }: { user: User; url: string }): Promise<string> => {
    const html = await render(VerificationEmail({ url }));
    emailService.sendEmail({ to: user.email, subject: "Verify your INDEKS account", html });
    return html;
  },
  sendResetPasswordEmail: async ({ user, url }: { user: User; url: string }): Promise<string> => {
    const html = await render(ResetPasswordEmail({ url }));
    emailService.sendEmail({ to: user.email, subject: "Reset your INDEKS password", html });
    return html;
  },
};