import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busqueda  = searchParams.get('busqueda')
    const limite    = parseInt(searchParams.get('limite') ?? '500')
    const pagina    = parseInt(searchParams.get('pagina') ?? '1')
    const porPagina = parseInt(searchParams.get('porPagina') ?? '20')
    const offset    = (pagina - 1) * porPagina

    let query = supabase
      .from('clientes')
      .select(
        'id, nombre, tipo_documento, numero_documento, correo, whatsapp, tipo_afiliacion, created_at',
        { count: 'exact' }
      )
      .order('nombre', { ascending: true })

    // Si se busca con texto, filtrar por nombre o documento
    if (busqueda) {
      query = query.or(
        `nombre.ilike.%${busqueda}%,numero_documento.ilike.%${busqueda}%`
      )
      // Para búsqueda de autocompletado devolver solo los primeros 10
      query = query.limit(10)
    } else {
      query = query.range(offset, offset + porPagina - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('GET /api/clientes — error:', error)
      return NextResponse.json(
        { error: 'Error al obtener los clientes', detalle: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data:         data ?? [],
      total:        count ?? 0,
      pagina,
      porPagina,
      totalPaginas: Math.ceil((count ?? 0) / porPagina),
    })
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