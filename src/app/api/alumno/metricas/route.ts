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
      data: { userId: user.id, name: `Clínica de ${user.firstName}` },
    });
  }

  // ── Parse inputs ────────────────────────────────────────────
  const serviceData = kpiData.serviceData ?? null;
  const workerData = kpiData.workerData ?? null;
  const monthlyExpenses = kpiData.monthlyExpenses ?? null;
  const useManualExpenses = kpiData.useManualExpenses ?? false;

  // ── Compute revenue & sessions from services ────────────────
  let computedRevenue = 0;
  let computedTotalSessions = 0;
  if (serviceData && typeof serviceData === "object") {
    const entries = Object.values(serviceData) as { revenue?: number; sessions?: number }[];
    computedRevenue = entries.reduce((acc, e) => acc + (Number(e.revenue) || 0), 0);
    computedTotalSessions = entries.reduce((acc, e) => acc + (Number(e.sessions) || 0), 0);
  }

  // ── Ticket medio ────────────────────────────────────────────
  const avgTicket = computedTotalSessions > 0
    ? Math.round((computedRevenue / computedTotalSessions) * 100) / 100
    : null;

  // ── Churn rate ──────────────────────────────────────────────
  const totalPatients12m = kpiData.totalPatients12m != null ? parseInt(String(kpiData.totalPatients12m)) : null;
  const singleVisitPat12m = kpiData.singleVisitPat12m != null ? parseInt(String(kpiData.singleVisitPat12m)) : null;
  let churnPct: number | null = null;
  if (totalPatients12m && totalPatients12m > 0 && singleVisitPat12m != null) {
    churnPct = Math.round((singleVisitPat12m / totalPatients12m) * 10000) / 100;
  }

  // ── Occupancy ───────────────────────────────────────────────
  // Passed pre-computed from client (needs diagnostico data for service mins & worker hours)
  const occupancy = kpiData.occupancy != null ? parseFloat(String(kpiData.occupancy)) : null;

  // ── Gross margin ────────────────────────────────────────────
  const grossMargin = kpiData.grossMargin != null ? parseFloat(String(kpiData.grossMargin)) : null;

  // ── Recurrence per service (rolling 12m) ────────────────────
  // We compute a global recurrence for display, per-service is in serviceData
  let recurrenceRate: number | null = null;
  try {
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const months12: string[] = [];
    for (let i = 0; i < 12; i++) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y -= 1; }
      months12.push(`${y}-${String(m).padStart(2, "0")}`);
    }

    const last12 = await prisma.kpiSnapshot.findMany({
      where: { clinicId: clinic.id, monthYear: { in: months12 } },
      select: { monthYear: true, serviceData: true },
    });

    // Sum sessions across all services for all 12 months
    let totalSes12 = 0;
    const allSnapshots = [
      ...last12.filter((s) => s.monthYear !== monthYear),
      { monthYear, serviceData },
    ];
    allSnapshots.forEach((snap) => {
      if (snap.serviceData && typeof snap.serviceData === "object") {
        const entries = Object.values(snap.serviceData as Record<string, { sessions?: number }>);
        totalSes12 += entries.reduce((acc, e) => acc + (Number(e.sessions) || 0), 0);
      }
    });

    // Sum unique patients from current month's service data
    let totalUniquePat = 0;
    if (serviceData && typeof serviceData === "object") {
      const entries = Object.values(serviceData as Record<string, { uniquePatients12m?: number }>);
      totalUniquePat = entries.reduce((acc, e) => acc + (Number(e.uniquePatients12m) || 0), 0);
    }

    if (totalUniquePat > 0 && totalSes12 > 0) {
      recurrenceRate = Math.round((totalSes12 / totalUniquePat) * 100) / 100;
    }
  } catch (err) {
    console.error("Error computing recurrence rate:", err);
  }

  // ── Build data object ───────────────────────────────────────
  const data = {
    serviceData: serviceData ?? undefined,
    workerData: workerData ?? undefined,
    monthlyExpenses: monthlyExpenses ?? undefined,
    useManualExpenses,
    newPatients: kpiData.newPatients != null ? parseInt(String(kpiData.newPatients)) : null,
    totalPatients12m,
    singleVisitPat12m,
    nps: kpiData.nps != null ? parseFloat(String(kpiData.nps)) : null,
    revenue: computedRevenue > 0 ? computedRevenue : null,
    totalSessions: computedTotalSessions > 0 ? computedTotalSessions : null,
    avgTicket,
    recurrenceRate,
    churnPct,
    occupancy,
    grossMargin,
    ownerHours: kpiData.ownerHours != null ? parseFloat(String(kpiData.ownerHours)) : null,
    patientsActive: totalPatients12m,
    isBaseline: kpiData.isBaseline ?? false,
  };

  const snapshot = await prisma.kpiSnapshot.upsert({
    where: {
      clinicId_monthYear: { clinicId: clinic.id, monthYear },
    },
    create: { clinicId: clinic.id, monthYear, ...data },
    update: data,
  });

  return NextResponse.json(snapshot);
}
