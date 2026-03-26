export const metadata = { title: "Política de Cookies | Academia FisioReferentes" };

export default function CookiesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Política de Cookies</h1>
      <p className="text-sm text-gray-500">Última actualización: 26 de marzo de 2026</p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas
        un sitio web. Permiten que el sitio recuerde tu sesión, preferencias y otra información.
      </p>

      <h2>2. Cookies que utilizamos</h2>

      <h3>Cookies estrictamente necesarias (no requieren consentimiento)</h3>
      <p>
        Estas cookies son esenciales para el funcionamiento de la Plataforma. Sin ellas no podrías
        iniciar sesión ni utilizar el servicio.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-*-auth-token</td>
            <td>Supabase</td>
            <td>Sesión de autenticación del usuario</td>
            <td>Sesión / 7 días</td>
          </tr>
          <tr>
            <td>cookie_consent</td>
            <td>Propia</td>
            <td>Registrar tu elección sobre cookies</td>
            <td>365 días</td>
          </tr>
        </tbody>
      </table>

      <h3>Cookies analíticas (requieren consentimiento)</h3>
      <p>
        Actualmente <strong>no utilizamos cookies analíticas</strong> (como Google Analytics).
        Si en el futuro se incorporan, se actualizará esta política y se solicitará tu consentimiento
        previo.
      </p>

      <h3>Cookies de marketing (requieren consentimiento)</h3>
      <p>
        Actualmente <strong>no utilizamos cookies de marketing</strong> ni de publicidad.
        Si en el futuro se incorporan, se actualizará esta política y se solicitará tu consentimiento
        previo.
      </p>

      <h2>3. Cookies de terceros</h2>
      <p>
        Stripe (procesador de pagos) puede establecer cookies propias cuando realizas un pago a
        través de su pasarela. Estas cookies son gestionadas por Stripe conforme a su propia
        política de privacidad:{" "}
        <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
          stripe.com/privacy
        </a>.
      </p>

      <h2>4. Gestión de cookies</h2>
      <p>
        Puedes gestionar tus preferencias de cookies en cualquier momento a través del banner de
        cookies que aparece en la Plataforma, o desde la configuración de tu navegador:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>
      <p>
        Ten en cuenta que desactivar las cookies esenciales puede impedir el funcionamiento
        correcto de la Plataforma.
      </p>

      <h2>5. Base legal</h2>
      <p>
        El uso de cookies esenciales se ampara en el artículo 22.2 de la LSSI-CE (exención para
        cookies técnicas necesarias). Las cookies no esenciales requieren tu consentimiento previo
        conforme al artículo 22.2 de la LSSI-CE y al artículo 6.1.a del RGPD.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para cualquier consulta sobre cookies, puedes escribirnos a{" "}
        <strong>privacidad@fisioreferentes.com</strong>.
      </p>
    </article>
  );
}
