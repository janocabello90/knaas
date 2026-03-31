import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get API key from current user or any SUPERADMIN
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { apiKeyEncrypted: true },
    });

    let apiKey = dbUser?.apiKeyEncrypted ?? null;
    if (!apiKey) {
      const admin = await prisma.user.findFirst({
        where: { role: "SUPERADMIN", apiKeyEncrypted: { not: null } },
        select: { apiKeyEncrypted: true },
      });
      apiKey = admin?.apiKeyEncrypted ?? null;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "No hay API key de Anthropic configurada. Configúrala en Ajustes." },
        { status: 400 }
      );
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
      system: `Eres un maquetador de contenido educativo para una academia de fisioterapeutas propietarios de clínica.

Tu ÚNICA tarea es recibir texto en bruto y devolver HTML bien maquetado. REGLAS ABSOLUTAS:

1. NO cambies NI UNA SOLA PALABRA del texto original. No reescribas, no resumas, no parafrasees, no añadas contenido nuevo.
2. Solo añade etiquetas HTML para dar formato y estructura visual.

ETIQUETAS QUE PUEDES USAR:
- <h2> para títulos principales de sección
- <h3> para subtítulos
- <p> para párrafos normales
- <strong> para texto importante o conceptos clave (úsalo con criterio, no en exceso)
- <em> para énfasis
- <ul><li> para listas con viñetas (cuando el texto ya enumera elementos)
- <ol><li> para listas numeradas (cuando el texto ya numera pasos)
- <blockquote> para citas textuales o frases destacadas
- <div class="callout"> para ideas clave o conceptos importantes que merecen destacarse visualmente (precede con 💡)
- <div class="warning"> para advertencias o errores comunes (precede con ⚠️)
- <hr> para separar secciones claramente distintas

CRITERIOS DE MAQUETACIÓN:
- Identifica la estructura natural del texto: si hay secciones temáticas, usa <h2>
- Los párrafos largos que tratan subtemas distintos deben separarse en <p> individuales
- Si el autor enumera cosas (aunque sea en prosa), valora si queda mejor como <ul> o <ol>
- Las frases que son máximas, lecciones clave o definiciones importantes → <div class="callout">
- Las advertencias tipo "cuidado con...", "no caigas en..." → <div class="warning">
- Las citas literales o frases de referencia → <blockquote>
- Usa <strong> para los 2-3 conceptos más importantes de cada sección, no más

DEVUELVE ÚNICAMENTE EL HTML. Sin explicaciones, sin comentarios, sin markdown, sin bloques de código. Solo el HTML limpio.`,
    });

    const html =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Clean up any markdown code fences the model might add
    const cleanHtml = html
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({ html: cleanHtml });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/admin/lessons/format-ai error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
