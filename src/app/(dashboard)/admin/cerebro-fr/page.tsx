import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Plus, FileText, Tag } from "lucide-react";

type CerebroDocWithUploader = Awaited<ReturnType<typeof getCerebroDocs>>[number];

async function getCerebroDocs() {
  return prisma.cerebroDocument.findMany({
    include: {
      uploadedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    metodologia: "bg-blue-100 text-blue-700",
    caso_exito: "bg-green-100 text-green-700",
    plantilla: "bg-purple-100 text-purple-700",
    referencia: "bg-amber-100 text-amber-700",
    experto: "bg-red-100 text-red-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
}

function getProgramColor(program: string): string {
  const colors: Record<string, string> = {
    ACTIVA: "bg-blue-50 border border-blue-200",
    OPTIMIZA: "bg-green-50 border border-green-200",
    ESCALA: "bg-purple-50 border border-purple-200",
  };
  return colors[program] || "";
}

function getProgramBadgeColor(program: string): string {
  const colors: Record<string, string> = {
    ACTIVA: "bg-blue-100 text-blue-700",
    OPTIMIZA: "bg-green-100 text-green-700",
    ESCALA: "bg-purple-100 text-purple-700",
  };
  return colors[program] || "bg-gray-100 text-gray-700";
}

export default async function CerebroFRPage() {
  await requireRole(["SUPERADMIN"]);
  const docs = await getCerebroDocs();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cerebro FR</h1>
          <p className="mt-1 text-sm text-gray-500">
            {docs.length} documento{docs.length !== 1 ? "s" : ""} en la base de conocimiento
          </p>
        </div>
        <Link
          href="/admin/cerebro-fr/subir"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Subir documento
        </Link>
      </div>

      {/* Grid of Document Cards */}
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="mb-2 text-gray-600">No hay documentos en Cerebro FR todavía.</p>
          <Link href="/admin/cerebro-fr/subir" className="text-blue-600 hover:underline">
            Sube el primero
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc: CerebroDocWithUploader) => (
            <div
              key={doc.id}
              className={`rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md ${getProgramColor(doc.program || "")}`}
            >
              {/* Category Badge */}
              <div className="mb-3 flex items-start justify-between">
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(doc.category)}`}>
                  {doc.category.replace("_", " ")}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-base font-semibold text-gray-900 line-clamp-2">{doc.title}</h3>

              {/* Program Badge (if set) */}
              {doc.program && (
                <div className="mb-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getProgramBadgeColor(doc.program)}`}>
                    {doc.program}
                  </span>
                </div>
              )}

              {/* Step Number (if set) */}
              {doc.stepNumber && (
                <p className="mb-3 text-xs text-gray-600">
                  Paso <span className="font-semibold">{doc.stepNumber}</span>
                </p>
              )}

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {doc.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {doc.description && (
                <p className="mb-4 text-sm text-gray-600 line-clamp-2">{doc.description}</p>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                  Subido por {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} • {formatDateShort(doc.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
