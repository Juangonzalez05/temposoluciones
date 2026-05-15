// Tipos de archivo permitidos para el logo
export const LOGO_TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const

// Tamaño máximo: 2 MB en bytes
export const LOGO_TAMANO_MAXIMO = 2 * 1024 * 1024

export interface LogoUploadResult {
  base64: string | null
  formato: 'jpeg' | 'png' | null
  error: string | null
}

/**
 * Convierte un archivo de imagen a base64 para almacenamiento en la base de datos.
 * Valida el tipo y tamaño del archivo antes de la conversión.
 */
export async function convertirLogoABase64(
  archivo: File
): Promise<LogoUploadResult> {
  // Validar tipo de archivo
  if (!LOGO_TIPOS_PERMITIDOS.includes(archivo.type as any)) {
    return {
      base64: null,
      formato: null,
      error: 'Tipo de archivo no permitido. Solo se aceptan JPG, JPEG o PNG.',
    }
  }

  // Validar tamaño
  if (archivo.size > LOGO_TAMANO_MAXIMO) {
    return {
      base64: null,
      formato: null,
      error: 'El archivo supera el tamaño máximo de 2 MB.',
    }
  }

  try {
    // Convertir a base64 usando FileReader
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(archivo)
    })

    // Extraer solo la parte base64 (sin el prefijo data:image/xxx;base64,)
    const base64Data = base64.split(',')[1]

    // Determinar el formato
    let formato: 'jpeg' | 'png' | null = null
    if (archivo.type === 'image/jpeg' || archivo.type === 'image/jpg') {
      formato = 'jpeg'
    } else if (archivo.type === 'image/png') {
      formato = 'png'
    }

    return {
      base64: base64Data,
      formato,
      error: null,
    }
  } catch (error) {
    console.error('Error convirtiendo logo a base64:', error)
    return {
      base64: null,
      formato: null,
      error: 'Error al procesar la imagen. Intenta con otro archivo.',
    }
  }
}

/**
 * Valida un archivo de logo sin convertirlo.
 */
export function validarLogoArchivo(archivo: File): string | null {
  if (!LOGO_TIPOS_PERMITIDOS.includes(archivo.type as any)) {
    return 'Tipo de archivo no permitido. Solo se aceptan JPG, JPEG o PNG.'
  }

  if (archivo.size > LOGO_TAMANO_MAXIMO) {
    return 'El archivo supera el tamaño máximo de 2 MB.'
  }

  return null
}
