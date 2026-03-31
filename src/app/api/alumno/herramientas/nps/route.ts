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

    // 4. Calculate NPS metrics
    const total = responses?.length ?? 0;
    const promoters = responses?.filter((r) => r.category === "promoter").length ?? 0;
    const passives = responses?.filter((r) => r.category === "passive").length ?? 0;
    const detractors = responses?.filter((r) => r.category === "detractor").length ?? 0;

    const npsScore =
      total > 0
        ? Math.round(((promoters - detractors) / total) * 100)
        : null;

    const avgScore =
      total > 0
        ? Number(
            (
              responses!.reduce((sum, r) => sum + r.score, 0) / total
            ).toFixed(1)
          )
        : null;

    // 5. Trend: compare last 30 days vs previous 30 days
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

    const recentNps =
      recentResponses.length > 0
        ? Math.round(
            ((recentResponses.filter((r) => r.category === "promoter").length -
              recentResponses.filter((r) => r.category === "detractor").length) /
              recentResponses.length) *
              100
          )
        : null;

    const previousNps =
      previousResponses.length > 0
        ? Math.round(
            ((previousResponses.filter((r) => r.category === "promoter").length -
              previousResponses.filter((r) => r.category === "detractor")
                .length) /
              previousResponses.length) *
              100
          )
        : null;

    let trend: "up" | "down" | "stable" | null = null;
    if (recentNps !== null && previousNps !== null) {
      if (recentNps > previousNps) trend = "up";
      else if (recentNps < previousNps) trend = "down";
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

    // 7. Per-staff NPS (top 5)
    const staffMap = new Map<
      string,
      { promoters: number; detractors: number; total: number }
    >();
    for (const r of responses ?? []) {
      if (r.staff_members) {
        for (const staff of r.staff_members) {
          const s = staffMap.get(staff) ?? {
            promoters: 0,
            detractors: 0,
            total: 0,
          };
          s.total++;
          if (r.category === "promoter") s.promoters++;
          if (r.category === "detractor") s.detractors++;
          staffMap.set(staff, s);
        }
      }
    }

    const staffNps = Array.from(staffMap.entries())
      .map(([name, s]) => ({
        name,
        nps: Math.round(((s.promoters - s.detractors) / s.total) * 100),
        total: s.total,
      }))
      .sort((a, b) => b.nps - a.nps)
      .slice(0, 5);

    return NextResponse.json({
      connected: true,
      clinic: {
        name: clinic.name,
        slug: clinic.slug,
        teamSize: clinic.team_members?.length ?? 0,
      },
      metrics: {
        npsScore,
        avgScore,
        total,
        promoters,
        passives,
        detractors,
        trend,
        recentNps,
        previousNps,
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
