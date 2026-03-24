"use client";

import { useEffect, useState } from "react";
import { StudentCard, StudentData } from "@/components/comunidad/student-card";
import { Users, Search } from "lucide-react";

export default function MiCohortePage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [cohortName, setCohortName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/alumno/comunidad?type=mi-cohorte")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
        setCohortName(data.cohortName ?? null);
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
      (s.specialty ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Cohorte</h1>
        {cohortName && (
          <p className="mt-1 text-sm text-gray-500">{cohortName}</p>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad o especialidad..."
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
              ? "Aún no hay compañeros en tu cohorte"
              : "No se encontraron resultados"}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-500">
            {filtered.length} compañero{filtered.length !== 1 ? "s" : ""} de cohorte
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
