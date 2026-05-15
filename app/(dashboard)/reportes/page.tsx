'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { SelectorRazonSocial } from '@/components/SelectorRazonSocial'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { exportarExcel, exportarCSV } from '@/lib/utils/exportar'
import type { DateRange } from 'react-day-picker'

type TipoPeriodo = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'personalizado'
interface Resumen { totalIngresos:number; totalEgresos:number; saldoNeto:number; cantIngresos:number; cantEgresos:number; totalMovimientos:number; porMedioPago:Record<string,number> }
interface MovimientoReporte { id:string; tipo:'ingreso'|'egreso'; consecutivo:string; concepto:string; valor:number; medio_pago:string; fecha:string; beneficiario:string|null; notas:string|null; clientes:{ nombre:string; tipo_documento:string; numero_documento:string }|null; recibos:{ pdf_url:string; enviado_email:boolean; enviado_whatsapp:boolean }[]|null; razones_sociales:{ id:string; nombre:string; nombre_corto:string|null }|null }

function formatearPesos(valor: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor) }
function formatearFecha(fecha: string): string { const [anio, mes, dia] = fecha.split('-'); return `${dia}/${mes}/${anio}` }
function calcularRango(tipo: TipoPeriodo): { desde: string; hasta: string } {
  const hoy = new Date(); const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (tipo) {
    case 'hoy': return { desde: fmt(hoy), hasta: fmt(hoy) }
    case 'semana': return { desde: fmt(startOfWeek(hoy, { weekStartsOn: 1 })), hasta: fmt(endOfWeek(hoy, { weekStartsOn: 1 })) }
    case 'mes': return { desde: fmt(startOfMonth(hoy)), hasta: fmt(endOfMonth(hoy)) }
    case 'mes_anterior': { const mesAnt = subMonths(hoy, 1); return { desde: fmt(startOfMonth(mesAnt)), hasta: fmt(endOfMonth(mesAnt)) } }
    default: return { desde: fmt(hoy), hasta: fmt(hoy) }
  }
}

function TarjetaStat({ titulo, valor, subtitulo, icono: Icono, colorFondo, colorTexto }: { titulo:string; valor:string; subtitulo?:string; icono:React.ElementType; colorFondo:string; colorTexto:string }) {
  return (
    <Card className="border-0 bg-white/95 shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wide">{titulo}</p>
            <p className={`text-xl sm:text-2xl font-bold break-words ${colorTexto}`}>{valor}</p>
            {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
          </div>
          <div className={`rounded-xl p-2.5 shadow-sm ${colorFondo}`}><Icono className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportesPage() {
  const router = useRouter()
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes')
  const [rangoPersonalizado, setRangoPersonalizado] = useState<DateRange | undefined>()
  const [razonSocialId, setRazonSocialId] = useState<string | undefined>()
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoReporte[]>([])
  const [periodoActual, setPeriodoActual] = useState<{ desde: string; hasta: string } | null>(null)
  const [yaConsultado, setYaConsultado] = useState(false)

  function getRango(): { desde: string; hasta: string } | null {
    if (tipoPeriodo === 'personalizado') {
      if (!rangoPersonalizado?.from) return null
      return { desde: format(rangoPersonalizado.from, 'yyyy-MM-dd'), hasta: rangoPersonalizado.to ? format(rangoPersonalizado.to, 'yyyy-MM-dd') : format(rangoPersonalizado.from, 'yyyy-MM-dd') }
    }
    return calcularRango(tipoPeriodo)
  }

  async function consultarReporte() {
    const rango = getRango(); if (!rango) return
    setCargando(true); setYaConsultado(true)
    try {
      const params = new URLSearchParams({ desde: rango.desde, hasta: rango.hasta })
      if (razonSocialId) params.set('razon_social_id', razonSocialId)
      const response = await fetch(`/api/reportes?${params}`)
      const result = await response.json()
      if (response.ok) { setResumen(result.resumen); setMovimientos(result.movimientos); setPeriodoActual(result.periodo) }
    } catch (error) { console.error('Error consultando reporte:', error) } finally { setCargando(false) }
  }

  function onExportar(formato: 'excel' | 'csv') {
    if (!movimientos.length || !periodoActual) return
    setExportando(true)
    try {
      const datos = movimientos.map(m => ({ tipo: m.tipo, consecutivo: m.consecutivo, fecha: m.fecha, entidad: m.tipo === 'ingreso' ? (m.clientes?.nombre ?? '—') : (m.beneficiario ?? '—'), concepto: m.concepto, valor: Number(m.valor), medio_pago: m.medio_pago, notas: m.notas, razon_social: m.razones_sociales?.nombre_corto ?? m.razones_sociales?.nombre ?? '—' }))
      if (formato === 'excel') exportarExcel(datos, resumen!, periodoActual)
      else exportarCSV(datos, periodoActual)
    } finally { setExportando(false) }
  }

  function labelPeriodo(): string {
    if (tipoPeriodo === 'personalizado' && rangoPersonalizado?.from) {
      const desde = format(rangoPersonalizado.from, 'd MMM', { locale: es })
      const hasta = rangoPersonalizado.to ? format(rangoPersonalizado.to, 'd MMM yyyy', { locale: es }) : ''
      return hasta ? `${desde} – ${hasta}` : desde
    }
    return { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes', mes_anterior: 'Mes anterior', personalizado: 'Personalizado' }[tipoPeriodo]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-blue-50/60 to-violet-50/60 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="h-8 -ml-2 px-2 w-fit"><ArrowLeft className="h-4 w-4 mr-1.5" />Volver</Button>
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Reporte de caja</h1><Badge variant="secondary" className="rounded-full">{labelPeriodo()}</Badge></div>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl">Analiza ingresos y egresos por período con exportación rápida y desglose detallado de movimientos.</p>
              </div>
            </div>
          </div>
          <Card className="w-full max-w-xl border bg-background/85 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Acciones rápidas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={consultarReporte} disabled={cargando || (tipoPeriodo === 'personalizado' && !rangoPersonalizado?.from)} className="w-full">{cargando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Consultando...</> : 'Consultar reporte'}</Button>
              <Button variant="outline" onClick={() => onExportar('excel')} disabled={exportando || !movimientos.length}><FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />Excel</Button>
              <Button variant="outline" onClick={() => onExportar('csv')} disabled={exportando || !movimientos.length}><FileText className="mr-2 h-4 w-4 text-blue-600" />CSV</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-0 shadow-sm ring-1 ring-black/5">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" />Seleccionar período</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tipoPeriodo} onValueChange={(v) => setTipoPeriodo(v as TipoPeriodo)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1 bg-muted/70 p-1">
              <TabsTrigger value="hoy" className="text-xs sm:text-sm">Hoy</TabsTrigger><TabsTrigger value="semana" className="text-xs sm:text-sm">Semana</TabsTrigger><TabsTrigger value="mes" className="text-xs sm:text-sm">Mes</TabsTrigger><TabsTrigger value="mes_anterior" className="text-xs sm:text-sm">Mes ant.</TabsTrigger><TabsTrigger value="personalizado" className="text-xs sm:text-sm">Personalizado</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full">
            <SelectorRazonSocial
              value={razonSocialId}
              onChange={setRazonSocialId}
              disabled={cargando}
            />
          </div>
          {tipoPeriodo === 'personalizado' && (
            <div className="w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full sm:w-auto min-w-[260px] justify-start text-left font-normal', !rangoPersonalizado && 'text-muted-foreground')}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {rangoPersonalizado?.from ? (rangoPersonalizado.to ? <>{format(rangoPersonalizado.from, 'd MMM yyyy', { locale: es })} – {format(rangoPersonalizado.to, 'd MMM yyyy', { locale: es })}</> : format(rangoPersonalizado.from, 'd MMM yyyy', { locale: es })) : 'Selecciona el rango de fechas'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={rangoPersonalizado} onSelect={setRangoPersonalizado} numberOfMonths={1} locale={es} disabled={(date) => date > new Date()} className="sm:[&_.rdp-months]:flex" /></PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {resumen && <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"><TarjetaStat titulo="Total ingresos" valor={formatearPesos(resumen.totalIngresos)} subtitulo={`${resumen.cantIngresos} movimiento${resumen.cantIngresos !== 1 ? 's' : ''}`} icono={ArrowDownCircle} colorFondo="bg-green-500" colorTexto="text-green-700" /><TarjetaStat titulo="Total egresos" valor={formatearPesos(resumen.totalEgresos)} subtitulo={`${resumen.cantEgresos} movimiento${resumen.cantEgresos !== 1 ? 's' : ''}`} icono={ArrowUpCircle} colorFondo="bg-red-500" colorTexto="text-red-700" /><TarjetaStat titulo="Saldo neto" valor={formatearPesos(resumen.saldoNeto)} subtitulo={resumen.saldoNeto >= 0 ? 'Balance positivo' : 'Balance negativo'} icono={resumen.saldoNeto >= 0 ? TrendingUp : TrendingDown} colorFondo={resumen.saldoNeto >= 0 ? 'bg-blue-600' : 'bg-orange-500'} colorTexto={resumen.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'} /><TarjetaStat titulo="Total movimientos" valor={String(resumen.totalMovimientos)} subtitulo={periodoActual ? `${formatearFecha(periodoActual.desde)} – ${formatearFecha(periodoActual.hasta)}` : ''} icono={CalendarDays} colorFondo="bg-purple-500" colorTexto="text-purple-700" /></section>}

      {yaConsultado && <Card className="overflow-hidden border bg-background shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Movimientos del período {movimientos.length > 0 && <Badge variant="outline" className="ml-2 text-xs">{movimientos.length} registros</Badge>}</CardTitle>{movimientos.length > 0 && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={exportando}><Download className="mr-2 h-4 w-4" />Exportar</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onExportar('excel')}><FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />Exportar a Excel</DropdownMenuItem><DropdownMenuItem onClick={() => onExportar('csv')}><FileText className="mr-2 h-4 w-4 text-blue-600" />Exportar a CSV</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</CardHeader><CardContent className="p-0">{cargando ? <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : movimientos.length === 0 ? <div className="text-center py-16 px-4 text-muted-foreground"><CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" /><p className="font-medium">No encontramos movimientos para este período.</p><p className="text-sm mt-1">Prueba otro rango o consulta nuevamente.</p></div> : <><div className="hidden md:block overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">Fecha</TableHead><TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">N° Recibo</TableHead><TableHead className="text-xs">Cliente / Beneficiario</TableHead><TableHead className="text-xs">Concepto</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Medio de pago</TableHead></TableRow></TableHeader><TableBody>{movimientos.map((mov, i) => <TableRow key={mov.id} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}><TableCell className="text-sm whitespace-nowrap">{formatearFecha(mov.fecha)}</TableCell><TableCell><Badge variant="outline" className={mov.tipo === 'ingreso' ? 'border-green-500 text-green-700 bg-green-50 text-xs' : 'border-red-500 text-red-700 bg-red-50 text-xs'}>{mov.tipo === 'ingreso' ? '↓' : '↑'} {mov.tipo}</Badge></TableCell><TableCell className="font-mono text-xs text-muted-foreground">{mov.consecutivo}</TableCell><TableCell className="text-sm">{mov.tipo === 'ingreso' ? mov.clientes?.nombre ?? '—' : mov.beneficiario ?? '—'}</TableCell><TableCell className="text-sm max-w-[220px] truncate">{mov.concepto}</TableCell><TableCell className={`text-sm font-semibold text-right whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>{mov.tipo === 'egreso' ? '- ' : '+ '}{formatearPesos(Number(mov.valor))}</TableCell><TableCell className="text-sm">{mov.medio_pago}</TableCell></TableRow>)}</TableBody></Table></div><div className="md:hidden space-y-3 p-3 sm:p-4">{movimientos.map((mov) => <div key={mov.id} className="rounded-xl border bg-white p-3 shadow-sm space-y-2"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{formatearFecha(mov.fecha)}</p><Badge variant="outline" className={mov.tipo === 'ingreso' ? 'border-green-500 text-green-700 bg-green-50 text-xs' : 'border-red-500 text-red-700 bg-red-50 text-xs'}>{mov.tipo}</Badge></div><p className="text-xs font-mono text-muted-foreground">{mov.consecutivo}</p><p className="text-sm font-semibold">{mov.tipo === 'ingreso' ? mov.clientes?.nombre ?? '—' : mov.beneficiario ?? '—'}</p><p className="text-sm text-muted-foreground">{mov.concepto}</p><div className="flex items-center justify-between text-sm"><span>{mov.medio_pago}</span><span className={`font-bold ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>{mov.tipo === 'egreso' ? '- ' : '+ '}{formatearPesos(Number(mov.valor))}</span></div></div>)}</div>{resumen && <div className="border-t bg-muted/30 px-4 py-3 space-y-1"><div className="flex justify-between text-sm"><span>Total ingresos del período:</span><span className="font-bold text-green-700">+ {formatearPesos(resumen.totalIngresos)}</span></div><div className="flex justify-between text-sm"><span>Total egresos del período:</span><span className="font-bold text-red-700">- {formatearPesos(resumen.totalEgresos)}</span></div><div className="flex justify-between text-sm border-t pt-1 mt-1"><span className="font-semibold">Saldo neto:</span><span className={`font-bold ${resumen.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{formatearPesos(resumen.saldoNeto)}</span></div></div>}</>}</CardContent></Card>}
    </div>
  )
}
