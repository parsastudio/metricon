import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_mock");

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from: "Metricon <noreply@metricon.co>",
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
    