'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingUp } from 'lucide-react'
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
    <Card>
      <CardContent className="flex items-center gap-4 pt-5 pb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icono className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{titulo}</p>
          <p className="text-lg font-bold text-gray-800">{valor}</p>
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
        pagina:    String(pagina),
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
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de movimientos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta y filtra todos los ingresos y egresos registrados.
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">
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

    </div>
  )
}