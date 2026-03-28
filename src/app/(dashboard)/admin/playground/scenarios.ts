// ══════════════════════════════════════════════════════════════
// PLAYGROUND SCENARIOS — 3 realistic clinic archetypes
// ══════════════════════════════════════════════════════════════

export type PlaygroundService = {
  sid: number;
  name: string;
  mins: number;
  facM: number;   // monthly avg revenue
  sesM: number;   // monthly avg sessions
};

export type PlaygroundWorker = {
  wid: number;
  name: string;
  tipo: string;
  hconv: number;  // weekly contracted hours
  pct: number;    // utilization target %
  srvIds: number[];
  isOwner: boolean;
};

export type PlaygroundGasto = {
  id: number;
  concepto: string;
  partida: string;
  valor: number;   // monthly
};

export type PlaygroundKpi = {
  monthYear: string;
  serviceData: Record<string, { revenue: number; sessions: number; uniquePatients12m: number }>;
  workerData: Record<string, { revenue: number; sessions: number; isOwner: boolean }>;
  newPatients: number;
  totalPatients12m: number;
  singleVisitPat12m: number;
  nps: number;
  revenue: number;
  totalSessions: number;
  avgTicket: number;
  churnPct: number;
  occupancy: number;
  grossMargin: number;
  monthlyExpenses: Record<string, number>;
  useManualExpenses: boolean;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;        // tailwind bg color
  borderColor: string;
  textColor: string;
  services: PlaygroundService[];
  workers: PlaygroundWorker[];
  gastos: PlaygroundGasto[];
  costAlloc: Record<string, Record<number, number>>;
  kpiHistory: PlaygroundKpi[];  // last 6 months
};

// ─────────────────────────────────────────────────────────────
// SCENARIO 1: Clínica nueva que va bien
// Solo owner + 1 fisio, 2 servicios, creciendo rápido
// ─────────────────────────────────────────────────────────────

const scenario1Services: PlaygroundService[] = [
  { sid: 1, name: "Fisioterapia", mins: 50, facM: 4200, sesM: 84 },
  { sid: 2, name: "Pilates Máquina", mins: 55, facM: 1800, sesM: 45 },
];

const scenario1Workers: PlaygroundWorker[] = [
  { wid: 1, name: "Carlos (Owner)", tipo: "FISIO", hconv: 40, pct: 80, srvIds: [1, 2], isOwner: true },
  { wid: 2, name: "Laura", tipo: "FISIO", hconv: 30, pct: 75, srvIds: [1], isOwner: false },
];

const scenario1Gastos: PlaygroundGasto[] = [
  { id: 1, concepto: "Alquiler local", partida: "INFRA_01", valor: 850 },
  { id: 2, concepto: "Suministros", partida: "INFRA_02", valor: 180 },
  { id: 3, concepto: "Seguro RC", partida: "INFRA_03", valor: 85 },
  { id: 4, concepto: "Salario Laura", partida: "PERS_CLIN_01", valor: 1600 },
  { id: 5, concepto: "SS Laura", partida: "PERS_CLIN_02", valor: 520 },
  { id: 6, concepto: "Gestoría", partida: "PERS_GEST_01", valor: 150 },
  { id: 7, concepto: "Google Ads", partida: "MKT_01", valor: 300 },
  { id: 8, concepto: "Material fungible", partida: "APROV_01", valor: 120 },
  { id: 9, concepto: "Software gestión", partida: "OTROS_01", valor: 60 },
];

const scenario1CostAlloc: Record<string, Record<number, number>> = {
  APROV:     { 1: 70, 2: 30 },
  INFRA:     { 1: 60, 2: 40 },
  PERS_CLIN: { 1: 75, 2: 25 },
  PERS_GEST: { 1: 50, 2: 50 },
  MKT:       { 1: 60, 2: 40 },
  OTROS:     { 1: 50, 2: 50 },
};

function buildScenario1Kpis(): PlaygroundKpi[] {
  // Growing clinic — revenue increasing month over month
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const revGrowth = [0.85, 0.90, 0.95, 1.0, 1.05, 1.10];
  const baseRev = 6000;
  const totalGastos = 3865; // sum of gastos

  return months.map((m, i) => {
    const factor = revGrowth[i];
    const fisioRev = Math.round(4200 * factor);
    const pilatesRev = Math.round(1800 * factor);
    const fisioSes = Math.round(84 * factor);
    const pilatesSes = Math.round(45 * factor);
    const totalRev = fisioRev + pilatesRev;
    const totalSes = fisioSes + pilatesSes;

    return {
      monthYear: m,
      serviceData: {
        "1": { revenue: fisioRev, sessions: fisioSes, uniquePatients12m: Math.round(38 * factor) },
        "2": { revenue: pilatesRev, sessions: pilatesSes, uniquePatients12m: Math.round(22 * factor) },
      },
      workerData: {
        "1": { revenue: Math.round(totalRev * 0.55), sessions: Math.round(totalSes * 0.55), isOwner: true },
        "2": { revenue: Math.round(totalRev * 0.45), sessions: Math.round(totalSes * 0.45), isOwner: false },
      },
      newPatients: Math.round(12 + i * 2),
      totalPatients12m: Math.round(55 + i * 5),
      singleVisitPat12m: Math.round(8 + i),
      nps: 8.5 + (i * 0.1),
      revenue: totalRev,
      totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((8 + i) / (55 + i * 5)) * 10000) / 100,
      occupancy: Math.round(65 + i * 2.5),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 120, INFRA: 1115, PERS_CLIN: 2120, PERS_GEST: 150, MKT: 300, OTROS: 60 },
      useManualExpenses: false,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 2: Clínica con margen ajustado (2-3 fisios)
// Factura bien pero gasta mucho, margen fino
// ─────────────────────────────────────────────────────────────

const scenario2Services: PlaygroundService[] = [
  { sid: 1, name: "Fisioterapia", mins: 45, facM: 8500, sesM: 170 },
  { sid: 2, name: "Osteopatía", mins: 60, facM: 3200, sesM: 45 },
  { sid: 3, name: "Nutrición", mins: 40, facM: 1200, sesM: 30 },
];

const scenario2Workers: PlaygroundWorker[] = [
  { wid: 1, name: "Marta (Owner)", tipo: "FISIO", hconv: 40, pct: 85, srvIds: [1, 2], isOwner: true },
  { wid: 2, name: "Pablo", tipo: "FISIO", hconv: 38, pct: 80, srvIds: [1], isOwner: false },
  { wid: 3, name: "Andrea", tipo: "FISIO", hconv: 35, pct: 75, srvIds: [1, 2], isOwner: false },
  { wid: 4, name: "Lucía", tipo: "NUTRICIONISTA", hconv: 20, pct: 70, srvIds: [3], isOwner: false },
];

const scenario2Gastos: PlaygroundGasto[] = [
  { id: 1, concepto: "Alquiler local 120m²", partida: "INFRA_01", valor: 1800 },
  { id: 2, concepto: "Suministros", partida: "INFRA_02", valor: 320 },
  { id: 3, concepto: "Seguro RC", partida: "INFRA_03", valor: 150 },
  { id: 4, concepto: "Mantenimiento", partida: "INFRA_04", valor: 100 },
  { id: 5, concepto: "Salario Pablo", partida: "PERS_CLIN_01", valor: 1900 },
  { id: 6, concepto: "SS Pablo", partida: "PERS_CLIN_02", valor: 620 },
  { id: 7, concepto: "Salario Andrea", partida: "PERS_CLIN_03", valor: 1750 },
  { id: 8, concepto: "SS Andrea", partida: "PERS_CLIN_04", valor: 570 },
  { id: 9, concepto: "Salario Lucía (parcial)", partida: "PERS_CLIN_05", valor: 800 },
  { id: 10, concepto: "SS Lucía", partida: "PERS_CLIN_06", valor: 260 },
  { id: 11, concepto: "Recepcionista", partida: "PERS_GEST_01", valor: 1400 },
  { id: 12, concepto: "SS Recepcionista", partida: "PERS_GEST_02", valor: 455 },
  { id: 13, concepto: "Gestoría", partida: "PERS_GEST_03", valor: 200 },
  { id: 14, concepto: "Google Ads", partida: "MKT_01", valor: 500 },
  { id: 15, concepto: "Redes sociales", partida: "MKT_02", valor: 250 },
  { id: 16, concepto: "Material fungible", partida: "APROV_01", valor: 280 },
  { id: 17, concepto: "Software + CRM", partida: "OTROS_01", valor: 120 },
  { id: 18, concepto: "Formación equipo", partida: "OTROS_02", valor: 150 },
];

const scenario2CostAlloc: Record<string, Record<number, number>> = {
  APROV:     { 1: 60, 2: 25, 3: 15 },
  INFRA:     { 1: 55, 2: 25, 3: 20 },
  PERS_CLIN: { 1: 65, 2: 20, 3: 15 },
  PERS_GEST: { 1: 50, 2: 25, 3: 25 },
  MKT:       { 1: 50, 2: 30, 3: 20 },
  OTROS:     { 1: 40, 2: 30, 3: 30 },
};

function buildScenario2Kpis(): PlaygroundKpi[] {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  // Flat/slightly declining — tight margins
  const factors = [1.02, 1.0, 0.98, 0.97, 1.0, 1.01];
  const totalGastos = 11625; // sum of all gastos

  return months.map((m, i) => {
    const f = factors[i];
    const fisioRev = Math.round(8500 * f);
    const osteoRev = Math.round(3200 * f);
    const nutriRev = Math.round(1200 * f);
    const fisioSes = Math.round(170 * f);
    const osteoSes = Math.round(45 * f);
    const nutriSes = Math.round(30 * f);
    const totalRev = fisioRev + osteoRev + nutriRev;
    const totalSes = fisioSes + osteoSes + nutriSes;

    return {
      monthYear: m,
      serviceData: {
        "1": { revenue: fisioRev, sessions: fisioSes, uniquePatients12m: Math.round(95 * f) },
        "2": { revenue: osteoRev, sessions: osteoSes, uniquePatients12m: Math.round(30 * f) },
        "3": { revenue: nutriRev, sessions: nutriSes, uniquePatients12m: Math.round(18 * f) },
      },
      workerData: {
        "1": { revenue: Math.round(totalRev * 0.30), sessions: Math.round(totalSes * 0.30), isOwner: true },
        "2": { revenue: Math.round(totalRev * 0.28), sessions: Math.round(totalSes * 0.28), isOwner: false },
        "3": { revenue: Math.round(totalRev * 0.30), sessions: Math.round(totalSes * 0.30), isOwner: false },
        "4": { revenue: Math.round(totalRev * 0.12), sessions: Math.round(totalSes * 0.12), isOwner: false },
      },
      newPatients: Math.round(18 - i * 0.5),
      totalPatients12m: Math.round(140 + i),
      singleVisitPat12m: Math.round(28 + i * 2),
      nps: 7.2 + (i * 0.05),
      revenue: totalRev,
      totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((28 + i * 2) / (140 + i)) * 10000) / 100,
      occupancy: Math.round(72 + i),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 280, INFRA: 2370, PERS_CLIN: 5900, PERS_GEST: 2055, MKT: 750, OTROS: 270 },
      useManualExpenses: false,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 3: Clínica óptima — buena recurrencia, márgenes sanos
// 4 servicios, equipo sólido, todo bien engrasado
// ─────────────────────────────────────────────────────────────

const scenario3Services: PlaygroundService[] = [
  { sid: 1, name: "Fisioterapia", mins: 50, facM: 14000, sesM: 230 },
  { sid: 2, name: "Osteopatía", mins: 60, facM: 5500, sesM: 70 },
  { sid: 3, name: "Pilates Máquina", mins: 55, facM: 4500, sesM: 90 },
  { sid: 4, name: "Readaptación Deportiva", mins: 60, facM: 3500, sesM: 50 },
];

const scenario3Workers: PlaygroundWorker[] = [
  { wid: 1, name: "Javier (Owner)", tipo: "FISIO", hconv: 35, pct: 60, srvIds: [1, 4], isOwner: true },
  { wid: 2, name: "Sara", tipo: "FISIO", hconv: 38, pct: 85, srvIds: [1, 2], isOwner: false },
  { wid: 3, name: "Daniel", tipo: "FISIO", hconv: 38, pct: 85, srvIds: [1, 3], isOwner: false },
  { wid: 4, name: "Irene", tipo: "FISIO", hconv: 35, pct: 80, srvIds: [2, 4], isOwner: false },
  { wid: 5, name: "Marcos", tipo: "FISIO", hconv: 30, pct: 80, srvIds: [3], isOwner: false },
];

const scenario3Gastos: PlaygroundGasto[] = [
  { id: 1, concepto: "Alquiler 180m²", partida: "INFRA_01", valor: 2500 },
  { id: 2, concepto: "Suministros", partida: "INFRA_02", valor: 420 },
  { id: 3, concepto: "Seguro RC", partida: "INFRA_03", valor: 200 },
  { id: 4, concepto: "Mantenimiento", partida: "INFRA_04", valor: 150 },
  { id: 5, concepto: "Salario Sara", partida: "PERS_CLIN_01", valor: 2200 },
  { id: 6, concepto: "SS Sara", partida: "PERS_CLIN_02", valor: 715 },
  { id: 7, concepto: "Salario Daniel", partida: "PERS_CLIN_03", valor: 2200 },
  { id: 8, concepto: "SS Daniel", partida: "PERS_CLIN_04", valor: 715 },
  { id: 9, concepto: "Salario Irene", partida: "PERS_CLIN_05", valor: 2000 },
  { id: 10, concepto: "SS Irene", partida: "PERS_CLIN_06", valor: 650 },
  { id: 11, concepto: "Salario Marcos", partida: "PERS_CLIN_07", valor: 1500 },
  { id: 12, concepto: "SS Marcos", partida: "PERS_CLIN_08", valor: 488 },
  { id: 13, concepto: "Recepcionista", partida: "PERS_GEST_01", valor: 1500 },
  { id: 14, concepto: "SS Recepcionista", partida: "PERS_GEST_02", valor: 488 },
  { id: 15, concepto: "Gestoría", partida: "PERS_GEST_03", valor: 250 },
  { id: 16, concepto: "Google Ads", partida: "MKT_01", valor: 600 },
  { id: 17, concepto: "Redes sociales", partida: "MKT_02", valor: 350 },
  { id: 18, concepto: "Web + SEO", partida: "MKT_03", valor: 200 },
  { id: 19, concepto: "Material fungible", partida: "APROV_01", valor: 400 },
  { id: 20, concepto: "Equipamiento Pilates", partida: "APROV_02", valor: 200 },
  { id: 21, concepto: "Software + CRM", partida: "OTROS_01", valor: 180 },
  { id: 22, concepto: "Formación continua", partida: "OTROS_02", valor: 250 },
];

const scenario3CostAlloc: Record<string, Record<number, number>> = {
  APROV:     { 1: 40, 2: 20, 3: 25, 4: 15 },
  INFRA:     { 1: 40, 2: 20, 3: 25, 4: 15 },
  PERS_CLIN: { 1: 45, 2: 20, 3: 20, 4: 15 },
  PERS_GEST: { 1: 35, 2: 25, 3: 25, 4: 15 },
  MKT:       { 1: 35, 2: 25, 3: 20, 4: 20 },
  OTROS:     { 1: 30, 2: 25, 3: 25, 4: 20 },
};

function buildScenario3Kpis(): PlaygroundKpi[] {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  // Stable & strong, slight growth
  const factors = [0.97, 0.99, 1.0, 1.02, 1.03, 1.05];
  const totalGastos = 18356; // sum of all gastos

  return months.map((m, i) => {
    const f = factors[i];
    const fisioRev = Math.round(14000 * f);
    const osteoRev = Math.round(5500 * f);
    const pilatesRev = Math.round(4500 * f);
    const readaptRev = Math.round(3500 * f);
    const fisioSes = Math.round(230 * f);
    const osteoSes = Math.round(70 * f);
    const pilatesSes = Math.round(90 * f);
    const readaptSes = Math.round(50 * f);
    const totalRev = fisioRev + osteoRev + pilatesRev + readaptRev;
    const totalSes = fisioSes + osteoSes + pilatesSes + readaptSes;

    return {
      monthYear: m,
      serviceData: {
        "1": { revenue: fisioRev, sessions: fisioSes, uniquePatients12m: Math.round(160 * f) },
        "2": { revenue: osteoRev, sessions: osteoSes, uniquePatients12m: Math.round(45 * f) },
        "3": { revenue: pilatesRev, sessions: pilatesSes, uniquePatients12m: Math.round(55 * f) },
        "4": { revenue: readaptRev, sessions: readaptSes, uniquePatients12m: Math.round(30 * f) },
      },
      workerData: {
        "1": { revenue: Math.round(totalRev * 0.18), sessions: Math.round(totalSes * 0.18), isOwner: true },
        "2": { revenue: Math.round(totalRev * 0.24), sessions: Math.round(totalSes * 0.24), isOwner: false },
        "3": { revenue: Math.round(totalRev * 0.24), sessions: Math.round(totalSes * 0.24), isOwner: false },
        "4": { revenue: Math.round(totalRev * 0.20), sessions: Math.round(totalSes * 0.20), isOwner: false },
        "5": { revenue: Math.round(totalRev * 0.14), sessions: Math.round(totalSes * 0.14), isOwner: false },
      },
      newPatients: Math.round(30 + i * 1.5),
      totalPatients12m: Math.round(280 + i * 3),
      singleVisitPat12m: Math.round(22 + i),
      nps: 9.0 + (i * 0.05),
      revenue: totalRev,
      totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((22 + i) / (280 + i * 3)) * 10000) / 100,
      occupancy: Math.round(78 + i),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 600, INFRA: 3270, PERS_CLIN: 10468, PERS_GEST: 2238, MKT: 1150, OTROS: 430 },
      useManualExpenses: false,
    };
  });
}

// ══════════════════════════════════════════════════════════════
// EXPORT SCENARIOS
// ══════════════════════════════════════════════════════════════

export const SCENARIOS: Scenario[] = [
  {
    id: "nueva-exitosa",
    name: "Clínica Nueva Exitosa",
    description: "Acaba de abrir, owner + 1 fisio, 2 servicios. Crecimiento rápido, buenos márgenes iniciales.",
    emoji: "🚀",
    color: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    services: scenario1Services,
    workers: scenario1Workers,
    gastos: scenario1Gastos,
    costAlloc: scenario1CostAlloc,
    kpiHistory: buildScenario1Kpis(),
  },
  {
    id: "margen-ajustado",
    name: "Margen Ajustado",
    description: "3 fisios + nutricionista, factura 12-13k/mes pero gastos altos. Margen <15%, necesita optimizar.",
    emoji: "⚠️",
    color: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    services: scenario2Services,
    workers: scenario2Workers,
    gastos: scenario2Gastos,
    costAlloc: scenario2CostAlloc,
    kpiHistory: buildScenario2Kpis(),
  },
  {
    id: "clinica-optima",
    name: "Clínica Óptima",
    description: "5 profesionales, 4 servicios, factura 27k+/mes. Buena recurrencia, NPS alto, margen >30%.",
    emoji: "⭐",
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    services: scenario3Services,
    workers: scenario3Workers,
    gastos: scenario3Gastos,
    costAlloc: scenario3CostAlloc,
    kpiHistory: buildScenario3Kpis(),
  },
];
