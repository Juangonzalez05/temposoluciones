'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  ReceiptText,
  UserCircle2,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BotonRecibo } from '@/components/BotonRecibo'

// ── Tipos ─────────────────────────────────────────────────────
type DetalleMovimiento = {
  id: string
  tipo: 'ingreso' | 'egreso'
  consecutivo: string
  concepto: string
  valor: number
  medio_pago: string
  fecha: string
  beneficiario: string | null
  notas: string | null
  soporte_url: string | null
  created_at: string
  clientes: {
    nombre: string
    tipo_documento: string
    numero_documento: string
    correo: string | null
    whatsapp: string | null
    tipo_afiliacion: string
  } | null
  recibos: {
    id: string
    pdf_url: string
    enviado_email: boolean
    enviado_whatsapp: boolean
    created_at: string
  }[] | null
}

function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

function FilaDato({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{valor}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function DetalleMovimientoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [movimiento, setMovimiento] = useState<DetalleMovimiento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        const response = await fetch(`/api/movimientos/${id}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error ?? 'No se pudo cargar el movimiento')
          return
        }

        setMovimiento(result.data)
      } catch {
        setError('Error de conexión')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !movimiento) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-red-500 font-medium">{error ?? 'Movimiento no encontrado'}</p>
        <Button variant="outline" onClick={() => router.push('/historial')}>
          Volver al historial
        </Button>
      </div>
    )
  }

  const esIngreso = movimiento.tipo === 'ingreso'
  const recibo = movimiento.recibos?.[0]
  const [anio, mes, dia] = movimiento.fecha.split('-')
  const fechaLegible = `${dia}/${mes}/${anio}`

  const clasePremium = esIngreso
    ? 'from-emerald-50 via-white to-emerald-100 border-emerald-200'
    : 'from-rose-50 via-white to-rose-100 border-rose-200'

  const claseValor = esIngreso ? 'text-emerald-700' : 'text-rose-700'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <Card className={`overflow-hidden border bg-gradient-to-br ${clasePremium}`}>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur"
                onClick={() => router.push('/historial')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al historial
              </Button>
              <Badge className={esIngreso ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                {esIngreso ? 'Movimiento de ingreso' : 'Movimiento de egreso'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Detalle financiero</p>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Detalle del movimiento</h1>
                <p className="text-sm text-slate-600">Consulta toda la información operativa, soportes y estado del recibo del movimiento.</p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
                    <Hash className="mr-1 h-3.5 w-3.5" />
                    {movimiento.consecutivo}
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
                    <CalendarDays className="mr-1 h-3.5 w-3.5" />
                    {fechaLegible}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Consecutivo</p>
                <p className="font-mono text-sm font-semibold text-slate-800">{movimiento.consecutivo}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-2 ${esIngreso ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge className={esIngreso ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                {esIngreso ? '↓ Ingreso' : '↑ Egreso'}
              </Badge>
              <p className="text-xs uppercase tracking-wide text-slate-500">Valor del movimiento</p>
              <p className={`text-3xl font-extrabold sm:text-4xl ${claseValor}`}>{formatearPesos(Number(movimiento.valor))}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
              <p className="inline-flex items-center gap-2 sm:justify-end">
                <CalendarDays className="h-4 w-4" /> Fecha: {fechaLegible}
              </p>
              <p className="inline-flex items-center gap-2 sm:justify-end">
                <CircleDollarSign className="h-4 w-4" />
                Estado: <span className="font-semibold text-slate-800">Registrado</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del movimiento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <FilaDato label="Concepto" valor={movimiento.concepto} />
          <FilaDato label="Medio de pago" valor={movimiento.medio_pago} />
          <FilaDato label="Fecha" valor={fechaLegible} />
          <FilaDato label="Consecutivo" valor={movimiento.consecutivo} />
          {movimiento.notas && <FilaDato label="Notas" valor={movimiento.notas} />}
        </CardContent>
      </Card>

      {esIngreso && movimiento.clientes && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base text-emerald-800">
              <UserCircle2 className="h-5 w-5" /> Cliente / Afiliado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FilaDato label="Nombre" valor={movimiento.clientes.nombre} />
            <FilaDato
              label="Documento"
              valor={`${movimiento.clientes.tipo_documento} ${movimiento.clientes.numero_documento}`}
            />
            <FilaDato label="Tipo de afiliación" valor={movimiento.clientes.tipo_afiliacion} />
            <FilaDato label="Correo" valor={movimiento.clientes.correo} />
            <FilaDato label="WhatsApp" valor={movimiento.clientes.whatsapp} />
          </CardContent>
        </Card>
      )}

      {!esIngreso && movimiento.beneficiario && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base text-rose-800">
              <UserCircle2 className="h-5 w-5" /> Beneficiario del pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FilaDato label="Nombre / Entidad" valor={movimiento.beneficiario} />
          </CardContent>
        </Card>
      )}

      {movimiento.soporte_url && (
        <Card className="border-sky-200 bg-sky-50/40">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base text-sky-800">
              <FileText className="h-5 w-5" /> Soporte / Comprobante adjunto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-sky-600 text-white hover:bg-sky-700 sm:w-auto"
              onClick={() => window.open(movimiento.soporte_url!, '_blank')}
            >
              Ver soporte adjunto
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-violet-200">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <ReceiptText className="h-5 w-5 text-violet-600" /> Recibo PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Correo</p>
              <div className="flex items-center gap-2">
                {recibo?.enviado_email ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-300" />
                )}
                <span className="text-sm text-slate-700">Enviado por correo</span>
                <Badge variant="outline" className="ml-auto">
                  {recibo?.enviado_email ? 'Enviado' : 'Pendiente'}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">WhatsApp</p>
              <div className="flex items-center gap-2">
                {recibo?.enviado_whatsapp ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-300" />
                )}
                <span className="text-sm text-slate-700">Enviado por WhatsApp</span>
                <Badge variant="outline" className="ml-auto">
                  {recibo?.enviado_whatsapp ? 'Enviado' : 'Pendiente'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-violet-800">
              <Wallet className="h-4 w-4" /> Generación y consulta del recibo
            </p>
            <BotonRecibo movimientoId={movimiento.id} consecutivo={movimiento.consecutivo} />
          </div>

          <p className="text-xs text-slate-500">
            El envío automático por correo y WhatsApp se habilitará en la Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
