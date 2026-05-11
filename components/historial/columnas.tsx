'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, FileText, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// ── Tipo del movimiento con relaciones ───────────────────────
export type MovimientoFila = {
  id: string
  tipo: 'ingreso' | 'egreso'
  consecutivo: string
  concepto: string
  valor: number
  medio_pago: string
  fecha: string
  beneficiario: string | null
  notas: string | null
  created_at: string
  clientes: {
    id: string
    nombre: string
    tipo_documento: string
    numero_documento: string
  } | null
  recibos: {
    id: string
    pdf_url: string
    enviado_email: boolean
    enviado_whatsapp: boolean
  }[] | null
}

// ── Función para formatear pesos ─────────────────────────────
function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

// ── Definición de columnas ───────────────────────────────────
export const columnas: ColumnDef<MovimientoFila>[] = [
  // Fecha
  {
    accessorKey: 'fecha',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-semibold"
      >
        Fecha
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const fecha = row.getValue('fecha') as string
      const [anio, mes, dia] = fecha.split('-')
      return (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {dia}/{mes}/{anio}
        </span>
      )
    },
  },

  // Tipo (ingreso / egreso)
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as string
      return (
        <Badge
          variant="outline"
          className={
            tipo === 'ingreso'
              ? 'border-green-500 text-green-700 bg-green-50'
              : 'border-red-500 text-red-700 bg-red-50'
          }
        >
          {tipo === 'ingreso' ? '↓ Ingreso' : '↑ Egreso'}
        </Badge>
      )
    },
  },

  // Consecutivo
  {
    accessorKey: 'consecutivo',
    header: 'N° Recibo',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-500">
        {row.getValue('consecutivo')}
      </span>
    ),
  },

  // Cliente / Beneficiario
  {
    id: 'entidad',
    header: 'Cliente / Beneficiario',
    cell: ({ row }) => {
      const mov = row.original
      const nombre = mov.tipo === 'ingreso'
        ? mov.clientes?.nombre
        : mov.beneficiario
      return (
        <div className="max-w-[180px]">
          <p className="text-sm font-medium text-gray-800 truncate">
            {nombre ?? '—'}
          </p>
          {mov.tipo === 'ingreso' && mov.clientes && (
            <p className="text-xs text-gray-400">
              {mov.clientes.tipo_documento} {mov.clientes.numero_documento}
            </p>
          )}
        </div>
      )
    },
  },

  // Concepto
  {
    accessorKey: 'concepto',
    header: 'Concepto',
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 max-w-[200px] truncate block">
        {row.getValue('concepto')}
      </span>
    ),
  },

  // Valor
  {
    accessorKey: 'valor',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-semibold"
      >
        Valor
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const valor = Number(row.getValue('valor'))
      const tipo  = row.original.tipo
      return (
        <span className={`font-mono font-semibold text-sm ${
          tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
        }`}>
          {tipo === 'egreso' ? '- ' : '+ '}
          {formatearPesos(valor)}
        </span>
      )
    },
  },

  // Medio de pago
  {
    accessorKey: 'medio_pago',
    header: 'Medio de pago',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.getValue('medio_pago')}
      </span>
    ),
  },

  // Estado del recibo
  {
    id: 'recibo',
    header: 'Recibo',
    cell: ({ row }) => {
      const recibos = row.original.recibos
      const tieneRecibo = recibos && recibos.length > 0 && recibos[0].pdf_url

      return tieneRecibo ? (
        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 text-xs">
          ✓ Generado
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-400 text-xs">
          Pendiente
        </Badge>
      )
    },
  },

  // Acciones
  {
    id: 'acciones',
    header: '',
    cell: ({ row }) => (
      <Link href={`/historial/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 h-8">
          <FileText className="h-4 w-4 mr-1" />
          Ver
        </Button>
      </Link>
    ),
  },
]