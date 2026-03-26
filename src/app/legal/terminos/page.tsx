export const metadata = { title: "Términos y Condiciones | Academia FisioReferentes" };

export default function TerminosPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-sm text-gray-500">Última actualización: 26 de marzo de 2026 — Versión 1.0</p>

      <h2>1. Partes y objeto</h2>
      <p>
        Los presentes Términos y Condiciones (en adelante, &quot;Términos&quot;) regulan la relación
        entre <strong>FISIOREFERENTES SL</strong> (NIF B56869407, Zaragoza, España), en adelante
        &quot;FisioReferentes&quot;, y el usuario registrado en la plataforma &quot;Academia
        FisioReferentes&quot; (en adelante, el &quot;Alumno&quot;).
      </p>
      <p>
        El objeto es la prestación del servicio de formación online dirigido a fisioterapeutas
        propietarios de clínica, que incluye acceso a contenidos formativos, ejercicios interactivos,
        un asistente educativo basado en inteligencia artificial, y sesiones de mentoría.
      </p>

      <h2>2. Registro y acceso</h2>
      <p>
        El acceso a la Plataforma se realiza mediante invitación de FisioReferentes. Al registrarse,
        el Alumno declara que los datos proporcionados son veraces, completos y actualizados, y se
        compromete a mantenerlos así durante la vigencia de su cuenta.
      </p>
      <p>
        El Alumno es responsable de la custodia de sus credenciales de acceso y debe notificar
        cualquier uso no autorizado de su cuenta a la mayor brevedad posible.
      </p>

      <h2>3. Programa formativo</h2>
      <p>
        La Plataforma da acceso a programas estructurados (ACTIVA, OPTIMIZA, ESCALA) con
        contenidos teóricos, ejercicios prácticos y herramientas de diagnóstico. Los contenidos
        se desbloquean conforme al progreso del Alumno y al calendario de su cohorte.
      </p>
      <p>
        FisioReferentes se reserva el derecho a modificar, ampliar o actualizar los contenidos
        formativos para mejorar la calidad del servicio, sin que ello suponga una disminución
        sustancial de las prestaciones contratadas.
      </p>

      <h2>4. Asistente de inteligencia artificial</h2>
      <p>
        La Plataforma incluye un asistente educativo basado en IA (denominado &quot;Academia IA&quot;).
        El Alumno reconoce y acepta que:
      </p>
      <ul>
        <li>Las respuestas del asistente son orientativas y de carácter educativo.</li>
        <li>No constituyen asesoramiento profesional, fiscal, legal ni sanitario.</li>
        <li>Para utilizar el asistente, se requiere consentimiento explícito para el procesamiento
            de datos por el proveedor de IA (Anthropic), conforme a la Política de Privacidad.</li>
        <li>El Alumno puede revocar este consentimiento en cualquier momento, lo que desactivará
            el acceso al asistente IA.</li>
      </ul>

      <h2>5. Precio y forma de pago</h2>
      <p>
        Los precios de los programas se comunican al Alumno antes de la inscripción. Todos los
        importes se expresan en euros sin IVA; el IVA (21%) se añade automáticamente. Los métodos
        de pago disponibles son tarjeta bancaria (a través de Stripe) y transferencia bancaria.
      </p>
      <p>
        FisioReferentes emitirá factura electrónica por cada pago conforme a la normativa fiscal
        vigente.
      </p>

      <h2>6. Derecho de desistimiento</h2>
      <p>
        De conformidad con el artículo 103.m) del Real Decreto Legislativo 1/2007 (TRLGDCU),
        el suministro de contenido digital que no se preste en un soporte material está excluido
        del derecho de desistimiento una vez que haya comenzado la ejecución del servicio con
        el consentimiento previo y expreso del Alumno.
      </p>
      <p>
        Si el Alumno no ha accedido a ningún contenido formativo, podrá solicitar el desistimiento
        dentro de los 14 días naturales siguientes a la inscripción, enviando su solicitud a
        legal@fisioreferentes.com.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Todos los materiales formativos, metodologías, ejercicios y herramientas de la Plataforma
        son propiedad de FISIOREFERENTES SL. El Alumno obtiene una licencia personal, intransferible
        y no exclusiva para acceder a los contenidos durante la vigencia de su inscripción.
      </p>
      <p>
        Queda expresamente prohibido copiar, distribuir, grabar o compartir los contenidos con
        terceros, así como utilizarlos con fines comerciales ajenos al programa.
      </p>

      <h2>8. Protección de datos</h2>
      <p>
        El tratamiento de datos personales se rige por nuestra{" "}
        <a href="/legal/privacidad">Política de Privacidad</a>. El Alumno puede ejercer sus derechos
        de acceso, rectificación, supresión, limitación, portabilidad y oposición en cualquier
        momento desde su Área Privada o escribiendo a privacidad@fisioreferentes.com.
      </p>

      <h2>9. Suspensión y baja</h2>
      <p>
        FisioReferentes podrá suspender o cancelar la cuenta del Alumno en caso de incumplimiento
        de estos Términos, uso fraudulento de la Plataforma, o impago reiterado. En caso de baja
        voluntaria, el Alumno puede solicitar la eliminación de su cuenta y datos personales
        conforme al derecho de supresión.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <p>
        FisioReferentes no garantiza que la aplicación de los conocimientos adquiridos en el
        programa produzca resultados económicos concretos en la clínica del Alumno. La formación
        es una herramienta educativa; los resultados dependen de múltiples factores ajenos al control
        de FisioReferentes.
      </p>

      <h2>11. Legislación y jurisdicción</h2>
      <p>
        Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes
        se someten a los juzgados y tribunales de Zaragoza, salvo que la normativa de consumidores
        establezca otro fuero.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos: <strong>legal@fisioreferentes.com</strong>
      </p>
    </article>
  );
}
