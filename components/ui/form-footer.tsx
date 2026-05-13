'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormFooterProps {
  enviando: boolean
  subiendoArchivo?: boolean
  labelBotonEnvio: string
  colorBoton?: string
  iconoBoton?: React.ReactNode
}

export function FormFooter({
  enviando,
  subiendoArchivo = false,
  labelBotonEnvio,
  colorBoton = 'bg-gray-800 hover:bg-gray-900',
  iconoBoton,
}: FormFooterProps) {
  const router = useRouter()

  return (
    /*
      - En móvil: fixed bottom-0, ancho completo, fondo blanco con sombra
      - En escritorio (sm+): estático, alineado a la derecha
    */
    <div
      className={cn(
        // Móvil: barra fija en el fondo
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex gap-3',
        // Escritorio: estático, al final del formulario
        'sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:justify-end sm:pb-8'
      )}
    >
      {/* Botón Cancelar/Volver */}
      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
        disabled={enviando}
        className="flex-1 sm:flex-none sm:w-auto gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden xs:inline">Cancelar</span>
        <span className="xs:hidden">Volver</span>
      </Button>

      {/* Botón de envío */}
      <Button
        type="submit"
        className={cn(colorBoton, 'flex-1 sm:flex-none sm:min-w-[180px] gap-2')}
        disabled={enviando || subiendoArchivo}
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {subiendoArchivo ? 'Subiendo...' : 'Guardando...'}
          </>
        ) : (
          <>
            {iconoBoton}
            {labelBotonEnvio}
          </>
        )}
      </Button>
    </div>
  )
}