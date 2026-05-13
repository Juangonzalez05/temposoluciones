'use client'

import { useState, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Cliente = {
  id: string
  nombre: string
  tipo_documento: string
  numero_documento: string
  tipo_afiliacion: string
}

interface ComboboxClientesProps {
  value: string                        // ID del cliente seleccionado
  onChange: (id: string) => void       // Callback al seleccionar
  disabled?: boolean
  placeholder?: string
}

export function ComboboxClientes({
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar cliente...',
}: ComboboxClientesProps) {
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // Nombre del cliente actualmente seleccionado
  const clienteSeleccionado = clientes.find(c => c.id === value)

  // Buscar clientes cuando el usuario escribe
  const buscarClientes = useCallback(async (texto: string) => {
    if (texto.length < 2) {
      setClientes([])
      return
    }

    setCargando(true)
    try {
      const response = await fetch(
        `/api/clientes?busqueda=${encodeURIComponent(texto)}`
      )
      const result = await response.json()
      if (response.ok) setClientes(result.data ?? [])
    } catch (err) {
      console.error('Error buscando clientes:', err)
    } finally {
      setCargando(false)
    }
  }, [])

  function onInputChange(texto: string) {
    setBusqueda(texto)
    buscarClientes(texto)
  }

  function onSeleccionar(clienteId: string) {
    onChange(clienteId === value ? '' : clienteId)
    setOpen(false)
  }

  const LABELS_AFILIACION: Record<string, string> = {
    independiente: 'Indep.',
    dependiente:   'Dep.',
    empresa:       'Empresa',
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value && clienteSeleccionado ? (
            <span className="truncate">
              {clienteSeleccionado.nombre}
              <span className="text-gray-400 ml-1 text-xs">
                {clienteSeleccionado.tipo_documento} {clienteSeleccionado.numero_documento}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Escribe el nombre o documento..."
            value={busqueda}
            onValueChange={onInputChange}
          />
          <CommandList>
            {cargando && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-400">Buscando...</span>
              </div>
            )}
            {!cargando && busqueda.length >= 2 && clientes.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-gray-400">
                    No se encontró "{busqueda}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => {
                      setOpen(false)
                      window.open('/clientes/nuevo', '_blank')
                    }}
                  >
                    <UserPlus className="mr-2 h-3 w-3" />
                    Crear nuevo cliente
                  </Button>
                </div>
              </CommandEmpty>
            )}
            {!cargando && busqueda.length < 2 && (
              <div className="py-4 text-center text-sm text-gray-400">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}
            {clientes.length > 0 && (
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.id}
                    value={cliente.id}
                    onSelect={() => onSeleccionar(cliente.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === cliente.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {cliente.tipo_documento} {cliente.numero_documento}
                        {' · '}
                        {LABELS_AFILIACION[cliente.tipo_afiliacion] ?? cliente.tipo_afiliacion}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}