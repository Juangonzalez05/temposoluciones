'use client'

import { useState } from 'react'
import { Search, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

export interface FiltrosHistorial {
  busqueda: string
  tipo: 'todos' | 'ingreso' | 'egreso'
  desde: string
  hasta: string
}

interface FiltrosHistorialProps {
  filtros: FiltrosHistorial
  onChange: (filtros: FiltrosHistorial) => void
  cargando?: boolean
}

export function FiltrosHistorialBar({
  filtros,
  onChange,
  cargando = false,
}: FiltrosHistorialProps) {
  const [rango, setRango] = useState<DateRange | undefined>(
    filtros.desde && filtros.hasta
      ? { from: new Date(filtros.desde), to: new Date(filtros.hasta) }
      : undefined
  )

  function actualizarFiltro<K extends keyof FiltrosHistorial>(
    clave: K,
    valor: FiltrosHistorial[K]
  ) {
    onChange({ ...filtros, [clave]: valor })
  }

  function onSeleccionarRango(range: DateRange | undefined) {
    setRango(range)
    onChange({
      ...filtros,
      desde: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
      hasta: range?.to   ? format(range.to,   'yyyy-MM-dd') : '',
    })
  }

  function limpiarFiltros() {
    setRango(undefined)
    onChange({ busqueda: '', tipo: 'todos', desde: '', hasta: '' })
  }

  const hayFiltrosActivos =
    filtros.busqueda || filtros.tipo !== 'todos' || filtros.desde || filtros.hasta

  return (
    <div className="flex flex-wrap gap-3 items-center">

      {/* Búsqueda por texto */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por concepto, consecutivo..."
          value={filtros.busqueda}
          onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
          className="pl-9 h-9"
          disabled={cargando}
        />
      </div>

      {/* Filtro por tipo */}
      <Select
        value={filtros.tipo}
        onValueChange={(v) => actualizarFiltro('tipo', v as FiltrosHistorial['tipo'])}
        disabled={cargando}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="ingreso">↓ Ingresos</SelectItem>
          <SelectItem value="egreso">↑ Egresos</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro por rango de fechas */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 justify-start text-left font-normal min-w-[220px]',
              !rango && 'text-muted-foreground'
            )}
            disabled={cargando}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {rango?.from ? (
              rango.to ? (
                <>
                  {format(rango.from, 'd MMM', { locale: es })} –{' '}
                  {format(rango.to, 'd MMM yyyy', { locale: es })}
                </>
              ) : (
                format(rango.from, 'd MMM yyyy', { locale: es })
              )
            ) : (
              'Rango de fechas'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={rango}
            onSelect={onSeleccionarRango}
            numberOfMonths={2}
            locale={es}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>

      {/* Botón limpiar filtros */}
      {hayFiltrosActivos && (
        <Button
          variant="ghost"
          size="sm"
          onClick={limpiarFiltros}
          className="h-9 text-gray-500 hover:text-gray-800"
          disabled={cargando}
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  )
}