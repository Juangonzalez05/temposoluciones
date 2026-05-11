'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
      <span className="text-sm text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{valor}</span>
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/historial')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Detalle del movimiento
          </h1>
          <p className="text-sm text-gray-400 font-mono">{movimiento.consecutivo}</p>
        </div>
      </div>

      {/* Badge tipo + valor */}
      <Card className={esIngreso ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="flex items-center justify-between pt-5 pb-4">
          <div className="space-y-1">
            <Badge
              className={esIngreso
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'}
            >
              {esIngreso ? '↓ Ingreso' : '↑ Egreso'}
            </Badge>
            <p className="text-xs text-gray-500">{fechaLegible}</p>
          </div>
          <p className={`text-2xl font-bold ${esIngreso ? 'text-green-700' : 'text-red-700'}`}>
            {formatearPesos(Number(movimiento.valor))}
          </p>
        </CardContent>
      </Card>

      {/* Datos del movimiento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Información del movimiento</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <FilaDato label="Concepto"     valor={movimiento.concepto} />
          <FilaDato label="Medio de pago" valor={movimiento.medio_pago} />
          <FilaDato label="Fecha"        valor={fechaLegible} />
          <FilaDato label="Consecutivo"  valor={movimiento.consecutivo} />
          {movimiento.notas && <FilaDato label="Notas" valor={movimiento.notas} />}
        </CardContent>
      </Card>

      {/* Datos del cliente (ingresos) */}
      {esIngreso && movimiento.clientes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cliente / Afiliado</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            <FilaDato label="Nombre" valor={movimiento.clientes.nombre} />
            <FilaDato
              label="Documento"
              valor={`${movimiento.clientes.tipo_documento} ${movimiento.clientes.numero_documento}`}
            />
            <FilaDato label="Tipo de afiliación" valor={movimiento.clientes.tipo_afiliacion} />
            <FilaDato label="Correo"    valor={movimiento.clientes.correo} />
            <FilaDato label="WhatsApp"  valor={movimiento.clientes.whatsapp} />
          </CardContent>
        </Card>
      )}

      {/* Datos del beneficiario (egresos) */}
      {!esIngreso && movimiento.beneficiario && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Beneficiario del pago</CardTitle>
          </CardHeader>
          <CardContent>
            <FilaDato label="Nombre / Entidad" valor={movimiento.beneficiario} />
          </CardContent>
        </Card>
      )}

      {/* Soporte adjunto */}
      {movimiento.soporte_url && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Soporte / Comprobante adjunto</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="text-blue-600 border-blue-300"
              onClick={() => window.open(movimiento.soporte_url!, '_blank')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver soporte adjunto
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado del recibo y acciones (F4-03 y F4-04) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recibo PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Estado del recibo */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              {recibo?.enviado_email ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300" />
              )}
              <span className="text-sm text-gray-600">Enviado por correo</span>
            </div>
            <div className="flex items-center gap-2">
              {recibo?.enviado_whatsapp ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300" />
              )}
              <span className="text-sm text-gray-600">Enviado por WhatsApp</span>
            </div>
          </div>

          <Separator />

          {/* Botón ver/generar recibo */}
          <BotonRecibo
            movimientoId={movimiento.id}
            consecutivo={movimiento.consecutivo}
          />

          {/* Nota sobre envío (Fase 3 pendiente) */}
          <p className="text-xs text-gray-400">
            El envío automático por correo y WhatsApp se habilitará en la Fase 3.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}