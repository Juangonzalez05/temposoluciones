import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,

} from '@react-pdf/renderer'
// Agregar junto a los otros imports al inicio del archivo:
import { LOGO_BASE64 } from '@/lib/utils/logo-base64'
// ── Datos que recibe el componente ────────────────────────────
export interface ReciboPDFProps {
  consecutivo: string
  fecha: string
  tipo: 'ingreso' | 'egreso'
  clienteNombre: string
  clienteDocumento: string
  concepto: string
  valor: number
  medioPago: string
  notas?: string | null
  beneficiario?: string | null
}

// ── Paleta de colores ─────────────────────────────────────────
const COLORES = {
  azul:       '#1a56db',
  azulOscuro: '#1e429f',
  azulClaro:  '#EFF6FF',
  verde:      '#057a55',
  verdeBg:    '#ECFDF5',
  rojo:       '#c81e1e',
  rojoBg:     '#FEF2F2',
  grisOscuro: '#1F2937',
  grisMedio:  '#6B7280',
  grisClaro:  '#F3F4F6',
  blanco:     '#FFFFFF',
  borde:      '#E5E7EB',
}

// ── Estilos del PDF ───────────────────────────────────────────
const estilos = StyleSheet.create({
  pagina: {
    fontFamily:       'Helvetica',
    backgroundColor:  COLORES.blanco,
    paddingTop:       40,
    paddingBottom:    50,
    paddingHorizontal: 45,
    fontSize:         10,
    color:            COLORES.grisOscuro,
  },

  // ── Encabezado ──────────────────────────────────────────────
  encabezado: {
    flexDirection:      'row',
    justifyContent:     'space-between',
    alignItems:         'flex-start',
    marginBottom:       24,
    paddingBottom:      16,
    borderBottomWidth:  2,
    borderBottomColor:  COLORES.azul,
  },
  encabezadoIzquierda: {
    flexDirection: 'column',
    alignItems:   'flex-start',
    gap:           2,
  },

  // ── Logo ────────────────────────────────────────────────────
  // Ajusta width y height según las proporciones reales de tu logo.
  // Si tu logo es más ancho que alto (formato horizontal),
  // aumenta el width y reduce el height.
  // Si es cuadrado, ponlos iguales. Valores en puntos (pt).
  logo: {
    width:       200,
    height:      65,
    objectFit:   'contain', // mantiene proporciones sin distorsionar
    alignSelf:   'flex-start',  
    marginBottom: 6,
  },

  subtituloEmpresa: {
    fontSize: 9,
    color:    COLORES.grisMedio,
  },
  infoEmpresa: {
    fontSize: 9,
    color:    COLORES.grisMedio,
  },
  encabezadoDerecha: {
    flexDirection: 'column',
    alignItems:    'flex-end',
    gap:           3,
  },
  badgeTipo: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      4,
    marginBottom:      6,
  },
  badgeTexto: {
    fontSize:       11,
    fontFamily:     'Helvetica-Bold',
    color:          COLORES.blanco,
    textTransform:  'uppercase',
    letterSpacing:  0.8,
  },
  consecutivoLabel: {
    fontSize:  8,
    color:     COLORES.grisMedio,
    textAlign: 'right',
  },
  consecutivoValor: {
    fontSize:   13,
    fontFamily: 'Helvetica-Bold',
    color:      COLORES.azulOscuro,
    textAlign:  'right',
  },
  fechaTexto: {
    fontSize:  9,
    color:     COLORES.grisMedio,
    textAlign: 'right',
  },

  // ── Secciones de datos ──────────────────────────────────────
  seccion: {
    marginBottom:  14,
    borderWidth:   1,
    borderColor:   COLORES.borde,
    borderRadius:  6,
    overflow:      'hidden',
  },
  seccionTitulo: {
    backgroundColor:  COLORES.azulClaro,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  seccionTituloTexto: {
    fontSize:       9,
    fontFamily:     'Helvetica-Bold',
    color:          COLORES.azulOscuro,
    textTransform:  'uppercase',
    letterSpacing:  0.5,
  },
  seccionContenido: {
    paddingHorizontal: 12,
    paddingVertical:   10,
  },

  // ── Filas de datos ──────────────────────────────────────────
  fila: {
    flexDirection: 'row',
    marginBottom:  6,
    alignItems:    'flex-start',
  },
  filaLabel: {
    width:      130,
    fontSize:   9,
    color:      COLORES.grisMedio,
    fontFamily: 'Helvetica-Bold',
  },
  filaValor: {
    flex:     1,
    fontSize: 10,
    color:    COLORES.grisOscuro,
  },

  // ── Bloque de valor destacado ───────────────────────────────
  bloqueValor: {
    backgroundColor: COLORES.grisClaro,
    borderRadius:    6,
    padding:         14,
    marginBottom:    14,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  bloqueValorLabel: {
    fontSize:   11,
    color:      COLORES.grisMedio,
    fontFamily: 'Helvetica-Bold',
  },
  bloqueValorMonto: {
    fontSize:   22,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Notas ───────────────────────────────────────────────────
  notasContenido: {
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  notasTexto: {
    fontSize:   9,
    color:      COLORES.grisMedio,
    lineHeight: 1.5,
  },

  // ── Pie de página ───────────────────────────────────────────
  piePagina: {
    position:        'absolute',
    bottom:          30,
    left:            45,
    right:           45,
    borderTopWidth:  1,
    borderTopColor:  COLORES.borde,
    paddingTop:      10,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  pieTexto: {
    fontSize: 8,
    color:    COLORES.grisMedio,
  },
  firmaBloque: {
    alignItems: 'center',
    width:      160,
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: COLORES.grisOscuro,
    width:          140,
    marginBottom:   4,
  },
  firmaTexto: {
    fontSize:  8,
    color:     COLORES.grisMedio,
    textAlign: 'center',
  },
})

// ── Función para formatear pesos colombianos ──────────────────
function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

// ── Función para formatear fecha legible ──────────────────────
function formatearFecha(fecha: string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  const [anio, mes, dia] = fecha.split('-')
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL DEL RECIBO
// ══════════════════════════════════════════════════════════════
export function ReciboPDF({
  consecutivo,
  fecha,
  tipo,
  clienteNombre,
  clienteDocumento,
  concepto,
  valor,
  medioPago,
  notas,
  beneficiario,
}: ReciboPDFProps) {
  const esIngreso  = tipo === 'ingreso'
  const colorTipo  = esIngreso ? COLORES.verde : COLORES.rojo
  const labelTipo  = esIngreso ? 'Recibo de Ingreso' : 'Comprobante de Egreso'

  return (
    <Document
      title={`${labelTipo} ${consecutivo} - TempoSoluciones`}
      author="TempoSoluciones"
      subject={concepto}
    >
      <Page size="A4" style={estilos.pagina}>

        {/* ── ENCABEZADO ── */}
        <View style={estilos.encabezado}>

          {/* LADO IZQUIERDO: logo + datos de contacto */}
          <View style={estilos.encabezadoIzquierda}>

            {/*
              LOGO: se carga desde la carpeta public/ del proyecto.
              El path debe ser absoluto partiendo de la raíz del servidor.

              ── Si el archivo es PNG ──
              src="/logo-temposoluciones.png"

              ── Si el archivo es JPEG/JPG ──
              src="/logo-temposoluciones.jpg"

              Cambia el nombre si usaste uno diferente al copiar el archivo.
            */}
           <Image
              src={{uri:LOGO_BASE64,format: 'png' }}
              style={estilos.logo}
            />

            <Text style={estilos.subtituloEmpresa}>
              Administración de Seguridad Social y Servicios
            </Text>
            <Text style={estilos.infoEmpresa}>NIT: 901013892-8</Text>
            <Text style={estilos.infoEmpresa}>Tel: +57 311 794 7842</Text>
            <Text style={estilos.infoEmpresa}>Bello, Colombia</Text>
          </View>

          {/* LADO DERECHO: tipo de recibo + consecutivo + fecha */}
          <View style={estilos.encabezadoDerecha}>
            <View style={[estilos.badgeTipo, { backgroundColor: colorTipo }]}>
              <Text style={estilos.badgeTexto}>{labelTipo}</Text>
            </View>
            <Text style={estilos.consecutivoLabel}>Número de recibo</Text>
            <Text style={estilos.consecutivoValor}>{consecutivo}</Text>
            <Text style={estilos.fechaTexto}>{formatearFecha(fecha)}</Text>
          </View>
        </View>

        {/* ── MONTO DESTACADO ── */}
        <View style={estilos.bloqueValor}>
          <Text style={estilos.bloqueValorLabel}>
            {esIngreso ? 'VALOR RECIBIDO' : 'VALOR PAGADO'}
          </Text>
          <Text style={[estilos.bloqueValorMonto, { color: colorTipo }]}>
            {formatearPesos(valor)}
          </Text>
        </View>

        {/* ── DATOS DEL CLIENTE (solo ingresos) ── */}
        {esIngreso && (
          <View style={estilos.seccion}>
            <View style={estilos.seccionTitulo}>
              <Text style={estilos.seccionTituloTexto}>Datos del cliente</Text>
            </View>
            <View style={estilos.seccionContenido}>
              <View style={estilos.fila}>
                <Text style={estilos.filaLabel}>Nombre completo:</Text>
                <Text style={estilos.filaValor}>{clienteNombre}</Text>
              </View>
              <View style={estilos.fila}>
                <Text style={estilos.filaLabel}>Documento:</Text>
                <Text style={estilos.filaValor}>{clienteDocumento}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── DATOS DEL BENEFICIARIO (solo egresos) ── */}
        {!esIngreso && beneficiario && (
          <View style={estilos.seccion}>
            <View style={estilos.seccionTitulo}>
              <Text style={estilos.seccionTituloTexto}>Beneficiario del pago</Text>
            </View>
            <View style={estilos.seccionContenido}>
              <View style={estilos.fila}>
                <Text style={estilos.filaLabel}>Nombre / Entidad:</Text>
                <Text style={estilos.filaValor}>{beneficiario}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── DETALLES DEL MOVIMIENTO ── */}
        <View style={estilos.seccion}>
          <View style={estilos.seccionTitulo}>
            <Text style={estilos.seccionTituloTexto}>Detalles del movimiento</Text>
          </View>
          <View style={estilos.seccionContenido}>
            <View style={estilos.fila}>
              <Text style={estilos.filaLabel}>Concepto:</Text>
              <Text style={estilos.filaValor}>{concepto}</Text>
            </View>
            <View style={estilos.fila}>
              <Text style={estilos.filaLabel}>Medio de pago:</Text>
              <Text style={estilos.filaValor}>{medioPago}</Text>
            </View>
            <View style={estilos.fila}>
              <Text style={estilos.filaLabel}>Fecha:</Text>
              <Text style={estilos.filaValor}>{formatearFecha(fecha)}</Text>
            </View>
            <View style={estilos.fila}>
              <Text style={estilos.filaLabel}>N° Recibo:</Text>
              <Text style={estilos.filaValor}>{consecutivo}</Text>
            </View>
          </View>
        </View>

        {/* ── NOTAS (si existen) ── */}
        {notas && (
          <View style={estilos.seccion}>
            <View style={estilos.seccionTitulo}>
              <Text style={estilos.seccionTituloTexto}>Observaciones</Text>
            </View>
            <View style={estilos.notasContenido}>
              <Text style={estilos.notasTexto}>{notas}</Text>
            </View>
          </View>
        )}

        {/* ── PIE DE PÁGINA ── */}
        <View style={estilos.piePagina} fixed>
          <View>
            <Text style={estilos.pieTexto}>TempoSoluciones · NIT 901013892-8</Text>
            <Text style={estilos.pieTexto}>Documento generado digitalmente</Text>
          </View>
          <View style={estilos.firmaBloque}>
            <View style={estilos.firmaLinea} />
            <Text style={estilos.firmaTexto}>Firma / Sello TempoSoluciones</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}