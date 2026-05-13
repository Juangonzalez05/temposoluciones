'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Mail, Phone,
  TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Loader2, Edit, ExternalLink,
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

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-red-500">{error ?? 'Cliente no encontrado'}</p>
        <Button variant="outline" onClick={() => router.push('/clientes')}>
          Volver a clientes
        </Button>
      </div>
    )
  }

  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Number(m.valor), 0)

  const totalPagado  = movimientos.filter(m => m.tipo === 'ingreso').length

  const LABELS_AFILIACION: Record<string, string> = {
    independiente: 'Independiente',
    dependiente:   'Dependiente',
    empresa:       'Empresa',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/clientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{cliente.nombre}</h1>
          <p className="text-sm text-gray-400">
            {cliente.tipo_documento} {cliente.numero_documento}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {LABELS_AFILIACION[cliente.tipo_afiliacion] ?? cliente.tipo_afiliacion}
        </Badge>
      </div>

      {/* Datos del cliente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Datos del afiliado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Tipo de documento</p>
              <p className="font-medium">{cliente.tipo_documento}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Número de documento</p>
              <p className="font-medium">{cliente.numero_documento}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Tipo de afiliación</p>
              <p className="font-medium">
                {LABELS_AFILIACION[cliente.tipo_afiliacion] ?? cliente.tipo_afiliacion}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Registrado el</p>
              <p className="font-medium">
                {formatearFecha(cliente.created_at.split('T')[0])}
              </p>
            </div>
          </div>

          {(cliente.correo || cliente.whatsapp) && (
            <>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-4 text-sm">
                {cliente.correo && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {cliente.correo}
                  </div>
                )}
                {cliente.whatsapp && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {cliente.whatsapp}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">Total pagado</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {formatearPesos(totalIngresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">N° de pagos</span>
            </div>
            <p className="text-lg font-bold text-blue-700">{totalPagado}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500">Total movimientos</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{movimientos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de movimientos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Historial de movimientos
            <Badge variant="outline" className="ml-2 text-xs">
              {movimientos.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movimientos.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Este cliente aún no tiene movimientos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">N° Recibo</TableHead>
                    <TableHead className="text-xs">Concepto</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs">Medio</TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov, i) => (
                    <TableRow
                      key={mov.id}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                    >
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {formatearFecha(mov.fecha)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {mov.consecutivo}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 max-w-[180px] truncate">
                        {mov.concepto}
                      </TableCell>
                      <TableCell className={`text-sm font-semibold text-right whitespace-nowrap ${
                        mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatearPesos(Number(mov.valor))}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {mov.medio_pago}
                      </TableCell>
                      <TableCell>
                        <Link href={`/historial/${mov.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}