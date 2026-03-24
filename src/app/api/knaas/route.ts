import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ACTIVA_STEPS } from "@/types/steps";

function buildSystemPrompt(
  mode: string,
  userName: string,
  clinicData: Record<string, unknown> | null,
  stepNumber: number,
  stepProgress: Record<string, unknown>[] | null,
  cerebroContext: string
) {
  const step = ACTIVA_STEPS[stepNumber - 1];

  const base = `Eres el KNAAS — el asistente de acompañamiento del programa ACTIVA de De Fisio a Empresario.
Tu función es acompañar a ${userName} en la transformación de su clínica de fisioterapia en un negocio estructurado y rentable.
No eres un chatbot genérico. Conoces su clínica, sus números y el trabajo que ha hecho hasta aquí.

CONTEXTO DE LA CLÍNICA:
${clinicData ? JSON.stringify(clinicData, null, 2) : "No disponible todavía — el alumno aún no ha completado el onboarding."}

ESTADO EN ACTIVA:
Paso actual: ${stepNumber} — ${step?.name ?? "N/A"}
Objetivos del paso:
- SABER: ${step?.saber ?? "N/A"}
- DECIDIR: ${step?.decidir ?? "N/A"}
- HACER: ${step?.hacer ?? "N/A"}

Outputs esperados: ${step?.outputs.join(", ") ?? "N/A"}
`;

  const modeInstructions: Record<string, string> = {
    acompanante: `MODO ACOMPAÑANTE (activo):
El alumno está trabajando el Paso ${stepNumber}. Tu objetivo es ayudarle a alcanzar los 3 objetivos del paso.
Propón el trabajo, guía los ejercicios, detecta bloqueos y asegúrate de que produce el output concreto antes de avanzar.
${step?.knaasCompanion ?? ""}`,

    analista: `MODO ANALISTA (activo):
El alumno ha solicitado análisis estratégico. Adopta el rol de analista senior.
Marcos disponibles: Blue Team (mejor caso a favor), Devil's Advocate (peor caso en contra), Pre-mortem (imaginar el fallo y trabajar hacia atrás), Segunda Orden (consecuencias de las consecuencias).
Construye el análisis con rigor. Termina identificando los 2-3 puntos más vulnerables.
${step?.knaasAnalyst ?? ""}`,

    generador: `MODO GENERADOR (activo):
El alumno necesita generar un output del Paso ${stepNumber}.
Usa toda la información de su clínica disponible para generar un borrador personalizado — no una plantilla genérica.
El output tiene que sonar como si lo hubiera escrito alguien que conoce su clínica en profundidad. Entrégalo completo y listo para usar.
${step?.knaasGenerator ?? ""}`,
  };

  const principles = `
PRINCIPIOS DE COMPORTAMIENTO:
— Nunca das respuestas genéricas cuando tienes datos reales disponibles. Siempre usas sus números.
— Cuando detectas un error conceptual, lo señalas con claridad antes de continuar.
— No avanzas al siguiente objetivo si el anterior no está consolidado.
— Usas el tono de De Fisio a Empresario: directo, sin condescendencia, orientado a la acción.
— Cuando el alumno está en modo Analista, eres exigente. Tu trabajo es hacer que la decisión sea más sólida.
— Cuando generas un borrador, lo entregas completo y listo, no como esquema.
— Hablas en español.`;

  const cerebro = cerebroContext
    ? `\nCONTEXTO ADICIONAL DEL CEREBRO FR:\n${cerebroContext}`
    : "";

  return `${base}\n${modeInstructions[mode] ?? modeInstructions.acompanante}\n${principles}${cerebro}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: {
        clinics: true,
        enrollments: {
          include: {
            stepProgress: { orderBy: { stepNumber: "asc" } },
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 400 }
      );
    }

    // Get API key: first check user's own key, then fall back to any SUPERADMIN's key
    let apiKey = dbUser.apiKeyEncrypted;
    if (!apiKey) {
      const admin = await prisma.user.findFirst({
        where: { role: "SUPERADMIN", apiKeyEncrypted: { not: null } },
        select: { apiKeyEncrypted: true },
      });
      apiKey = admin?.apiKeyEncrypted ?? null;
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: "No hay API key de Anthropic configurada. Pide al admin que la configure en Ajustes." },
        { status: 400 }
      );
    }

    const { message, mode = "acompanante", history = [] } = await request.json();

    // Get current step
    const enrollment = dbUser.enrollments[0];
    const currentStepProgress = enrollment?.stepProgress.find(
      (s) => s.status === "IN_PROGRESS"
    );
    const stepNumber = currentStepProgress?.stepNumber ?? 1;

    // Get clinic data
    const clinic = dbUser.clinics[0];
    const clinicData = clinic
      ? {
          nombre: clinic.name,
          modelo: clinic.model,
          fase: clinic.cyclePhase,
          equipo: clinic.teamCount,
          servicios: clinic.services,
        }
      : null;

    // Get Cerebro FR context (simplified - in production use pgvector similarity search)
    const cerebroDocs = await prisma.cerebroDocument.findMany({
      where: {
        isActive: true,
        OR: [
          { stepNumber: null },
          { stepNumber },
        ],
      },
      take: 5,
      select: { title: true, content: true },
    });
    const cerebroContext = cerebroDocs
      .filter((d: { title: string; content: string | null }) => d.content)
      .map((d: { title: string; content: string | null }) => `[${d.title}]: ${d.content?.substring(0, 500)}`)
      .join("\n\n");

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      mode,
      `${dbUser.firstName} ${dbUser.lastName}`,
      clinicData,
      stepNumber,
      enrollment?.stepProgress as unknown as Record<string, unknown>[],
      cerebroContext
    );

    // Call Anthropic API with user's key
    // TODO: decrypt apiKeyEncrypted in production
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Log session
    if (enrollment) {
      await prisma.conversationSession.create({
        data: {
          enrollmentId: enrollment.id,
          stepNumber,
          mode: mode.toUpperCase() as "ACOMPANANTE" | "ANALISTA" | "GENERADOR",
          messages: [
            ...history,
            { role: "user", content: message },
            { role: "assistant", content: assistantMessage },
          ],
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          costEstimate:
            (response.usage.input_tokens * 0.003 +
              response.usage.output_tokens * 0.015) /
            1000,
        },
      });
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error: unknown) {
    console.error("KNAAS API error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
