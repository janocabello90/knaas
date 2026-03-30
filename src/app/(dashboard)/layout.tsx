import { requireAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { ConsentGate } from "@/components/legal/consent-gate";
import { FloatingAssistant } from "@/components/widgets/floating-assistant";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Get the student's active program (from their enrollment)
  const activeEnrollment = user.enrollments?.find(
    (e) => e.status === "ACTIVE" || e.status === "PENDING"
  );
  const activeProgram = activeEnrollment?.cohort?.program ?? null;

  return (
    <div className="min-h-screen">
      <Sidebar
        role={user.role}
        userName={`${user.firstName} ${user.lastName}`}
        userInitials={getInitials(user.firstName, user.lastName)}
        activeProgram={activeProgram}
      />
      <main className="ml-64 min-h-screen p-6 lg:p-8">
        <ConsentGate>
          {children}
        </ConsentGate>
      </main>
      {/* Floating AI assistant — only for students with active enrollment */}
      {user.role === "ALUMNO" && activeProgram && <FloatingAssistant />}

      {/* Legal footer */}
      <footer className="ml-64 border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} FISIOREFERENTES SL</span>
          <Link href="/legal/aviso-legal" className="hover:text-gray-700">Aviso Legal</Link>
          <Link href="/legal/privacidad" className="hover:text-gray-700">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:text-gray-700">Cookies</Link>
          <Link href="/legal/terminos" className="hover:text-gray-700">Términos</Link>
        </div>
      </footer>
    </div>
  );
}
