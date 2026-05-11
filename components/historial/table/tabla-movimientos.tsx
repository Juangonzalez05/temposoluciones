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
      {/* Tabla */}
      <div className="rounded-lg border overflow-hidden">
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

      {/* Controles de paginación */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
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
            <SelectTrigger className="h-8 w-[80px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
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
          <span className="text-sm text-gray-600 px-3">
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