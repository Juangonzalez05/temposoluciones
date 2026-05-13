'use client'

import { useState, useCallback } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CalendarDays,
} from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek,
         startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { exportarExcel, exportarCSV } from '@/lib/utils/exportar'
import type { DateRange } from 'react-day-picker'

// ── Tipos ─────────────────────────────────────────────────────
type TipoPeriodo = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'personalizado'

interface Resumen {
  totalIngresos:    number
  totalEgresos:     number
  saldoNeto:        number
  cantIngresos:     number
  cantEgresos:      number
  totalMovimientos: number
  porMedioPago:     Record<string, number>
}

interface MovimientoReporte {
  id:           string
  tipo:         'ingreso' | 'egreso'
  consecutivo:  string
  concepto:     string
  valor:        number
  medio_pago:   string
  fecha:        string
  beneficiario: string | null
  notas:        string | null
  clientes: {
    nombre:          string
    tipo_documento:  string
    numero_documento: string
  } | null
  recibos: {
    pdf_url:          string
    enviado_email:    boolean
    enviado_whatsapp: boolean
  }[] | null
}

// ── Helpers ───────────────────────────────────────────────────
function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

function calcularRango(tipo: TipoPeriodo): { desde: string; hasta: string } {
  const hoy = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (tipo) {
    case 'hoy':
      return { desde: fmt(hoy), hasta: fmt(hoy) }
    case 'semana':
      return {
        desde: fmt(startOfWeek(hoy, { weekStartsOn: 1 })),
        hasta: fmt(endOfWeek(hoy, { weekStartsOn: 1 })),
      }
    case 'mes':
      return { desde: fmt(startOfMonth(hoy)), hasta: fmt(endOfMonth(hoy)) }
    case 'mes_anterior': {
      const mesAnt = subMonths(hoy, 1)
      return { desde: fmt(startOfMonth(mesAnt)), hasta: fmt(endOfMonth(mesAnt)) }
    }
    default:
      return { desde: fmt(hoy), hasta: fmt(hoy) }
  }
}

// ── Tarjeta de estadística ────────────────────────────────────
function TarjetaStat({
  titulo, valor, subtitulo, icono: Icono, colorFondo, colorTexto,
}: {
  titulo:     string
  valor:      string
  subtitulo?: string
  icono:      React.ElementType
  colorFondo: string
  colorTexto: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {titulo}
            </p>
            <p className={`text-2xl font-bold ${colorTexto}`}>{valor}</p>
            {subtitulo && (
              <p className="text-xs text-gray-400">{subtitulo}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${colorFondo}`}>
            <Icono className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function ReportesPage() {
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes')
  const [rangoPersonalizado, setRangoPersonalizado] = useState<DateRange | undefined>()
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoReporte[]>([])
  const [periodoActual, setPeriodoActual] = useState<{ desde: string; hasta: string } | null>(null)
  const [yaConsultado, setYaConsultado] = useState(false)

  // ── Obtener rango activo ──────────────────────────────────
  function getRango(): { desde: string; hasta: string } | null {
    if (tipoPeriodo === 'personalizado') {
      if (!rangoPersonalizado?.from) return null
      return {
        desde: format(rangoPersonalizado.from, 'yyyy-MM-dd'),
        hasta: rangoPersonalizado.to
          ? format(rangoPersonalizado.to, 'yyyy-MM-dd')
          : format(rangoPersonalizado.from, 'yyyy-MM-dd'),
      }
    }
    return calcularRango(tipoPeriodo)
  }

  // ── Consultar reporte ─────────────────────────────────────
  async function consultarReporte() {
    const rango = getRango()
    if (!rango) return

    setCargando(true)
    setYaConsultado(true)
    try {
      const params = new URLSearchParams({ desde: rango.desde, hasta: rango.hasta })
      const response = await fetch(`/api/reportes?${params}`)
      const result = await response.json()

      if (response.ok) {
        setResumen(result.resumen)
        setMovimientos(result.movimientos)
        setPeriodoActual(result.periodo)
      }
    } catch (error) {
      console.error('Error consultando reporte:', error)
    } finally {
      setCargando(false)
    }
  }

  // ── Exportar ──────────────────────────────────────────────
  function onExportar(formato: 'excel' | 'csv') {
    if (!movimientos.length || !periodoActual) return
    setExportando(true)

    try {
      const datos = movimientos.map(m => ({
        tipo:        m.tipo,
        consecutivo: m.consecutivo,
        fecha:       m.fecha,
        entidad:     m.tipo === 'ingreso'
          ? (m.clientes?.nombre ?? '—')
          : (m.beneficiario ?? '—'),
        concepto:    m.concepto,
        valor:       Number(m.valor),
        medio_pago:  m.medio_pago,
        notas:       m.notas,
      }))

      if (formato === 'excel') {
        exportarExcel(datos, resumen!, periodoActual)
      } else {
        exportarCSV(datos, periodoActual)
      }
    } finally {
      setExportando(false)
    }
  }

  // ── Etiqueta del período seleccionado ─────────────────────
  function labelPeriodo(): string {
    if (tipoPeriodo === 'personalizado' && rangoPersonalizado?.from) {
      const desde = format(rangoPersonalizado.from, 'd MMM', { locale: es })
      const hasta = rangoPersonalizado.to
        ? format(rangoPersonalizado.to, 'd MMM yyyy', { locale: es })
        : ''
      return hasta ? `${desde} – ${hasta}` : desde
    }
    return {
      hoy:          'Hoy',
      semana:       'Esta semana',
      mes:          'Este mes',
      mes_anterior: 'Mes anterior',
      personalizado: 'Personalizado',
    }[tipoPeriodo]
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de caja</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta los movimientos y totales por período.
          </p>
        </div>

        {/* Botón exportar */}
        {movimientos.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={exportando}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {exportando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExportar('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Exportar a Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportar('csv')}>
                <FileText className="mr-2 h-4 w-4 text-blue-600" />
                Exportar a CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Selector de período */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Seleccionar período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={tipoPeriodo}
            onValueChange={(v) => setTipoPeriodo(v as TipoPeriodo)}
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="hoy">Hoy</TabsTrigger>
              <TabsTrigger value="semana">Esta semana</TabsTrigger>
              <TabsTrigger value="mes">Este mes</TabsTrigger>
              <TabsTrigger value="mes_anterior">Mes anterior</TabsTrigger>
              <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Selector de rango personalizado */}
          {tipoPeriodo === 'personalizado' && (
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'min-w-[260px] justify-start text-left font-normal',
                      !rangoPersonalizado && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {rangoPersonalizado?.from ? (
                      rangoPersonalizado.to ? (
                        <>
                          {format(rangoPersonalizado.from, 'd MMM yyyy', { locale: es })}
                          {' – '}
                          {format(rangoPersonalizado.to, 'd MMM yyyy', { locale: es })}
                        </>
                      ) : (
                        format(rangoPersonalizado.from, 'd MMM yyyy', { locale: es })
                      )
                    ) : (
                      'Selecciona el rango de fechas'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={rangoPersonalizado}
                    onSelect={setRangoPersonalizado}
                    numberOfMonths={2}
                    locale={es}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Botón consultar */}
          <Button
            onClick={consultarReporte}
            disabled={
              cargando ||
              (tipoPeriodo === 'personalizado' && !rangoPersonalizado?.from)
            }
            className="bg-blue-700 hover:bg-blue-800"
          >
            {cargando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              `Consultar reporte — ${labelPeriodo()}`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tarjetas de resumen */}
      {resumen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TarjetaStat
              titulo="Total ingresos"
              valor={formatearPesos(resumen.totalIngresos)}
              subtitulo={`${resumen.cantIngresos} movimiento${resumen.cantIngresos !== 1 ? 's' : ''}`}
              icono={ArrowDownCircle}
              colorFondo="bg-green-500"
              colorTexto="text-green-700"
            />
            <TarjetaStat
              titulo="Total egresos"
              valor={formatearPesos(resumen.totalEgresos)}
              subtitulo={`${resumen.cantEgresos} movimiento${resumen.cantEgresos !== 1 ? 's' : ''}`}
              icono={ArrowUpCircle}
              colorFondo="bg-red-500"
              colorTexto="text-red-700"
            />
            <TarjetaStat
              titulo="Saldo neto"
              valor={formatearPesos(resumen.saldoNeto)}
              subtitulo={resumen.saldoNeto >= 0 ? 'Balance positivo' : 'Balance negativo'}
              icono={resumen.saldoNeto >= 0 ? TrendingUp : TrendingDown}
              colorFondo={resumen.saldoNeto >= 0 ? 'bg-blue-600' : 'bg-orange-500'}
              colorTexto={resumen.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'}
            />
            <TarjetaStat
              titulo="Total movimientos"
              valor={String(resumen.totalMovimientos)}
              subtitulo={periodoActual
                ? `${formatearFecha(periodoActual.desde)} – ${formatearFecha(periodoActual.hasta)}`
                : ''}
              icono={CalendarDays}
              colorFondo="bg-purple-500"
              colorTexto="text-purple-700"
            />
          </div>

          {/* Desglose por medio de pago */}
          {Object.keys(resumen.porMedioPago).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ingresos por medio de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(resumen.porMedioPago).map(([medio, total]) => (
                    <div
                      key={medio}
                      className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-2"
                    >
                      <span className="text-sm text-gray-600">{medio}</span>
                      <span className="text-sm font-bold text-green-700">
                        {formatearPesos(total)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Tabla de movimientos del período */}
      {yaConsultado && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">
              Movimientos del período
              {movimientos.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {movimientos.length} registros
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cargando ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No hay movimientos en este período.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs">N° Recibo</TableHead>
                        <TableHead className="text-xs">Cliente / Beneficiario</TableHead>
                        <TableHead className="text-xs">Concepto</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                        <TableHead className="text-xs">Medio de pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.map((mov, i) => (
                        <TableRow
                          key={mov.id}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        >
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {formatearFecha(mov.fecha)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                mov.tipo === 'ingreso'
                                  ? 'border-green-500 text-green-700 bg-green-50 text-xs'
                                  : 'border-red-500 text-red-700 bg-red-50 text-xs'
                              }
                            >
                              {mov.tipo === 'ingreso' ? '↓' : '↑'} {mov.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-400">
                            {mov.consecutivo}
                          </TableCell>
                          <TableCell className="text-sm">
                            {mov.tipo === 'ingreso'
                              ? mov.clientes?.nombre ?? '—'
                              : mov.beneficiario ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700 max-w-[180px] truncate">
                            {mov.concepto}
                          </TableCell>
                          <TableCell className={`text-sm font-semibold text-right whitespace-nowrap ${
                            mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {mov.tipo === 'egreso' ? '- ' : '+ '}
                            {formatearPesos(Number(mov.valor))}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {mov.medio_pago}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Fila de totales al final */}
                {resumen && (
                  <div className="border-t bg-gray-50 px-4 py-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total ingresos del período:</span>
                      <span className="font-bold text-green-700">
                        + {formatearPesos(resumen.totalIngresos)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total egresos del período:</span>
                      <span className="font-bold text-red-700">
                        - {formatearPesos(resumen.totalEgresos)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1 mt-1">
                      <span className="font-semibold text-gray-700">Saldo neto:</span>
                      <span className={`font-bold text-base ${
                        resumen.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-600'
                      }`}>
                        {formatearPesos(resumen.saldoNeto)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}