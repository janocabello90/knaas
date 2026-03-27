/**
 * Academia — Central email sending service.
 *
 * All transactional emails go through this module.
 * Uses Resend with lazy init (build-safe).
 */

import { resend } from "@/lib/resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "FisioReferentes <noreply@fisioreferentes.com>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || "alex@fisioreferentes.com",
      tags: options.tags,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent to ${options.to}: ${options.subject} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Convenience wrappers ───────────────────────────────────────────

import {
  paymentConfirmation,
  paymentLinkSent,
  transferPendingVerification,
  transferVerified,
  welcomeEnrollment,
  welcomeWithCredentials,
  paymentReminder,
  paymentRefunded,
} from "./templates";

export async function sendPaymentConfirmation(
  to: string,
  data: Parameters<typeof paymentConfirmation>[0]
) {
  const { subject, html } = paymentConfirmation(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "payment_confirmation" }],
  });
}

export async function sendPaymentLink(
  to: string,
  data: Parameters<typeof paymentLinkSent>[0]
) {
  const { subject, html } = paymentLinkSent(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "payment_link" }],
  });
}

export async function sendTransferPending(
  to: string,
  data: Parameters<typeof transferPendingVerification>[0]
) {
  const { subject, html } = transferPendingVerification(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "transfer_pending" }],
  });
}

export async function sendTransferVerified(
  to: string,
  data: Parameters<typeof transferVerified>[0]
) {
  const { subject, html } = transferVerified(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "transfer_verified" }],
  });
}

export async function sendWelcome(
  to: string,
  data: Parameters<typeof welcomeEnrollment>[0]
) {
  const { subject, html } = welcomeEnrollment(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "welcome" }],
  });
}

export async function sendWelcomeWithCredentials(
  to: string,
  data: Parameters<typeof welcomeWithCredentials>[0]
) {
  const { subject, html } = welcomeWithCredentials(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "welcome_credentials" }],
  });
}

export async function sendPaymentReminder(
  to: string,
  data: Parameters<typeof paymentReminder>[0]
) {
  const { subject, html } = paymentReminder(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "payment_reminder" }],
  });
}

export async function sendPaymentRefunded(
  to: string,
  data: Parameters<typeof paymentRefunded>[0]
) {
  const { subject, html } = paymentRefunded(data);
  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "type", value: "payment_refunded" }],
  });
}
