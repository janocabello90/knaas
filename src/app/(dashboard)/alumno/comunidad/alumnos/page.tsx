"use client";

import { useEffect, useState } from "react";
import { StudentCard, StudentData } from "@/components/comunidad/student-card";
import { Users, Search } from "lucide-react";

export default function TodosAlumnosPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/alumno/comunidad?type=todos")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      (s.city ?? "").toLowerCase().includes(term) ||
      (s.specialty ?? "").toLowerCase().includes(term) ||
      (s.cohortName ?? "").toLowerCase().includes(term)
    );
  });

  // Group by cohort
  const byCohort: Record<string, StudentData[]> = {};
  filtered.forEach((s) => {
    const key = s.cohortName || "Sin cohorte";
    if (!byCohort[key]) byCohort[key] = [];
    byCohort[key].push(s);
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resto de Alumnos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Alumnos de otras cohortes de FisioReferentes
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad, especialidad o cohorte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-500">
            {students.length === 0
              ? "Aún no hay alumnos en otras cohortes"
              : "No se encontraron resultados"}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-500">
            {filtered.length} alumno{filtered.length !== 1 ? "s" : ""} en otras cohortes
          </p>
          {Object.entries(byCohort).map(([cohortName, cohortStudents]) => (
            <div key={cohortName} className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {cohortName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cohortStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
