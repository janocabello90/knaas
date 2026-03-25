/**
 * Base HTML layout for all Academia transactional emails.
 * Inline styles for max email-client compatibility.
 */

const BRAND_COLOR = "#6366f1"; // indigo-500
const BRAND_DARK = "#4338ca";  // indigo-700
const BG_COLOR = "#f8fafc";    // slate-50
const TEXT_COLOR = "#1e293b";  // slate-800
const TEXT_MUTED = "#64748b";  // slate-500

export function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FisioReferentes</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_DARK});padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                FisioReferentes
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;color:${TEXT_COLOR};font-size:16px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:13px;color:${TEXT_MUTED};">
                © ${new Date().getFullYear()} FisioReferentes · De Fisio a Empresario
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:${TEXT_MUTED};">
                Este email ha sido enviado desde la Academia de FisioReferentes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function button(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${BRAND_COLOR};border-radius:8px;padding:14px 32px;">
      <a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">${text}</a>
    </td>
  </tr>
</table>`;
}

export function infoBox(label: string, value: string): string {
  return `<tr>
  <td style="padding:8px 0;color:${TEXT_MUTED};font-size:14px;width:140px;vertical-align:top;">${label}</td>
  <td style="padding:8px 0;color:${TEXT_COLOR};font-size:14px;font-weight:600;">${value}</td>
</tr>`;
}

export function detailsTable(rows: { label: string; value: string }[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;background-color:#f8fafc;border-radius:8px;padding:16px;">
  ${rows.map((r) => infoBox(r.label, r.value)).join("")}
</table>`;
}
