import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

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
  azul:        '#1a56db',
  azulOscuro:  '#1e429f',
  azulClaro:   '#EFF6FF',
  verde:       '#057a55',
  verdeBg:     '#ECFDF5',
  rojo:        '#c81e1e',
  rojoBg:      '#FEF2F2',
  grisOscuro:  '#1F2937',
  grisMedio:   '#6B7280',
  grisClaro:   '#F3F4F6',
  blanco:      '#FFFFFF',
  negro:       '#000000',
  borde:       '#E5E7EB',
}

// ── Estilos del PDF ───────────────────────────────────────────
// Nota: react-pdf usa un subconjunto de CSS con unidades pt (puntos).
// NO soporta rem, em, %, vh, vw — solo números (pt) y algunas strings.
const estilos = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    backgroundColor: COLORES.blanco,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    fontSize: 10,
    color: COLORES.grisOscuro,
  },

  // ── Encabezado ──────────────────────────────────────────────
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORES.azul,
  },
  encabezadoIzquierda: {
    flexDirection: 'column',
    gap: 3,
    flex: 1,
  },
  logoEmpresa: {
    width: 210,
    height: 56,
    marginBottom: 6,
    objectFit: 'contain',
  },
  subtituloEmpresa: {
    fontSize: 9,
    color: COLORES.grisMedio,
  },
  infoEmpresa: {
    fontSize: 9,
    color: COLORES.grisMedio,
  },
  encabezadoDerecha: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
  },
  badgeTipo: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  badgeTexto: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.blanco,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  consecutivoLabel: {
    fontSize: 8,
    color: COLORES.grisMedio,
    textAlign: 'right',
  },
  consecutivoValor: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.azulOscuro,
    textAlign: 'right',
  },
  fechaTexto: {
    fontSize: 9,
    color: COLORES.grisMedio,
    textAlign: 'right',
  },

  // ── Secciones de datos ──────────────────────────────────────
  seccion: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 6,
    overflow: 'hidden',
  },
  seccionTitulo: {
    backgroundColor: COLORES.azulClaro,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  seccionTituloTexto: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORES.azulOscuro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seccionContenido: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // ── Filas de datos ──────────────────────────────────────────
  fila: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  filaLabel: {
    width: 130,
    fontSize: 9,
    color: COLORES.grisMedio,
    fontFamily: 'Helvetica-Bold',
  },
  filaValor: {
    flex: 1,
    fontSize: 10,
    color: COLORES.grisOscuro,
  },

  // ── Bloque de valor destacado ───────────────────────────────
  bloqueValor: {
    backgroundColor: COLORES.grisClaro,
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloqueValorLabel: {
    fontSize: 11,
    color: COLORES.grisMedio,
    fontFamily: 'Helvetica-Bold',
  },
  bloqueValorMonto: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Notas ───────────────────────────────────────────────────
  notasContenido: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notasTexto: {
    fontSize: 9,
    color: COLORES.grisMedio,
    lineHeight: 1.5,
  },

  // ── Pie de página ───────────────────────────────────────────
  piePagina: {
    position: 'absolute',
    bottom: 30,
    left: 45,
    right: 45,
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieTexto: {
    fontSize: 8,
    color: COLORES.grisMedio,
  },
  firmaBloque: {
    alignItems: 'center',
    width: 160,
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: COLORES.grisOscuro,
    width: 140,
    marginBottom: 4,
  },
  firmaTexto: {
    fontSize: 8,
    color: COLORES.grisMedio,
    textAlign: 'center',
  },
})

// ── Función para formatear pesos colombianos ──────────────────
function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
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
  const esIngreso = tipo === 'ingreso'
  const colorTipo = esIngreso ? COLORES.verde : COLORES.rojo
  const labelTipo = esIngreso ? 'Recibo de Ingreso' : 'Comprobante de Egreso'
  const logoEmpresaSrc = '/LOGO TEMPO.jpeg'

  return (
    <Document
      title={`${labelTipo} ${consecutivo} - TempoSoluciones`}
      author="TempoSoluciones"
      subject={concepto}
    >
      <Page size="A4" style={estilos.pagina}>

        {/* ── ENCABEZADO ── */}
        <View style={estilos.encabezado}>
          <View style={estilos.encabezadoIzquierda}>
            <Image style={estilos.logoEmpresa} src={logoEmpresaSrc} />
            <Text style={estilos.subtituloEmpresa}>
              Administración de Seguridad Social y Servicios
            </Text>
            <Text style={estilos.infoEmpresa}>NIT: 900.XXX.XXX-X</Text>
            <Text style={estilos.infoEmpresa}>Tel: +57 300 000 0000</Text>
            <Text style={estilos.infoEmpresa}>Medellín, Colombia</Text>
          </View>

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
            <Text style={estilos.pieTexto}>TempoSoluciones · NIT 900.XXX.XXX-X</Text>
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