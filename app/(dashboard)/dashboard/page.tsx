// app/(dashboard)/page.tsx
import { Suspense } from "react";
import { getResumenHoy, getMovimientosRecientes } from "@/lib/actions/dashboard.actions";
import { StatsCard, formatCOP } from "@/components/dashboard/stats-card";
import { RecentMovements } from "@/components/dashboard/recent-movements";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Componente de skeleton mientras carga el resumen
function StatsSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-5 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-9 w-9 bg-muted rounded-lg" />
          </div>
          <div className="h-7 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// Componente async que carga los datos reales del resumen
async function DashboardStats() {
  const resumen = await getResumenHoy();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard
        title="Ingresos del Día"
        value={formatCOP(resumen.totalIngresos)}
        description="Total recibido hoy"
        icon={TrendingUp}
        variant="ingreso"
      />
      <StatsCard
        title="Egresos del Día"
        value={formatCOP(resumen.totalEgresos)}
        description="Total pagado hoy"
        icon={TrendingDown}
        variant="egreso"
      />
      <StatsCard
        title="Saldo del Día"
        value={formatCOP(resumen.saldo)}
        description="Ingresos menos egresos"
        icon={Wallet}
        variant="saldo"
      />
      <StatsCard
        title="Movimientos"
        value={String(resumen.cantidadMovimientos)}
        description="Registros del día de hoy"
        icon={Activity}
        variant="default"
      />
    </div>
  );
}

// Componente async que carga los movimientos recientes
async function MovimientosRecientes() {
  const movimientos = await getMovimientosRecientes();
  return <RecentMovements movimientos={movimientos} />;
}

// Página del dashboard (Server Component)
export default function DashboardPage() {
  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  // Capitalizar la primera letra
  const fechaFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Encabezado de la página ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen del día</h2>
          <p className="text-muted-foreground text-sm mt-1">{fechaFormateada}</p>
        </div>
        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/egresos/nuevo">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Egreso
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/ingresos/nuevo">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Ingreso
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Cards de estadísticas ── */}
      {/* Suspense muestra el skeleton mientras se cargan los datos de Supabase */}
      <Suspense fallback={<StatsSkeletons />}>
        <DashboardStats />
      </Suspense>

      {/* ── Tabla de movimientos recientes ── */}
      <Suspense
        fallback={
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <MovimientosRecientes />
      </Suspense>

    </div>
  );
}