import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReciboPDF, type ReciboPDFProps } from '@/components/ReciboPDF'
import React from 'react'

interface MovimientoRow {
  id: string
  consecutivo: string
  tipo: 'ingreso' | 'egreso'
  concepto: string
  valor: number | string
  fecha: string
  cliente_id: string | null
  razon_social_id: string | null
  medio_pago: string
  notas: string | null
  beneficiario: string | null
  clientes?: {
    nombre: string
    tipo_documento: string
    numero_documento: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: movimiento, error: movError } = await supabase
      .from('movimientos')
      .select(`
        id,
        consecutivo,
        tipo,
        concepto,
        valor,
        fecha,
        cliente_id,
        razon_social_id,
        medio_pago,
        notas,
        beneficiario,
        clientes (
          nombre,
          tipo_documento,
          numero_documento
        )
      `)
      .eq('id', id)
      .single<MovimientoRow>()

    if (movError) {
      console.error('Error consultando movimiento:', movError)
      return NextResponse.json({ error: 'Error consultando movimiento' }, { status: 500 })
    }

    if (!movimiento) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
    }

    if (!movimiento.razon_social_id) {
      return NextResponse.json(
        { error: 'El movimiento no tiene una razón social asignada' },
        { status: 400 }
      )
    }

    const { data: razonSocial, error: razonSocialError } = await supabase
      .from('razones_sociales')
      .select('nombre,nit,telefono,correo,direccion,logo_base64,logo_formato')
      .eq('id', movimiento.razon_social_id)
      .eq('activa', true)
      .maybeSingle()

    if (razonSocialError) {
      console.error('Error consultando razón social:', razonSocialError)
      return NextResponse.json({ error: 'Error consultando razón social' }, { status: 500 })
    }

    if (!razonSocial) {
      return NextResponse.json({ error: 'Razón social no encontrada' }, { status: 404 })
    }

    const { data: reciboExistente } = await supabase
      .from('recibos')
      .select('id, pdf_url')
      .eq('movimiento_id', id)
      .single()

    if (reciboExistente?.pdf_url) {
      return NextResponse.json({
        pdf_url: reciboExistente.pdf_url,
        recibo_id: reciboExistente.id,
        cached: true,
      })
    }

    const clienteNombre = movimiento.clientes?.nombre ?? movimiento.beneficiario ?? 'Sin nombre'
    const clienteDocumento = movimiento.clientes
      ? `${movimiento.clientes.tipo_documento} ${movimiento.clientes.numero_documento}`
      : ''

    const props: ReciboPDFProps = {
      consecutivo: movimiento.consecutivo,
      fecha: movimiento.fecha,
      tipo: movimiento.tipo,
      clienteNombre,
      clienteDocumento,
      concepto: movimiento.concepto,
      valor: Number(movimiento.valor),
      medioPago: movimiento.medio_pago,
      notas: movimiento.notas,
      beneficiario: movimiento.beneficiario,
      razonSocialNombre: razonSocial.nombre,
      razonSocialNit: razonSocial.nit,
      razonSocialLogo: razonSocial.logo_base64,
      razonSocialLogoFormato: razonSocial.logo_formato,
      razonSocialTelefono: razonSocial.telefono,
      razonSocialCorreo: razonSocial.correo,
    }

    const elemento = React.createElement(ReciboPDF, props)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(elemento as any)

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
      return NextResponse.json({ error: 'Error al guardar el PDF en Storage' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('recibos').getPublicUrl(uploadData.path)
    const pdfUrl = urlData.publicUrl

    const { data: nuevoRecibo, error: reciboError } = await supabase
      .from('recibos')
      .insert({ movimiento_id: id, pdf_url: pdfUrl, enviado_email: false, enviado_whatsapp: false })
      .select()
      .single()

    if (reciboError) {
      console.error('Error guardando recibo en BD:', reciboError)
      return NextResponse.json(
        { error: 'PDF generado pero error al registrar en base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pdf_url: pdfUrl, recibo_id: nuevoRecibo.id, cached: false })
  } catch (error) {
    console.error('Error inesperado generando PDF:', error)

    if (error instanceof Error && /image|logo/i.test(error.message)) {
      return NextResponse.json({ error: 'Logo inválido para generar el PDF' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
