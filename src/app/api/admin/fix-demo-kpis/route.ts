import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/fix-demo-kpis
 *
 * 1. Runs migrations 006 + 007 (ALTER TABLE IF NOT EXISTS — safe to re-run)
 * 2. Upserts 3 months of KPI snapshots with FULL v2/v3 data for demo user
 *
 * Protected by same secret as seed-demo.
 * DELETE THIS ENDPOINT AFTER USE.
 */

const DEMO_EMAIL = "elsa.demo@fisioreferentes.com";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const secret = req.headers.get("x-seed-secret");
    if (secret !== "fisioreferentes-seed-2026") {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const currentUser = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
      if (!currentUser || currentUser.role !== "SUPERADMIN")
        return NextResponse.json({ error: "Solo superadmins" }, { status: 403 });
    }

    // ── Step 1: Run migrations 006 + 007 ──
    await prisma.$executeRawUnsafe(`
      ALTER TABLE kpi_snapshots
        ADD COLUMN IF NOT EXISTS service_data JSONB,
        ADD COLUMN IF NOT EXISTS worker_data JSONB,
        ADD COLUMN IF NOT EXISTS new_patients INTEGER,
        ADD COLUMN IF NOT EXISTS total_patients INTEGER,
        ADD COLUMN IF NOT EXISTS total_sessions INTEGER;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE kpi_snapshots
        ADD COLUMN IF NOT EXISTS total_patients_12m INTEGER,
        ADD COLUMN IF NOT EXISTS single_visit_pat_12m INTEGER,
        ADD COLUMN IF NOT EXISTS monthly_expenses JSONB,
        ADD COLUMN IF NOT EXISTS use_manual_expenses BOOLEAN DEFAULT false;
    `);

    // Also add recurrence_rate and churn_pct if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE kpi_snapshots
        ADD COLUMN IF NOT EXISTS recurrence_rate DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS churn_pct DOUBLE PRECISION;
    `);

    // ── Step 2: Find demo user's clinic ──
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: { clinics: true },
    });

    if (!demoUser || !demoUser.clinics[0]) {
      return NextResponse.json(
        { error: "Usuario demo no encontrado. Ejecuta /api/admin/seed-demo primero." },
        { status: 404 }
      );
    }

    const clinicId = demoUser.clinics[0].id;

    // ── Step 3: Full KPI data for 3 months ──
    const kpiMonths = [
      {
        monthYear: "2026-01",
        revenue: 14200,
        totalSessions: 320,
        avgTicket: 44.38,
        newPatients: 22,
        nps: 8.0,
        totalPatients12m: 380,
        singleVisitPat12m: 133,
        churnPct: 35.0,
        recurrenceRate: 3.2,
        occupancy: 62,
        grossMargin: 18,
        ownerHours: 35,
        patientsActive: 380,
        isBaseline: true,
        serviceData: {
          "1": { revenue: 9800, sessions: 218, uniquePatients12m: 280 },
          "2": { revenue: 2750, sessions: 50, uniquePatients12m: 85 },
          "3": { revenue: 1650, sessions: 110, uniquePatients12m: 95 },
        },
        workerData: {
          "1": { revenue: 5500, sessions: 120, isOwner: true },
          "2": { revenue: 4200, sessions: 95, isOwner: false },
          "3": { revenue: 3500, sessions: 80, isOwner: false },
          "4": { revenue: 0, sessions: 0, isOwner: false },
        },
      },
      {
        monthYear: "2026-02",
        revenue: 15100,
        totalSessions: 340,
        avgTicket: 44.41,
        newPatients: 25,
        nps: 8.2,
        totalPatients12m: 385,
        singleVisitPat12m: 131,
        churnPct: 34.0,
        recurrenceRate: 3.4,
        occupancy: 64,
        grossMargin: 20,
        ownerHours: 33,
        patientsActive: 385,
        isBaseline: false,
        serviceData: {
          "1": { revenue: 10200, sessions: 227, uniquePatients12m: 283 },
          "2": { revenue: 3025, sessions: 55, uniquePatients12m: 87 },
          "3": { revenue: 1875, sessions: 125, uniquePatients12m: 97 },
        },
        workerData: {
          "1": { revenue: 5800, sessions: 125, isOwner: true },
          "2": { revenue: 4500, sessions: 100, isOwner: false },
          "3": { revenue: 3800, sessions: 85, isOwner: false },
          "4": { revenue: 0, sessions: 0, isOwner: false },
        },
      },
      {
        monthYear: "2026-03",
        revenue: 15800,
        totalSessions: 350,
        avgTicket: 45.14,
        newPatients: 28,
        nps: 8.4,
        totalPatients12m: 390,
        singleVisitPat12m: 128,
        churnPct: 32.8,
        recurrenceRate: 3.5,
        occupancy: 66,
        grossMargin: 22,
        ownerHours: 30,
        patientsActive: 390,
        isBaseline: false,
        serviceData: {
          "1": { revenue: 10800, sessions: 240, uniquePatients12m: 288 },
          "2": { revenue: 3080, sessions: 56, uniquePatients12m: 88 },
          "3": { revenue: 1920, sessions: 128, uniquePatients12m: 98 },
        },
        workerData: {
          "1": { revenue: 5600, sessions: 118, isOwner: true },
          "2": { revenue: 4800, sessions: 108, isOwner: false },
          "3": { revenue: 4200, sessions: 94, isOwner: false },
          "4": { revenue: 0, sessions: 0, isOwner: false },
        },
      },
    ];

    const results = [];

    for (const kpi of kpiMonths) {
      const snapshot = await prisma.kpiSnapshot.upsert({
        where: {
          clinicId_monthYear: { clinicId, monthYear: kpi.monthYear },
        },
        create: {
          clinicId,
          monthYear: kpi.monthYear,
          revenue: kpi.revenue,
          totalSessions: kpi.totalSessions,
          avgTicket: kpi.avgTicket,
          newPatients: kpi.newPatients,
          nps: kpi.nps,
          totalPatients12m: kpi.totalPatients12m,
          singleVisitPat12m: kpi.singleVisitPat12m,
          churnPct: kpi.churnPct,
          recurrenceRate: kpi.recurrenceRate,
          occupancy: kpi.occupancy,
          grossMargin: kpi.grossMargin,
          ownerHours: kpi.ownerHours,
          patientsActive: kpi.patientsActive,
          isBaseline: kpi.isBaseline,
          serviceData: kpi.serviceData,
          workerData: kpi.workerData,
        },
        update: {
          revenue: kpi.revenue,
          totalSessions: kpi.totalSessions,
          avgTicket: kpi.avgTicket,
          newPatients: kpi.newPatients,
          nps: kpi.nps,
          totalPatients12m: kpi.totalPatients12m,
          singleVisitPat12m: kpi.singleVisitPat12m,
          churnPct: kpi.churnPct,
          recurrenceRate: kpi.recurrenceRate,
          occupancy: kpi.occupancy,
          grossMargin: kpi.grossMargin,
          ownerHours: kpi.ownerHours,
          patientsActive: kpi.patientsActive,
          isBaseline: kpi.isBaseline,
          serviceData: kpi.serviceData,
          workerData: kpi.workerData,
        },
      });
      results.push({ monthYear: kpi.monthYear, id: snapshot.id });
    }

    return NextResponse.json({
      success: true,
      message: "Migraciones aplicadas y KPIs actualizados con datos completos",
      migrations: ["006_kpi_snapshot_v2", "007_kpi_snapshot_v3", "recurrence_rate + churn_pct"],
      snapshots: results,
      dashboard: "El cuadro de mandos de Elsa Demo ahora mostrará todos los datos",
    });
  } catch (error) {
    console.error("POST /api/admin/fix-demo-kpis error:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
