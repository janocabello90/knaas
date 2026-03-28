"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Brain,
  Calendar,
  Mail,
  Activity,
  BookOpen,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  GraduationCap,
  Eye,
  ArrowLeftRight,
  Gamepad2,
  ChevronDown,
  UserCircle,
  Lock,
  ClipboardCheck,
  KeyRound,
  CreditCard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeId?: string; // used to match dynamic badge counts
};

type NavSection = {
  title?: string;
  items: NavItem[];
  locked?: boolean;
  lockedLabel?: string;
};

const adminSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
      { label: "Alumnos", href: "/admin/alumnos", icon: <Users size={20} /> },
      { label: "Cohortes", href: "/admin/cohortes", icon: <FolderKanban size={20} /> },
      { label: "Cerebro FR", href: "/admin/cerebro-fr", icon: <Brain size={20} /> },
      { label: "Cuadro de Mandos", href: "/admin/metricas", icon: <BarChart3 size={20} /> },
      { label: "Mentorías", href: "/admin/mentorias", icon: <Calendar size={20} /> },
      { label: "Mensajes", href: "/admin/mensajes", icon: <Mail size={20} />, badgeId: "unread-messages" },
      { label: "Accesos", href: "/admin/accesos", icon: <KeyRound size={20} /> },
      { label: "Facturación", href: "/admin/facturacion", icon: <CreditCard size={20} /> },
      { label: "Monitoring IA", href: "/admin/monitoring", icon: <Activity size={20} /> },
      { label: "Tareas", href: "/admin/tareas", icon: <ClipboardCheck size={20} /> },
    ],
  },
];

const playgroundSections: NavSection[] = [
  {
    items: [
      { label: "Playground", href: "/admin/playground", icon: <Gamepad2 size={20} /> },
    ],
  },
];

const mentorSections: NavSection[] = [
  {
    items: [
      { label: "Mi Cohorte", href: "/mentor", icon: <LayoutDashboard size={20} /> },
      { label: "Alumnos", href: "/mentor/alumnos", icon: <Users size={20} /> },
      { label: "Mentorías", href: "/mentor/mentorias", icon: <Calendar size={20} /> },
      { label: "Mensajes", href: "/mentor/mensajes", icon: <Mail size={20} />, badgeId: "unread-messages" },
    ],
  },
];

function buildAlumnoSections(activeProgram: string | null): NavSection[] {
  const programa = activeProgram ?? "ACTIVA";

  const activaItems: NavItem[] = [
    { label: "Mi Programa", href: "/alumno/programa", icon: <BookOpen size={20} /> },
    { label: "Academia IA", href: "/alumno/academia", icon: <Bot size={20} /> },
    { label: "Mentorías", href: "/alumno/mentorias", icon: <Calendar size={20} /> },
    { label: "Mensajes", href: "/alumno/mensajes", icon: <Mail size={20} />, badgeId: "unread-messages" },
  ];

  const sections: NavSection[] = [];

  // Active program section
  if (programa === "ACTIVA") {
    sections.push({ title: "ACTIVA", items: activaItems });
    sections.push({ title: "OPTIMIZA", items: [], locked: true });
    sections.push({ title: "ESCALA", items: [], locked: true });
  } else if (programa === "OPTIMIZA") {
    sections.push({ title: "ACTIVA", items: [{ label: "Completado", href: "/alumno/programa", icon: <BookOpen size={20} /> }] });
    sections.push({ title: "OPTIMIZA", items: activaItems });
    sections.push({ title: "ESCALA", items: [], locked: true });
  } else if (programa === "ESCALA") {
    sections.push({ title: "ACTIVA", items: [{ label: "Completado", href: "/alumno/programa", icon: <BookOpen size={20} /> }] });
    sections.push({ title: "OPTIMIZA", items: [{ label: "Completado", href: "/alumno/programa", icon: <BookOpen size={20} /> }] });
    sections.push({ title: "ESCALA", items: activaItems });
  }

  // Métricas de mi clínica
  sections.push({
    title: "Métricas de mi clínica",
    items: [
      { label: "Mi Cuadro de Mandos", href: "/alumno/metricas", icon: <BarChart3 size={20} /> },
    ],
  });

  // Comunidad
  sections.push({
    title: "Comunidad",
    items: [
      { label: "Mi Cohorte", href: "/alumno/comunidad/mi-cohorte", icon: <Users size={20} /> },
      { label: "Resto de Alumnos", href: "/alumno/comunidad/alumnos", icon: <UserCircle size={20} /> },
    ],
  });

  return sections;
}

interface SidebarProps {
  role: "SUPERADMIN" | "MENTOR" | "ALUMNO";
  userName: string;
  userInitials: string;
  activeProgram?: string | null;
}

export function Sidebar({ role, userName, userInitials, activeProgram = null }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Unread messages badge
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/alumno/mensajes/unread-count")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => {});

    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetch("/api/alumno/mensajes/unread-count")
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.count || 0))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge counts map
  const badgeCounts: Record<string, number> = {
    "unread-messages": unreadCount,
  };

  // View mode: only available for SUPERADMIN
  const canSwitchView = role === "SUPERADMIN";
  const [viewMode, setViewMode] = useState<"admin" | "alumno" | "playground">("admin");

  // Detect view mode from current path
  useEffect(() => {
    if (canSwitchView) {
      if (pathname.startsWith("/admin/playground")) {
        setViewMode("playground");
      } else if (pathname.startsWith("/alumno")) {
        setViewMode("alumno");
      } else {
        setViewMode("admin");
      }
    }
  }, [pathname, canSwitchView]);

  const viewModes = [
    { key: "admin" as const, label: "Admin", href: "/admin" },
    { key: "alumno" as const, label: "Alumno", href: "/alumno/programa" },
    { key: "playground" as const, label: "Playground", href: "/admin/playground" },
  ];

  // Determine which sections to show based on role + viewMode
  let activeSections: NavSection[];
  let activeRoleLabel: string;
  let activeRoleColor: string;

  if (role === "SUPERADMIN" && viewMode === "playground") {
    activeSections = playgroundSections;
    activeRoleLabel = "Playground";
    activeRoleColor = "bg-orange-100 text-orange-700";
  } else if (role === "SUPERADMIN" && viewMode === "alumno") {
    activeSections = buildAlumnoSections(activeProgram);
    activeRoleLabel = "Admin · Vista Alumno";
    activeRoleColor = "bg-amber-100 text-amber-700";
  } else if (role === "SUPERADMIN") {
    activeSections = adminSections;
    activeRoleLabel = "Administrador";
    activeRoleColor = "bg-purple-100 text-purple-700";
  } else if (role === "MENTOR") {
    activeSections = mentorSections;
    activeRoleLabel = "Mentor";
    activeRoleColor = "bg-teal-100 text-teal-700";
  } else {
    activeSections = buildAlumnoSections(activeProgram);
    activeRoleLabel = "Alumno";
    activeRoleColor = "bg-blue-100 text-blue-700";
  }

  const settingsHref =
    role === "SUPERADMIN"
      ? viewMode === "alumno"
        ? "/alumno/area-privada"
        : "/admin/ajustes"
      : role === "MENTOR"
        ? "/mentor/ajustes"
        : "/alumno/area-privada";

  const programColors: Record<string, { bg: string; text: string; border: string }> = {
    ACTIVA: { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-200" },
    OPTIMIZA: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200" },
    ESCALA: { bg: "bg-purple-600", text: "text-purple-700", border: "border-purple-200" },
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <GraduationCap size={28} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-gray-900">Academia</p>
              <p className="text-[10px] text-gray-500">FisioReferentes</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ChevronLeft
            size={18}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Role badge + View switcher */}
      {!collapsed && (
        <div className="shrink-0 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                activeRoleColor
              )}
            >
              {activeRoleLabel}
            </span>
          </div>
          {canSwitchView && (
            <div className="mt-2 flex gap-1 rounded-lg bg-gray-100 p-0.5">
              {viewModes.map((vm) => (
                <button
                  key={vm.key}
                  onClick={() => { setViewMode(vm.key); router.push(vm.href); }}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    viewMode === vm.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {vm.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed view switcher */}
      {collapsed && canSwitchView && (
        <div className="shrink-0 border-b border-gray-200 px-2 py-2 space-y-1">
          {viewModes.map((vm) => (
            <button
              key={vm.key}
              onClick={() => { setViewMode(vm.key); router.push(vm.href); }}
              className={cn(
                "flex w-full items-center justify-center rounded-md p-1.5 transition-colors",
                viewMode === vm.key
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              )}
              title={vm.label}
            >
              {vm.key === "admin" ? <LayoutDashboard size={16} /> : vm.key === "alumno" ? <Eye size={16} /> : <Gamepad2 size={16} />}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {activeSections.map((section, sIdx) => {
          const isProgramSection = ["ACTIVA", "OPTIMIZA", "ESCALA"].includes(section.title ?? "");
          const colors = isProgramSection ? programColors[section.title ?? ""] : null;

          return (
            <div key={sIdx} className={cn(sIdx > 0 && "mt-3")}>
              {/* Section title */}
              {section.title && !collapsed && (
                <div className="mb-2 flex items-center gap-2 px-3">
                  {isProgramSection && (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        section.locked ? "bg-gray-300" : colors?.bg
                      )}
                    />
                  )}
                  <p
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      section.locked ? "text-gray-300" : isProgramSection ? colors?.text : "text-gray-400"
                    )}
                  >
                    {section.title}
                  </p>
                  {section.locked && <Lock size={10} className="text-gray-300" />}
                </div>
              )}

              {/* Collapsed section separator */}
              {sIdx > 0 && collapsed && (
                <div className="mx-2 mb-2 border-t border-gray-200" />
              )}


              {/* Nav items */}
              {!section.locked && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      item.href === pathname ||
                      (item.href !== "/admin" &&
                        item.href !== "/mentor" &&
                        pathname.startsWith(item.href));

                    const badge = item.badgeId ? badgeCounts[item.badgeId] || 0 : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                          collapsed && "justify-center px-2"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="relative">
                          {item.icon}
                          {badge > 0 && collapsed && (
                            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                          )}
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {badge > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                {badge > 99 ? "99+" : badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User & Settings */}
      <div className="shrink-0 border-t border-gray-200 p-2">
        <Link
          href={settingsHref}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings size={20} />
          {!collapsed && <span>{settingsHref.includes("admin") ? "Ajustes" : "Área Privada"}</span>}
        </Link>

        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
