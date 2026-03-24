"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
  { label: "Alumnos", href: "/admin/alumnos", icon: <Users size={20} /> },
  { label: "Cohortes", href: "/admin/cohortes", icon: <FolderKanban size={20} /> },
  { label: "Cerebro FR", href: "/admin/cerebro-fr", icon: <Brain size={20} /> },
  { label: "Mentorías", href: "/admin/mentorias", icon: <Calendar size={20} /> },
  { label: "Mensajes", href: "/admin/mensajes", icon: <Mail size={20} /> },
  { label: "Monitoring IA", href: "/admin/monitoring", icon: <Activity size={20} /> },
];

const mentorNav: NavItem[] = [
  { label: "Mi Cohorte", href: "/mentor", icon: <LayoutDashboard size={20} /> },
  { label: "Alumnos", href: "/mentor/alumnos", icon: <Users size={20} /> },
  { label: "Mentorías", href: "/mentor/mentorias", icon: <Calendar size={20} /> },
  { label: "Mensajes", href: "/mentor/mensajes", icon: <Mail size={20} /> },
];

const alumnoNav: NavItem[] = [
  { label: "Mi Programa", href: "/alumno/programa", icon: <BookOpen size={20} /> },
  { label: "KNAAS", href: "/alumno/knaas", icon: <Bot size={20} /> },
  { label: "PodiumMetrics", href: "/alumno/metricas", icon: <BarChart3 size={20} /> },
  { label: "Mentorías", href: "/alumno/mentorias", icon: <Calendar size={20} /> },
  { label: "Mensajes", href: "/alumno/mensajes", icon: <Mail size={20} /> },
];

interface SidebarProps {
  role: "SUPERADMIN" | "MENTOR" | "ALUMNO";
  userName: string;
  userInitials: string;
}

export function Sidebar({ role, userName, userInitials }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    role === "SUPERADMIN" ? adminNav : role === "MENTOR" ? mentorNav : alumnoNav;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <GraduationCap size={28} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-gray-900">KNAAS</p>
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

      {/* Role badge */}
      {!collapsed && (
        <div className="border-b border-gray-200 px-4 py-3">
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              role === "SUPERADMIN" && "bg-purple-100 text-purple-700",
              role === "MENTOR" && "bg-teal-100 text-teal-700",
              role === "ALUMNO" && "bg-blue-100 text-blue-700"
            )}
          >
            {role === "SUPERADMIN" ? "Super Admin" : role === "MENTOR" ? "Mentor" : "Alumno"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === pathname ||
            (item.href !== "/admin" &&
              item.href !== "/mentor" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Settings */}
      <div className="border-t border-gray-200 p-2">
        <Link
          href={role === "SUPERADMIN" ? "/admin/ajustes" : role === "MENTOR" ? "/mentor/ajustes" : "/alumno/ajustes"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings size={20} />
          {!collapsed && <span>Ajustes</span>}
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
