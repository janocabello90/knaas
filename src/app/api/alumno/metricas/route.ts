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

  // ── Compute auto-calculated fields ──────────────────────────
  const serviceData = kpiData.serviceData ?? null;
  const workerData = kpiData.workerData ?? null;

  // Revenue = sum of all service revenues
  let computedRevenue: number | null = null;
  let computedTotalSessions: number | null = null;
  if (serviceData && typeof serviceData === "object") {
    const entries = Object.values(serviceData) as { revenue?: number; sessions?: number }[];
    const revSum = entries.reduce((acc, e) => acc + (Number(e.revenue) || 0), 0);
    const sesSum = entries.reduce((acc, e) => acc + (Number(e.sessions) || 0), 0);
    if (revSum > 0) computedRevenue = revSum;
    if (sesSum > 0) computedTotalSessions = sesSum;
  }

  // Use explicit totalSessions if provided, else computed from services
  const finalTotalSessions = kpiData.totalSessions != null
    ? parseInt(String(kpiData.totalSessions))
    : computedTotalSessions;

  // Use explicit revenue if provided, else computed from services
  const finalRevenue = kpiData.revenue != null
    ? parseFloat(String(kpiData.revenue))
    : computedRevenue;

  // Ticket medio = revenue / totalSessions
  let avgTicket: number | null = null;
  if (finalRevenue && finalTotalSessions && finalTotalSessions > 0) {
    avgTicket = finalRevenue / finalTotalSessions;
  }

  // ── Tasa de recurrencia (rolling 12 months) ─────────────────
  // Get last 12 months of snapshots for this clinic
  let recurrenceRate: number | null = null;
  try {
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Build 12-month range
    const months12: string[] = [];
    for (let i = 0; i < 12; i++) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y -= 1; }
      months12.push(`${y}-${String(m).padStart(2, "0")}`);
    }

    const last12 = await prisma.kpiSnapshot.findMany({
      where: {
        clinicId: clinic.id,
        monthYear: { in: months12 },
      },
      select: { monthYear: true, totalSessions: true, totalPatients: true },
    });

    // Include current submission in the calculation
    const allData = [
      ...last12.filter((s) => s.monthYear !== monthYear),
      {
        monthYear,
        totalSessions: finalTotalSessions,
        totalPatients: kpiData.totalPatients != null ? parseInt(String(kpiData.totalPatients)) : null,
      },
    ];

    const totalSes12 = allData.reduce((acc, s) => acc + (s.totalSessions ?? 0), 0);
    const totalPat12 = allData.reduce((acc, s) => acc + (s.totalPatients ?? 0), 0);

    if (totalPat12 > 0 && totalSes12 > 0) {
      recurrenceRate = Math.round((totalSes12 / totalPat12) * 100) / 100;
    }
  } catch (err) {
    console.error("Error computing recurrence rate:", err);
  }

  // ── Build data object ───────────────────────────────────────
  const data = {
    serviceData: serviceData ?? undefined,
    workerData: workerData ?? undefined,
    newPatients: kpiData.newPatients != null ? parseInt(String(kpiData.newPatients)) : null,
    totalPatients: kpiData.totalPatients != null ? parseInt(String(kpiData.totalPatients)) : null,
    totalSessions: finalTotalSessions,
    revenue: finalRevenue,
    avgTicket,
    recurrenceRate,
    nps: kpiData.nps != null ? parseFloat(String(kpiData.nps)) : null,
    churnPct: kpiData.churnPct != null ? parseFloat(String(kpiData.churnPct)) : null,
    occupancy: kpiData.occupancy != null ? parseFloat(String(kpiData.occupancy)) : null,
    ownerHours: kpiData.ownerHours != null ? parseFloat(String(kpiData.ownerHours)) : null,
    grossMargin: kpiData.grossMargin != null ? parseFloat(String(kpiData.grossMargin)) : null,
    patientsActive: kpiData.totalPatients != null ? parseInt(String(kpiData.totalPatients)) : null,
    isBaseline: kpiData.isBaseline ?? false,
  };

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
      ...data,
    },
    update: data,
  });

  return NextResponse.json(snapshot);
}
