import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CerebroList } from "./cerebro-list";

async function getCerebroDocs() {
  return prisma.cerebroDocument.findMany({
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CerebroFRPage() {
  await requireRole(["SUPERADMIN"]);
  const docs = await getCerebroDocs();

  // Serialize dates for client component
  const serialized = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    program: doc.program,
    stepNumber: doc.stepNumber,
    tags: doc.tags,
    content: doc.content,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    uploadedBy: {
      firstName: doc.uploadedBy.firstName,
      lastName: doc.uploadedBy.lastName,
    },
  }));

  return <CerebroList initialDocs={serialized} />;
}
