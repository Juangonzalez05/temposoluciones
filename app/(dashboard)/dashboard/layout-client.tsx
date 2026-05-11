// app/(dashboard)/layout-client.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

// Mapa de rutas a títulos de página
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/ingresos/nuevo": "Nuevo Ingreso",
  "/egresos/nuevo": "Nuevo Egreso",
  "/historial": "Historial de Movimientos",
  "/reportes": "Reportes de Caja",
  "/clientes": "Clientes y Afiliados",
};

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function DashboardLayoutClient({
  children,
  userEmail,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Obtiene el título de la página actual
  const pageTitle = pageTitles[pathname] ?? "TempoSoluciones";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar: fijo a la izquierda en desktop, overlay en móvil */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenido principal: con margen izquierdo en desktop para el sidebar */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar fija arriba */}
        <Topbar
          userEmail={userEmail}
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Área de contenido de cada página */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        {/* Footer sutil */}
        <footer className="py-4 px-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            TempoSoluciones · Sistema Digital de Caja · {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}