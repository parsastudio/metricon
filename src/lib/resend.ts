import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_mock");

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Metricon <noreply@metricon.co>";
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
