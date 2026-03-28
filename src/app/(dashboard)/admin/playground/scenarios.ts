// ══════════════════════════════════════════════════════════════
// PLAYGROUND SCENARIOS — 3 realistic clinic archetypes
// Full DiagData (ejercicio1 + ejercicio2 + sistema) + KPI history
// ══════════════════════════════════════════════════════════════

// ─── Types matching Paso 1 exactly ─────────────────────────

export type Servicio = {
  sid: number;
  name: string;
  mins: number;
  precio: number;
  facM: number[];   // 12 monthly billing
  sesM: number[];   // 12 monthly sessions
  pac: number;
};

export type Profesional = {
  wid: number;
  name: string;
  tipo: string;
  hconv: number;
  pct: number;
  srvIds: number[];
  vacM: number[];   // 12 monthly vacation weeks
};

export type Gasto = {
  id: number;
  concepto: string;
  partida: string;
  valor: number;
};

export type Ej1Data = {
  aFac: number[];   // 12 monthly billing
  aSes: number[];   // 12 monthly sessions
  aNew: number[];   // 12 monthly new patients
  gPac: number;     // total patients
  gChurn: number;   // annual churn %
  gNps: number;     // NPS
  srvs: Servicio[];
  wrks: Profesional[];
  gastos: Gasto[];
  dIngSrv: number;
  dIngOtros: number;
  costAlloc: Record<string, Record<number, number>>;
};

export type Sala = {
  id: number;
  nombre: string;
  servNombre: string;
  sesHora: number;
  horasDia: number;
  ticket: number;
};

export type Ej2Data = {
  diasSem: number;
  semanasAno: number;
  salas: Sala[];
};

export type PalancaDetalle = {
  enfoque: string;
  ticketObjetivo?: number;
  sesionesExtra?: number;
  pacientesNuevos?: number;
};

export type SistemaData = {
  sueldo: number;
  margen: number;
  facAnoAnterior: number;
  objFac: number;
  palancas: string[];
  palancaDetalles: Record<string, PalancaDetalle>;
  forecast: number[];
  forecastSesiones: number[];
};

export type DiagData = {
  ejercicio1: Ej1Data;
  ejercicio2: Ej2Data;
  sistema: SistemaData;
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
  color: string;
  borderColor: string;
  textColor: string;
  diagData: DiagData;
  kpiHistory: PlaygroundKpi[];
};

// ═════════════════════════════════════════════════════════════
// SCENARIO 1: Clínica Nueva Exitosa
// Owner + 1 fisio, 2 servicios, creciendo rápido
// ═════════════════════════════════════════════════════════════

const sc1_ej1: Ej1Data = {
  // Monthly billing — growing over the year (started mid-year)
  aFac: [3200, 3500, 3900, 4200, 4500, 4800, 5100, 3800, 5400, 5700, 6000, 6300],
  aSes: [68, 74, 80, 86, 92, 98, 104, 78, 110, 116, 122, 129],
  aNew: [15, 14, 16, 13, 18, 15, 12, 8, 17, 16, 19, 22],
  gPac: 180,
  gChurn: 18,
  gNps: 8.5,
  srvs: [
    {
      sid: 1, name: "Fisioterapia", mins: 50, precio: 50, pac: 120,
      facM: [2200, 2400, 2700, 2900, 3100, 3300, 3500, 2600, 3700, 3900, 4100, 4300],
      sesM: [44, 48, 54, 58, 62, 66, 70, 52, 74, 78, 82, 86],
    },
    {
      sid: 2, name: "Pilates Máquina", mins: 55, precio: 40, pac: 60,
      facM: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1200, 1700, 1800, 1900, 2000],
      sesM: [24, 26, 26, 28, 30, 32, 34, 26, 36, 38, 40, 43],
    },
  ],
  wrks: [
    { wid: 1, name: "Carlos (Owner)", tipo: "FISIO", hconv: 40, pct: 80, srvIds: [1, 2], vacM: [0,0,0,0,0,0,1,2,0,0,0,1] },
    { wid: 2, name: "Laura", tipo: "FISIO", hconv: 30, pct: 75, srvIds: [1], vacM: [0,0,0,0,0,0,0,2,1,0,0,1] },
  ],
  gastos: [
    { id: 1, concepto: "Compras de mercancías / mantenimiento instalación", partida: "APROV_COMPRAS", valor: 80 },
    { id: 2, concepto: "Suministros desechables y fungibles", partida: "APROV_FUNGIBLES", valor: 40 },
    { id: 3, concepto: "Arrendamientos y cánones", partida: "INFRA_ALQUILER", valor: 850 },
    { id: 4, concepto: "Suministros agua, gas y electricidad", partida: "INFRA_SUMINISTROS", valor: 130 },
    { id: 5, concepto: "Primas de seguros", partida: "INFRA_SEGUROS", valor: 85 },
    { id: 6, concepto: "Teléfono e internet", partida: "INFRA_TELECOM", valor: 50 },
    { id: 7, concepto: "Software de gestión", partida: "INFRA_SOFTWARE", valor: 60 },
    { id: 8, concepto: "Sueldos y salarios — personal clínico", partida: "PERS_CLIN_SUELDOS", valor: 1600 },
    { id: 9, concepto: "Gastos sociales y SS — clínico", partida: "PERS_CLIN_SS", valor: 520 },
    { id: 10, concepto: "Prestación de servicios de otros profesionales", partida: "PERS_GEST_EXTERNO", valor: 150 },
    { id: 11, concepto: "Marketing y publicidad", partida: "MKT", valor: 300 },
  ],
  dIngSrv: 95,
  dIngOtros: 5,
  costAlloc: {
    APROV:     { 1: 70, 2: 30 },
    INFRA:     { 1: 60, 2: 40 },
    PERS_CLIN: { 1: 75, 2: 25 },
    PERS_GEST: { 1: 50, 2: 50 },
    MKT:       { 1: 60, 2: 40 },
    OTROS:     { 1: 50, 2: 50 },
  },
};

const sc1_ej2: Ej2Data = {
  diasSem: 5,
  semanasAno: 46,
  salas: [
    { id: 1, nombre: "Sala 1 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 55 },
    { id: 2, nombre: "Sala Pilates", servNombre: "Pilates Máquina", sesHora: 1, horasDia: 6, ticket: 45 },
  ],
};

const sc1_sistema: SistemaData = {
  sueldo: 2500,
  margen: 25,
  facAnoAnterior: 56400, // sum aFac
  objFac: 84000,         // objetivo: crecer ~50%
  palancas: ["captacion", "recurrencia", "precio"],
  palancaDetalles: {
    captacion: { enfoque: "Potenciar Google Ads local + GMB. Objetivo: 20 pacientes nuevos/mes", pacientesNuevos: 20 },
    recurrencia: { enfoque: "Plan terapéutico de 8-10 sesiones por paciente. Seguimiento activo.", sesionesExtra: 15 },
    precio: { enfoque: "Subir fisioterapia de 50€ a 55€. Pilates de 40€ a 45€ en Q2.", ticketObjetivo: 55 },
  },
  forecast: [5500, 5800, 6200, 6500, 6800, 7000, 7200, 5400, 7500, 7800, 8000, 8300],
  forecastSesiones: [105, 110, 118, 123, 129, 133, 137, 102, 142, 148, 152, 158],
};

function buildScenario1Kpis(): PlaygroundKpi[] {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const revGrowth = [0.85, 0.90, 0.95, 1.0, 1.05, 1.10];
  const totalGastos = 3865;
  return months.map((m, i) => {
    const f = revGrowth[i];
    const fisioRev = Math.round(4200 * f); const pilatesRev = Math.round(1800 * f);
    const fisioSes = Math.round(84 * f); const pilatesSes = Math.round(45 * f);
    const totalRev = fisioRev + pilatesRev; const totalSes = fisioSes + pilatesSes;
    return {
      monthYear: m,
      serviceData: {
        "1": { revenue: fisioRev, sessions: fisioSes, uniquePatients12m: Math.round(38 * f) },
        "2": { revenue: pilatesRev, sessions: pilatesSes, uniquePatients12m: Math.round(22 * f) },
      },
      workerData: {
        "1": { revenue: Math.round(totalRev * 0.55), sessions: Math.round(totalSes * 0.55), isOwner: true },
        "2": { revenue: Math.round(totalRev * 0.45), sessions: Math.round(totalSes * 0.45), isOwner: false },
      },
      newPatients: Math.round(12 + i * 2), totalPatients12m: Math.round(55 + i * 5),
      singleVisitPat12m: Math.round(8 + i), nps: 8.5 + i * 0.1,
      revenue: totalRev, totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((8 + i) / (55 + i * 5)) * 10000) / 100,
      occupancy: Math.round(65 + i * 2.5),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 120, INFRA: 1175, PERS_CLIN: 2120, PERS_GEST: 150, MKT: 300, OTROS: 0 },
      useManualExpenses: false,
    };
  });
}

// ═════════════════════════════════════════════════════════════
// SCENARIO 2: Margen Ajustado
// 3 fisios + nutricionista, factura bien pero gastos altos
// ═════════════════════════════════════════════════════════════

const sc2_ej1: Ej1Data = {
  aFac: [12500, 12800, 13100, 12900, 13200, 13000, 12700, 9800, 13500, 13200, 12900, 13300],
  aSes: [248, 254, 260, 256, 262, 258, 252, 196, 268, 262, 256, 264],
  aNew: [22, 20, 24, 18, 21, 19, 16, 10, 23, 20, 18, 22],
  gPac: 450,
  gChurn: 22,
  gNps: 7.4,
  srvs: [
    {
      sid: 1, name: "Fisioterapia", mins: 45, precio: 50, pac: 300,
      facM: [8200, 8400, 8600, 8500, 8700, 8500, 8300, 6400, 8900, 8700, 8500, 8800],
      sesM: [164, 168, 172, 170, 174, 170, 166, 128, 178, 174, 170, 176],
    },
    {
      sid: 2, name: "Osteopatía", mins: 60, precio: 70, pac: 100,
      facM: [3000, 3100, 3200, 3100, 3200, 3200, 3100, 2400, 3300, 3200, 3100, 3200],
      sesM: [43, 44, 46, 44, 46, 46, 44, 34, 47, 46, 44, 46],
    },
    {
      sid: 3, name: "Nutrición", mins: 40, precio: 40, pac: 50,
      facM: [1300, 1300, 1300, 1300, 1300, 1300, 1300, 1000, 1300, 1300, 1300, 1300],
      sesM: [41, 42, 42, 42, 42, 42, 42, 34, 43, 42, 42, 42],
    },
  ],
  wrks: [
    { wid: 1, name: "Marta (Owner)", tipo: "FISIO", hconv: 40, pct: 85, srvIds: [1, 2], vacM: [0,0,0,0,0,0,1,2,0,0,0,1] },
    { wid: 2, name: "Pablo", tipo: "FISIO", hconv: 38, pct: 80, srvIds: [1], vacM: [0,0,0,1,0,0,0,2,0,0,0,1] },
    { wid: 3, name: "Andrea", tipo: "FISIO", hconv: 35, pct: 75, srvIds: [1, 2], vacM: [0,0,0,0,0,1,0,2,0,0,0,1] },
    { wid: 4, name: "Lucía", tipo: "NUTRICIONISTA", hconv: 20, pct: 70, srvIds: [3], vacM: [0,0,0,0,0,0,1,2,0,0,0,1] },
  ],
  gastos: [
    { id: 1, concepto: "Compras de mercancías / mantenimiento instalación", partida: "APROV_COMPRAS", valor: 180 },
    { id: 2, concepto: "Material de oficina y recepción", partida: "APROV_OFICINA", valor: 40 },
    { id: 3, concepto: "Suministros desechables y fungibles", partida: "APROV_FUNGIBLES", valor: 60 },
    { id: 4, concepto: "Arrendamientos y cánones", partida: "INFRA_ALQUILER", valor: 1800 },
    { id: 5, concepto: "Gastos de comunidad e IBI", partida: "INFRA_COMUNIDAD", valor: 120 },
    { id: 6, concepto: "Reparaciones y conservación", partida: "INFRA_REPARACIONES", valor: 100 },
    { id: 7, concepto: "Suministros agua, gas y electricidad", partida: "INFRA_SUMINISTROS", valor: 220 },
    { id: 8, concepto: "Primas de seguros", partida: "INFRA_SEGUROS", valor: 150 },
    { id: 9, concepto: "Teléfono e internet", partida: "INFRA_TELECOM", valor: 70 },
    { id: 10, concepto: "Hosting, web y dominios", partida: "INFRA_HOSTING", valor: 30 },
    { id: 11, concepto: "Software de gestión", partida: "INFRA_SOFTWARE", valor: 80 },
    { id: 12, concepto: "Sueldos y salarios — personal clínico", partida: "PERS_CLIN_SUELDOS", valor: 4450 },
    { id: 13, concepto: "Gastos sociales y SS — clínico", partida: "PERS_CLIN_SS", valor: 1450 },
    { id: 14, concepto: "Sueldos y salarios — personal gestión", partida: "PERS_GEST_SUELDOS", valor: 1400 },
    { id: 15, concepto: "Gastos sociales y SS — gestión", partida: "PERS_GEST_SS", valor: 455 },
    { id: 16, concepto: "Prestación de servicios de otros profesionales", partida: "PERS_GEST_EXTERNO", valor: 200 },
    { id: 17, concepto: "Marketing y publicidad", partida: "MKT", valor: 750 },
    { id: 18, concepto: "Otros servicios (desinfección, residuos...)", partida: "INFRA_OTROS", valor: 70 },
  ],
  dIngSrv: 98,
  dIngOtros: 2,
  costAlloc: {
    APROV:     { 1: 60, 2: 25, 3: 15 },
    INFRA:     { 1: 55, 2: 25, 3: 20 },
    PERS_CLIN: { 1: 65, 2: 20, 3: 15 },
    PERS_GEST: { 1: 50, 2: 25, 3: 25 },
    MKT:       { 1: 50, 2: 30, 3: 20 },
    OTROS:     { 1: 40, 2: 30, 3: 30 },
  },
};

const sc2_ej2: Ej2Data = {
  diasSem: 5,
  semanasAno: 46,
  salas: [
    { id: 1, nombre: "Sala 1 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 55 },
    { id: 2, nombre: "Sala 2 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 55 },
    { id: 3, nombre: "Sala Osteopatía", servNombre: "Osteopatía", sesHora: 1, horasDia: 7, ticket: 75 },
    { id: 4, nombre: "Consulta Nutrición", servNombre: "Nutrición", sesHora: 1.5, horasDia: 5, ticket: 45 },
  ],
};

const sc2_sistema: SistemaData = {
  sueldo: 3000,
  margen: 20,
  facAnoAnterior: 152900, // sum aFac
  objFac: 168000,
  palancas: ["precio", "recurrencia", "costes"],
  palancaDetalles: {
    precio: { enfoque: "Subir fisio a 55€ y osteo a 75€. Nutrición mantener.", ticketObjetivo: 55 },
    recurrencia: { enfoque: "Implantar planes de 6 sesiones con descuento del 5%. Seguimiento semanal.", sesionesExtra: 20 },
    costes: { enfoque: "Renegociar alquiler. Revisar seguros. Optimizar horarios para reducir horas ociosas." },
  },
  forecast: [13500, 13800, 14200, 14000, 14500, 14200, 13800, 10500, 14800, 14500, 14200, 14500],
  forecastSesiones: [260, 266, 274, 270, 280, 274, 266, 202, 285, 280, 274, 280],
};

function buildScenario2Kpis(): PlaygroundKpi[] {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const factors = [1.02, 1.0, 0.98, 0.97, 1.0, 1.01];
  const totalGastos = 11625;
  return months.map((m, i) => {
    const f = factors[i];
    const fisioRev = Math.round(8500 * f); const osteoRev = Math.round(3200 * f); const nutriRev = Math.round(1200 * f);
    const fisioSes = Math.round(170 * f); const osteoSes = Math.round(45 * f); const nutriSes = Math.round(30 * f);
    const totalRev = fisioRev + osteoRev + nutriRev; const totalSes = fisioSes + osteoSes + nutriSes;
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
      newPatients: Math.round(18 - i * 0.5), totalPatients12m: Math.round(140 + i),
      singleVisitPat12m: Math.round(28 + i * 2), nps: 7.2 + i * 0.05,
      revenue: totalRev, totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((28 + i * 2) / (140 + i)) * 10000) / 100,
      occupancy: Math.round(72 + i),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 280, INFRA: 2640, PERS_CLIN: 5900, PERS_GEST: 2055, MKT: 750, OTROS: 0 },
      useManualExpenses: false,
    };
  });
}

// ═════════════════════════════════════════════════════════════
// SCENARIO 3: Clínica Óptima
// 5 profesionales, 4 servicios, todo bien engrasado
// ═════════════════════════════════════════════════════════════

const sc3_ej1: Ej1Data = {
  aFac: [26000, 26500, 27000, 27500, 28000, 27800, 27000, 20000, 28500, 29000, 29500, 30000],
  aSes: [420, 428, 436, 444, 452, 449, 436, 323, 460, 468, 476, 484],
  aNew: [28, 30, 32, 30, 34, 31, 25, 18, 35, 33, 32, 36],
  gPac: 850,
  gChurn: 10,
  gNps: 9.1,
  srvs: [
    {
      sid: 1, name: "Fisioterapia", mins: 50, precio: 60, pac: 480,
      facM: [13500, 13800, 14000, 14200, 14500, 14300, 14000, 10500, 14700, 15000, 15200, 15500],
      sesM: [225, 230, 233, 237, 242, 238, 233, 175, 245, 250, 253, 258],
    },
    {
      sid: 2, name: "Osteopatía", mins: 60, precio: 80, pac: 140,
      facM: [5200, 5300, 5500, 5600, 5700, 5600, 5400, 4000, 5800, 5900, 6000, 6100],
      sesM: [65, 66, 69, 70, 71, 70, 68, 50, 73, 74, 75, 76],
    },
    {
      sid: 3, name: "Pilates Máquina", mins: 55, precio: 45, pac: 150,
      facM: [4200, 4300, 4400, 4500, 4600, 4500, 4400, 3300, 4700, 4800, 4900, 5000],
      sesM: [85, 87, 89, 91, 93, 91, 89, 67, 95, 97, 99, 101],
    },
    {
      sid: 4, name: "Readaptación Deportiva", mins: 60, precio: 70, pac: 80,
      facM: [3100, 3100, 3100, 3200, 3200, 3400, 3200, 2200, 3300, 3300, 3400, 3400],
      sesM: [45, 45, 45, 46, 46, 50, 46, 31, 47, 47, 49, 49],
    },
  ],
  wrks: [
    { wid: 1, name: "Javier (Owner)", tipo: "FISIO", hconv: 35, pct: 60, srvIds: [1, 4], vacM: [0,0,0,0,0,0,1,2,0,0,0,1] },
    { wid: 2, name: "Sara", tipo: "FISIO", hconv: 38, pct: 85, srvIds: [1, 2], vacM: [0,0,0,0,0,1,0,2,0,0,0,1] },
    { wid: 3, name: "Daniel", tipo: "FISIO", hconv: 38, pct: 85, srvIds: [1, 3], vacM: [0,0,0,0,1,0,0,2,0,0,0,1] },
    { wid: 4, name: "Irene", tipo: "FISIO", hconv: 35, pct: 80, srvIds: [2, 4], vacM: [0,0,1,0,0,0,0,2,0,0,0,1] },
    { wid: 5, name: "Marcos", tipo: "FISIO", hconv: 30, pct: 80, srvIds: [3], vacM: [0,0,0,0,0,0,1,2,0,0,0,1] },
  ],
  gastos: [
    { id: 1, concepto: "Compras de mercancías / mantenimiento instalación", partida: "APROV_COMPRAS", valor: 250 },
    { id: 2, concepto: "Material de oficina y recepción", partida: "APROV_OFICINA", valor: 60 },
    { id: 3, concepto: "Suministros desechables y fungibles", partida: "APROV_FUNGIBLES", valor: 90 },
    { id: 4, concepto: "Arrendamientos y cánones", partida: "INFRA_ALQUILER", valor: 2500 },
    { id: 5, concepto: "Gastos de comunidad e IBI", partida: "INFRA_COMUNIDAD", valor: 150 },
    { id: 6, concepto: "Reparaciones y conservación", partida: "INFRA_REPARACIONES", valor: 150 },
    { id: 7, concepto: "Suministros agua, gas y electricidad", partida: "INFRA_SUMINISTROS", valor: 320 },
    { id: 8, concepto: "Primas de seguros", partida: "INFRA_SEGUROS", valor: 200 },
    { id: 9, concepto: "Teléfono e internet", partida: "INFRA_TELECOM", valor: 80 },
    { id: 10, concepto: "Hosting, web y dominios", partida: "INFRA_HOSTING", valor: 40 },
    { id: 11, concepto: "Renting de máquinas y amortizaciones", partida: "INFRA_RENTING", valor: 300 },
    { id: 12, concepto: "Software de gestión", partida: "INFRA_SOFTWARE", valor: 130 },
    { id: 13, concepto: "Otros servicios (desinfección, residuos...)", partida: "INFRA_OTROS", valor: 100 },
    { id: 14, concepto: "Sueldos y salarios — personal clínico", partida: "PERS_CLIN_SUELDOS", valor: 7900 },
    { id: 15, concepto: "Gastos sociales y SS — clínico", partida: "PERS_CLIN_SS", valor: 2568 },
    { id: 16, concepto: "Sueldos y salarios — personal gestión", partida: "PERS_GEST_SUELDOS", valor: 1500 },
    { id: 17, concepto: "Gastos sociales y SS — gestión", partida: "PERS_GEST_SS", valor: 488 },
    { id: 18, concepto: "Prestación de servicios de otros profesionales", partida: "PERS_GEST_EXTERNO", valor: 250 },
    { id: 19, concepto: "Marketing y publicidad", partida: "MKT", valor: 1150 },
    { id: 20, concepto: "Otros servicios (formación continuada)", partida: "OTROS_FORMACION", valor: 250 },
  ],
  dIngSrv: 97,
  dIngOtros: 3,
  costAlloc: {
    APROV:     { 1: 40, 2: 20, 3: 25, 4: 15 },
    INFRA:     { 1: 40, 2: 20, 3: 25, 4: 15 },
    PERS_CLIN: { 1: 45, 2: 20, 3: 20, 4: 15 },
    PERS_GEST: { 1: 35, 2: 25, 3: 25, 4: 15 },
    MKT:       { 1: 35, 2: 25, 3: 20, 4: 20 },
    OTROS:     { 1: 30, 2: 25, 3: 25, 4: 20 },
  },
};

const sc3_ej2: Ej2Data = {
  diasSem: 5,
  semanasAno: 46,
  salas: [
    { id: 1, nombre: "Sala 1 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 65 },
    { id: 2, nombre: "Sala 2 — Fisioterapia", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 65 },
    { id: 3, nombre: "Sala Osteopatía", servNombre: "Osteopatía", sesHora: 1, horasDia: 7, ticket: 85 },
    { id: 4, nombre: "Sala Pilates", servNombre: "Pilates Máquina", sesHora: 1, horasDia: 7, ticket: 50 },
    { id: 5, nombre: "Sala Readaptación", servNombre: "Readaptación Deportiva", sesHora: 1, horasDia: 6, ticket: 75 },
  ],
};

const sc3_sistema: SistemaData = {
  sueldo: 5000,
  margen: 30,
  facAnoAnterior: 326800, // sum aFac
  objFac: 360000,
  palancas: ["recurrencia", "ocupacion", "servicios"],
  palancaDetalles: {
    recurrencia: { enfoque: "Programa de fidelización: bonos 10 sesiones (-10%). Follow-up automatizado post-alta.", sesionesExtra: 30 },
    ocupacion: { enfoque: "Optimizar huecos: sesiones cortas entre las largas. Horarios extendidos L-J.", },
    servicios: { enfoque: "Lanzar programa de readaptación grupal (4 personas) a 35€/sesión. Nuevo ingreso con alto margen.", },
  },
  forecast: [28500, 29000, 29500, 30000, 30500, 30200, 29500, 22000, 31000, 31500, 32000, 32500],
  forecastSesiones: [460, 468, 476, 484, 492, 487, 476, 355, 500, 508, 516, 524],
};

function buildScenario3Kpis(): PlaygroundKpi[] {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const factors = [0.97, 0.99, 1.0, 1.02, 1.03, 1.05];
  const totalGastos = 18176;
  return months.map((m, i) => {
    const f = factors[i];
    const fisioRev = Math.round(14000 * f); const osteoRev = Math.round(5500 * f);
    const pilatesRev = Math.round(4500 * f); const readaptRev = Math.round(3500 * f);
    const fisioSes = Math.round(230 * f); const osteoSes = Math.round(70 * f);
    const pilatesSes = Math.round(90 * f); const readaptSes = Math.round(50 * f);
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
      newPatients: Math.round(30 + i * 1.5), totalPatients12m: Math.round(280 + i * 3),
      singleVisitPat12m: Math.round(22 + i), nps: 9.0 + i * 0.05,
      revenue: totalRev, totalSessions: totalSes,
      avgTicket: Math.round((totalRev / totalSes) * 100) / 100,
      churnPct: Math.round(((22 + i) / (280 + i * 3)) * 10000) / 100,
      occupancy: Math.round(78 + i),
      grossMargin: Math.round(((totalRev - totalGastos) / totalRev) * 10000) / 100,
      monthlyExpenses: { APROV: 400, INFRA: 3970, PERS_CLIN: 10468, PERS_GEST: 2238, MKT: 1150, OTROS: 250 },
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
    diagData: { ejercicio1: sc1_ej1, ejercicio2: sc1_ej2, sistema: sc1_sistema },
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
    diagData: { ejercicio1: sc2_ej1, ejercicio2: sc2_ej2, sistema: sc2_sistema },
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
    diagData: { ejercicio1: sc3_ej1, ejercicio2: sc3_ej2, sistema: sc3_sistema },
    kpiHistory: buildScenario3Kpis(),
  },
];
