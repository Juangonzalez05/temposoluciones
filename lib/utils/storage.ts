import { createClient } from '@/lib/supabase/client'

// Tipos de archivo permitidos para el soporte del egreso
export const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

// Tamaño máximo: 5 MB en bytes
export const TAMANO_MAXIMO = 5 * 1024 * 1024

export interface ResultadoSubida {
  url: string | null
  error: string | null
}

/**
 * Sube un archivo al bucket "soportes" de Supabase Storage.
 * Retorna la URL pública del archivo o un error descriptivo.
 */
export async function subirSoporte(
  archivo: File,
  onProgreso?: (porcentaje: number) => void
): Promise<ResultadoSubida> {
  // Validar tipo de archivo
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return {
      url: null,
      error: 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG, PNG o WEBP.',
    }
  }

  // Validar tamaño
  if (archivo.size > TAMANO_MAXIMO) {
    return {
      url: null,
      error: 'El archivo supera el tamaño máximo de 5 MB.',
    }
  }

  const supabase = createClient()

  // Generar nombre único para el archivo usando timestamp + nombre original
  // Esto evita colisiones si dos egresos tienen el mismo nombre de archivo
  const timestamp = Date.now()
  const extension = archivo.name.split('.').pop()
  const nombreArchivo = `soportes/egreso-${timestamp}.${extension}`

  // Simular progreso inicial (Supabase JS no expone progreso nativo)
  onProgreso?.(10)

  const { data, error } = await supabase.storage
    .from('recibos')
    .upload(nombreArchivo, archivo, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error subiendo archivo a Storage:', error)
    return {
      url: null,
      error: 'Error al subir el archivo. Intenta de nuevo.',
    }
  }

  onProgreso?.(90)

  // Obtener la URL pública del archivo subido
  const { data: urlData } = supabase.storage
    .from('recibos')
    .getPublicUrl(data.path)

  onProgreso?.(100)

  return {
    url: urlData.publicUrl,
    error: null,
  }
}