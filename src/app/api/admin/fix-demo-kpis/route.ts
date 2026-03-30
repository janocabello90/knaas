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

    // ── Step 3: Full KPI data — 12 months 2025 + 3 months 2026 ──
    // 2025 data represents the "año anterior" matching the Radiografía baseline
    // Revenue trend: steady with seasonal dip in Aug, slight growth toward end of year
    const kpiMonths = [
      // ════════════════════ 2025 ════════════════════
      {
        monthYear: "2025-01",
        revenue: 13200, totalSessions: 298, avgTicket: 44.30, newPatients: 18, nps: 7.5,
        totalPatients12m: 340, singleVisitPat12m: 126, churnPct: 37.1, recurrenceRate: 2.9,
        occupancy: 56, grossMargin: 14, ownerHours: 38, patientsActive: 340, isBaseline: false,
        serviceData: { "1": { revenue: 9100, sessions: 202, uniquePatients12m: 252 }, "2": { revenue: 2530, sessions: 46, uniquePatients12m: 76 }, "3": { revenue: 1570, sessions: 105, uniquePatients12m: 88 } },
        workerData: { "1": { revenue: 5200, sessions: 115, isOwner: true }, "2": { revenue: 3900, sessions: 88, isOwner: false }, "3": { revenue: 3200, sessions: 72, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-02",
        revenue: 13500, totalSessions: 305, avgTicket: 44.26, newPatients: 19, nps: 7.6,
        totalPatients12m: 345, singleVisitPat12m: 128, churnPct: 37.1, recurrenceRate: 2.9,
        occupancy: 57, grossMargin: 14, ownerHours: 38, patientsActive: 345, isBaseline: false,
        serviceData: { "1": { revenue: 9300, sessions: 207, uniquePatients12m: 256 }, "2": { revenue: 2585, sessions: 47, uniquePatients12m: 77 }, "3": { revenue: 1615, sessions: 108, uniquePatients12m: 89 } },
        workerData: { "1": { revenue: 5300, sessions: 117, isOwner: true }, "2": { revenue: 4000, sessions: 90, isOwner: false }, "3": { revenue: 3300, sessions: 74, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-03",
        revenue: 14000, totalSessions: 315, avgTicket: 44.44, newPatients: 21, nps: 7.8,
        totalPatients12m: 350, singleVisitPat12m: 126, churnPct: 36.0, recurrenceRate: 3.0,
        occupancy: 59, grossMargin: 15, ownerHours: 37, patientsActive: 350, isBaseline: false,
        serviceData: { "1": { revenue: 9600, sessions: 214, uniquePatients12m: 260 }, "2": { revenue: 2700, sessions: 49, uniquePatients12m: 78 }, "3": { revenue: 1700, sessions: 113, uniquePatients12m: 90 } },
        workerData: { "1": { revenue: 5400, sessions: 118, isOwner: true }, "2": { revenue: 4100, sessions: 92, isOwner: false }, "3": { revenue: 3400, sessions: 76, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-04",
        revenue: 13800, totalSessions: 310, avgTicket: 44.52, newPatients: 20, nps: 7.7,
        totalPatients12m: 352, singleVisitPat12m: 127, churnPct: 36.1, recurrenceRate: 3.0,
        occupancy: 58, grossMargin: 15, ownerHours: 37, patientsActive: 352, isBaseline: false,
        serviceData: { "1": { revenue: 9500, sessions: 210, uniquePatients12m: 262 }, "2": { revenue: 2640, sessions: 48, uniquePatients12m: 78 }, "3": { revenue: 1660, sessions: 111, uniquePatients12m: 90 } },
        workerData: { "1": { revenue: 5350, sessions: 116, isOwner: true }, "2": { revenue: 4050, sessions: 91, isOwner: false }, "3": { revenue: 3350, sessions: 75, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-05",
        revenue: 14500, totalSessions: 325, avgTicket: 44.62, newPatients: 23, nps: 7.9,
        totalPatients12m: 358, singleVisitPat12m: 125, churnPct: 34.9, recurrenceRate: 3.1,
        occupancy: 61, grossMargin: 16, ownerHours: 36, patientsActive: 358, isBaseline: false,
        serviceData: { "1": { revenue: 10000, sessions: 222, uniquePatients12m: 268 }, "2": { revenue: 2750, sessions: 50, uniquePatients12m: 80 }, "3": { revenue: 1750, sessions: 117, uniquePatients12m: 91 } },
        workerData: { "1": { revenue: 5500, sessions: 120, isOwner: true }, "2": { revenue: 4300, sessions: 96, isOwner: false }, "3": { revenue: 3600, sessions: 80, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-06",
        revenue: 13000, totalSessions: 292, avgTicket: 44.52, newPatients: 16, nps: 7.6,
        totalPatients12m: 355, singleVisitPat12m: 128, churnPct: 36.1, recurrenceRate: 3.0,
        occupancy: 55, grossMargin: 14, ownerHours: 36, patientsActive: 355, isBaseline: false,
        serviceData: { "1": { revenue: 8900, sessions: 198, uniquePatients12m: 264 }, "2": { revenue: 2500, sessions: 45, uniquePatients12m: 79 }, "3": { revenue: 1600, sessions: 107, uniquePatients12m: 90 } },
        workerData: { "1": { revenue: 5100, sessions: 112, isOwner: true }, "2": { revenue: 3800, sessions: 85, isOwner: false }, "3": { revenue: 3200, sessions: 72, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-07",
        revenue: 8200, totalSessions: 185, avgTicket: 44.32, newPatients: 8, nps: 7.8,
        totalPatients12m: 348, singleVisitPat12m: 132, churnPct: 37.9, recurrenceRate: 2.8,
        occupancy: 35, grossMargin: 5, ownerHours: 20, patientsActive: 348, isBaseline: false,
        serviceData: { "1": { revenue: 5600, sessions: 125, uniquePatients12m: 258 }, "2": { revenue: 1550, sessions: 28, uniquePatients12m: 76 }, "3": { revenue: 1050, sessions: 70, uniquePatients12m: 85 } },
        workerData: { "1": { revenue: 3200, sessions: 70, isOwner: true }, "2": { revenue: 2400, sessions: 54, isOwner: false }, "3": { revenue: 2000, sessions: 45, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-08",
        revenue: 14200, totalSessions: 320, avgTicket: 44.38, newPatients: 22, nps: 8.0,
        totalPatients12m: 360, singleVisitPat12m: 130, churnPct: 36.1, recurrenceRate: 3.1,
        occupancy: 60, grossMargin: 16, ownerHours: 36, patientsActive: 360, isBaseline: false,
        serviceData: { "1": { revenue: 9800, sessions: 218, uniquePatients12m: 268 }, "2": { revenue: 2700, sessions: 49, uniquePatients12m: 80 }, "3": { revenue: 1700, sessions: 113, uniquePatients12m: 91 } },
        workerData: { "1": { revenue: 5400, sessions: 118, isOwner: true }, "2": { revenue: 4200, sessions: 94, isOwner: false }, "3": { revenue: 3500, sessions: 78, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-09",
        revenue: 14800, totalSessions: 332, avgTicket: 44.58, newPatients: 24, nps: 8.0,
        totalPatients12m: 365, singleVisitPat12m: 128, churnPct: 35.1, recurrenceRate: 3.1,
        occupancy: 62, grossMargin: 17, ownerHours: 36, patientsActive: 365, isBaseline: false,
        serviceData: { "1": { revenue: 10200, sessions: 227, uniquePatients12m: 272 }, "2": { revenue: 2800, sessions: 51, uniquePatients12m: 81 }, "3": { revenue: 1800, sessions: 120, uniquePatients12m: 92 } },
        workerData: { "1": { revenue: 5500, sessions: 120, isOwner: true }, "2": { revenue: 4400, sessions: 98, isOwner: false }, "3": { revenue: 3700, sessions: 82, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-10",
        revenue: 15200, totalSessions: 342, avgTicket: 44.44, newPatients: 26, nps: 8.1,
        totalPatients12m: 370, singleVisitPat12m: 126, churnPct: 34.1, recurrenceRate: 3.2,
        occupancy: 64, grossMargin: 18, ownerHours: 35, patientsActive: 370, isBaseline: false,
        serviceData: { "1": { revenue: 10500, sessions: 233, uniquePatients12m: 275 }, "2": { revenue: 2850, sessions: 52, uniquePatients12m: 83 }, "3": { revenue: 1850, sessions: 123, uniquePatients12m: 93 } },
        workerData: { "1": { revenue: 5500, sessions: 120, isOwner: true }, "2": { revenue: 4600, sessions: 102, isOwner: false }, "3": { revenue: 3900, sessions: 87, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-11",
        revenue: 14600, totalSessions: 328, avgTicket: 44.51, newPatients: 22, nps: 8.0,
        totalPatients12m: 375, singleVisitPat12m: 131, churnPct: 34.9, recurrenceRate: 3.1,
        occupancy: 61, grossMargin: 17, ownerHours: 36, patientsActive: 375, isBaseline: false,
        serviceData: { "1": { revenue: 10000, sessions: 222, uniquePatients12m: 278 }, "2": { revenue: 2800, sessions: 51, uniquePatients12m: 84 }, "3": { revenue: 1800, sessions: 120, uniquePatients12m: 93 } },
        workerData: { "1": { revenue: 5400, sessions: 118, isOwner: true }, "2": { revenue: 4400, sessions: 98, isOwner: false }, "3": { revenue: 3700, sessions: 82, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2025-12",
        revenue: 14400, totalSessions: 324, avgTicket: 44.44, newPatients: 20, nps: 8.1,
        totalPatients12m: 378, singleVisitPat12m: 132, churnPct: 34.9, recurrenceRate: 3.1,
        occupancy: 61, grossMargin: 17, ownerHours: 36, patientsActive: 378, isBaseline: true,
        serviceData: { "1": { revenue: 9900, sessions: 220, uniquePatients12m: 278 }, "2": { revenue: 2750, sessions: 50, uniquePatients12m: 84 }, "3": { revenue: 1750, sessions: 117, uniquePatients12m: 93 } },
        workerData: { "1": { revenue: 5400, sessions: 118, isOwner: true }, "2": { revenue: 4300, sessions: 96, isOwner: false }, "3": { revenue: 3600, sessions: 80, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      // ════════════════════ 2026 ════════════════════
      {
        monthYear: "2026-01",
        revenue: 14200, totalSessions: 320, avgTicket: 44.38, newPatients: 22, nps: 8.0,
        totalPatients12m: 380, singleVisitPat12m: 133, churnPct: 35.0, recurrenceRate: 3.2,
        occupancy: 62, grossMargin: 18, ownerHours: 35, patientsActive: 380, isBaseline: false,
        serviceData: { "1": { revenue: 9800, sessions: 218, uniquePatients12m: 280 }, "2": { revenue: 2750, sessions: 50, uniquePatients12m: 85 }, "3": { revenue: 1650, sessions: 110, uniquePatients12m: 95 } },
        workerData: { "1": { revenue: 5500, sessions: 120, isOwner: true }, "2": { revenue: 4200, sessions: 95, isOwner: false }, "3": { revenue: 3500, sessions: 80, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2026-02",
        revenue: 15100, totalSessions: 340, avgTicket: 44.41, newPatients: 25, nps: 8.2,
        totalPatients12m: 385, singleVisitPat12m: 131, churnPct: 34.0, recurrenceRate: 3.4,
        occupancy: 64, grossMargin: 20, ownerHours: 33, patientsActive: 385, isBaseline: false,
        serviceData: { "1": { revenue: 10200, sessions: 227, uniquePatients12m: 283 }, "2": { revenue: 3025, sessions: 55, uniquePatients12m: 87 }, "3": { revenue: 1875, sessions: 125, uniquePatients12m: 97 } },
        workerData: { "1": { revenue: 5800, sessions: 125, isOwner: true }, "2": { revenue: 4500, sessions: 100, isOwner: false }, "3": { revenue: 3800, sessions: 85, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2026-03",
        revenue: 15800, totalSessions: 350, avgTicket: 45.14, newPatients: 28, nps: 8.4,
        totalPatients12m: 390, singleVisitPat12m: 128, churnPct: 32.8, recurrenceRate: 3.5,
        occupancy: 66, grossMargin: 22, ownerHours: 30, patientsActive: 390, isBaseline: false,
        serviceData: { "1": { revenue: 10800, sessions: 240, uniquePatients12m: 288 }, "2": { revenue: 3080, sessions: 56, uniquePatients12m: 88 }, "3": { revenue: 1920, sessions: 128, uniquePatients12m: 98 } },
        workerData: { "1": { revenue: 5600, sessions: 118, isOwner: true }, "2": { revenue: 4800, sessions: 108, isOwner: false }, "3": { revenue: 4200, sessions: 94, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
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
      message: "Migraciones aplicadas y 15 meses de KPIs creados (ene 2025 — mar 2026)",
      migrations: ["006_kpi_snapshot_v2", "007_kpi_snapshot_v3", "recurrence_rate + churn_pct"],
      snapshots: results,
      dashboard: "El cuadro de mandos de Elsa Demo ahora mostrará 15 meses de datos completos",
    });
  } catch (error) {
    console.error("POST /api/admin/fix-demo-kpis error:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
