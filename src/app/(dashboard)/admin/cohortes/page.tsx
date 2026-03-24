import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

type CohortWithCount = Awaited<ReturnType<typeof getCohortes>>[number];

async function getCohortes() {
  return prisma.cohort.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "ACTIVE":
      return { bg: "bg-green-100", text: "text-green-700", label: "Activa" };
    case "DRAFT":
      return { bg: "bg-amber-100", text: "text-amber-700", label: "Borrador" };
    case "COMPLETED":
      return { bg: "bg-blue-100", text: "text-blue-700", label: "Completada" };
    case "ARCHIVED":
      return { bg: "bg-gray-100", text: "text-gray-700", label: "Archivada" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700", label: status };
  }
}

export default async function CohortesList() {
  await requireRole(["SUPERADMIN"]);
  const cohortes = await getCohortes();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cohortes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {cohortes.length} cohorte{cohortes.length !== 1 ? "s" : ""} registrada{cohortes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/cohortes/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Nueva cohorte
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Programa
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Alumnos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha inicio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cohortes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  No hay cohortes registradas todavía.
                  <Link href="/admin/cohortes/nueva" className="ml-1 text-blue-600 hover:underline">
                    Crear la primera
                  </Link>
                </td>
              </tr>
            ) : (
              cohortes.map((cohort: CohortWithCount) => {
                const statusBadge = getStatusBadge(cohort.status);
                return (
                  <tr key={cohort.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/cohortes/${cohort.id}`} className="group">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          {cohort.name}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {cohort.program}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users size={16} />
                        {cohort._count.enrollments}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateShort(cohort.startDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/cohortes/${cohort.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
