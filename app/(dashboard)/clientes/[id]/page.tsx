'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  ArrowDownCircle,
  Loader2,
  ExternalLink,
  UserCircle2,
  BadgeCheck,
  CalendarDays,
  Landmark,
  Wallet,
  ReceiptText,
  Inbox,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type ClienteDetalle = {
  id: string
  nombre: string
  tipo_documento: string
  numero_documento: string
  correo: string | null
  whatsapp: string | null
  tipo_afiliacion: string
  created_at: string
}

type MovimientoCliente = {
  id: string
  tipo: 'ingreso' | 'egreso'
  consecutivo: string
  concepto: string
  valor: number
  medio_pago: string
  fecha: string
  recibos: { pdf_url: string }[] | null
}

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

export default function DetalleClientePage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string

  const [cliente, setCliente] = useState<ClienteDetalle | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoCliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        // Cargar datos del cliente
        const respCliente = await fetch(`/api/clientes/${id}`)
        const resCliente  = await respCliente.json()
        if (!respCliente.ok) { setError(resCliente.error); return }
        setCliente(resCliente.data)

        // Cargar movimientos del cliente
        const respMovs = await fetch(`/api/movimientos?cliente_id=${id}&limite=200`)
        const resMov   = await respMovs.json()
        if (respMovs.ok) setMovimientos(resMov.data ?? [])
      } catch {
        setError('Error de conexión')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  const LABELS_AFILIACION: Record<string, string> = {
    independiente: 'Independiente',
    dependiente:   'Dependiente',
    empresa:       'Empresa',
  }

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
        <div className="rounded-2xl border bg-gradient-to-br from-slate-100 to-slate-50 p-6 md:p-8 space-y-4">
          <div className="h-9 w-28 rounded-md bg-slate-200" />
          <div className="h-8 w-3/5 rounded-md bg-slate-200" />
          <div className="h-5 w-1/2 rounded-md bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border bg-white p-6 space-y-4">
            <div className="h-6 w-44 rounded bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array.from({ length: 6 })].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-5 w-36 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-6 space-y-3">
            {[...Array.from({ length: 3 })].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="h-6 w-56 rounded bg-slate-200" />
          {[...Array.from({ length: 5 })].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="flex items-center justify-center text-slate-500 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando información del cliente...
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-red-800">No pudimos cargar este cliente</h2>
              <p className="text-sm text-red-700">{error ?? 'Cliente no encontrado'}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/clientes')}>
              Volver a clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Number(m.valor), 0)

  const totalPagado  = movimientos.filter(m => m.tipo === 'ingreso').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 sm:p-6 md:p-8 text-white">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative space-y-4">
          <Button
            variant="secondary"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => router.push('/clientes')}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Perfil del cliente</p>
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight break-words">{cliente.nombre}</h1>
              <p className="text-sm md:text-base text-slate-300 break-words">
                {cliente.tipo_documento} {cliente.numero_documento}
              </p>
              <p className="text-sm text-slate-400">Resumen financiero, contacto e historial completo de movimientos.</p>
            </div>
            <Badge className="w-fit bg-white/10 border border-white/20 text-white hover:bg-white/15">
              <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
              {LABELS_AFILIACION[cliente.tipo_afiliacion] ?? cliente.tipo_afiliacion}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-slate-500" />
              Perfil del afiliado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Nombre</p>
                <p className="font-medium text-slate-900 break-words">{cliente.nombre}</p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Documento</p>
                <p className="font-medium text-slate-900 break-words">
                  {cliente.tipo_documento} {cliente.numero_documento}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Afiliación</p>
                <p className="font-medium text-slate-900">
                  {LABELS_AFILIACION[cliente.tipo_afiliacion] ?? cliente.tipo_afiliacion}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Fecha de registro</p>
                <p className="font-medium text-slate-900">
                  {formatearFecha(cliente.created_at.split('T')[0])}
                </p>
              </div>
            </div>

            {(cliente.correo || cliente.whatsapp) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {cliente.correo && (
                    <div className="rounded-xl border p-3 flex items-start gap-2.5 bg-white">
                      <Mail className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Correo</p>
                        <p className="text-slate-800 break-all">{cliente.correo}</p>
                      </div>
                    </div>
                  )}
                  {cliente.whatsapp && (
                    <div className="rounded-xl border p-3 flex items-start gap-2.5 bg-white">
                      <Phone className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">WhatsApp</p>
                        <p className="text-slate-800 break-all">{cliente.whatsapp}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="group border-green-200 bg-gradient-to-b from-green-50 to-white hover:shadow-md transition-all">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <ArrowDownCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Total pagado</span>
              </div>
              <p className="text-2xl font-semibold text-green-800 break-words">{formatearPesos(totalIngresos)}</p>
            </CardContent>
          </Card>
          <Card className="group border-blue-200 bg-gradient-to-b from-blue-50 to-white hover:shadow-md transition-all">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Número de pagos</span>
              </div>
              <p className="text-2xl font-semibold text-blue-800">{totalPagado}</p>
            </CardContent>
          </Card>
          <Card className="group border-violet-200 bg-gradient-to-b from-violet-50 to-white hover:shadow-md transition-all">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-violet-700 mb-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">Total movimientos</span>
              </div>
              <p className="text-2xl font-semibold text-violet-800">{movimientos.length}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/60">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-500" />
            Historial de movimientos
            <Badge variant="outline" className="text-xs">
              {movimientos.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movimientos.length === 0 ? (
            <div className="py-14 px-4 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Aún no hay movimientos registrados</p>
              <p className="text-xs text-slate-500 mt-1">Cuando se registren ingresos o egresos aparecerán aquí.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">N° Recibo</TableHead>
                      <TableHead className="text-xs">Concepto</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                      <TableHead className="text-xs">Medio</TableHead>
                      <TableHead className="text-xs w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov, i) => (
                      <TableRow
                        key={mov.id}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                      >
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatearFecha(mov.fecha)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {mov.consecutivo}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 max-w-[260px] truncate">
                          {mov.concepto}
                        </TableCell>
                        <TableCell className={`text-sm font-semibold text-right whitespace-nowrap ${
                          mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatearPesos(Number(mov.valor))}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{mov.medio_pago}</TableCell>
                        <TableCell>
                          <Link href={`/historial/${mov.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden p-3 space-y-3">
                {movimientos.map((mov) => (
                  <Card key={mov.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatearFecha(mov.fecha)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{mov.consecutivo}</p>
                        </div>
                        <p className={`text-sm font-semibold ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>
                          {formatearPesos(Number(mov.valor))}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Concepto</p>
                        <p className="text-sm text-slate-800 break-words">{mov.concepto}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5" />
                          {mov.medio_pago}
                        </span>
                        <Link href={`/historial/${mov.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Wallet className="h-3.5 w-3.5 mr-1" />
                            Ver detalle
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
