import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
  });
  if (!user || user.role !== "SUPERADMIN") return null;
  return user;
}

// GET — all clinics with their KPI snapshots (admin overview)
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cohortId = url.searchParams.get("cohortId");

  // Get clinics with user info and snapshots
  const whereClause = cohortId
    ? {
        user: {
          enrollments: {
            some: { cohortId },
          },
        },
      }
    : {};

  const clinics = await prisma.clinic.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          enrollments: {
            include: { cohort: { select: { name: true, program: true } } },
            take: 1,
          },
        },
      },
      kpiSnapshots: {
        orderBy: { monthYear: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get cohorts for filter dropdown
  const cohorts = await prisma.cohort.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { id: true, name: true, program: true },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ clinics, cohorts });
}
