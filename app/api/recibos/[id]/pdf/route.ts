import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReciboPDF, type ReciboPDFProps } from '@/components/ReciboPDF'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // ── Verificar autenticación ───────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ── Obtener datos del movimiento con JOIN a clientes ──
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos')
      .select(`
        *,
        clientes (
          nombre,
          tipo_documento,
          numero_documento
        )
      `)
      .eq('id', id)
      .single()

    if (movError || !movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      )
    }

    // ── Verificar si ya existe un recibo para este movimiento ──
    const { data: reciboExistente } = await supabase
      .from('recibos')
      .select('id, pdf_url')
      .eq('movimiento_id', id)
      .single()

    if (reciboExistente?.pdf_url) {
      return NextResponse.json({
        pdf_url:   reciboExistente.pdf_url,
        recibo_id: reciboExistente.id,
        cached:    true,
      })
    }

    // ── Preparar datos para la plantilla ─────────────────
    const clienteNombre =
      movimiento.clientes?.nombre ?? movimiento.beneficiario ?? 'Sin nombre'

    const clienteDocumento = movimiento.clientes
      ? `${movimiento.clientes.tipo_documento} ${movimiento.clientes.numero_documento}`
      : ''

    // ── Props del componente ──────────────────────────────
    const props: ReciboPDFProps = {
      consecutivo:      movimiento.consecutivo,
      fecha:            movimiento.fecha,
      tipo:             movimiento.tipo as 'ingreso' | 'egreso',
      clienteNombre,
      clienteDocumento,
      concepto:         movimiento.concepto,
      valor:            Number(movimiento.valor),
      medioPago:        movimiento.medio_pago,
      notas:            movimiento.notas ?? null,
      beneficiario:     movimiento.beneficiario ?? null,
    }

    // ── Generar el PDF como buffer ────────────────────────
    // Se usa React.createElement porque este archivo es .ts (no .tsx)
    // y no puede procesar sintaxis JSX directamente.
 const elemento = React.createElement(ReciboPDF, props)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfBuffer = await renderToBuffer(elemento as any)

    // ── Subir el PDF a Supabase Storage ───────────────────
    const nombreArchivo = `recibos/recibo-${movimiento.consecutivo}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recibos')
      .upload(nombreArchivo, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error subiendo PDF a Storage:', uploadError)
      return NextResponse.json(
        { error: 'Error al guardar el PDF en Storage' },
        { status: 500 }
      )
    }

    // ── Obtener URL pública del PDF ───────────────────────
    const { data: urlData } = supabase.storage
      .from('recibos')
      .getPublicUrl(uploadData.path)

    const pdfUrl = urlData.publicUrl

    // ── Guardar referencia en la tabla recibos ────────────
    const { data: nuevoRecibo, error: reciboError } = await supabase
      .from('recibos')
      .insert({
        movimiento_id:    id,
        pdf_url:          pdfUrl,
        enviado_email:    false,
        enviado_whatsapp: false,
      })
      .select()
      .single()

    if (reciboError) {
      console.error('Error guardando recibo en BD:', reciboError)
      return NextResponse.json(
        { error: 'PDF generado pero error al registrar en base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      pdf_url:   pdfUrl,
      recibo_id: nuevoRecibo.id,
      cached:    false,
    })

  } catch (error) {
    console.error('Error inesperado generando PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}