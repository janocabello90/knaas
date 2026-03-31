"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain,
  Heart,
  Target,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  Lightbulb,
  AlertTriangle,
  Flame,
  FileSignature,
  Lock,
  BookOpen,
  Clock,
  ArrowLeft,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type MentalidadData = {
  ejercicio1?: Ej1Data;
  ejercicio2?: Ej2Data;
  saberCompleted?: boolean[];
};

type Ej1Data = {
  situacionActual: string;
  horasSemanaClinica: number;
  horasSemanaTratando: number;
  horasSemanaGestion: number;
  porQueAbriste: string;
  queTeFrustra: string;
  queTeGustaría: string;
  miedos: string[];
  excusas: string[];
  creenciasLimitantes: string[];
  nivelSatisfaccion: number;
  nivelEstres: number;
  nivelControl: number;
  identidad: "tecnico" | "hibrido" | "empresario" | "";
};

type Ej2Data = {
  compromiso: string;
  queEstoyDispuestoACambiar: string;
  queDejoDeHacer: string;
  comoMedireMiProgreso: string;
  firma: string;
  fecha: string;
};

const DEFAULT_EJ1: Ej1Data = {
  situacionActual: "",
  horasSemanaClinica: 0,
  horasSemanaTratando: 0,
  horasSemanaGestion: 0,
  porQueAbriste: "",
  queTeFrustra: "",
  queTeGustaría: "",
  miedos: [""],
  excusas: [""],
  creenciasLimitantes: [""],
  nivelSatisfaccion: 5,
  nivelEstres: 5,
  nivelControl: 5,
  identidad: "",
};

const DEFAULT_EJ2: Ej2Data = {
  compromiso: "",
  queEstoyDispuestoACambiar: "",
  queDejoDeHacer: "",
  comoMedireMiProgreso: "",
  firma: "",
  fecha: new Date().toISOString().split("T")[0],
};

// ══════════════════════════════════════════════════════════════
// SABER LESSONS
// ══════════════════════════════════════════════════════════════

type SaberLesson = {
  id: number;
  title: string;
  subtitle: string;
  readingTime: number;
  sections: { heading: string; content: string[] }[];
  keyTakeaway: string;
};

const SABER_LESSONS: SaberLesson[] = [
  {
    id: 1,
    title: "Introducción al Programa ACTIVA",
    subtitle: "Todo lo que necesitas saber para empezar con el pie derecho",
    readingTime: 20,
    sections: [
      {
        heading: "¿Por qué ACTIVA?",
        content: [
          "El programa ACTIVA nace de una observación simple pero poderosa: la mayoría de fisioterapeutas quieren crecer como empresarios, pero carecen de una metodología clara para hacerlo.",
          "Durante años, hemos trabajado con cientos de clínicos en transformación. Hemos visto lo que funciona y lo que no. ACTIVA es el resultado de esa experiencia acumulada.",
        ],
      },
      {
        heading: "La Metodología SABER → DECIDIR → ACTIVAR",
        content: [
          "Nuestro enfoque se divide en tres fases claramente diferenciadas:",
          "1. SABER: Aprender la teoría, entender los conceptos clave del negocio y el contexto competitivo.",
          "2. DECIDIR: Hacer diagnósticos reales sobre tu clínica, identificar debilidades y oportunidades.",
          "3. ACTIVAR: Ejecutar cambios concretos, implementar decisiones y medir resultados.",
          "No saltamos directamente a la acción sin entender. Tampoco nos quedamos en la teoría. Avanzamos paso a paso.",
        ],
      },
      {
        heading: "Estructura del Programa",
        content: [
          "ACTIVA consta de 4 módulos y 16 pasos en total.",
          "Cada paso tiene una duración estimada de 1-2 horas de dedicación por semana.",
          "Paso 0 (donde estás ahora): Mentalidad. Es el más importante porque todo lo demás depende de tu disposición a cambiar.",
          "Módulo 1 (Pasos 1-4): Diagnóstico. Entenderás qué está funcionando y qué no en tu clínica.",
          "Módulo 2 (Pasos 5-8): Estrategia. Diseñarás tu hoja de ruta hacia el crecimiento.",
          "Módulo 3 (Pasos 9-12): Operación. Implementarás cambios en la estructura y procesos.",
          "Módulo 4 (Pasos 13-16): Consolidación. Medirás resultados y diseñarás el siguiente ciclo.",
        ],
      },
      {
        heading: "Las Herramientas de la Plataforma",
        content: [
          "Accedes a plantillas, ejercicios interactivos y un sistema de seguimiento que te ayuda a no abandonar.",
          "Cada paso tiene teoría, ejercicios prácticos y momentos para reflexionar.",
          "Puedes volver atrás siempre que quieras. El programa es tuyo y adapta su ritmo al tuyo.",
        ],
      },
    ],
    keyTakeaway:
      "ACTIVA es tu brújula hacia la transformación empresarial. No es un curso de negocios genérico, sino un programa específicamente diseñado para fisioterapeutas que quieren dejar de ser solo técnicos.",
  },
  {
    id: 2,
    title: "La Analogía del Avión",
    subtitle: "Entendiendo tu negocio como un sistema",
    readingTime: 25,
    sections: [
      {
        heading: "¿Por qué una analogía?",
        content: [
          "Un avión es uno de los sistemas más complejos jamás creados. Para que vuele, cada componente debe funcionar en armonía.",
          "Tu clínica es exactamente así. No puedes tener solo un piloto excelente si el motor no funciona. No puedes tener la mejor propuesta de valor si no hay gente para ejecutarla.",
          "Esta analogía te ayuda a ver tu negocio de manera sistémica.",
        ],
      },
      {
        heading: "Los 7 Sistemas del Avión",
        content: [
          "1. EL PILOTO (Liderazgo): Eres tú. Tu visión, decisiones y dirección son lo que guía el avión.",
          "2. EL FUSELAJE (Propuesta de Valor): Es la estructura central. ¿Qué ofreces que otros no? ¿Por qué deberían venir pacientes a tu clínica y no a otra?",
          "3. LAS ALAS (Servicio): Es lo que te levanta del suelo. La calidad de tu servicio, la experiencia del paciente, los resultados que entregas.",
          "4. EL MOTOR (Marketing): Lo que impulsa el crecimiento. Sin marketing, nadie sabe que existes. Sin visibilidad, no hay demanda.",
          "5. EL COMBUSTIBLE (Cash Flow): Es la gasolina del sistema. Sin flujo de caja saludable, el avión se cae. Sin margen, no hay inversión posible.",
          "6. LOS INSTRUMENTOS (KPIs): Son los indicadores que te dicen si vas bien. Velocidad, altitud, dirección. En tu clínica, son números como pacientes mensuales, ticket promedio, retención.",
          "7. LA TRIPULACIÓN (Equipo): Nadie vuela solo. Tu equipo es lo que escala la clínica más allá de ti.",
        ],
      },
      {
        heading: "La Integración",
        content: [
          "El problema de muchos fisioterapeutas es que optimizan un sistema pero descuidan los otros.",
          "Pueden tener las alas perfectas (mejor técnica) pero un motor roto (nadie sabe de ti).",
          "O un motor potente (marketing agresivo) pero un servicio mediocre (malas alas).",
          "ACTIVA te enseña a integrar todos estos sistemas.",
        ],
      },
    ],
    keyTakeaway:
      "Tu clínica es un sistema. Cada parte depende de las otras. Crecer significa optimizar el conjunto, no una sola pieza.",
  },
  {
    id: 3,
    title: "¿Qué es realmente un negocio?",
    subtitle: "Del trueque a la era digital · El valor que importa",
    readingTime: 35,
    sections: [
      {
        heading: "Un poco de historia",
        content: [
          "Hace miles de años, no había dinero. Había trueque: tú me das 10 peces, yo te doy una cesta tejida.",
          "El trueque funcionaba si ambas partes valoraban lo que recibían más que lo que daban.",
          "Luego llegó el dinero. Simplificó el trueque, pero la lógica siguió siendo la misma: uno da valor, el otro da dinero a cambio.",
          "El dinero es solo la representación del valor.",
        ],
      },
      {
        heading: "Dos tipos de Valor",
        content: [
          "VALOR TÉCNICO: Es lo que sabes hacer. Tu destreza como fisio, tu formación, tu capacidad técnica.",
          "VALOR PERCIBIDO: Es lo que el paciente CREE que vale tu servicio. No es lo mismo.",
          "Un fisio puede ser técnicamente excelente pero si no sabe comunicar su valor, el paciente no paga por él como se merece.",
          "La brecha entre valor técnico y valor percibido es donde muchos fisios dejan dinero sobre la mesa.",
        ],
      },
      {
        heading: "¿Por qué los fisioterapeutas tienen una brecha empresarial?",
        content: [
          "Los fisioterapeutas son entrenados para ser técnicamente excelentes. Se invierten años en aprender anatomía, fisiología, técnicas.",
          "Pero nadie enseña en la universidad: cómo cobrar por ese valor, cómo comunicarlo, cómo construir un sistema que escale, cómo generar demanda.",
          "Resultado: muchos fisios tienen excelente valor técnico pero fracasan en la conversión de ese valor en ingresos.",
          "ACTIVA cierra esa brecha.",
        ],
      },
      {
        heading: "La Ecuación Simple",
        content: [
          "Un negocio sostenible = Valor Técnico + Valor Percibido + Sistema de Entrega + Modelo de Ingresos",
          "Si falta cualquiera de estas, el negocio se tambalea.",
        ],
      },
    ],
    keyTakeaway:
      "Un negocio no es solo ser bueno en lo que haces. Es saber comunicar ese valor, estructurar cómo lo entregas y monetizarlo correctamente.",
  },
  {
    id: 4,
    title: "La naturaleza competitiva de los negocios",
    subtitle: "Las 5 eras · El diagnóstico que nadie quiere hacer",
    readingTime: 40,
    sections: [
      {
        heading: "Las 5 Eras Competitivas",
        content: [
          "ERA 1 - DISPONIBILIDAD: El paciente va donde lo atienden. En un mercado pequeño, solo con estar disponible, ganas.",
          "ERA 2 - PRECIO: Compiten por quién cobra menos. La guerra de precios. Quien baja más, gana pacientes.",
          "ERA 3 - CALIDAD: La calidad se convierte en estándar. Todo el mundo ofrece 'calidad', por lo que diferenciarse es cada vez más difícil. La mayoría de mercados de fisioterapia están aquí.",
          "ERA 4 - DIFERENCIACIÓN: Competencia basada en propuesta única. Tú ofreces algo que otros no: especialización, experiencia, marca, comunidad.",
          "ERA 5 - RADICALIDAD: Cambio del modelo completo. No es mejorar lo que existe, sino reimaginar cómo se hace. Ejemplo: telehealth en fisio, o preventiva en lugar de reactiva.",
        ],
      },
      {
        heading: "Donde está la Fisioterapia Española",
        content: [
          "La mayoría de clínicas están atrapadas entre ERA 2 y ERA 3.",
          "Hay mucha competencia por precio. Y mucha gente ofreciendo 'calidad', sin saber exactamente qué quiere decir.",
          "Los fisios que ganan bien no son los que cobran menos ni simplemente los técnicamente mejores. Son los que han encontrado una diferenciación clara.",
          "Las clínicas con tracción son las que se han movido hacia ERA 4.",
        ],
      },
      {
        heading: "El diagnóstico que nadie quiere hacer",
        content: [
          "¿En qué era compites tú?",
          "¿Estás batiendo precios? Entonces estás en ERA 2.",
          "¿Apelas a calidad sin especificar en qué? Era 3.",
          "¿Tienes una especialidad clara, una marca, un por qué diferenciador? Era 4.",
          "La mayoría de fisios dirán que están en ERA 4, pero cuando analizas su marketing, sus precios, su propuesta, en realidad están en 2 o 3.",
          "Reconocer dónde estás es incómodo. Pero es el primer paso para avanzar.",
        ],
      },
    ],
    keyTakeaway:
      "Tu clínica compite en una era específica. Entender cuál es el diagnóstico más importante que harás en ACTIVA.",
  },
  {
    id: 5,
    title: "El mapa del negocio, la competencia y las ventajas que duran",
    subtitle: "Business Model Canvas · Competencia real · Barreras · Motores de crecimiento",
    readingTime: 45,
    sections: [
      {
        heading: "El Canvas de 9 Bloques",
        content: [
          "Es una herramienta que mapea todos los elementos de un modelo de negocio en una sola página:",
          "1. Segmento de Clientes: ¿A quién sirves?",
          "2. Propuesta de Valor: ¿Qué problema resuelves?",
          "3. Canales: ¿Cómo te encuentran?",
          "4. Relación con Clientes: ¿Cómo interactúas?",
          "5. Flujo de Ingresos: ¿Cómo monetizas?",
          "6. Recursos Clave: ¿Qué necesitas para funcionar?",
          "7. Actividades Clave: ¿Qué haces todos los días?",
          "8. Alianzas: ¿Con quién colaboras?",
          "9. Estructura de Costos: ¿Cuánto te cuesta funcionar?",
          "Este canvas es tu mapa. Lo usaremos en los próximos pasos.",
        ],
      },
      {
        heading: "Los 3 Tipos de Competencia",
        content: [
          "COMPETENCIA DIRECTA: Otra clínica de fisio en tu zona con modelo similar.",
          "COMPETENCIA INDIRECTA: Otros servicios que resuelven el mismo problema (osteopatía, quiropráctico, entrenador personal).",
          "COMPETENCIA POTENCIAL: Lo que podría aparecer mañana. Ej: Una clínica grande que abre sucursales en tu zona.",
          "Muchos fisios solo ven la competencia directa. Grave error.",
        ],
      },
      {
        heading: "Ventajas Reales vs Falsas",
        content: [
          "VENTAJA FALSA: 'Yo trabajo mejor que mis competidores'. Es subjetivo y muy fácil de copiar.",
          "VENTAJA REAL: Tiene defensas. Ejemplos: una marca sólida que tarda años en construirse, una especialización demandada que pocos tienen, un sistema operativo que es difícil de replicar.",
        ],
      },
      {
        heading: "Las Barreras Defensivas",
        content: [
          "¿Qué te protege de la competencia?",
          "1. Marca: Si tu marca es fuerte, el cliente elige y a ti te paga más.",
          "2. Especialización: Si eres el único que trata 'X' en tu zona, tienes barrera.",
          "3. Economía de escala: Si tu sistema es más eficiente que el de los competidores, tu margen es mejor.",
          "4. Red de clientes: Si tus pacientes te traen más pacientes, tu crecimiento es exponencial.",
          "5. Datos y know-how acumulado: Lo que has aprendido en años es difícil de copiar.",
        ],
      },
    ],
    keyTakeaway:
      "Un buen negocio no solo tiene una buena idea. Tiene defensas que te protegen de la copia. ACTIVA te ayuda a identificarlas y construirlas.",
  },
  {
    id: 6,
    title: "De la teoría al terreno: cómo tomamos el pulso a tu negocio",
    subtitle: "Cierre del Paso 0 · Introducción al Paso 1: Diagnóstico",
    readingTime: 20,
    sections: [
      {
        heading: "La Mirada Estratégica",
        content: [
          "Ya hemos cubierto la teoría. Aviones, eras, canvas, competencia, valor.",
          "Ahora necesitamos bajar del cielo y pisar el terreno.",
          "La 'mirada estratégica' es aprender a ver tu clínica a través de esta lente sistémica.",
          "No como 'mi clínica está bien porque tratamos bien', sino como un sistema con múltiples variables que interactúan.",
        ],
      },
      {
        heading: "Métricas Vanidosas vs Métricas Reales",
        content: [
          "VANIDOSA: 'Este mes traté 50 pacientes.' ¿Y? ¿Cuál fue el ticket promedio? ¿Cuál fue el margen?",
          "REAL: El margen neto por paciente tratado. El costo de adquisición vs el lifetime value.",
          "VANIDOSA: 'Tengo una clínica de 300 m².' ¿Y? ¿Cuál es la rentabilidad por m²?",
          "REAL: ROI sobre la inversión en infraestructura.",
          "En ACTIVA, evitamos métricas vanidosas. Nos enfocamos en números que explican si el negocio es realmente saludable.",
        ],
      },
      {
        heading: "Los 5 KPIs Fundamentales",
        content: [
          "Si solo midieras 5 cosas sobre tu clínica, ¿cuáles serían?",
          "1. VOLUMEN: ¿Cuántos pacientes activos tienes? ¿Crece o decrece?",
          "2. CAPTURA: ¿Cuánto ingresas por paciente en promedio (ticket medio)?",
          "3. RETENCIÓN: ¿Qué porcentaje de pacientes vuelve? ¿Cómo es la repetición?",
          "4. COSTO: ¿Cuál es tu estructura de costos como % de ingresos? ¿Hacia dónde va el dinero?",
          "5. ESCALA: ¿Cuántas horas trabajas tú personalmente? ¿La clínica depende 100% de ti?",
          "Estos 5 KPIs te dicen si tu negocio es escalable o no.",
        ],
      },
      {
        heading: "El siguiente paso",
        content: [
          "Ya tienes la teoría. Ya tienes el marco.",
          "En el Paso 1, comenzarás el DIAGNÓSTICO real.",
          "Mediremos esos 5 KPIs en tu clínica. Haremos una radiografía financiera. Identificaremos debilidades.",
          "Y descubriremos oportunidades que quizá no veías.",
          "La incomodidad del diagnóstico honesto es el precio de la claridad. Y la claridad es el primer paso del cambio.",
        ],
      },
    ],
    keyTakeaway:
      "Paso 0 es mentalidad. Paso 1 es diagnóstico. No puedes arreglar lo que no ves. Estos 6 SABER te dieron los lentes para ver.",
  },
];

// ══════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════

const TABS = [
  { key: "situacion", label: "Tu situación", icon: Brain },
  { key: "miedos", label: "Miedos y excusas", icon: AlertTriangle },
  { key: "identidad", label: "Tu identidad", icon: Lightbulb },
  { key: "compromiso", label: "Carta de compromiso", icon: FileSignature },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type PhaseType = "saber" | "decidir";

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function Paso0Page() {
  const [data, setData] = useState<MentalidadData>({});
  const [ej1, setEj1] = useState<Ej1Data>(DEFAULT_EJ1);
  const [ej2, setEj2] = useState<Ej2Data>(DEFAULT_EJ2);
  const [saberCompleted, setSaberCompleted] = useState<boolean[]>(
    Array(6).fill(false)
  );
  const [tab, setTab] = useState<TabKey>("situacion");
  const [phase, setPhase] = useState<PhaseType>("saber");
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load ──
  useEffect(() => {
    fetch("/api/alumno/programa/paso/0")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ejercicio1) setEj1({ ...DEFAULT_EJ1, ...d.ejercicio1 });
        if (d?.ejercicio2) setEj2({ ...DEFAULT_EJ2, ...d.ejercicio2 });
        if (d?.saberCompleted) setSaberCompleted(d.saberCompleted);
        setData(d || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Auto-save ──
  const save = useCallback(
    async (e1: Ej1Data, e2: Ej2Data, saber: boolean[]) => {
      setSaving(true);
      try {
        await fetch("/api/alumno/programa/paso/0", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ejercicio1: e1,
            ejercicio2: e2,
            saberCompleted: saber,
          }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error("Save error:", e);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const debouncedSave = useCallback(
    (e1: Ej1Data, e2: Ej2Data, saber: boolean[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(e1, e2, saber), 2000);
    },
    [save]
  );

  const updateEj1 = <K extends keyof Ej1Data>(key: K, value: Ej1Data[K]) => {
    setEj1((prev) => {
      const next = { ...prev, [key]: value };
      debouncedSave(next, ej2, saberCompleted);
      return next;
    });
  };

  const updateEj2 = <K extends keyof Ej2Data>(key: K, value: Ej2Data[K]) => {
    setEj2((prev) => {
      const next = { ...prev, [key]: value };
      debouncedSave(ej1, next, saberCompleted);
      return next;
    });
  };

  // ── List helpers ──
  const updateListItem = (
    key: "miedos" | "excusas" | "creenciasLimitantes",
    idx: number,
    value: string
  ) => {
    setEj1((prev) => {
      const arr = [...prev[key]];
      arr[idx] = value;
      const next = { ...prev, [key]: arr };
      debouncedSave(next, ej2, saberCompleted);
      return next;
    });
  };

  const addListItem = (key: "miedos" | "excusas" | "creenciasLimitantes") => {
    setEj1((prev) => {
      const next = { ...prev, [key]: [...prev[key], ""] };
      return next;
    });
  };

  const removeListItem = (
    key: "miedos" | "excusas" | "creenciasLimitantes",
    idx: number
  ) => {
    setEj1((prev) => {
      const arr = prev[key].filter((_, i) => i !== idx);
      const next = { ...prev, [key]: arr.length === 0 ? [""] : arr };
      debouncedSave(next, ej2, saberCompleted);
      return next;
    });
  };

  // ── SABER phase helpers ──
  const markLessonAsRead = useCallback(
    (lessonIdx: number) => {
      setSaberCompleted((prev) => {
        const next = [...prev];
        next[lessonIdx] = true;
        debouncedSave(ej1, ej2, next);
        return next;
      });
      setActiveLesson(null);
    },
    [ej1, ej2, debouncedSave]
  );

  const allSaberComplete = saberCompleted.every((c) => c === true);

  // ── Auto switch to DECIDIR when all lessons read ──
  useEffect(() => {
    if (allSaberComplete && phase === "saber") {
      setPhase("decidir");
    }
  }, [allSaberComplete, phase]);

  // ── Tab navigation ──
  const tabIdx = TABS.findIndex((t) => t.key === tab);
  const prevTab = tabIdx > 0 ? TABS[tabIdx - 1] : null;
  const nextTab = tabIdx < TABS.length - 1 ? TABS[tabIdx + 1] : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // SABER PHASE - Lesson View
  // ══════════════════════════════════════════════════════════════

  if (phase === "saber" && activeLesson !== null) {
    const lesson = SABER_LESSONS[activeLesson];
    const isRead = saberCompleted[activeLesson];

    return (
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setActiveLesson(null)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={16} />
            Volver a lecciones
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Lección {lesson.id}: {lesson.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{lesson.subtitle}</p>
        </div>

        {/* Reading metadata */}
        <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            {lesson.readingTime} min de lectura
          </div>
          {isRead && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
              Leído
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 space-y-6 mb-6">
          {lesson.sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {section.content.map((para, pidx) => (
                  <p key={pidx}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Key Takeaway */}
          <div className="mt-8 border-t border-gray-200 pt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Punto clave</h3>
            <p className="text-sm text-blue-800">{lesson.keyTakeaway}</p>
          </div>
        </div>

        {/* Mark as read button */}
        {!isRead && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => markLessonAsRead(activeLesson)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
            >
              <Check size={18} />
              Marcar como leído
            </button>
          </div>
        )}

        {isRead && (
          <div className="flex justify-center mb-6">
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check size={16} />
              Lección completada
            </p>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // SABER PHASE - Lessons List
  // ══════════════════════════════════════════════════════════════

  if (phase === "saber") {
    return (
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a href="/alumno/programa" className="hover:text-blue-600">
              Programa
            </a>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900">Paso 0</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mentalidad: de Fisio a Empresario
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Antes de los ejercicios prácticos, aprender la teoría que te
            permitirá entender el contexto.
          </p>
        </div>

        {/* Phase selector */}
        <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
          <button
            onClick={() => setPhase("saber")}
            className="rounded-md px-4 py-2 text-sm font-medium transition-all bg-white text-blue-700 shadow-sm"
          >
            SABER (Teoría)
          </button>
          <button
            disabled={!allSaberComplete}
            onClick={() => setPhase("decidir")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center gap-1 ${
              allSaberComplete
                ? "text-gray-700 hover:text-gray-900"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            {!allSaberComplete && <Lock size={14} />}
            DECIDIR (Ejercicios)
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Progreso: {saberCompleted.filter(Boolean).length} de 6 lecciones
              completadas
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{
                width: `${(saberCompleted.filter(Boolean).length / 6) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Lessons list */}
        <div className="space-y-3">
          {SABER_LESSONS.map((lesson, idx) => {
            const isRead = saberCompleted[idx];
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(idx)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isRead
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {lesson.id}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {lesson.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {lesson.subtitle}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {lesson.readingTime} min
                      </div>
                      {isRead && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check size={14} />
                          Completado
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isRead ? (
                      <div className="rounded-full bg-green-100 p-2">
                        <Check size={20} className="text-green-600" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-gray-100 p-2">
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Completion message */}
        {allSaberComplete && (
          <div className="mt-8 rounded-lg bg-green-50 border border-green-200 p-6 text-center">
            <div className="flex justify-center mb-3">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ¡Felicidades!
            </h3>
            <p className="text-sm text-green-800 mb-4">
              Has completado todas las lecciones de SABER. Ahora estás listo
              para los ejercicios prácticos de DECIDIR.
            </p>
            <button
              onClick={() => setPhase("decidir")}
              className="flex items-center gap-2 mx-auto rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
            >
              Continuar a Ejercicios
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DECIDIR PHASE - Exercises
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/alumno/programa" className="hover:text-blue-600">
            Programa
          </a>
          <ChevronRight size={14} />
          <span className="font-medium text-gray-900">Paso 0</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mentalidad: de Fisio a Empresario
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ahora es el momento de reflexionar y comprometerte con el cambio.
        </p>
      </div>

      {/* Phase selector */}
      <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setPhase("saber")}
          className="rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center gap-1 text-gray-700 hover:text-gray-900"
        >
          <BookOpen size={14} />
          SABER (Teoría)
        </button>
        <button
          onClick={() => setPhase("decidir")}
          className="rounded-md px-4 py-2 text-sm font-medium transition-all bg-white text-blue-700 shadow-sm"
        >
          DECIDIR (Ejercicios)
        </button>
      </div>

      {/* Save indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        {saving && (
          <span className="flex items-center gap-1 text-blue-500">
            <Loader2 size={14} className="animate-spin" /> Guardando...
          </span>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-green-600">
            <Check size={14} /> Guardado
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* ── Tab: Situación ── */}
        {tab === "situacion" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Tu situación actual
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Sé honesto contigo mismo. Nadie más verá estas respuestas.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe tu situación actual como dueño de clínica
              </label>
              <textarea
                value={ej1.situacionActual}
                onChange={(e) => updateEj1("situacionActual", e.target.value)}
                rows={4}
                placeholder="¿Cómo te sientes? ¿Cómo es tu día a día? ¿Estás donde querías estar?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas/semana en la clínica
                </label>
                <input
                  type="number"
                  value={ej1.horasSemanaClinica || ""}
                  onChange={(e) => updateEj1("horasSemanaClinica", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas/semana tratando
                </label>
                <input
                  type="number"
                  value={ej1.horasSemanaTratando || ""}
                  onChange={(e) => updateEj1("horasSemanaTratando", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas/semana en gestión
                </label>
                <input
                  type="number"
                  value={ej1.horasSemanaGestion || ""}
                  onChange={(e) => updateEj1("horasSemanaGestion", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {ej1.horasSemanaClinica > 0 && ej1.horasSemanaTratando > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>
                    {Math.round(
                      (ej1.horasSemanaTratando / ej1.horasSemanaClinica) * 100
                    )}%
                  </strong>{" "}
                  de tu tiempo lo pasas tratando pacientes.{" "}
                  {ej1.horasSemanaTratando / ej1.horasSemanaClinica > 0.7
                    ? "Eres más técnico que empresario. Ese es precisamente el cambio que vamos a trabajar."
                    : ej1.horasSemanaTratando / ej1.horasSemanaClinica > 0.4
                    ? "Estás en una zona híbrida. Tienes margen para crecer como empresario."
                    : "Ya dedicas más tiempo a gestionar que a tratar. Buen punto de partida."}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Por qué abriste tu clínica?
              </label>
              <textarea
                value={ej1.porQueAbriste}
                onChange={(e) => updateEj1("porQueAbriste", e.target.value)}
                rows={3}
                placeholder="Vuelve al origen. ¿Qué te motivó a dar el paso?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué es lo que más te frustra del día a día?
              </label>
              <textarea
                value={ej1.queTeFrustra}
                onChange={(e) => updateEj1("queTeFrustra", e.target.value)}
                rows={3}
                placeholder="Sin filtros. ¿Qué te quita energía, qué te preocupa?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo te gustaría que fuera tu vida dentro de 12 meses?
              </label>
              <textarea
                value={ej1.queTeGustaría}
                onChange={(e) => updateEj1("queTeGustaría", e.target.value)}
                rows={3}
                placeholder="Sé concreto. Horarios, ingresos, equipo, vacaciones, sensaciones..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Satisfaction scales */}
            <div className="space-y-4">
              {[
                {
                  key: "nivelSatisfaccion" as const,
                  label: "Nivel de satisfacción con tu clínica",
                  color: "blue",
                },
                {
                  key: "nivelEstres" as const,
                  label: "Nivel de estrés",
                  color: "red",
                },
                {
                  key: "nivelControl" as const,
                  label: "Sensación de control sobre el negocio",
                  color: "green",
                },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}:{" "}
                    <span className={`font-bold text-${color}-600`}>
                      {ej1[key]}/10
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ej1[key]}
                    onChange={(e) => updateEj1(key, +e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Miedos y excusas ── */}
        {tab === "miedos" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Miedos, excusas y creencias limitantes
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Todo empresario los tiene. Ponerlos por escrito es el primer paso
                para superarlos.
              </p>
            </div>

            {/* Miedos */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Mis miedos como dueño de clínica
              </label>
              {ej1.miedos.map((m, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={m}
                    onChange={(e) => updateListItem("miedos", i, e.target.value)}
                    placeholder={`Miedo ${i + 1}...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.miedos.length > 1 && (
                    <button
                      onClick={() => removeListItem("miedos", i)}
                      className="text-red-400 hover:text-red-600 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem("miedos")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Añadir miedo
              </button>
            </div>

            {/* Excusas */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flame size={16} className="text-orange-500" />
                Excusas que me pongo para no cambiar
              </label>
              {ej1.excusas.map((e, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={e}
                    onChange={(ev) => updateListItem("excusas", i, ev.target.value)}
                    placeholder={`Excusa ${i + 1}: "Es que no tengo tiempo para...", "Es que mi zona..."...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.excusas.length > 1 && (
                    <button
                      onClick={() => removeListItem("excusas", i)}
                      className="text-red-400 hover:text-red-600 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem("excusas")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Añadir excusa
              </button>
            </div>

            {/* Creencias limitantes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Brain size={16} className="text-purple-500" />
                Creencias limitantes que detecto en mí
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Ejemplos: "Los fisios no podemos cobrar más", "Si subo el precio
                perderé pacientes", "No sé de números"...
              </p>
              {ej1.creenciasLimitantes.map((c, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={c}
                    onChange={(e) =>
                      updateListItem("creenciasLimitantes", i, e.target.value)
                    }
                    placeholder={`Creencia ${i + 1}...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.creenciasLimitantes.length > 1 && (
                    <button
                      onClick={() => removeListItem("creenciasLimitantes", i)}
                      className="text-red-400 hover:text-red-600 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem("creenciasLimitantes")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Añadir creencia
              </button>
            </div>

            {ej1.miedos.filter(Boolean).length > 0 &&
              ej1.excusas.filter(Boolean).length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    <strong>
                      Has identificado {ej1.miedos.filter(Boolean).length} miedos
                      y {ej1.excusas.filter(Boolean).length} excusas.
                    </strong>{" "}
                    Reconocerlos es valiente y necesario. Durante el programa,
                    trabajaremos sobre cada uno de ellos con acciones concretas.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* ── Tab: Identidad ── */}
        {tab === "identidad" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ¿Quién eres hoy?
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                No hay respuesta buena o mala. Hay una respuesta honesta.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  value: "tecnico" as const,
                  icon: Heart,
                  title: "Técnico",
                  desc: "Trato pacientes todo el día. La gestión me la como con patatas. Mi clínica depende de mí al 100%.",
                  color: "red",
                },
                {
                  value: "hibrido" as const,
                  icon: Target,
                  title: "Híbrido",
                  desc: "Trato y gestiono. Hago de todo. A veces siento que no hago nada bien porque no me da la vida.",
                  color: "amber",
                },
                {
                  value: "empresario" as const,
                  icon: Lightbulb,
                  title: "Empresario",
                  desc: "Dedico la mayor parte del tiempo a gestionar, planificar y hacer crecer el negocio.",
                  color: "green",
                },
              ].map(({ value, icon: Icon, title, desc, color }) => (
                <button
                  key={value}
                  onClick={() => updateEj1("identidad", value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    ej1.identidad === value
                      ? `border-${color}-500 bg-${color}-50 ring-2 ring-${color}-200`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon size={24} className={`mb-2 text-${color}-500`} />
                  <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-xs text-gray-600">{desc}</p>
                </button>
              ))}
            </div>

            {ej1.identidad && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  {ej1.identidad === "tecnico" && (
                    <>
                      Te identificas como <strong>técnico</strong>. Es el punto de
                      partida más habitual en nuestros alumnos. El programa ACTIVA
                      está diseñado exactamente para este salto: de fisio a
                      empresario, paso a paso.
                    </>
                  )}
                  {ej1.identidad === "hibrido" && (
                    <>
                      Estás en la <strong>zona híbrida</strong>. Ya has dado algunos
                      pasos, pero probablemente sientes que no avanzas lo suficiente
                      en ninguna dirección. ACTIVA te ayudará a estructurar ese
                      cambio.
                    </>
                  )}
                  {ej1.identidad === "empresario" && (
                    <>
                      Ya te identificas como <strong>empresario</strong>. ACTIVA te
                      ayudará a consolidar lo que ya tienes y a identificar los
                      puntos ciegos que todo empresario tiene.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Carta de compromiso ── */}
        {tab === "compromiso" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Tu carta de compromiso
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Este es un pacto contigo mismo. Escríbelo con honestidad. Volveremos
                a leerlo en el Paso 16.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mi compromiso con este programa
              </label>
              <textarea
                value={ej2.compromiso}
                onChange={(e) => updateEj2("compromiso", e.target.value)}
                rows={4}
                placeholder="Yo me comprometo a... (sé específico: horas, actitud, acciones concretas)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué estoy dispuesto a cambiar?
              </label>
              <textarea
                value={ej2.queEstoyDispuestoACambiar}
                onChange={(e) =>
                  updateEj2("queEstoyDispuestoACambiar", e.target.value)
                }
                rows={3}
                placeholder="Hábitos, horarios, formas de pensar, decisiones que llevo posponiendo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué dejo de hacer a partir de hoy?
              </label>
              <textarea
                value={ej2.queDejoDeHacer}
                onChange={(e) => updateEj2("queDejoDeHacer", e.target.value)}
                rows={3}
                placeholder="Quejarme sin actuar, comparar mi clínica con otras, poner excusas..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo mediré mi progreso?
              </label>
              <textarea
                value={ej2.comoMedireMiProgreso}
                onChange={(e) => updateEj2("comoMedireMiProgreso", e.target.value)}
                rows={3}
                placeholder="Completar cada paso a tiempo, aplicar lo aprendido la misma semana, llevar un diario..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Firma */}
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tu firma (nombre completo)
                  </label>
                  <input
                    value={ej2.firma}
                    onChange={(e) => updateEj2("firma", e.target.value)}
                    placeholder="Nombre y apellidos"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={ej2.fecha}
                    onChange={(e) => updateEj2("fecha", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {ej2.firma && (
                <p className="mt-4 text-center text-lg italic text-gray-600">
                  &ldquo;{ej2.firma}&rdquo; — {ej2.fecha}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {prevTab ? (
          <button
            onClick={() => setTab(prevTab.key)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            {prevTab.label}
          </button>
        ) : (
          <button
            onClick={() => setPhase("saber")}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            Volver a SABER
          </button>
        )}

        <button
          onClick={() => save(ej1, ej2, saberCompleted)}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Guardar
        </button>

        {nextTab ? (
          <button
            onClick={() => setTab(nextTab.key)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {nextTab.label}
            <ChevronRight size={16} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
