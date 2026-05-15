import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const razonSocialId = searchParams.get('razon_social_id')

    if (!desde || !hasta) {
      return NextResponse.json(
        { error: 'Los parámetros "desde" y "hasta" son requeridos' },
        { status: 400 }
      )
    }

    if (razonSocialId) {
      const parsedRazonSocialId = z.string().uuid().safeParse(razonSocialId)
      if (!parsedRazonSocialId.success) {
        return NextResponse.json({ error: 'UUID inválido para razon_social_id' }, { status: 400 })
      }
    }

    // ── Obtener todos los movimientos del período ─────────
    let query = supabase
      .from('movimientos')
      .select(`
        id,
        tipo,
        consecutivo,
        concepto,
        valor,
        medio_pago,
        fecha,
        beneficiario,
        notas,
        created_at,
        clientes (
          nombre,
          tipo_documento,
          numero_documento
        ),
        recibos (
          pdf_url,
          enviado_email,
          enviado_whatsapp
        ),
        razones_sociales (
          id,
          nombre,
          nombre_corto
        )
      `)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })

    if (razonSocialId) {
      query = query.eq('razon_social_id', razonSocialId)
    }

    const { data: movimientos, error } = await query

    if (error) {
      console.error('Error obteniendo reporte:', error)
      return NextResponse.json(
        { error: 'Error al obtener los datos del reporte' },
        { status: 500 }
      )
    }

    const datos = movimientos ?? []

    // ── Calcular totales ──────────────────────────────────
    const totalIngresos = datos
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + Number(m.valor), 0)

    const totalEgresos = datos
      .filter(m => m.tipo === 'egreso')
      .reduce((acc, m) => acc + Number(m.valor), 0)

    const saldoNeto    = totalIngresos - totalEgresos
    const cantIngresos = datos.filter(m => m.tipo === 'ingreso').length
    const cantEgresos  = datos.filter(m => m.tipo === 'egreso').length

    // ── Desglose por medio de pago ────────────────────────
    const porMedioPago: Record<string, number> = {}
    datos
      .filter(m => m.tipo === 'ingreso')
      .forEach(m => {
        const mp = m.medio_pago
        porMedioPago[mp] = (porMedioPago[mp] ?? 0) + Number(m.valor)
      })

    return NextResponse.json({
      resumen: {
        totalIngresos,
        totalEgresos,
        saldoNeto,
        cantIngresos,
        cantEgresos,
        totalMovimientos: datos.length,
        porMedioPago,
      },
      movimientos: datos,
      periodo: { desde, hasta },
    })

  } catch (error) {
    console.error('Error inesperado en GET /api/reportes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}