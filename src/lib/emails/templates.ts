/**
 * KNAAS — Email templates for all transactional flows.
 * Each template function returns { subject, html }.
 */

import { baseLayout, button, detailsTable } from "./base-layout";

// ─── Datos fiscales emisor ──────────────────────────────────────────
const EMISOR = {
  nombre: "FISIOREFERENTES SL",
  direccion: "Paseo Fernando el Católico 39 3ºD (50006)",
  ciudad: "ZARAGOZA",
  nif: "B56869407",
  email: "hola@fisioreferentes.com",
};

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

function emisorBlock(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;background-color:#f1f5f9;border-radius:8px;padding:12px 16px;">
  <tr><td style="font-size:12px;color:#64748b;padding:2px 0;">Emisor:</td></tr>
  <tr><td style="font-size:13px;color:#1e293b;font-weight:600;padding:2px 0;">${EMISOR.nombre}</td></tr>
  <tr><td style="font-size:12px;color:#475569;padding:2px 0;">${EMISOR.direccion} · ${EMISOR.ciudad}</td></tr>
  <tr><td style="font-size:12px;color:#475569;padding:2px 0;">NIF: ${EMISOR.nif} · ${EMISOR.email}</td></tr>
</table>`;
}

function ivaBreakdown(baseAmount: number, ivaRate: number, ivaAmount: number, totalAmount: number, currency = "EUR"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
  <tr style="background-color:#f8fafc;">
    <td style="padding:8px 16px;font-size:13px;color:#64748b;">Base imponible</td>
    <td style="padding:8px 16px;font-size:13px;color:#1e293b;text-align:right;">${formatCurrency(baseAmount, currency)}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;font-size:13px;color:#64748b;">IVA (${ivaRate}%)</td>
    <td style="padding:8px 16px;font-size:13px;color:#1e293b;text-align:right;">${formatCurrency(ivaAmount, currency)}</td>
  </tr>
  <tr style="background-color:#f1f5f9;border-top:2px solid #e2e8f0;">
    <td style="padding:10px 16px;font-size:14px;color:#1e293b;font-weight:700;">Total</td>
    <td style="padding:10px 16px;font-size:14px;color:#1e293b;font-weight:700;text-align:right;">${formatCurrency(totalAmount, currency)}</td>
  </tr>
</table>`;
}

// ─── 1. Payment Confirmation ────────────────────────────────────────
export function paymentConfirmation(data: {
  firstName: string;
  baseAmount: number;
  ivaRate?: number;
  ivaAmount: number;
  totalAmount: number;
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
  const rate = data.ivaRate || 21;

  const details = [
    { label: "Método", value: methodLabel },
    { label: "Fecha", value: formatDate(data.paidAt) },
  ];
  if (data.cohortName) details.push({ label: "Programa", value: data.cohortName });
  if (data.invoiceNumber) details.push({ label: "Nº Factura", value: data.invoiceNumber });
  if (isInstallment) {
    details.push({ label: "Cuota", value: `${data.installmentNumber} de ${data.totalInstallments}` });
  }

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">¡Pago confirmado!</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Tu pago ha sido procesado correctamente${isInstallment ? ` (cuota ${data.installmentNumber} de ${data.totalInstallments})` : ""}.</p>
    ${ivaBreakdown(data.baseAmount, rate, data.ivaAmount, data.totalAmount, data.currency)}
    ${detailsTable(details)}
    ${emisorBlock()}
    <p>Si tienes alguna duda, responde directamente a este email.</p>`,
    `Pago de ${formatCurrency(data.totalAmount)} confirmado`
  );

  return {
    subject: `Pago confirmado${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}

// ─── 2. Payment Link Sent ───────────────────────────────────────────
export function paymentLinkSent(data: {
  firstName: string;
  baseAmount: number;
  ivaAmount: number;
  totalAmount: number;
  currency?: string;
  cohortName?: string;
  checkoutUrl: string;
  installments?: number;
}) {
  const isInstallment = data.installments && data.installments > 1;

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">Tu enlace de pago está listo</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Desde FisioReferentes te hemos generado un enlace para realizar ${isInstallment ? `el pago de tu cuota (${data.installments} cuotas)` : "tu pago"}${data.cohortName ? ` para <strong>${data.cohortName}</strong>` : ""}.</p>
    ${ivaBreakdown(data.baseAmount, 21, data.ivaAmount, data.totalAmount, data.currency)}
    ${button("Realizar pago", data.checkoutUrl)}
    ${emisorBlock()}
    <p style="font-size:14px;color:#64748b;">Este enlace es personal e intransferible.</p>`,
    `Enlace de pago listo — ${formatCurrency(data.totalAmount)}`
  );

  return {
    subject: `Tu enlace de pago | FisioReferentes`,
    html,
  };
}

// ─── 3. Transfer Pending Verification ──────────────────────────────
export function transferPendingVerification(data: {
  firstName: string;
  amount: number; // totalAmount
  currency?: string;
  cohortName?: string;
  invoiceNumber?: string;
  installmentNumber?: number;
  totalInstallments?: number;
}) {
  const isInstallment = data.totalInstallments && data.totalInstallments > 1;
  const base = Math.round((data.amount / 1.21) * 100) / 100;
  const iva = Math.round((data.amount - base) * 100) / 100;

  const details = [
    { label: "Método", value: "Transferencia bancaria" },
  ];
  if (data.cohortName) details.push({ label: "Programa", value: data.cohortName });
  if (data.invoiceNumber) details.push({ label: "Nº Factura", value: data.invoiceNumber });
  if (isInstallment) {
    details.push({ label: "Cuota", value: `${data.installmentNumber} de ${data.totalInstallments}` });
  }

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">Pago por transferencia registrado</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Hemos registrado tu pago por transferencia bancaria. Una vez recibamos y verifiquemos la transferencia, te enviaremos la confirmación.</p>
    ${ivaBreakdown(base, 21, iva, data.amount, data.currency)}
    ${detailsTable(details)}
    ${emisorBlock()}
    <p style="font-size:14px;color:#64748b;">Si ya has realizado la transferencia, no tienes que hacer nada más.</p>`,
    `Transferencia de ${formatCurrency(data.amount)} pendiente de verificación`
  );

  return {
    subject: `Transferencia registrada — pendiente de verificación | FisioReferentes`,
    html,
  };
}

// ─── 4. Transfer Verified ───────────────────────────────────────────
export function transferVerified(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  invoiceNumber?: string;
}) {
  const base = Math.round((data.amount / 1.21) * 100) / 100;
  const iva = Math.round((data.amount - base) * 100) / 100;

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">¡Transferencia verificada!</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Hemos recibido y verificado tu transferencia${data.cohortName ? ` para <strong>${data.cohortName}</strong>` : ""}.</p>
    ${ivaBreakdown(base, 21, iva, data.amount, data.currency)}
    ${data.invoiceNumber ? `<p>Nº de factura: <strong>${data.invoiceNumber}</strong></p>` : ""}
    ${emisorBlock()}
    <p>Ya tienes acceso completo a tu programa. ¡Gracias!</p>`,
    `Transferencia de ${formatCurrency(data.amount)} verificada`
  );

  return {
    subject: `Transferencia verificada${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}

// ─── 5. Welcome / Enrollment ────────────────────────────────────────
export function welcomeEnrollment(data: {
  firstName: string;
  cohortName: string;
  loginUrl: string;
}) {
  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">¡Bienvenido/a a FisioReferentes!</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Tu inscripción en <strong>${data.cohortName}</strong> ya está confirmada. Estamos encantados de tenerte en el programa.</p>
    <p>Ya puedes acceder a la plataforma para ver tu programa, las mentorías, la comunidad y todos los recursos disponibles.</p>
    ${button("Acceder a la plataforma", data.loginUrl)}
    ${emisorBlock()}
    <p>Si tienes cualquier duda, estamos a un email de distancia.</p>`,
    `Bienvenido/a a ${data.cohortName}`
  );

  return {
    subject: `¡Bienvenido/a a ${data.cohortName}! | FisioReferentes`,
    html,
  };
}

// ─── 6. Payment Reminder ───────────────────────────────────────────
export function paymentReminder(data: {
  firstName: string;
  amount: number;
  currency?: string;
  cohortName?: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDescription?: string;
  paymentUrl?: string;
}) {
  const base = Math.round((data.amount / 1.21) * 100) / 100;
  const iva = Math.round((data.amount - base) * 100) / 100;

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">Recordatorio de pago</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Te recordamos que tienes pendiente la cuota <strong>${data.installmentNumber} de ${data.totalInstallments}</strong>${data.cohortName ? ` de <strong>${data.cohortName}</strong>` : ""}${data.dueDescription ? ` (vence ${data.dueDescription})` : ""}.</p>
    ${ivaBreakdown(base, 21, iva, data.amount, data.currency)}
    ${data.paymentUrl ? button("Pagar ahora", data.paymentUrl) : ""}
    ${emisorBlock()}
    <p style="font-size:14px;color:#64748b;">Si ya has realizado el pago, ignora este mensaje.</p>`,
    `Recordatorio: cuota ${data.installmentNumber}/${data.totalInstallments} pendiente`
  );

  return {
    subject: `Recordatorio — Cuota ${data.installmentNumber}/${data.totalInstallments} pendiente | FisioReferentes`,
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
  const base = Math.round((data.amount / 1.21) * 100) / 100;
  const iva = Math.round((data.amount - base) * 100) / 100;

  const html = baseLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">Reembolso procesado</h2>
    <p>Hola <strong>${data.firstName}</strong>,</p>
    <p>Te confirmamos que hemos procesado el reembolso${data.invoiceNumber ? ` (factura ${data.invoiceNumber})` : ""}.</p>
    ${ivaBreakdown(base, 21, iva, data.amount, data.currency)}
    ${emisorBlock()}
    <p>El importe se reflejará en tu cuenta en un plazo de 5-10 días laborables, según tu banco.</p>`,
    `Reembolso de ${formatCurrency(data.amount)} procesado`
  );

  return {
    subject: `Reembolso procesado${data.invoiceNumber ? ` — ${data.invoiceNumber}` : ""} | FisioReferentes`,
    html,
  };
}
