import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(value: string) {
  return UUID_REGEX.test(value)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

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
      .select(
        'id, nombre, nombre_corto, nit, tipo, direccion, telefono, correo, logo_base64, logo_formato, activa, created_at'
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Razón social no encontrada' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/razones-sociales/[id] — error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const allowedFields = [
      'nombre',
      'nombre_corto',
      'direccion',
      'telefono',
      'correo',
      'logo_base64',
      'logo_formato',
      'activa',       // ← corregido: era 'actua'
    ] as const

    const payload: Record<string, unknown> = {}

    for (const key of Object.keys(body)) {
      if (!allowedFields.includes(key as (typeof allowedFields)[number])) {
        return NextResponse.json(
          { error: `Campo no permitido: ${key}` },
          { status: 400 }
        )
      }
      payload[key] = body[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'Payload inválido: no hay campos para actualizar' },
        { status: 400 }
      )
    }

    if (
      payload.logo_formato !== undefined &&
      payload.logo_formato !== null &&
      !['jpeg', 'png'].includes(String(payload.logo_formato))
    ) {
      return NextResponse.json(
        { error: 'Payload inválido: logo_formato debe ser "jpeg" o "png"' },
        { status: 400 }
      )
    }

    if (payload.activa !== undefined && typeof payload.activa !== 'boolean') {
      return NextResponse.json(
        { error: 'Payload inválido: activa debe ser boolean' },  // ← corregido
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('razones_sociales')
      .update(payload)
      .eq('id', id)
      .select(
        'id, nombre, nombre_corto, nit, tipo, direccion, telefono, correo, logo_base64, logo_formato, activa, created_at'
      )                                    // ← corregido: era 'actua'
      .single()

    if (error || !data) {
      if (error) {
        console.error('PATCH /api/razones-sociales/[id] — error supabase:', error)
      }
      return NextResponse.json({ error: 'Razón social no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data, message: 'Razón social actualizada' })
  } catch (err) {
    console.error('PATCH /api/razones-sociales/[id] — error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}