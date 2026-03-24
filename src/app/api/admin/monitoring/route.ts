import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // ── Fetch all data in parallel ──────────────────────────────────
    const [
      sessions,
      alerts,
      totalAlumnos,
      enrollments,
    ] = await Promise.all([
      // All conversation sessions with enrollment + user data
      prisma.conversationSession.findMany({
        orderBy: { startedAt: "desc" },
        include: {
          enrollment: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              cohort: { select: { id: true, name: true, program: true } },
            },
          },
        },
      }),
      // All alerts with enrollment + user data
      prisma.alert.findMany({
        orderBy: { triggeredAt: "desc" },
        include: {
          enrollment: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              cohort: { select: { id: true, name: true, program: true } },
            },
          },
        },
      }),
      // Total students
      prisma.user.count({ where: { role: "ALUMNO" } }),
      // All enrollments with last activity
      prisma.enrollment.findMany({
        where: { status: "ACTIVE" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          cohort: { select: { id: true, name: true, program: true } },
          stepProgress: {
            orderBy: { stepNumber: "asc" },
          },
          conversationSessions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { startedAt: true },
          },
        },
      }),
    ]);

    // ── Aggregate global stats ──────────────────────────────────────
    const totalSessions = sessions.length;
    const totalTokens = sessions.reduce((sum, s) => sum + s.tokensUsed, 0);
    const totalCost = sessions.reduce((sum, s) => sum + s.costEstimate, 0);
    const activeAlerts = alerts.filter((a) => !a.resolvedAt).length;

    // ── Usage by day (last 30 days) ─────────────────────────────────
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(
      (s) => new Date(s.startedAt) >= thirtyDaysAgo
    );

    const usageByDay: Record<string, { sessions: number; tokens: number; cost: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      usageByDay[key] = { sessions: 0, tokens: 0, cost: 0 };
    }
    for (const s of recentSessions) {
      const key = new Date(s.startedAt).toISOString().slice(0, 10);
      if (usageByDay[key]) {
        usageByDay[key].sessions += 1;
        usageByDay[key].tokens += s.tokensUsed;
        usageByDay[key].cost += s.costEstimate;
      }
    }

    const dailyUsage = Object.entries(usageByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Usage by mode ───────────────────────────────────────────────
    const byMode: Record<string, { sessions: number; tokens: number; cost: number }> = {};
    for (const s of sessions) {
      if (!byMode[s.mode]) byMode[s.mode] = { sessions: 0, tokens: 0, cost: 0 };
      byMode[s.mode].sessions += 1;
      byMode[s.mode].tokens += s.tokensUsed;
      byMode[s.mode].cost += s.costEstimate;
    }

    // ── Usage by step ───────────────────────────────────────────────
    const byStep: Record<number, { sessions: number; tokens: number; cost: number }> = {};
    for (const s of sessions) {
      if (!byStep[s.stepNumber]) byStep[s.stepNumber] = { sessions: 0, tokens: 0, cost: 0 };
      byStep[s.stepNumber].sessions += 1;
      byStep[s.stepNumber].tokens += s.tokensUsed;
      byStep[s.stepNumber].cost += s.costEstimate;
    }

    // ── Top users by tokens/cost ────────────────────────────────────
    const byUser: Record<string, { id: string; name: string; sessions: number; tokens: number; cost: number; cohort: string }> = {};
    for (const s of sessions) {
      const uid = s.enrollment.user.id;
      if (!byUser[uid]) {
        byUser[uid] = {
          id: uid,
          name: `${s.enrollment.user.firstName} ${s.enrollment.user.lastName}`,
          sessions: 0,
          tokens: 0,
          cost: 0,
          cohort: s.enrollment.cohort?.name ?? "—",
        };
      }
      byUser[uid].sessions += 1;
      byUser[uid].tokens += s.tokensUsed;
      byUser[uid].cost += s.costEstimate;
    }

    const topUsers = Object.values(byUser)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // ── Usage by cohort ─────────────────────────────────────────────
    const byCohort: Record<string, { name: string; program: string; sessions: number; tokens: number; cost: number }> = {};
    for (const s of sessions) {
      const cid = s.enrollment.cohort?.id ?? "none";
      if (!byCohort[cid]) {
        byCohort[cid] = {
          name: s.enrollment.cohort?.name ?? "Sin cohorte",
          program: s.enrollment.cohort?.program ?? "—",
          sessions: 0,
          tokens: 0,
          cost: 0,
        };
      }
      byCohort[cid].sessions += 1;
      byCohort[cid].tokens += s.tokensUsed;
      byCohort[cid].cost += s.costEstimate;
    }

    // ── Student activity / inactivity ───────────────────────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const studentActivity = enrollments.map((e) => {
      const lastSession = e.conversationSessions[0]?.startedAt ?? null;
      const currentStep = e.stepProgress.find(
        (sp) => sp.status === "IN_PROGRESS" || sp.status === "AVAILABLE"
      )?.stepNumber ?? 0;
      const completedSteps = e.stepProgress.filter(
        (sp) => sp.status === "COMPLETED"
      ).length;

      let activityStatus: "active" | "warning" | "inactive" = "active";
      if (!lastSession || new Date(lastSession) < fourteenDaysAgo) {
        activityStatus = "inactive";
      } else if (new Date(lastSession) < sevenDaysAgo) {
        activityStatus = "warning";
      }

      return {
        userId: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName}`,
        cohort: e.cohort?.name ?? "—",
        program: e.cohort?.program ?? "—",
        currentStep,
        completedSteps,
        lastSession,
        activityStatus,
      };
    });

    // ── Recent sessions (last 20) ───────────────────────────────────
    const recentSessionsList = sessions.slice(0, 20).map((s) => ({
      id: s.id,
      user: `${s.enrollment.user.firstName} ${s.enrollment.user.lastName}`,
      cohort: s.enrollment.cohort?.name ?? "—",
      mode: s.mode,
      stepNumber: s.stepNumber,
      tokensUsed: s.tokensUsed,
      costEstimate: s.costEstimate,
      startedAt: s.startedAt,
    }));

    // ── Alerts formatted ────────────────────────────────────────────
    const formattedAlerts = alerts.slice(0, 30).map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      user: `${a.enrollment.user.firstName} ${a.enrollment.user.lastName}`,
      cohort: a.enrollment.cohort?.name ?? "—",
      triggeredAt: a.triggeredAt,
      resolvedAt: a.resolvedAt,
    }));

    // ── Monthly cost trend ──────────────────────────────────────────
    const monthlyCost: Record<string, { sessions: number; tokens: number; cost: number }> = {};
    for (const s of sessions) {
      const key = new Date(s.startedAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyCost[key]) monthlyCost[key] = { sessions: 0, tokens: 0, cost: 0 };
      monthlyCost[key].sessions += 1;
      monthlyCost[key].tokens += s.tokensUsed;
      monthlyCost[key].cost += s.costEstimate;
    }

    return NextResponse.json({
      global: {
        totalSessions,
        totalTokens,
        totalCost,
        totalAlumnos,
        activeAlerts,
        avgTokensPerSession: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
        avgCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0,
      },
      dailyUsage,
      byMode: Object.entries(byMode).map(([mode, data]) => ({ mode, ...data })),
      byStep: Object.entries(byStep)
        .map(([step, data]) => ({ step: parseInt(step), ...data }))
        .sort((a, b) => a.step - b.step),
      byCohort: Object.values(byCohort),
      topUsers,
      studentActivity,
      recentSessions: recentSessionsList,
      alerts: formattedAlerts,
      monthlyCost: Object.entries(monthlyCost)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (error) {
    console.error("Monitoring API error:", error);
    return NextResponse.json(
      { error: "Error al cargar datos de monitoring" },
      { status: 500 }
    );
  }
}
