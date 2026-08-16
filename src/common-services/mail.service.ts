import { env } from "../config/env";
import { mailer } from "../config/mailer";

type mailInput = {
  email: string;
  displayName: string;
  otp: string;
};

export async function sendVerificationEmail(input: mailInput): Promise<void> {
  await mailer.sendMail({
    from: env.smtp.from,
    to: input.email,
    subject: "Verify your Account",
    text: `Hi ${input.displayName},\n\n Enter the 6-digit code below to verify your email and activate your account. This code will expire soon.\n\n${input.otp}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi ${input.displayName},</p><p>Enter the 6-digit code below to verify your email and activate your account. This code will expire soon.</p><h2>${input.otp}</h2><p>If you did not request this, you can ignore this email.</p>`,
  });
}
