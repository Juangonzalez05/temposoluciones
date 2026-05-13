'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  BarChart3,
  DollarSign,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablaMovimientos } from '@/components/historial/table/tabla-movimientos'
import { FiltrosHistorialBar, FiltrosHistorial } from '@/components/historial/table/filtros-historial'
import { MovimientoFila } from '@/components/historial/columnas'

// ── Tarjeta de resumen ────────────────────────────────────────
function TarjetaResumen({
  titulo,
  valor,
  icono: Icono,
  color,
}: {
  titulo: string
  valor: string
  icono: React.ElementType
  color: string
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-black/5 bg-white/95">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:pt-5 sm:pb-4">
        <div className={`p-2 rounded-xl ${color} shadow-sm sm:p-2.5`}>
          <Icono className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium leading-tight">{titulo}</p>
          <p className="text-base font-bold text-foreground break-words sm:text-lg">{valor}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function HistorialPage() {
  const router = useRouter()
  const [movimientos, setMovimientos] = useState<MovimientoFila[]>([])
  const [cargando, setCargando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosHistorial>({
    busqueda: '',
    tipo: 'todos',
    desde: '',
    hasta: '',
  })

  // ── Resumen calculado de los datos actuales ───────────────
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Number(m.valor), 0)

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((acc, m) => acc + Number(m.valor), 0)

  const saldo = totalIngresos - totalEgresos

  // ── Cargar movimientos ────────────────────────────────────
  const cargarMovimientos = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        porPagina: String(porPagina),
      })

      if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
      if (filtros.tipo !== 'todos') params.set('tipo', filtros.tipo)
      if (filtros.desde) params.set('desde', filtros.desde)
      if (filtros.hasta) params.set('hasta', filtros.hasta)

      const response = await fetch(`/api/movimientos?${params.toString()}`)
      const result = await response.json()

      if (response.ok) {
        setMovimientos(result.data ?? [])
        setTotal(result.total ?? 0)
        setTotalPaginas(result.totalPaginas ?? 1)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setCargando(false)
    }
  }, [pagina, porPagina, filtros])

  // Recargar cuando cambien filtros o paginación
  useEffect(() => {
    cargarMovimientos()
  }, [cargarMovimientos])

  // Reiniciar a página 1 cuando cambian los filtros
  function onCambiarFiltros(nuevosFiltros: FiltrosHistorial) {
    setFiltros(nuevosFiltros)
    setPagina(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 space-y-5 sm:px-4 sm:py-6 md:px-10 md:py-8 md:space-y-8 lg:px-12">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background via-blue-50/50 to-emerald-50/50 p-4 shadow-sm sm:rounded-2xl sm:p-5 md:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 sm:space-y-4">
            <Button variant="ghost" onClick={() => router.back()} className="w-fit -ml-2 h-8 px-2 text-sm sm:h-9">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
              Volver
            </Button>

            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl leading-tight sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Historial de movimientos
                  </h1>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:px-3 sm:py-1 sm:text-xs">
                    {total} registros
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl">
                  Consulta, analiza y filtra ingresos y egresos en una sola vista para tomar decisiones financieras más rápidas.
                </p>
              </div>
            </div>
          </div>

          <Card className="w-full max-w-xl border bg-background/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="text-sm font-semibold">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
              <Button asChild className="w-full h-9 text-sm">
                <Link href="/ingresos/nuevo">Nuevo ingreso</Link>
              </Button>
              <Button asChild variant="destructive" className="w-full h-9 text-sm">
                <Link href="/egresos/nuevo">Nuevo egreso</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-9 text-sm">
                <Link href="/reportes">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                  Ver reportes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tarjetas de resumen */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        <TarjetaResumen
          titulo="Total ingresos (página actual)"
          valor={formatearPesos(totalIngresos)}
          icono={ArrowDownCircle}
          color="bg-green-500"
        />
        <TarjetaResumen
          titulo="Total egresos (página actual)"
          valor={formatearPesos(totalEgresos)}
          icono={ArrowUpCircle}
          color="bg-red-500"
        />
        <TarjetaResumen
          titulo="Saldo neto"
          valor={formatearPesos(saldo)}
          icono={saldo >= 0 ? TrendingUp : DollarSign}
          color={saldo >= 0 ? 'bg-blue-600' : 'bg-orange-500'}
        />
      </section>

      {/* Filtros */}
      <Card className="border-0 shadow-sm ring-1 ring-black/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Filtrar movimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FiltrosHistorialBar
            filtros={filtros}
            onChange={onCambiarFiltros}
            cargando={cargando}
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <section className="rounded-2xl border bg-background shadow-sm overflow-hidden">
        <TablaMovimientos
          data={movimientos}
          total={total}
          pagina={pagina}
          totalPaginas={totalPaginas}
          porPagina={porPagina}
          onCambiarPagina={setPagina}
          onCambiarPorPagina={(n) => { setPorPagina(n); setPagina(1) }}
          cargando={cargando}
        />
      </section>
    </div>
  )
}
