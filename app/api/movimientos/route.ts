import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarConsecutivo } from '@/lib/utils/consecutivo'
import { z } from 'zod'

const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  razon_social_id: z.string().uuid('razon_social_id es requerido'),
  cliente_id: z.string().uuid('ID de cliente inválido').optional().nullable(),
  concepto: z
    .string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(200, 'El concepto no puede superar 200 caracteres'),
  valor: z.coerce
    .number()
    .positive('El valor debe ser mayor a cero')
    .max(999999999, 'El valor supera el límite permitido'),
  medio_pago: z.enum(['Efectivo', 'Transferencia', 'Nequi', 'Daviplata']),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  soporte_url: z.string().url().optional().nullable(),
  notas: z
    .string()
    .max(500, 'Las notas no pueden superar 500 caracteres')
    .optional()
    .nullable(),
  beneficiario: z
    .string({ error: 'El beneficiario es requerido para egresos' })
    .min(2, 'El nombre del beneficiario es muy corto')
    .optional()
    .nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const validacion = movimientoSchema.safeParse(body)
    if (!validacion.success) {
      const razonSocialErrors = validacion.error.flatten().fieldErrors.razon_social_id
      if (razonSocialErrors?.length) {
        return NextResponse.json({ error: 'razon_social_id es requerido' }, { status: 400 })
      }

      return NextResponse.json(
        {
          error: 'Datos inválidos',
          detalles: validacion.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const datos = validacion.data

    const { data: razonSocial, error: razonSocialError } = await supabase
      .from('razones_sociales')
      .select('id')
      .eq('id', datos.razon_social_id)
      .eq('activa', true)
      .maybeSingle()

    if (razonSocialError) {
      console.error('Error validando razón social:', razonSocialError)
      return NextResponse.json({ error: 'Error al validar la razón social' }, { status: 500 })
    }

    if (!razonSocial) {
      return NextResponse.json({ error: 'Razón social inválida' }, { status: 400 })
    }

    const consecutivo = await generarConsecutivo()

    const { data: movimiento, error: insertError } = await supabase
      .from('movimientos')
      .insert({
        tipo: datos.tipo,
        consecutivo,
        razon_social_id: datos.razon_social_id,
        cliente_id: datos.cliente_id ?? null,
        concepto: datos.concepto,
        valor: datos.valor,
        medio_pago: datos.medio_pago,
        fecha: datos.fecha,
        soporte_url: datos.soporte_url ?? null,
        notas: datos.notas ?? null,
        beneficiario: datos.beneficiario ?? null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error insertando movimiento:', insertError)
      return NextResponse.json(
        { error: 'Error al guardar el movimiento en la base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Movimiento registrado correctamente',
        data: movimiento,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error inesperado en POST /api/movimientos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const busqueda = searchParams.get('busqueda')
    const pagina = parseInt(searchParams.get('pagina') ?? '1')
    const porPagina = parseInt(searchParams.get('porPagina') ?? '20')
    const offset = (pagina - 1) * porPagina
    const clienteId = searchParams.get('cliente_id')
    const razonSocialId = searchParams.get('razon_social_id')

    if (razonSocialId) {
      const parsedRazonSocialId = z.string().uuid().safeParse(razonSocialId)
      if (!parsedRazonSocialId.success) {
        return NextResponse.json({ error: 'UUID inválido para razon_social_id' }, { status: 400 })
      }
    }

    let query = supabase
      .from('movimientos')
      .select(
        `
        *,
        clientes (
          id,
          nombre,
          tipo_documento,
          numero_documento
        ),
        recibos (
          id,
          pdf_url,
          enviado_email,
          enviado_whatsapp
        ),
        razones_sociales (
          id,
          nombre,
          nombre_corto
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + porPagina - 1)

    if (clienteId) query = query.eq('cliente_id', clienteId)
    if (tipo) query = query.eq('tipo', tipo)
    if (desde) query = query.gte('fecha', desde)
    if (hasta) query = query.lte('fecha', hasta)
    if (razonSocialId) query = query.eq('razon_social_id', razonSocialId)
    if (busqueda)
      query = query.or(
        `concepto.ilike.%${busqueda}%,consecutivo.ilike.%${busqueda}%,beneficiario.ilike.%${busqueda}%`
      )

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo movimientos:', error)
      return NextResponse.json({ error: 'Error al obtener los movimientos' }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      pagina,
      porPagina,
      totalPaginas: Math.ceil((count ?? 0) / porPagina),
    })
  } catch (error) {
    console.error('Error inesperado en GET /api/movimientos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
