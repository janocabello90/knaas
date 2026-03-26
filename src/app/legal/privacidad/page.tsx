export const metadata = { title: "Política de Privacidad | Academia FisioReferentes" };

export default function PrivacidadPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Política de Privacidad</h1>
      <p className="text-sm text-gray-500">Última actualización: 26 de marzo de 2026 — Versión 1.0</p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Identidad:</strong> FISIOREFERENTES SL</li>
        <li><strong>NIF:</strong> B56869407</li>
        <li><strong>Dirección:</strong> Zaragoza, España</li>
        <li><strong>Correo de contacto:</strong> privacidad@fisioreferentes.com</li>
      </ul>

      <h2>2. Datos personales que tratamos</h2>
      <table>
        <thead>
          <tr><th>Categoría</th><th>Datos</th><th>Finalidad</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Identificativos</td>
            <td>Nombre, apellidos, email, teléfono, foto, ciudad, provincia</td>
            <td>Gestión de la cuenta y personalización del servicio</td>
          </tr>
          <tr>
            <td>Profesionales</td>
            <td>Especialidad, años de experiencia, motivación</td>
            <td>Adaptar el contenido formativo</td>
          </tr>
          <tr>
            <td>Fiscales</td>
            <td>NIF/CIF, nombre fiscal, dirección fiscal, tipo de empresa</td>
            <td>Emisión de facturas y cumplimiento tributario</td>
          </tr>
          <tr>
            <td>Financieros</td>
            <td>Pagos, estado de cuotas (procesados por Stripe)</td>
            <td>Gestión de cobros y facturación</td>
          </tr>
          <tr>
            <td>De negocio (clínica)</td>
            <td>KPIs agregados: facturación, sesiones, pacientes activos, NPS, churn</td>
            <td>Ejercicios del programa formativo (Diagnóstico 360°)</td>
          </tr>
          <tr>
            <td>De uso</td>
            <td>Progreso en el programa, conversaciones con el asistente IA</td>
            <td>Seguimiento formativo y mejora del servicio</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Nota sobre datos de salud:</strong> No tratamos datos de salud individuales de pacientes.
        Los KPIs de clínica son datos de negocio agregados (facturación, volumen de sesiones) que no
        permiten identificar a pacientes concretos ni su estado de salud.
      </p>

      <h2>3. Base legal del tratamiento</h2>
      <table>
        <thead>
          <tr><th>Tratamiento</th><th>Base legal (RGPD)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Gestión de la cuenta y prestación del servicio</td>
            <td>Art. 6.1.b — Ejecución de un contrato</td>
          </tr>
          <tr>
            <td>Emisión de facturas y cumplimiento tributario</td>
            <td>Art. 6.1.c — Obligación legal</td>
          </tr>
          <tr>
            <td>Procesamiento por IA (asistente educativo)</td>
            <td>Art. 6.1.a — Consentimiento explícito</td>
          </tr>
          <tr>
            <td>Comunicaciones de marketing</td>
            <td>Art. 6.1.a — Consentimiento explícito</td>
          </tr>
          <tr>
            <td>Mejora del servicio y análisis agregado</td>
            <td>Art. 6.1.f — Interés legítimo</td>
          </tr>
          <tr>
            <td>Cookies analíticas</td>
            <td>Art. 6.1.a — Consentimiento explícito</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Procesamiento por Inteligencia Artificial</h2>
      <p>
        La Plataforma incluye un asistente educativo basado en IA (Anthropic Claude). Cuando utilizas
        el asistente, se envía información contextual a los servidores de Anthropic para generar respuestas
        relevantes. Esta información puede incluir:
      </p>
      <ul>
        <li>Tu nombre y el nombre de tu clínica</li>
        <li>KPIs agregados de tu clínica (facturación, sesiones, etc.)</li>
        <li>Tu progreso en el programa formativo</li>
        <li>El historial de la conversación en curso</li>
      </ul>
      <p>
        <strong>Garantías:</strong> Anthropic NO utiliza tus datos para entrenar sus modelos de IA
        (conforme a sus Términos Comerciales de Servicio). Los datos se procesan únicamente para
        generar la respuesta solicitada. Existe un Acuerdo de Tratamiento de Datos (DPA) con
        Anthropic que incluye Cláusulas Contractuales Tipo (SCCs) para transferencias internacionales.
      </p>
      <p>
        <strong>Este procesamiento requiere tu consentimiento explícito</strong>, que puedes otorgar
        o revocar en cualquier momento desde tu Área Privada.
      </p>

      <h2>5. Encargados del tratamiento (subencargados)</h2>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Finalidad</th><th>Ubicación</th><th>Garantías</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>Autenticación y base de datos</td>
            <td>EE.UU.</td>
            <td>DPA con SCCs / EU-US DPF</td>
          </tr>
          <tr>
            <td>Stripe Inc.</td>
            <td>Procesamiento de pagos</td>
            <td>EE.UU.</td>
            <td>DPA incluido en SSA / EU-US DPF</td>
          </tr>
          <tr>
            <td>Anthropic PBC</td>
            <td>Asistente educativo (IA)</td>
            <td>EE.UU.</td>
            <td>DPA con SCCs / Términos Comerciales</td>
          </tr>
          <tr>
            <td>Resend Inc.</td>
            <td>Envío de emails transaccionales</td>
            <td>EE.UU.</td>
            <td>DPA con SCCs</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Alojamiento de la aplicación web</td>
            <td>EE.UU.</td>
            <td>DPA con SCCs / EU-US DPF</td>
          </tr>
        </tbody>
      </table>
      <p>
        Todas las transferencias internacionales se amparan en la Decisión de Adecuación de la
        Comisión Europea para el EU-US Data Privacy Framework y/o en Cláusulas Contractuales
        Tipo (SCCs) aprobadas por la Comisión.
      </p>

      <h2>6. Plazos de conservación</h2>
      <table>
        <thead>
          <tr><th>Datos</th><th>Plazo</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          <tr><td>Cuenta de usuario</td><td>Mientras dure la relación + 1 año</td><td>Servicio</td></tr>
          <tr><td>Datos fiscales y facturas</td><td>6 años tras la última factura</td><td>Art. 30 Código de Comercio</td></tr>
          <tr><td>Conversaciones con IA</td><td>12 meses tras la última sesión</td><td>Servicio</td></tr>
          <tr><td>Registros de consentimiento</td><td>5 años tras la revocación</td><td>Demostración de cumplimiento</td></tr>
          <tr><td>Logs de acceso</td><td>90 días</td><td>Seguridad</td></tr>
        </tbody>
      </table>

      <h2>7. Derechos del interesado (ARSULIPO)</h2>
      <p>
        De conformidad con el RGPD y la LOPDGDD, puedes ejercer los siguientes derechos:
      </p>
      <ul>
        <li><strong>Acceso:</strong> Obtener copia de tus datos personales.</li>
        <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
        <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos (&quot;derecho al olvido&quot;).</li>
        <li><strong>Limitación:</strong> Solicitar la restricción del tratamiento.</li>
        <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado (JSON/CSV).</li>
        <li><strong>Oposición:</strong> Oponerte al tratamiento basado en interés legítimo.</li>
      </ul>
      <p>
        Puedes ejercer estos derechos desde tu <strong>Área Privada</strong> (sección &quot;Mis Datos&quot;)
        o enviando un correo a <strong>privacidad@fisioreferentes.com</strong> junto con una copia de tu
        DNI/NIE. Responderemos en un plazo máximo de 30 días.
      </p>
      <p>
        Si consideras que no hemos atendido correctamente tus derechos, puedes presentar una reclamación
        ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>:{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos, incluyendo:
        cifrado en tránsito (TLS/HTTPS), control de acceso basado en roles, autenticación segura
        mediante Supabase Auth, y almacenamiento seguro de credenciales. Las contraseñas nunca
        se almacenan en texto plano.
      </p>

      <h2>9. Modificaciones de esta política</h2>
      <p>
        Nos reservamos el derecho a actualizar esta política de privacidad. Notificaremos cualquier
        cambio material por correo electrónico o mediante un aviso en la Plataforma. La fecha de
        actualización y la versión figuran al inicio de este documento.
      </p>
    </article>
  );
}
