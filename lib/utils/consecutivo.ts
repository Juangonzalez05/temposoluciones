import { createClient } from '@/lib/supabase/server'

export async function generarConsecutivo(): Promise<string> {
  const supabase = await createClient()

  const anioActual = new Date().getFullYear()

  // Buscar el último movimiento del año actual
  const { data, error } = await supabase
    .from('movimientos')
    .select('consecutivo')
    .like('consecutivo', `REC-${anioActual}-%`)
    .order('consecutivo', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error generando consecutivo:', error)
    throw new Error('No se pudo generar el número de recibo')
  }

  // Si no hay registros en este año, empieza en 0001
  if (!data || data.length === 0) {
    return `REC-${anioActual}-0001`
  }

  // Extraer el número del último consecutivo y sumarle 1
  // Ejemplo: "REC-2025-0042" → extraer "0042" → 42 → 43 → "0043"
  const ultimoConsecutivo = data[0].consecutivo
  const ultimoNumero = parseInt(ultimoConsecutivo.split('-')[2], 10)
  const nuevoNumero = ultimoNumero + 1

  // Formatear con ceros a la izquierda (siempre 4 dígitos)
  const nuevoNumeroFormateado = String(nuevoNumero).padStart(4, '0')

  return `REC-${anioActual}-${nuevoNumeroFormateado}`
}