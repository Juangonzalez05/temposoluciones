'use client'

import { useState } from 'react'
import { FileText, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BotonReciboProps {
  movimientoId: string
  consecutivo: string
}

export function BotonRecibo({ movimientoId, consecutivo }: BotonReciboProps) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function abrirRecibo() {
    setCargando(true)
    setError(null)

    try {
      const response = await fetch(`/api/recibos/${movimientoId}/pdf`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Error al generar el recibo')
        return
      }

      // Abrir el PDF en una nueva pestaña del navegador
      window.open(result.pdf_url, '_blank', 'noopener,noreferrer')

    } catch (err) {
      console.error('Error abriendo recibo:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={abrirRecibo}
        disabled={cargando}
        variant="outline"
        className="border-blue-600 text-blue-700 hover:bg-blue-50 min-w-[200px]"
      >
        {cargando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando recibo...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Ver / Imprimir Recibo {consecutivo}
            <ExternalLink className="ml-2 h-3 w-3" />
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}