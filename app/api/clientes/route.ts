import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('GET /api/clientes — no autenticado:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ── Consulta principal ──────────────────────────────────
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, tipo_documento, numero_documento, correo, whatsapp, tipo_afiliacion')
      .order('nombre', { ascending: true })

    // Log para diagnosticar en la terminal de Next.js
    console.log('GET /api/clientes — registros encontrados:', data?.length ?? 0)
    if (error) console.error('GET /api/clientes — error Supabase:', error)

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener los clientes', detalle: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    console.error('GET /api/clientes — error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('clientes')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('POST /api/clientes — error:', error)
      return NextResponse.json(
        { error: 'Error al crear el cliente', detalle: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, message: 'Cliente creado correctamente' },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/clientes — error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}