import { env } from "../config/env";
import { mailer } from "../config/mailer";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
    html: `<p>Hi ${escapeHtml(input.displayName)},</p><p>Enter the 6-digit code below to verify your email and activate your account. This code will expire soon.</p><h2>${input.otp}</h2><p>If you did not request this, you can ignore this email.</p>`,
  });
}

type invitationMailInput = {
  email: string;
  organizationName: string;
  roleName: string;
  token: string;
  expiresAt: Date;
};

export async function sendInvitationEmail(
  input: invitationMailInput,
): Promise<void> {
  const link = `${env.appUrl}/invitations/${input.token}`;
  const expires = input.expiresAt.toUTCString();
  // Organization and role names are user-controlled; escape them so an org
  // creator cannot inject markup or links into mail sent to arbitrary inboxes.
  const organizationName = escapeHtml(input.organizationName);
  const roleName = escapeHtml(input.roleName);

  await mailer.sendMail({
    from: env.smtp.from,
    to: input.email,
    subject: `You're invited to join ${input.organizationName}`,
    text: `Hi,\n\nYou have been invited to join ${input.organizationName} as ${input.roleName}.\n\nAccept the invitation here:\n${link}\n\nThis invitation expires on ${expires}. If you were not expecting it, you can ignore this email.`,
    html: `<p>Hi,</p><p>You have been invited to join <strong>${organizationName}</strong> as <strong>${roleName}</strong>.</p><p><a href="${escapeHtml(link)}">Accept the invitation</a></p><p>This invitation expires on ${expires}. If you were not expecting it, you can ignore this email.</p>`,
  });
}
