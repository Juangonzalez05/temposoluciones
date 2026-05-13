import * as XLSX from 'xlsx'

// ── Tipo del movimiento para exportación ─────────────────────
interface MovimientoExport {
  tipo: string
  consecutivo: string
  fecha: string
  entidad: string
  concepto: string
  valor: number
  medio_pago: string
  notas: string | null
}

// ── Formatear pesos colombianos ───────────────────────────────
function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

// ── Formatear fecha DD/MM/YYYY ────────────────────────────────
function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

// ══════════════════════════════════════════════════════════════
// EXPORTAR A EXCEL (.xlsx)
// ══════════════════════════════════════════════════════════════
export function exportarExcel(
  movimientos: MovimientoExport[],
  resumen: {
    totalIngresos: number
    totalEgresos: number
    saldoNeto: number
  },
  periodo: { desde: string; hasta: string },
  nombreArchivo?: string
) {
  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Movimientos detallados ────────────────────────
  const filasTitulo = [
    ['TEMPOSOLUCIONES — REPORTE DE CAJA'],
    [`Período: ${formatearFecha(periodo.desde)} al ${formatearFecha(periodo.hasta)}`],
    [''],
  ]

  const filasEncabezado = [[
    'TIPO',
    'N° RECIBO',
    'FECHA',
    'CLIENTE / BENEFICIARIO',
    'CONCEPTO',
    'VALOR',
    'MEDIO DE PAGO',
    'NOTAS',
  ]]

  const filasMovimientos = movimientos.map(m => [
    m.tipo.toUpperCase(),
    m.consecutivo,
    formatearFecha(m.fecha),
    m.entidad,
    m.concepto,
    m.valor,       // Número para que Excel pueda sumar
    m.medio_pago,
    m.notas ?? '',
  ])

  const filasTotal = [
    [''],
    ['', '', '', '', 'TOTAL INGRESOS:', resumen.totalIngresos, '', ''],
    ['', '', '', '', 'TOTAL EGRESOS:',  resumen.totalEgresos,  '', ''],
    ['', '', '', '', 'SALDO NETO:',     resumen.saldoNeto,     '', ''],
  ]

  const todasLasFilas = [
    ...filasTitulo,
    ...filasEncabezado,
    ...filasMovimientos,
    ...filasTotal,
  ]

  const ws = XLSX.utils.aoa_to_sheet(todasLasFilas)

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 12 }, // Tipo
    { wch: 16 }, // N° recibo
    { wch: 12 }, // Fecha
    { wch: 30 }, // Entidad
    { wch: 30 }, // Concepto
    { wch: 16 }, // Valor
    { wch: 18 }, // Medio de pago
    { wch: 30 }, // Notas
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')

  // ── Hoja 2: Resumen ───────────────────────────────────────
  const wsResumen = XLSX.utils.aoa_to_sheet([
    ['RESUMEN DEL PERÍODO'],
    [`${formatearFecha(periodo.desde)} al ${formatearFecha(periodo.hasta)}`],
    [''],
    ['Concepto', 'Valor'],
    ['Total ingresos',   resumen.totalIngresos],
    ['Total egresos',    resumen.totalEgresos],
    ['Saldo neto',       resumen.saldoNeto],
    [''],
    ['Total movimientos', movimientos.length],
    ['Movimientos de ingreso', movimientos.filter(m => m.tipo === 'ingreso').length],
    ['Movimientos de egreso',  movimientos.filter(m => m.tipo === 'egreso').length],
  ])

  wsResumen['!cols'] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // ── Descargar el archivo ──────────────────────────────────
  const nombre = nombreArchivo
    ?? `reporte-caja-${periodo.desde}-${periodo.hasta}.xlsx`

  XLSX.writeFile(wb, nombre)
}

// ══════════════════════════════════════════════════════════════
// EXPORTAR A CSV
// ══════════════════════════════════════════════════════════════
export function exportarCSV(
  movimientos: MovimientoExport[],
  periodo: { desde: string; hasta: string },
  nombreArchivo?: string
) {
  const ws = XLSX.utils.aoa_to_sheet([
    ['TIPO', 'N° RECIBO', 'FECHA', 'CLIENTE / BENEFICIARIO', 'CONCEPTO', 'VALOR', 'MEDIO DE PAGO', 'NOTAS'],
    ...movimientos.map(m => [
      m.tipo.toUpperCase(),
      m.consecutivo,
      formatearFecha(m.fecha),
      m.entidad,
      m.concepto,
      m.valor,
      m.medio_pago,
      m.notas ?? '',
    ]),
  ])

  const csv = XLSX.utils.sheet_to_csv(ws)

  // Descargar como archivo .csv
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = nombreArchivo ?? `reporte-caja-${periodo.desde}-${periodo.hasta}.csv`
  link.click()
  URL.revokeObjectURL(url)
}