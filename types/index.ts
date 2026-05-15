
// types/index.ts

export type TipoMovimiento = "ingreso" | "egreso";

export type MedioPago = "Efectivo" | "Transferencia" | "Nequi" | "Daviplata";

export type TipoAfiliacion = "independiente" | "dependiente" | "empresa";
export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'Pasaporte'


export interface Cliente {
  id: string
  nombre: string
  tipo_documento: TipoDocumento
  numero_documento: string
  correo: string | null
  whatsapp: string | null
  tipo_afiliacion: TipoAfiliacion
  created_at: string
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  consecutivo: string;
  cliente_id?: string;
  concepto: string;
  valor: number;
  medio_pago: MedioPago;
  fecha: string;
  soporte_url?: string;
  notas?: string;
  created_at: string;
  // Relación con cliente (cuando se hace JOIN en la consulta)
  clientes?: Cliente | null
}

export interface Recibo {
  id: string;
  movimiento_id: string;
  pdf_url: string;
  enviado_email: boolean;
  enviado_whatsapp: boolean;
  created_at: string;
}

// Tipo para el resumen del dashboard
export interface ResumenCaja {
  totalIngresos: number;
  totalEgresos: number;
  saldo: number;
  cantidadMovimientos: number;
}
// ── Formulario de Ingreso ────────────────────────────────────
export interface IngresoFormData {
  cliente_id: string
  concepto: string
  valor: number
  medio_pago: MedioPago
  fecha: string
  notas?: string
}

// ── Razón Social ─────────────────────────────────────────────
export interface RazonSocial {
  id: string
  nombre: string
  nombre_corto: string | null
  nit: string
  tipo: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  logo_base64: string | null
  logo_formato: 'jpeg' | 'png' | null
  activa: boolean
  created_at: string
}

export interface RazonSocialFormData {
  nombre: string
  nombre_corto: string
  nit: string
  direccion: string
  telefono: string
  correo: string
  logo_base64: string | null
  logo_formato: 'jpeg' | 'png' | null
}

// ── Respuesta estándar de la API ─────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}