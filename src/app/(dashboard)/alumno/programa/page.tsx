import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVA_STEPS, StepDefinition } from "@/types/steps";
import { cn } from "@/lib/utils";
import type { StepProgress } from "@prisma/client";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UnreadMessagesWidget } from "@/components/widgets/unread-messages-widget";

const monthColors: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  1: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  2: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  3: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  4: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
};

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 size={20} className="text-green-500" />,
  IN_PROGRESS: <PlayCircle size={20} className="text-blue-500" />,
  PENDING_VALIDATION: <Clock size={20} className="text-amber-500" />,
  AVAILABLE: <ChevronRight size={20} className="text-gray-400" />,
  LOCKED: <Lock size={14} className="text-gray-300" />,
};

export default async function ProgramaPage() {
  const user = await requireRole(["ALUMNO"]);
  const isAdmin = (user.role as string) === "SUPERADMIN" || (user.role as string) === "ADMIN";

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id },
    include: {
      cohort: true,
      stepProgress: { orderBy: { stepNumber: "asc" } },
    },
  });

  const stepProgressMap = new Map(
    enrollment?.stepProgress.map((sp: StepProgress) => [sp.stepNumber, sp] as const) ?? []
  );

  const completedSteps = enrollment?.stepProgress.filter(
    (s: StepProgress) => s.status === "COMPLETED"
  ).length ?? 0;
  const totalSteps = ACTIVA_STEPS.length; // 14 (0-13)
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const currentStep = enrollment?.stepProgress.find(
    (s: StepProgress) => s.status === "IN_PROGRESS"
  );

  // ── Weekly time-gating ──
  // Each step unlocks 1 per week from enrollment date.
  // Step 0 → week 1, Step 1 → week 1, Step 2 → week 2, etc.
  // Admins bypass time-gating.
  const enrolledAt = enrollment?.enrolledAt ? new Date(enrollment.enrolledAt) : null;
  const now = new Date();
  const weeksElapsed = enrolledAt
    ? Math.floor((now.getTime() - enrolledAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  function isStepUnlockedByTime(stepNumber: number): boolean {
    if (isAdmin) return true;
    if (!enrolledAt) return false;
    // Step 0 and 1 unlock in week 0 (first week), step 2 in week 1, etc.
    const unlockWeek = stepNumber <= 1 ? 0 : stepNumber - 1;
    return weeksElapsed >= unlockWeek;
  }

  // Group steps by month
  const stepsByMonth = ACTIVA_STEPS.reduce((acc, step) => {
    if (!acc[step.month]) acc[step.month] = [];
    acc[step.month].push(step);
    return acc;
  }, {} as Record<number, typeof ACTIVA_STEPS>);

  const monthLabels: Record<number, string> = {
    1: "Mes 1 — Diagnóstico, autoconocimiento y claridad estratégica",
    2: "Mes 2 — Propuesta de valor y modelo de negocio",
    3: "Mes 3 — Captación, ventas y marca personal",
    4: "Mes 4 — Graduación y transición",
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header with ACTIVA logo */}
      <div className="mb-8 flex items-center gap-4">
        <Image
          src="/ACTIVA.png"
          alt="Programa ACTIVA"
          width={80}
          height={80}
          className="h-16 w-auto"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Programa ACTIVA</h1>
          <p className="mt-1 text-sm text-gray-500">
            {enrollment?.cohort.name ?? "Sin cohorte asignada"} &middot; 14 pasos (0–13) &middot; 4 meses
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Progreso general</p>
            <p className="text-xs text-gray-500">
              {completedSteps} de {totalSteps} pasos completados
            </p>
          </div>
          <span className="text-2xl font-bold text-blue-600">{progressPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {currentStep && (
          <p className="mt-3 text-sm text-gray-600">
            Paso actual:{" "}
            <strong>
              {currentStep.stepNumber}. {ACTIVA_STEPS.find(s => s.number === currentStep.stepNumber)?.name}
            </strong>
          </p>
        )}
      </div>

      {/* Unread Messages Widget */}
      <div className="mb-8">
        <UnreadMessagesWidget />
      </div>

      {/* Steps by Month */}
      {Object.entries(stepsByMonth).map(([monthStr, steps]: [string, StepDefinition[]]) => {
        const month = Number(monthStr);
        const colors = monthColors[month];

        return (
          <div key={month} className="mb-8">
            <h2 className={cn("mb-4 text-sm font-semibold uppercase tracking-wider", colors.text)}>
              {monthLabels[month]}
            </h2>
            <div className="space-y-3">
              {steps.map((step) => {
                const progress = stepProgressMap.get(step.number);
                const timeUnlocked = isStepUnlockedByTime(step.number);
                const status = progress?.status
                  ?? (timeUnlocked ? "AVAILABLE" : "LOCKED");
                const isActive = status === "IN_PROGRESS";
                const isCompleted = status === "COMPLETED";
                const isLocked = status === "LOCKED";

                const cardClasses = cn(
                  "block rounded-xl border bg-white p-4 transition-all",
                  isActive && `${colors.border} ring-2 ring-blue-200`,
                  isCompleted && "border-green-200",
                  isLocked && "border-gray-200 opacity-60",
                  !isActive && !isCompleted && !isLocked && "border-gray-200",
                  !isLocked && "cursor-pointer hover:shadow-md"
                );

                const cardContent = (
                  <>
                    <div className="flex items-center gap-4">
                      {/* Step number */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          isCompleted && "bg-green-100 text-green-700",
                          isActive && "bg-blue-100 text-blue-700",
                          !isCompleted && !isActive && `${colors.badge}`
                        )}
                      >
                        {step.number}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-sm font-semibold",
                              isLocked ? "text-gray-400" : "text-gray-900"
                            )}
                          >
                            {step.name}
                          </h3>
                          <span className="text-xs text-gray-400">{step.hours}h</span>
                        </div>

                        {isLocked && !isAdmin && enrolledAt && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            Se desbloquea el{" "}
                            {new Date(
                              enrolledAt.getTime() +
                                (step.number <= 1 ? 0 : (step.number - 1)) * 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                          </p>
                        )}

                        {!isLocked && (
                          <div className="mt-1.5 flex items-center gap-3">
                            {(["saber", "decidir", "hacer"] as const).map((obj) => {
                              const done = progress?.[obj] ?? false;
                              const label = obj === "hacer" ? "activar" : obj;
                              return (
                                <span
                                  key={obj}
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                                    done
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-400"
                                  )}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Status icon */}
                      <div className="shrink-0">{statusIcons[status]}</div>
                    </div>

                    {/* Active step: show CTA */}
                    {isActive && (
                      <div className="mt-4 flex gap-2">
                        <span
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Continuar paso
                        </span>
                        <span
                          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Abrir Academia IA
                        </span>
                      </div>
                    )}
                  </>
                );

                return isLocked ? (
                  <div key={step.number} className={cardClasses}>
                    {cardContent}
                  </div>
                ) : (
                  <Link key={step.number} href={`/alumno/programa/paso/${step.number}`} className={cardClasses}>
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* OPTIMIZA / ESCALA locked */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Lock size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-500">
          OPTIMIZA y ESCALA se desbloquean al completar ACTIVA
        </p>
        <p className="mt-1 text-xs text-gray-400">
          El siguiente paso después de los 14 pasos de ACTIVA
        </p>
      </div>
    </div>
  );
}
