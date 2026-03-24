import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    include: { clinics: true },
  });
  return dbUser;
}

// GET — all KPI snapshots for this user's clinic
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clinic = user.clinics[0];
  if (!clinic) {
    return NextResponse.json({ snapshots: [], clinic: null });
  }

  const snapshots = await prisma.kpiSnapshot.findMany({
    where: { clinicId: clinic.id },
    orderBy: { monthYear: "asc" },
  });

  return NextResponse.json({ snapshots, clinic });
}

// POST — create or update a KPI snapshot for a month
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let clinic = user.clinics[0];

  const body = await request.json();
  const { monthYear, ...kpiData } = body;

  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return NextResponse.json(
      { error: "monthYear debe tener formato YYYY-MM" },
      { status: 400 }
    );
  }

  // Auto-create clinic if not exists
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        userId: user.id,
        name: `Clínica de ${user.firstName}`,
      },
    });
  }

  // Upsert: create or update
  const snapshot = await prisma.kpiSnapshot.upsert({
    where: {
      clinicId_monthYear: {
        clinicId: clinic.id,
        monthYear,
      },
    },
    create: {
      clinicId: clinic.id,
      monthYear,
      patientsActive: kpiData.patientsActive != null ? parseInt(String(kpiData.patientsActive)) : null,
      avgTicket: kpiData.avgTicket != null ? parseFloat(String(kpiData.avgTicket)) : null,
      recurrenceRate: kpiData.recurrenceRate != null ? parseFloat(String(kpiData.recurrenceRate)) : null,
      ownerHours: kpiData.ownerHours != null ? parseFloat(String(kpiData.ownerHours)) : null,
      grossMargin: kpiData.grossMargin != null ? parseFloat(String(kpiData.grossMargin)) : null,
      revenue: kpiData.revenue != null ? parseFloat(String(kpiData.revenue)) : null,
      nps: kpiData.nps != null ? parseFloat(String(kpiData.nps)) : null,
      occupancy: kpiData.occupancy != null ? parseFloat(String(kpiData.occupancy)) : null,
      churnPct: kpiData.churnPct != null ? parseFloat(String(kpiData.churnPct)) : null,
      isBaseline: kpiData.isBaseline ?? false,
    },
    update: {
      patientsActive: kpiData.patientsActive != null ? parseInt(String(kpiData.patientsActive)) : null,
      avgTicket: kpiData.avgTicket != null ? parseFloat(String(kpiData.avgTicket)) : null,
      recurrenceRate: kpiData.recurrenceRate != null ? parseFloat(String(kpiData.recurrenceRate)) : null,
      ownerHours: kpiData.ownerHours != null ? parseFloat(String(kpiData.ownerHours)) : null,
      grossMargin: kpiData.grossMargin != null ? parseFloat(String(kpiData.grossMargin)) : null,
      revenue: kpiData.revenue != null ? parseFloat(String(kpiData.revenue)) : null,
      nps: kpiData.nps != null ? parseFloat(String(kpiData.nps)) : null,
      occupancy: kpiData.occupancy != null ? parseFloat(String(kpiData.occupancy)) : null,
      churnPct: kpiData.churnPct != null ? parseFloat(String(kpiData.churnPct)) : null,
      isBaseline: kpiData.isBaseline ?? false,
    },
  });

  return NextResponse.json(snapshot);
}
