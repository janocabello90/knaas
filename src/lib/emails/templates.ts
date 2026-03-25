/**
 * KNAAS — Email templates for all transactional flows.
 *
 * Each template function returns { subject, html }.
 */

import { baseLayout, button, detailsTable } from "./base-layout";

// ─── Helpers ────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── 1. Payment Confirmation (after Stripe or verified transfer) ────
export function paymentConfirmation(data: {
  firstName: string;
  amount: number;
  currency?: string;
  method: "STRIPE" | "TRANSFERENCIA";
  cohortName?: string;
  invoiceNumber?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  paidAt: Date | string;
}) {
  const isInstallment = data.totalInstallments && data.totalInstallments > 1;
  const methodLabel = data.method === "STRIPE" ? "Tarjeta (Stripe)" : "Transferencia bancaria";

  const details = [
    { label: "Importe", value: formatCurrency(data.amount, data.currency) },
    { label: "Método", value: methodLabel },
    { label: "Fecha", value: formatDate(data.paidAt) },
  ];
  if (data.cohortName) details.push({ label: "Programa", value: data.cohortName });
  if (data.invoiceNumber) details.push({ label: "Nº Factura", value: data.invoiceNumber });
  if (isInstallment) {
    details.push({
      label: "Cuota",
      value: `${data.installmentNumber} de ${data.totalInstallments}`,
    });
  }

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      ¡Pago confirmado! ✅
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Tu pago ha sido procesado correctamente${isInstallment ? ` (cuota ${data.installmentNumber} de ${data.totalInstallments})` : ""}.</p>
    ${detailsTable(details)}
    <p>Si tienes alguna duda, responde directamente a este email.</p>
    <p style="margin-top:24px;">¡Gracias por confiar en nosotros!</p>`,
    `Pago de ${formatCurrency(data.amount)} confirmado`
  );

  return {
    subject: `✅ Pago confirmado${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}

// ─── 2. Payment Link Sent (Stripe checkout link for student) ────────
export function paymentLinkSent(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  checkoutUrl: string;
  installments?: number;
}) {
  const isInstallment = data.installments && data.installments > 1;

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      Tu enlace de pago está listo
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Desde FisioReferentes te hemos generado un enlace para realizar ${isInstallment ? `el pago de tu cuota (${data.installments} cuotas de ${formatCurrency(data.amount)})` : `el pago de ${formatCurrency(data.amount, data.currency)}`}${data.cohortName ? ` para <strong>${data.cohortName}</strong>` : ""}.</p>
    ${button("Realizar pago", data.checkoutUrl)}
    <p style="font-size:14px;color:#64748b;">Este enlace es personal e intransferible. Si tienes algún problema, contacta con nosotros.</p>`,
    `Enlace de pago listo — ${formatCurrency(data.amount)}`
  );

  return {
    subject: `💳 Tu enlace de pago | FisioReferentes`,
    html,
  };
}

// ─── 3. Transfer Pending Verification ──────────────────────────────
export function transferPendingVerification(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  invoiceNumber?: string;
  installmentNumber?: number;
  totalInstallments?: number;
}) {
  const isInstallment = data.totalInstallments && data.totalInstallments > 1;

  const details = [
    { label: "Importe", value: formatCurrency(data.amount, data.currency) },
    { label: "Método", value: "Transferencia bancaria" },
  ];
  if (data.cohortName) details.push({ label: "Programa", value: data.cohortName });
  if (data.invoiceNumber) details.push({ label: "Nº Factura", value: data.invoiceNumber });
  if (isInstallment) {
    details.push({
      label: "Cuota",
      value: `${data.installmentNumber} de ${data.totalInstallments}`,
    });
  }

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      Pago por transferencia registrado
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Hemos registrado tu pago por transferencia bancaria. Una vez recibamos y verifiquemos la transferencia, te enviaremos la confirmación.</p>
    ${detailsTable(details)}
    <p style="font-size:14px;color:#64748b;">Si ya has realizado la transferencia, no tienes que hacer nada más. Te confirmaremos en cuanto la recibamos.</p>`,
    `Transferencia de ${formatCurrency(data.amount)} pendiente de verificación`
  );

  return {
    subject: `🏦 Transferencia registrada — pendiente de verificación | FisioReferentes`,
    html,
  };
}

// ─── 4. Transfer Verified (admin confirmed) ─────────────────────────
export function transferVerified(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  invoiceNumber?: string;
}) {
  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      ¡Transferencia verificada! ✅
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Hemos recibido y verificado tu transferencia de <strong>${formatCurrency(data.amount, data.currency)}</strong>${data.cohortName ? ` para <strong>${data.cohortName}</strong>` : ""}.</p>
    ${data.invoiceNumber ? `<p>Nº de factura: <strong>${data.invoiceNumber}</strong></p>` : ""}
    <p>Ya tienes acceso completo a tu programa. ¡Gracias!</p>`,
    `Transferencia de ${formatCurrency(data.amount)} verificada`
  );

  return {
    subject: `✅ Transferencia verificada${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}

// ─── 5. Welcome / Enrollment Confirmation ───────────────────────────
export function welcomeEnrollment(data: {
  firstName: string;
  cohortName: string;
  loginUrl: string;
}) {
  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      ¡Bienvenido/a a FisioReferentes! 🎉
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Tu inscripción en <strong>${data.cohortName}</strong> ya está confirmada. Estamos encantados de tenerte en el programa.</p>
    <p>Ya puedes acceder a la plataforma para ver tu programa, las mentorías, la comunidad y todos los recursos disponibles.</p>
    ${button("Acceder a la plataforma", data.loginUrl)}
    <p>Si tienes cualquier duda, estamos a un email de distancia.</p>
    <p style="margin-top:24px;">¡Nos vemos dentro!</p>`,
    `Bienvenido/a a ${data.cohortName}`
  );

  return {
    subject: `🎉 ¡Bienvenido/a a ${data.cohortName}! | FisioReferentes`,
    html,
  };
}

// ─── 6. Payment Reminder (upcoming installment) ────────────────────
export function paymentReminder(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDescription?: string; // e.g. "en 3 días", "mañana"
  paymentUrl?: string;
}) {
  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      Recordatorio de pago
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Te recordamos que tienes pendiente la cuota <strong>${data.installmentNumber} de ${data.totalInstallments}</strong> por importe de <strong>${formatCurrency(data.amount, data.currency)}</strong>${data.cohortName ? ` de <strong>${data.cohortName}</strong>` : ""}${data.dueDescription ? ` (vence ${data.dueDescription})` : ""}.</p>
    ${data.paymentUrl ? button("Pagar ahora", data.paymentUrl) : ""}
    <p style="font-size:14px;color:#64748b;">Si ya has realizado el pago, ignora este mensaje. Se actualizará automáticamente cuando lo verifiquemos.</p>`,
    `Recordatorio: cuota ${data.installmentNumber}/${data.totalInstallments} pendiente`
  );

  return {
    subject: `⏰ Recordatorio — Cuota ${data.installmentNumber}/${data.totalInstallments} pendiente | FisioReferentes`,
    html,
  };
}

// ─── 7. Payment Refunded ────────────────────────────────────────────
export function paymentRefunded(data: {
  firstName: string;
  amount: number;
  currency?: string;
  invoiceNumber?: string;
}) {
  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
      Reembolso procesado
    </h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Te confirmamos que hemos procesado el reembolso de <strong>${formatCurrency(data.amount, data.currency)}</strong>${data.invoiceNumber ? ` (factura ${data.invoiceNumber})` : ""}.</p>
    <p>El importe se reflejará en tu cuenta en un plazo de 5-10 días laborables, según tu banco.</p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>`,
    `Reembolso de ${formatCurrency(data.amount)} procesado`
  );

  return {
    subject: `💸 Reembolso procesado${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}
