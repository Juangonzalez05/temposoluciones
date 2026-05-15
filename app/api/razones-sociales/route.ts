import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('razones_sociales')
      .select('id, nombre, nombre_corto, nit, tipo')
      .eq('activa', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('GET /api/razones-sociales — error:', error)
      return NextResponse.json(
        { error: 'Error al obtener razones sociales', detalle: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('GET /api/razones-sociales — error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
