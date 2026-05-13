'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { columnas, MovimientoFila } from '../columnas'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface TablaMovimientosProps {
  data: MovimientoFila[]
  total: number
  pagina: number
  totalPaginas: number
  porPagina: number
  onCambiarPagina: (pagina: number) => void
  onCambiarPorPagina: (porPagina: number) => void
  cargando?: boolean
}

export function TablaMovimientos({
  data,
  total,
  pagina,
  totalPaginas,
  porPagina,
  onCambiarPagina,
  onCambiarPorPagina,
  cargando = false,
}: TablaMovimientosProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true, // La paginación la maneja el servidor
    pageCount: totalPaginas,
  })

  return (
    <div className="space-y-4">
      {/* Tabla desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold text-gray-600">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {cargando ? (
              // Skeleton de carga
              Array.from({ length: porPagina > 5 ? 5 : porPagina }).map((_, i) => (
                <TableRow key={i}>
                  {columnas.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} className="text-center py-12 text-gray-400">
                  No se encontraron movimientos con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Listado mobile */}
      <div className="md:hidden space-y-2 px-1">
        {cargando ? (
          Array.from({ length: porPagina > 4 ? 4 : porPagina }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-gray-400">
            No se encontraron movimientos con los filtros aplicados.
          </div>
        ) : (
          data.map((mov) => (
            <article key={mov.id} className="rounded-lg border bg-white p-3 space-y-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="outline"
                  className={mov.tipo === 'ingreso'
                    ? 'border-green-500 text-green-700 bg-green-50 text-[11px]'
                    : 'border-red-500 text-red-700 bg-red-50 text-[11px]'
                  }
                >
                  {mov.tipo === 'ingreso' ? '↓ Ingreso' : '↑ Egreso'}
                </Badge>
                <span className={`text-sm font-semibold ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>
                  {mov.tipo === 'egreso' ? '- ' : '+ '}
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(mov.valor))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-gray-500">Fecha</span>
                <span className="text-right text-gray-700">{mov.fecha.split('-').reverse().join('/')}</span>
                <span className="text-gray-500">Descripción</span>
                <span className="text-right text-gray-700 line-clamp-2">{mov.concepto}</span>
                <span className="text-gray-500">Estado</span>
                <span className="text-right">
                  {mov.recibos && mov.recibos.length > 0 && mov.recibos[0].pdf_url ? (
                    <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 text-[10px]">✓ Generado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 text-[10px]">Pendiente</Badge>
                  )}
                </span>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full h-8 text-blue-600 hover:text-blue-800">
                <Link href={`/historial/${mov.id}`}>Ver detalle</Link>
              </Button>
            </article>
          ))
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Mostrando{' '}
            <span className="font-medium">{(pagina - 1) * porPagina + 1}</span>
            {' '}–{' '}
            <span className="font-medium">
              {Math.min(pagina * porPagina, total)}
            </span>
            {' '}de{' '}
            <span className="font-medium">{total}</span> registros
          </p>
          <Select
            value={String(porPagina)}
            onValueChange={(v) => onCambiarPorPagina(Number(v))}
          >
            <SelectTrigger className="h-8 w-[88px] text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1">
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => onCambiarPagina(1)}
            disabled={pagina === 1 || cargando}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina === 1 || cargando}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm text-gray-600 px-2 sm:px-3">
            Pág. {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina === totalPaginas || cargando}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => onCambiarPagina(totalPaginas)}
            disabled={pagina === totalPaginas || cargando}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
