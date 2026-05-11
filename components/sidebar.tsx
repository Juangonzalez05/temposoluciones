// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  ClockIcon,
  Users,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Definición de los ítems del menú de navegación
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Resumen del día",
  },
  {
    label: "Nuevo Ingreso",
    href: "/ingresos/nuevo",
    icon: ArrowDownLeft,
    description: "Registrar pago recibido",
    highlight: true, // Ítem destacado visualmente
  },
  {
    label: "Nuevo Egreso",
    href: "/egresos/nuevo",
    icon: ArrowUpRight,
    description: "Registrar pago realizado",
  },
];

const secondaryItems = [
  {
    label: "Historial",
    href: "/historial",
    icon: ClockIcon,
    description: "Todos los movimientos",
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    description: "Resumen por período",
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Gestionar afiliados",
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay oscuro para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base: fijo, altura completa, ancho fijo
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40",
          "flex flex-col transition-transform duration-300 ease-in-out",
          // En móvil: se oculta fuera de la pantalla si está cerrado
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* ── Encabezado: Logo y nombre ── */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">TempoSoluciones</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sistema de Caja</p>
            </div>
          </div>
          {/* Botón de cierre (solo en móvil) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Navegación principal ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Sección principal */}
          <div className="space-y-1 mb-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Principal
            </p>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group cursor-pointer",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    // Ítem de "Nuevo Ingreso" destacado con borde verde cuando no está activo
                    item.highlight && !isActive(item.href) &&
                      "border border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive(item.href) ? "text-primary-foreground" : ""
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p
                      className={cn(
                        "text-[11px] truncate",
                        isActive(item.href)
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Sección secundaria */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Gestión
            </p>
            {secondaryItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p
                      className={cn(
                        "text-[11px] truncate",
                        isActive(item.href)
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* ── Pie del sidebar: versión ── */}
        <div className="p-4 border-t border-border shrink-0">
          <p className="text-[11px] text-muted-foreground text-center">
            v1.0 · TempoSoluciones © 2024
          </p>
        </div>
      </aside>
    </>
  );
}