import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { npsSupabase } from "@/lib/nps-supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // If NPS Supabase is not configured, return a "not connected" state
    if (!npsSupabase) {
      return NextResponse.json({
        connected: false,
        message: "NPS no configurado",
      });
    }

    // 1. Find the NPS clinic linked to this user by email
    //    First look up the auth user in the NPS Supabase by email
    const { data: authUsers, error: authError } =
      await npsSupabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching NPS auth users:", authError);
      return NextResponse.json({
        connected: false,
        message: "Error conectando con NPS",
      });
    }

    // Find NPS user matching the knaas user's email
    const npsAuthUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === user.email.toLowerCase()
    );

    if (!npsAuthUser) {
      return NextResponse.json({
        connected: false,
        message: "No tienes una cuenta NPS vinculada",
        npsUrl: "https://nps-fisioreferentes.vercel.app/registro",
      });
    }

    // 2. Find the clinic owned by this NPS user
    const { data: clinic, error: clinicError } = await npsSupabase
      .from("clinics")
      .select("id, name, slug, google_review_url, team_members")
      .eq("owner_id", npsAuthUser.id)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json({
        connected: false,
        message: "No se encontró tu clínica en NPS",
        npsUrl: "https://nps-fisioreferentes.vercel.app/registro",
      });
    }

    // 3. Fetch NPS responses for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: responses, error: respError } = await npsSupabase
      .from("nps_responses")
      .select("id, score, category, created_at, staff_members, feedback_text")
      .eq("clinic_id", clinic.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (respError) {
      console.error("Error fetching NPS responses:", respError);
      return NextResponse.json({
        connected: true,
        clinic: { name: clinic.name, slug: clinic.slug },
        metrics: null,
        error: "Error cargando respuestas",
      });
    }

    // 4. Calculate metrics — main metric is AVG(score) on 0-10 scale
    const total = responses?.length ?? 0;
    const promoters = responses?.filter((r) => r.category === "promoter").length ?? 0;
    const passives = responses?.filter((r) => r.category === "passive").length ?? 0;
    const detractors = responses?.filter((r) => r.category === "detractor").length ?? 0;

    const avgScore =
      total > 0
        ? Number(
            (
              responses!.reduce((sum, r) => sum + r.score, 0) / total
            ).toFixed(1)
          )
        : null;

    // 5. Trend: compare AVG last 30 days vs previous 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentResponses =
      responses?.filter((r) => new Date(r.created_at) >= thirtyDaysAgo) ?? [];
    const previousResponses =
      responses?.filter(
        (r) =>
          new Date(r.created_at) >= sixtyDaysAgo &&
          new Date(r.created_at) < thirtyDaysAgo
      ) ?? [];

    const recentAvg =
      recentResponses.length > 0
        ? Number(
            (recentResponses.reduce((sum, r) => sum + r.score, 0) / recentResponses.length).toFixed(1)
          )
        : null;

    const previousAvg =
      previousResponses.length > 0
        ? Number(
            (previousResponses.reduce((sum, r) => sum + r.score, 0) / previousResponses.length).toFixed(1)
          )
        : null;

    let trend: "up" | "down" | "stable" | null = null;
    if (recentAvg !== null && previousAvg !== null) {
      if (recentAvg > previousAvg) trend = "up";
      else if (recentAvg < previousAvg) trend = "down";
      else trend = "stable";
    }

    // 6. Last 5 responses for preview
    const latestResponses = (responses ?? []).slice(0, 5).map((r) => ({
      score: r.score,
      category: r.category,
      feedback: r.feedback_text,
      date: r.created_at,
      staff: r.staff_members,
    }));

    // 7. Per-staff avg score (top 5)
    const staffMap = new Map<
      string,
      { sumScores: number; total: number }
    >();
    for (const r of responses ?? []) {
      if (r.staff_members) {
        for (const staff of r.staff_members) {
          const s = staffMap.get(staff) ?? { sumScores: 0, total: 0 };
          s.total++;
          s.sumScores += r.score;
          staffMap.set(staff, s);
        }
      }
    }

    const staffNps = Array.from(staffMap.entries())
      .map(([name, s]) => ({
        name,
        avg: Number((s.sumScores / s.total).toFixed(1)),
        total: s.total,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);

    return NextResponse.json({
      connected: true,
      clinic: {
        name: clinic.name,
        slug: clinic.slug,
        teamSize: clinic.team_members?.length ?? 0,
      },
      metrics: {
        avgScore,
        total,
        promoters,
        passives,
        detractors,
        trend,
        recentAvg,
        previousAvg,
      },
      latestResponses,
      staffNps,
      npsAppUrl: `https://nps-fisioreferentes.vercel.app/panel`,
      surveyUrl: `https://nps-fisioreferentes.vercel.app/encuesta/${clinic.slug}`,
    });
  } catch (err) {
    console.error("NPS API error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
