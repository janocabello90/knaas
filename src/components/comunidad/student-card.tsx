"use client";

import { MapPin, Briefcase, Linkedin, Instagram, Shield, Star } from "lucide-react";

export type StudentData = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  city: string | null;
  province: string | null;
  specialty: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  bio: string | null;
  cohortName: string;
  program: string;
  completedSteps: number;
  role?: string;
};

export function StudentCard({ student }: { student: StudentData }) {
  const initials = `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();
  const location = [student.city, student.province].filter(Boolean).join(", ");
  const progressPct = Math.round((student.completedSteps / 16) * 100);
  const isStaff = student.role === "SUPERADMIN" || student.role === "MENTOR";

  const avatarBorderColor = student.role === "SUPERADMIN"
    ? "ring-2 ring-purple-400"
    : student.role === "MENTOR"
      ? "ring-2 ring-teal-400"
      : "";

  return (
    <div className={`rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${isStaff ? "border-purple-200 bg-purple-50/30" : "border-gray-200"}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {student.photo ? (
          <img
            src={student.photo}
            alt={`${student.firstName} ${student.lastName}`}
            className={`h-14 w-14 shrink-0 rounded-full object-cover ${avatarBorderColor}`}
          />
        ) : (
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${isStaff ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"} ${avatarBorderColor}`}>
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Name + role/program badge */}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {student.firstName} {student.lastName}
            </h3>
            {student.role === "SUPERADMIN" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                <Shield size={10} />
                Admin
              </span>
            )}
            {student.role === "MENTOR" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                <Star size={10} />
                Mentor
              </span>
            )}
            {!isStaff && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                {student.program}
              </span>
            )}
          </div>

          {/* Cohort */}
          <p className="mt-0.5 text-xs text-gray-500">{student.cohortName}</p>

          {/* Location */}
          {location && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />
              <span>{location}</span>
            </div>
          )}

          {/* Specialty + experience */}
          {(student.specialty || student.yearsExperience) && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Briefcase size={12} />
              <span>
                {student.specialty}
                {student.specialty && student.yearsExperience ? " · " : ""}
                {student.yearsExperience ? `${student.yearsExperience} años exp.` : ""}
              </span>
            </div>
          )}

          {/* Bio */}
          {student.bio && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-600">{student.bio}</p>
          )}

          {/* Progress bar (only for students) */}
          {!isStaff && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Progreso</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Social links */}
          {(student.linkedinUrl || student.instagramUrl) && (
            <div className="mt-3 flex gap-2">
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Linkedin size={14} />
                </a>
              )}
              {student.instagramUrl && (
                <a
                  href={student.instagramUrl.startsWith("http") ? student.instagramUrl : `https://instagram.com/${student.instagramUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                >
                  <Instagram size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
