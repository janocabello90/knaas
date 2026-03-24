import { requireAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

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
        {children}
      </main>
    </div>
  );
}
