import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { StepStatus } from "@prisma/client";

/**
 * POST /api/admin/seed-demo
 *
 * Creates a demo student "Elsa Demo" with:
 *  - Supabase auth user (email + password)
 *  - Prisma User (ALUMNO)
 *  - Clinic record
 *  - Enrollment (ACTIVE) in first available ACTIVA cohort
 *  - StepProgress for all steps (0-2 completed, 3 available)
 *  - DiagnosticData for Paso 0, 1 and 2
 *  - Consents accepted
 *
 * Protected by SEED_SECRET header to prevent abuse.
 * DELETE THIS ENDPOINT AFTER USE.
 */

const DEMO_EMAIL = "elsa.demo@fisioreferentes.com";
const DEMO_PASSWORD = "FisioDemo2026!";
const DEMO_FIRST = "Elsa";
const DEMO_LAST = "Demo";
const DEMO_CLINIC = "Clínica FisioDemo Madrid";

export async function POST(req: NextRequest) {
  try {
    // ── Auth check: must be a logged-in SUPERADMIN ──
    // Simple secret check so we can call from outside too
    const secret = req.headers.get("x-seed-secret");
    if (secret !== "fisioreferentes-seed-2026") {
      // Also allow if called by a superadmin via cookie auth
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const currentUser = await prisma.user.findUnique({
        where: { supabaseAuthId: authUser.id },
      });
      if (!currentUser || currentUser.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Solo superadmins" }, { status: 403 });
      }
    }

    // ── Check if user already exists ──
    const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (existing) {
      return NextResponse.json({
        message: "Usuario demo ya existe",
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        userId: existing.id,
      });
    }

    // ── Find an ACTIVA cohort ──
    let cohort = await prisma.cohort.findFirst({
      where: { program: "ACTIVA", status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    });

    // If no active cohort, create one
    if (!cohort) {
      cohort = await prisma.cohort.create({
        data: {
          program: "ACTIVA",
          name: "ACTIVA-Demo-2026",
          description: "Cohorte de demostración",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-07-15"),
          status: "ACTIVE",
          maxStudents: 20,
          price: 2997,
        },
      });
    }

    // ── Create Supabase auth user ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Error al crear usuario en Supabase", details: authError?.message },
        { status: 400 }
      );
    }

    // ── Create User ──
    const user = await prisma.user.create({
      data: {
        supabaseAuthId: authData.user.id,
        email: DEMO_EMAIL,
        firstName: DEMO_FIRST,
        lastName: DEMO_LAST,
        phone: "+34600000000",
        role: "ALUMNO",
        city: "Madrid",
        province: "Madrid",
        country: "España",
        specialty: "Fisioterapia deportiva",
        motivation: "Quiero convertir mi clínica en un negocio rentable",
        onboardingDone: true,
      },
    });

    // ── Create Clinic ──
    const clinic = await prisma.clinic.create({
      data: {
        userId: user.id,
        name: DEMO_CLINIC,
        address: "Calle Gran Vía 42, Madrid",
        phone: "+34600000000",
        email: DEMO_EMAIL,
        model: "MIXTO",
        teamCount: 4,
        services: [
          { name: "Fisioterapia", ticket: 45 },
          { name: "Osteopatía", ticket: 55 },
          { name: "Pilates", ticket: 15 },
        ],
        channels: ["Instagram", "Google", "Boca a boca"],
      },
    });

    // ── Create Enrollment ──
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        cohortId: cohort.id,
        status: "ACTIVE",
        subscriptionType: "NORMAL",
      },
    });

    // ── Create StepProgress: 0-2 completed, 3 available, rest locked ──
    const steps = [];
    for (let i = 0; i <= 15; i++) {
      let status: StepStatus = "LOCKED";
      if (i <= 2) status = "COMPLETED";
      else if (i === 3) status = "AVAILABLE";

      steps.push({
        enrollmentId: enrollment.id,
        stepNumber: i,
        status,
        saber: i <= 2,
        decidir: i <= 2,
        hacer: i <= 2,
        startedAt: i <= 2 ? new Date("2026-02-01") : null,
        completedAt: i <= 2 ? new Date("2026-03-15") : null,
      });
    }
    await prisma.stepProgress.createMany({ data: steps });

    // ── Create Consents ──
    await prisma.userConsent.createMany({
      data: [
        { userId: user.id, purpose: "terms", granted: true, version: "1.0" },
        { userId: user.id, purpose: "privacy", granted: true, version: "1.0" },
        { userId: user.id, purpose: "ai_processing", granted: true, version: "1.0" },
      ],
    });

    // ══════════════════════════════════════════════
    //  PASO 0 — Mentalidad: de Fisio a Empresario
    // ══════════════════════════════════════════════
    const paso0Data = {
      ejercicio1: {
        situacionActual:
          "Llevo 6 años con la clínica. Facturo unos 180.000€ al año pero trabajo 50 horas semanales. Tengo 3 fisios contratados y una recepcionista a media jornada. Me siento atrapado tratando pacientes todo el día sin tiempo para gestionar.",
        horasSemanaClinica: 50,
        horasSemanaTratando: 35,
        horasSemanaGestion: 10,
        porQueAbriste:
          "Quería tener mi propio proyecto y ayudar a mis pacientes con un enfoque integral. También quería libertad financiera y de tiempo.",
        queTeFrustra:
          "No tengo tiempo para pensar estratégicamente. Los fisios que contrato no rinden como yo. Los pacientes solo quieren venir conmigo. La facturación no sube aunque trabajo más horas.",
        queTeGustaria:
          "Trabajar 25 horas a la semana, cobrar un sueldo de 4.000€/mes, tener un equipo que funcione sin mí y poder irme de vacaciones sin que caiga todo.",
        miedos: [
          "Si dejo de tratar, perderé pacientes",
          "Mi equipo no está preparado para llevar la clínica",
          "Si subo precios, la gente se irá",
          "No sé gestionar ni liderar",
        ],
        excusas: [
          "No tengo tiempo para formarme",
          "En mi zona no se puede cobrar más",
          "Es que mis fisios son buenos pero no venden",
          "Ya lo intenté y no funcionó",
        ],
        creenciasLimitantes: [
          "Un buen fisio tiene que tratar a sus pacientes personalmente",
          "Subir precios es ser avaricioso",
          "Si delego, la calidad bajará",
        ],
        nivelSatisfaccion: 4,
        nivelEstres: 8,
        nivelControl: 3,
        identidad: "hibrido",
      },
      ejercicio2: {
        compromiso:
          "Me comprometo a dedicar al menos 5 horas semanales a trabajar EN mi clínica, no en ella. Voy a empezar a delegar tratamientos y a formarme como empresario. En 6 meses quiero trabajar máximo 30 horas a la semana.",
        queEstoyDispuestoACambiar:
          "Mi agenda: voy a bloquear tiempo para gestión. Mi mentalidad: no soy imprescindible en cabina. Mi equipo: voy a invertir en formarles.",
        queDejoDeHacer:
          "Dejo de atender a todos los pacientes nuevos personalmente. Dejo de resolver todos los problemas operativos yo mismo. Dejo de pensar que nadie puede hacerlo como yo.",
        comoMedireMiProgreso:
          "Cada mes revisaré: horas en cabina (objetivo: -5h/mes), facturación del equipo vs mía, y satisfacción personal del 1 al 10.",
        firma: "Elsa Demo",
        fecha: "2026-02-10",
      },
    };

    await prisma.diagnosticData.create({
      data: {
        userId: user.id,
        year: 0, // Paso 0 sentinel
        data: paso0Data,
      },
    });

    // ══════════════════════════════════════════════
    //  PASO 1 + 2 — Diagnóstico 360° completo
    //  (ejercicio1 = Radiografía, ejercicio2 = Capacidad, sistema = Objetivo)
    // ══════════════════════════════════════════════
    const diagData = {
      ejercicio1: {
        aFac: [14200, 13800, 15100, 14600, 15800, 13200, 8500, 14900, 15500, 16200, 15000, 14800],
        aSes: [320, 310, 340, 330, 350, 300, 190, 335, 345, 360, 340, 330],
        aNew: [22, 18, 25, 20, 28, 15, 8, 24, 26, 30, 23, 21],
        gPac: 380,
        gChurn: 35,
        gNps: 8.2,
        srvs: [
          {
            sid: 1,
            name: "Fisioterapia",
            mins: 45,
            precio: 45,
            facM: [9800, 9500, 10200, 9900, 10800, 9000, 5800, 10100, 10500, 11000, 10200, 10000],
            sesM: [218, 211, 227, 220, 240, 200, 129, 224, 233, 244, 227, 222],
            pac: 280,
          },
          {
            sid: 2,
            name: "Osteopatía",
            mins: 60,
            precio: 55,
            facM: [2750, 2640, 3025, 2860, 3080, 2530, 1650, 2970, 3080, 3190, 2860, 2750],
            sesM: [50, 48, 55, 52, 56, 46, 30, 54, 56, 58, 52, 50],
            pac: 85,
          },
          {
            sid: 3,
            name: "Pilates",
            mins: 55,
            precio: 15,
            facM: [1650, 1660, 1875, 1840, 1920, 1670, 1050, 1830, 1915, 2010, 1940, 2050],
            sesM: [110, 111, 125, 123, 128, 111, 70, 122, 128, 134, 129, 137],
            pac: 95,
          },
        ],
        wrks: [
          {
            wid: 1,
            name: "Elsa Demo (propietaria)",
            tipo: "FISIO",
            hconv: 35,
            pct: 100,
            srvIds: [1, 2],
            vacM: [0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
          },
          {
            wid: 2,
            name: "Carlos Ruiz",
            tipo: "FISIO",
            hconv: 38,
            pct: 0,
            srvIds: [1],
            vacM: [0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2],
          },
          {
            wid: 3,
            name: "Laura Martín",
            tipo: "FISIO",
            hconv: 30,
            pct: 0,
            srvIds: [1, 3],
            vacM: [0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0],
          },
          {
            wid: 4,
            name: "Ana López",
            tipo: "ADMIN",
            hconv: 20,
            pct: 0,
            srvIds: [],
            vacM: [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2],
          },
        ],
        gastos: [
          { id: 1, concepto: "Material fungible clínico", partida: "APROV_FUNGIBLES", valor: 3600 },
          { id: 2, concepto: "Material de oficina", partida: "APROV_OFICINA", valor: 600 },
          { id: 3, concepto: "Alquiler local", partida: "INFRA_ALQUILER", valor: 18000 },
          { id: 4, concepto: "Comunidad de propietarios", partida: "INFRA_COMUNIDAD", valor: 1200 },
          { id: 5, concepto: "Reparaciones y mantenimiento", partida: "INFRA_REPARACIONES", valor: 2400 },
          { id: 6, concepto: "Servicios bancarios", partida: "INFRA_BANCO", valor: 480 },
          { id: 7, concepto: "Suministros (luz, agua, gas)", partida: "INFRA_SUMINISTROS", valor: 4800 },
          { id: 8, concepto: "Seguros", partida: "INFRA_SEGUROS", valor: 2400 },
          { id: 9, concepto: "Telecomunicaciones", partida: "INFRA_TELECOM", valor: 1200 },
          { id: 10, concepto: "Hosting y dominios", partida: "INFRA_HOSTING", valor: 360 },
          { id: 11, concepto: "Software (gestión, CRM)", partida: "INFRA_SOFTWARE", valor: 1800 },
          { id: 12, concepto: "Sueldos personal clínico", partida: "PERS_CLIN_SUELDOS", valor: 62400 },
          { id: 13, concepto: "Seguridad social clínico", partida: "PERS_CLIN_SS", valor: 18720 },
          { id: 14, concepto: "Coste propietario clínico", partida: "PERS_CLIN_PROP", valor: 36000 },
          { id: 15, concepto: "Sueldo recepcionista", partida: "PERS_GEST_SUELDOS", valor: 12000 },
          { id: 16, concepto: "SS gestión", partida: "PERS_GEST_SS", valor: 3600 },
          { id: 17, concepto: "Asesoría externa", partida: "PERS_GEST_EXTERNO", valor: 3000 },
          { id: 18, concepto: "Marketing y publicidad", partida: "MKT", valor: 6000 },
          { id: 19, concepto: "Otros gastos", partida: "OTROS", valor: 2400 },
        ],
        dIngSrv: 171600,
        dIngOtros: 9000,
        costAlloc: {
          APROV: { 1: 60, 2: 25, 3: 15 },
          INFRA: { 1: 50, 2: 20, 3: 30 },
          PERS_CLIN: { 1: 55, 2: 25, 3: 20 },
          PERS_GEST: { 1: 40, 2: 30, 3: 30 },
          MKT: { 1: 50, 2: 30, 3: 20 },
          OTROS: { 1: 34, 2: 33, 3: 33 },
        },
      },
      ejercicio2: {
        diasSem: 5,
        semanasAno: 46,
        salas: [
          { id: 1, nombre: "Sala 1 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 50 },
          { id: 2, nombre: "Sala 2 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 50 },
          { id: 3, nombre: "Sala 3 — Osteopatía", servNombre: "Osteopatía", sesHora: 1, horasDia: 6, ticket: 60 },
          { id: 4, nombre: "Sala Pilates", servNombre: "Pilates", sesHora: 1, horasDia: 6, ticket: 18 },
        ],
      },
      sistema: {
        sueldo: 4000,
        margen: 25,
        facAnoAnterior: 171600,
        objFac: 220000,
        palancas: ["captacion", "recurrencia", "precio"],
        palancaDetalles: {
          captacion: {
            enfoque:
              "Aumentar pacientes nuevos de 22/mes a 30/mes. Invertir más en Google Ads local y programa de referidos con descuento en segunda sesión.",
            pacientesNuevos: 30,
          },
          recurrencia: {
            enfoque:
              "Implementar bonos de 10 sesiones con descuento del 10%. Plan de seguimiento post-alta con revisión trimestral gratuita.",
            sesionesExtra: 40,
          },
          precio: {
            enfoque:
              "Subir ticket de fisioterapia a 50€ y osteopatía a 60€. Pilates de 15€ a 18€. Comunicar valor añadido con sesiones de valoración inicial de 75 minutos.",
            ticketObjetivo: 52,
          },
        },
        forecast: [17500, 17000, 18500, 18000, 19200, 16500, 11000, 18200, 19000, 20000, 18800, 18300],
        forecastSesiones: [365, 355, 385, 375, 400, 345, 230, 380, 395, 415, 390, 380],
      },
    };

    await prisma.diagnosticData.create({
      data: {
        userId: user.id,
        year: 2026,
        data: diagData,
      },
    });

    // ══════════════════════════════════════════════
    //  KPI Snapshots (3 months of history)
    // ══════════════════════════════════════════════
    const kpiMonths = [
      {
        monthYear: "2026-01",
        revenue: 14200,
        totalSessions: 320,
        avgTicket: 44.4,
        newPatients: 22,
        nps: 8.0,
        totalPatients12m: 380,
        singleVisitPat12m: 133,
        churnPct: 35,
        occupancy: 62,
        grossMargin: 18,
        ownerHours: 35,
        serviceData: { "1": { revenue: 9800, sessions: 218, uniquePatients12m: 280 }, "2": { revenue: 2750, sessions: 50, uniquePatients12m: 85 }, "3": { revenue: 1650, sessions: 110, uniquePatients12m: 95 } },
        workerData: { "1": { revenue: 5500, sessions: 120, isOwner: true }, "2": { revenue: 4200, sessions: 95, isOwner: false }, "3": { revenue: 3500, sessions: 80, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2026-02",
        revenue: 15100,
        totalSessions: 340,
        avgTicket: 44.4,
        newPatients: 25,
        nps: 8.2,
        totalPatients12m: 385,
        singleVisitPat12m: 131,
        churnPct: 34,
        occupancy: 64,
        grossMargin: 20,
        ownerHours: 33,
        serviceData: { "1": { revenue: 10200, sessions: 227, uniquePatients12m: 283 }, "2": { revenue: 3025, sessions: 55, uniquePatients12m: 87 }, "3": { revenue: 1875, sessions: 125, uniquePatients12m: 97 } },
        workerData: { "1": { revenue: 5800, sessions: 125, isOwner: true }, "2": { revenue: 4500, sessions: 100, isOwner: false }, "3": { revenue: 3800, sessions: 85, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
      {
        monthYear: "2026-03",
        revenue: 15800,
        totalSessions: 350,
        avgTicket: 45.1,
        newPatients: 28,
        nps: 8.4,
        totalPatients12m: 390,
        singleVisitPat12m: 128,
        churnPct: 33,
        occupancy: 66,
        grossMargin: 22,
        ownerHours: 30,
        serviceData: { "1": { revenue: 10800, sessions: 240, uniquePatients12m: 288 }, "2": { revenue: 3080, sessions: 56, uniquePatients12m: 88 }, "3": { revenue: 1920, sessions: 128, uniquePatients12m: 98 } },
        workerData: { "1": { revenue: 5600, sessions: 118, isOwner: true }, "2": { revenue: 4800, sessions: 108, isOwner: false }, "3": { revenue: 4200, sessions: 94, isOwner: false }, "4": { revenue: 0, sessions: 0, isOwner: false } },
      },
    ];

    for (const kpi of kpiMonths) {
      await prisma.kpiSnapshot.create({
        data: {
          clinicId: clinic.id,
          monthYear: kpi.monthYear,
          serviceData: kpi.serviceData,
          workerData: kpi.workerData,
          newPatients: kpi.newPatients,
          nps: kpi.nps,
          totalPatients12m: kpi.totalPatients12m,
          singleVisitPat12m: kpi.singleVisitPat12m,
          revenue: kpi.revenue,
          totalSessions: kpi.totalSessions,
          avgTicket: kpi.avgTicket,
          churnPct: kpi.churnPct,
          occupancy: kpi.occupancy,
          grossMargin: kpi.grossMargin,
          ownerHours: kpi.ownerHours,
          isBaseline: kpi.monthYear === "2026-01",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Usuario demo creado con éxito",
      credentials: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
      user: {
        id: user.id,
        name: `${DEMO_FIRST} ${DEMO_LAST}`,
        clinic: DEMO_CLINIC,
      },
      enrollment: {
        id: enrollment.id,
        cohortId: cohort.id,
        cohortName: cohort.name,
      },
      data: {
        paso0: "Mentalidad completa (ejercicio1 + ejercicio2)",
        paso1: "Radiografía completa (3 servicios, 4 profesionales, 19 gastos, costAlloc)",
        paso2: "Capacidad instalada (4 salas)",
        sistema: "Objetivo + 3 palancas + forecast 12 meses",
        kpis: "3 meses de histórico (ene-mar 2026)",
      },
    });
  } catch (error) {
    console.error("POST /api/admin/seed-demo error:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
