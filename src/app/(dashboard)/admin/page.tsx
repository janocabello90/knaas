import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, Brain, Activity } from "lucide-react";

async function getStats() {
  const [totalAlumnos, totalCohorts, totalDocuments, totalSessions] =
    await Promise.all([
      prisma.user.count({ where: { role: "ALUMNO" } }),
      prisma.cohort.count({ where: { status: "ACTIVE" } }),
      prisma.cerebroDocument.count({ where: { isActive: true } }),
      prisma.conversationSession.count(),
    ]);

  return { totalAlumnos, totalCohorts, totalDocuments, totalSessions };
}

export default async function AdminDashboard() {
  const user = await requireRole(["SUPERADMIN"]);
  const stats = await getStats();

  const cards = [
    {
      label: "Alumnos activos",
      value: stats.totalAlumnos,
      icon: <Users size={24} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Cohortes activas",
      value: stats.totalCohorts,
      icon: <BookOpen size={24} />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Docs Cerebro FR",
      value: stats.totalDocuments,
      icon: <Brain size={24} />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Sesiones IA",
      value: stats.totalSessions,
      icon: <Activity size={24} />,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Buenos días, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Panel de superadministración de FisioReferentes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${card.color}`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Crear alumno", href: "/admin/alumnos/nuevo", desc: "Añadir un nuevo alumno al programa" },
            { label: "Nueva cohorte", href: "/admin/cohortes/nueva", desc: "Crear un grupo de alumnos" },
            { label: "Subir a Cerebro FR", href: "/admin/cerebro-fr/subir", desc: "Añadir documentos a la base de conocimiento" },
            { label: "Agendar mentoría", href: "/admin/mentorias/nueva", desc: "Programar una sesión grupal o individual" },
            { label: "Enviar mensaje", href: "/admin/mensajes/nuevo", desc: "Comunicarse con alumnos o cohortes" },
            { label: "Ver monitoring IA", href: "/admin/monitoring", desc: "Consumo de créditos de Anthropic" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="text-sm font-medium text-gray-900">{action.label}</p>
              <p className="mt-1 text-xs text-gray-500">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
