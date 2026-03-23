import { requireAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen">
      <Sidebar
        role={user.role}
        userName={`${user.firstName} ${user.lastName}`}
        userInitials={getInitials(user.firstName, user.lastName)}
      />
      <main className="ml-64 min-h-screen p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
