'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type RazonSocial = {
  id: string
  nombre: string
  nombre_corto: string | null
}

type SelectorRazonSocialProps = {
  value?: string
  onChange: (value: string) => void
  defaultValue?: string
  disabled?: boolean
}

export function SelectorRazonSocial({
  value,
  onChange,
  defaultValue,
  disabled = false,
}: SelectorRazonSocialProps) {
  const [razones, setRazones] = useState<RazonSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    const controller = new AbortController()

    async function cargarRazones() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/razones-sociales', {
          signal: controller.signal,
          credentials: 'include',
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron cargar las razones sociales')
        }
        if (!activo) return
        setRazones(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!activo || (err instanceof DOMException && err.name === 'AbortError')) return
        setError('No se pudieron cargar las razones sociales')
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargarRazones()
    return () => {
      activo = false
      controller.abort()
    }
  }, [])

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="rounded-xl h-11">
          <SelectValue placeholder="Cargando razones sociales..." />
        </SelectTrigger>
      </Select>
    )
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className="rounded-xl h-11 border-red-300">
          <SelectValue placeholder={error} />
        </SelectTrigger>
      </Select>
    )
  }

  if (!razones.length) {
    return (
      <Select disabled>
        <SelectTrigger className="rounded-xl h-11">
          <SelectValue placeholder="No hay razones sociales activas" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="rounded-xl h-11">
        <SelectValue placeholder="Seleccionar razón social" />
      </SelectTrigger>
      <SelectContent>
        {razones.map((razon) => (
          <SelectItem key={razon.id} value={razon.id}>
            {razon.nombre_corto
              ? `${razon.nombre} (${razon.nombre_corto})`
              : razon.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}