"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  GraduationCap,
  PartyPopper,
  Users,
  UtensilsCrossed,
  MessageSquare,
  Check,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Attendance = "si" | "no" | "no_se";

type RsvpData = {
  attendance: Attendance;
  guests: number;
  guest_names: string;
  allergies: string;
  dietary_notes: string;
  comments: string;
};

type CohortInfo = {
  id: string;
  name: string;
  endDate: string | null;
};

export default function Paso13GraduacionPage() {
  const [rsvp, setRsvp] = useState<RsvpData | null>(null);
  const [cohort, setCohort] = useState<CohortInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [attendance, setAttendance] = useState<Attendance>("no_se");
  const [guests, setGuests] = useState(0);
  const [guestNames, setGuestNames] = useState("");
  const [allergies, setAllergies] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetch("/api/alumno/graduacion")
      .then((r) => r.json())
      .then((data) => {
        if (data.cohort) setCohort(data.cohort);
        if (data.rsvp) {
          setRsvp(data.rsvp);
          setAttendance((data.rsvp.attendance as Attendance) ?? "no_se");
          setGuests(data.rsvp.guests ?? 0);
          setGuestNames(data.rsvp.guest_names ?? "");
          setAllergies(data.rsvp.allergies ?? "");
          setDietaryNotes(data.rsvp.dietary_notes ?? "");
          setComments(data.rsvp.comments ?? "");
        }
      })
      .catch(() => setError("Error al cargar los datos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/alumno/graduacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance,
          guests: attendance === "si" ? guests : 0,
          guestNames: attendance === "si" ? guestNames : "",
          allergies: attendance === "si" ? allergies : "",
          dietaryNotes: attendance === "si" ? dietaryNotes : "",
          comments,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Back link */}
      <Link
        href="/alumno/programa"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Volver al programa
      </Link>

      {/* ═══════════════════════════════════════════════════════════
          GRADUATION INVITATION CARD
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50">
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-rose-100/50" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-100/50" />

        <div className="relative p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <Image
                src="/ACTIVA.png"
                alt="ACTIVA"
                width={60}
                height={60}
                className="h-12 w-auto"
              />
              <GraduationCap size={40} className="text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Graduación ACTIVA
            </h1>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-rose-400 to-amber-400" />
          </div>

          {/* Invitation body */}
          <div className="mb-6 rounded-xl bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <PartyPopper size={28} className="mx-auto mb-3 text-amber-500" />
            <p className="text-lg font-medium text-gray-800">
              ¡Estás invitado/a a la ceremonia de graduación!
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Después de 4 meses de trabajo intenso, es hora de celebrar tu
              transformación como fisioterapeuta empresario. Queremos compartir
              este momento contigo y con las personas que te han acompañado en el
              camino.
            </p>
          </div>

          {/* Event details */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-sm">
              <Calendar size={20} className="shrink-0 text-rose-400" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Fecha
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {cohort?.endDate
                    ? new Date(cohort.endDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Por confirmar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-sm">
              <Clock size={20} className="shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Hora
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Por confirmar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-sm">
              <MapPin size={20} className="shrink-0 text-rose-400" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Lugar
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Por confirmar
                </p>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="mt-6 rounded-xl bg-white/80 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Star size={16} className="text-amber-500" /> ¿Qué incluye la
              graduación?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Ceremonia de entrega de diplomas ACTIVA
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Presentación de tu informe de consolidación y evolución
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Networking con tu cohorte y mentores
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Comida / cena de celebración
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Adelanto exclusivo del programa OPTIMIZA
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RSVP FORM
          ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-gray-900">
          <MessageSquare size={22} className="text-rose-500" />
          Confirma tu asistencia
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Necesitamos saber si podrás venir para organizar todo bien.
          {rsvp && (
            <span className="ml-1 text-green-600">
              (Ya respondiste — puedes actualizar tu respuesta)
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendance */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              ¿Vienes a la graduación?
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                {
                  value: "si" as Attendance,
                  label: "¡Sí, voy!",
                  emoji: "🎉",
                  color: "border-green-300 bg-green-50 text-green-800 ring-green-200",
                },
                {
                  value: "no" as Attendance,
                  label: "No puedo ir",
                  emoji: "😔",
                  color: "border-gray-300 bg-gray-50 text-gray-700 ring-gray-200",
                },
                {
                  value: "no_se" as Attendance,
                  label: "No lo sé todavía",
                  emoji: "🤔",
                  color: "border-amber-300 bg-amber-50 text-amber-800 ring-amber-200",
                },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAttendance(opt.value)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-center transition-all",
                    attendance === opt.value
                      ? `${opt.color} ring-2`
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <p className="mt-1 text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional fields for "si" */}
          {attendance === "si" && (
            <div className="space-y-5 rounded-xl border border-green-200 bg-green-50/50 p-5">
              {/* Guests count */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-green-600" />
                  ¿Cuántos acompañantes traes?
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Sin contarte a ti. Pon 0 si vienes solo/a.
                </p>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              {/* Guest names */}
              {guests > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Nombres de los acompañantes
                  </label>
                  <input
                    type="text"
                    value={guestNames}
                    onChange={(e) => setGuestNames(e.target.value)}
                    placeholder="Ej: María García, Pedro López"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              )}

              {/* Allergies */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <UtensilsCrossed size={16} className="text-amber-600" />
                  ¿Alguna alergia alimentaria?
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Tuyas o de tus acompañantes. Déjalo en blanco si no hay.
                </p>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Ej: Gluten, frutos secos, mariscos..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              {/* Dietary notes */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Preferencias alimentarias
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Vegetariano, vegano, halal, kosher, etc.
                </p>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ej: Vegetariano, sin lactosa..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>
          )}

          {/* Comments (always visible) */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              ¿Algo que quieras contarnos?
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Comentarios, sugerencias, lo que necesites..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
              saved
                ? "bg-green-600 text-white"
                : "bg-rose-600 text-white hover:bg-rose-700",
              saving && "cursor-not-allowed opacity-70"
            )}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                ¡Respuesta guardada!
              </>
            ) : (
              <>
                <GraduationCap size={18} />
                {rsvp ? "Actualizar respuesta" : "Enviar respuesta"}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Step 13 content area - lessons */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="mb-1 text-xl font-bold text-gray-900">
          Paso 13 — La graduación ACTIVA
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Los sistemas vitales para tu nuevo negocio
        </p>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Lo que trabajamos en este paso
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Descubre los sistemas vitales para que tu negocio crezca sin caos
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Evaluación de consolidación de los 13 pasos anteriores
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Comparativa numérica: dónde empezaste vs dónde estás ahora
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                Decisión sobre tu siguiente paso hacia OPTIMIZA
              </li>
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="mb-1 text-xs font-medium uppercase text-rose-600">
                Informe de consolidación
              </p>
              <p className="text-sm text-gray-600">
                Tu progreso cuantitativo y cualitativo comparando el Paso 1
                con tu situación actual.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-xs font-medium uppercase text-amber-600">
                Plan de siguiente paso
              </p>
              <p className="text-sm text-gray-600">
                Tu hoja de ruta personalizada hacia OPTIMIZA con fechas y
                objetivos concretos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
