import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: {
      clinics: true,
      enrollments: {
        include: {
          cohort: true,
          stepProgress: {
            orderBy: { stepNumber: "asc" },
          },
        },
      },
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  // SUPERADMIN can access all views (admin, mentor, alumno)
  if (user.role === "SUPERADMIN") return user;
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }
  return user;
}
