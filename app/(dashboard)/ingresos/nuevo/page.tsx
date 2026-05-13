'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
  Image as ImageIcon,
  User,
  DollarSign,
  CreditCard,
  FileCheck,
  ChevronRight,
  Receipt,
  ClipboardList,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { subirSoporte, TIPOS_PERMITIDOS, TAMANO_MAXIMO } from '@/lib/utils/storage'
import { BotonRecibo } from '@/components/BotonRecibo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ComboboxClientes } from '@/components/clientes/combobox-clientes'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Conceptos predefinidos ────────────────────────────────────
const CONCEPTOS_PREDEFINIDOS = [
  'Aporte salud',
  'Aporte pensión',
  'Aporte ARL',
  'Aporte caja de compensación',
  'Afiliación independiente',
  'Afiliación dependiente',
  'Renovación afiliación',
  'Servicio de asesoría',
  'Pago administración',
  'Otro',
]

// ── Medios de pago ────────────────────────────────────────────
const MEDIOS_PAGO = [
  { value: 'Efectivo',      label: 'Efectivo',              icon: '💵' },
  { value: 'Transferencia', label: 'Transferencia bancaria', icon: '🏦' },
  { value: 'Nequi',         label: 'Nequi',                 icon: '📱' },
  { value: 'Daviplata',     label: 'Daviplata',             icon: '📱' },
]

// ── Zod schema ────────────────────────────────────────────────
const ingresoFormSchema = z.object({
  cliente_id:             z.string().min(1, 'Debes seleccionar un cliente'),
  concepto:               z.string().min(1, 'Selecciona un concepto'),
  concepto_personalizado: z.string().optional(),
  valor: z
    .string()
    .min(1, 'El valor es requerido')
    .refine(
      (val) => !isNaN(Number(val.replace(/\./g, ''))),
      { message: 'Ingresa un valor numérico válido' }
    )
    .refine(
      (val) => Number(val.replace(/\./g, '')) > 0,
      { message: 'El valor debe ser mayor a cero' }
    ),
  medio_pago: z.enum(['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'], {
    error: 'Selecciona el medio de pago',
  }),
  fecha: z.date({ error: 'La fecha es requerida' }),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type IngresoFormValues = z.infer<typeof ingresoFormSchema>

// ── Helpers ───────────────────────────────────────────────────
function formatearPesos(valor: string): string {
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  return Number(soloNumeros).toLocaleString('es-CO')
}

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Componente: paso numerado ─────────────────────────────────
function PasoHeader({
  numero,
  titulo,
  descripcion,
  icono: Icono,
  completado,
}: {
  numero: number
  titulo: string
  descripcion: string
  icono: React.ElementType
  completado?: boolean
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors',
          completado
            ? 'bg-green-500 text-white'
            : 'bg-blue-50 text-blue-700 border-2 border-blue-200'
        )}
      >
        {completado ? <CheckCircle2 className="h-5 w-5" /> : <Icono className="h-5 w-5" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Paso {numero}
          </span>
          {completado && (
            <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0 h-5">
              Completado
            </Badge>
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 leading-tight">{titulo}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{descripcion}</p>
      </div>
    </div>
  )
}

// ── Componente: sección del formulario ────────────────────────
function SeccionFormulario({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

// ── Componente: botón de medio de pago ────────────────────────
function BotonMedioPago({
  medio,
  seleccionado,
  onClick,
}: {
  medio: { value: string; label: string; icon: string }
  seleccionado: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 transition-all w-full text-center',
        seleccionado
          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <span className="text-2xl leading-none">{medio.icon}</span>
      <span className="text-xs font-medium leading-tight">{medio.label}</span>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function NuevoIngresoPage() {
  const router = useRouter()
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  // Estados del formulario
  const [enviando, setEnviando]               = useState(false)
  const [exitoso, setExitoso]                 = useState(false)
  const [errorServidor, setErrorServidor]     = useState<string | null>(null)
  const [conceptoPersonalizado, setConceptoPersonalizado] = useState(false)
  const [movimientoId, setMovimientoId]       = useState<string | null>(null)
  const [consecutivoGenerado, setConsecutivoGenerado] = useState('')

  // Estados del archivo
  const [archivo, setArchivo]               = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo]     = useState<string | null>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [progresoSubida, setProgresoSubida] = useState(0)
  const [arrastrando, setArrastrando]       = useState(false)

  const form = useForm<IngresoFormValues>({
    resolver: zodResolver(ingresoFormSchema),
    defaultValues: {
      cliente_id:             '',
      concepto:               '',
      concepto_personalizado: '',
      valor:                  '',
      medio_pago:             undefined,
      fecha:                  new Date(),
      notas:                  '',
    },
  })

  // Observar valores para feedback visual
  const watchCliente   = form.watch('cliente_id')
  const watchConcepto  = form.watch('concepto')
  const watchValor     = form.watch('valor')
  const watchMedioPago = form.watch('medio_pago')
  const watchFecha     = form.watch('fecha')

  const paso1Completo = !!watchCliente
  const paso2Completo = !!watchConcepto && !!watchValor && !!watchMedioPago && !!watchFecha

  // ── Manejo de archivo ─────────────────────────────────────
  function validarArchivo(file: File): string | null {
    if (!TIPOS_PERMITIDOS.includes(file.type))
      return 'Tipo de archivo no permitido. Solo PDF, JPG, PNG o WEBP.'
    if (file.size > TAMANO_MAXIMO)
      return `El archivo es muy grande. Máximo ${formatearTamano(TAMANO_MAXIMO)}.`
    return null
  }

  function seleccionarArchivo(file: File) {
    const error = validarArchivo(file)
    if (error) { setErrorArchivo(error); setArchivo(null); return }
    setErrorArchivo(null)
    setArchivo(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) seleccionarArchivo(file)
  }

  function eliminarArchivo() {
    setArchivo(null)
    setErrorArchivo(null)
    setProgresoSubida(0)
    if (inputArchivoRef.current) inputArchivoRef.current.value = ''
  }

  // ── Envío del formulario ──────────────────────────────────
  async function onSubmit(values: IngresoFormValues) {
    setEnviando(true)
    setErrorServidor(null)

    let soporteUrl: string | null = null

    if (archivo) {
      setSubiendoArchivo(true)
      const resultado = await subirSoporte(archivo, setProgresoSubida)
      setSubiendoArchivo(false)
      if (resultado.error) {
        setErrorServidor(resultado.error)
        setEnviando(false)
        return
      }
      soporteUrl = resultado.url
    }

    try {
      const conceptoFinal =
        values.concepto === 'Otro' && values.concepto_personalizado
          ? values.concepto_personalizado
          : values.concepto

      const payload = {
        tipo:        'ingreso',
        cliente_id:  values.cliente_id,
        concepto:    conceptoFinal,
        valor:       Number(values.valor.replace(/\./g, '')),
        medio_pago:  values.medio_pago,
        fecha:       format(values.fecha, 'yyyy-MM-dd'),
        notas:       values.notas || null,
        soporte_url: soporteUrl,
      }

      const response = await fetch('/api/movimientos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorServidor(result.error || 'Error al guardar el ingreso')
        return
      }

      setMovimientoId(result.data.id)
      setConsecutivoGenerado(result.data.consecutivo)
      setExitoso(true)
    } catch {
      setErrorServidor('Error de conexión. Verifica tu internet e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Pantalla de éxito ─────────────────────────────────────
  if (exitoso && movimientoId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center space-y-6">
            {/* Ícono animado */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">¡Ingreso registrado!</h2>
              <p className="text-gray-500 text-sm">
                El movimiento fue guardado correctamente.
              </p>
              <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
                <Receipt className="h-4 w-4 text-gray-400" />
                <span className="font-mono font-bold text-blue-700 text-sm">
                  {consecutivoGenerado}
                </span>
              </div>
            </div>

            {/* Botón recibo */}
            <div className="flex justify-center">
              <BotonRecibo
                movimientoId={movimientoId}
                consecutivo={consecutivoGenerado}
              />
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  form.reset()
                  setExitoso(false)
                  setArchivo(null)
                  setMovimientoId(null)
                  setConsecutivoGenerado('')
                  setErrorServidor(null)
                }}
                className="rounded-xl"
              >
                Otro ingreso
              </Button>
              <Button
                onClick={() => router.push('/historial')}
                className="bg-blue-700 hover:bg-blue-800 rounded-xl"
              >
                Ver historial
              </Button>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario principal ──────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── BARRA SUPERIOR ── */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl h-10 w-10 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">Nuevo ingreso</h1>
            <p className="text-xs text-gray-400">
              Registra el pago y genera el recibo automáticamente
            </p>
          </div>
          {/* Indicador de progreso */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                paso1Completo ? 'bg-blue-600' : 'bg-gray-200'
              )}
            />
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                paso2Completo ? 'bg-blue-600' : 'bg-gray-200'
              )}
            />
            <div className="w-2 h-2 rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Error del servidor */}
        {errorServidor && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{errorServidor}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ══ PASO 1: CLIENTE ══ */}
            <SeccionFormulario>
              <PasoHeader
                numero={1}
                titulo="¿Quién realiza el pago?"
                descripcion="Busca el cliente por nombre o número de documento."
                icono={User}
                completado={paso1Completo}
              />
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ComboboxClientes
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar cliente o afiliado..."
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Escribe al menos 2 letras del nombre para buscar.{' '}
                      <a
                        href="/clientes/nuevo"
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        ¿No existe? Créalo aquí.
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SeccionFormulario>

            {/* ══ PASO 2: DATOS DEL PAGO ══ */}
            <SeccionFormulario>
              <PasoHeader
                numero={2}
                titulo="Datos del pago"
                descripcion="Completa el concepto, valor y cómo se recibió el dinero."
                icono={DollarSign}
                completado={paso2Completo}
              />

              <div className="space-y-5">
                {/* Concepto */}
                <FormField
                  control={form.control}
                  name="concepto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Concepto <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v)
                          setConceptoPersonalizado(v === 'Otro')
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-11">
                            <SelectValue placeholder="¿Por qué concepto paga?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONCEPTOS_PREDEFINIDOS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Concepto personalizado */}
                {conceptoPersonalizado && (
                  <FormField
                    control={form.control}
                    name="concepto_personalizado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Describe el concepto <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Describe el motivo del pago..."
                            className="rounded-xl h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Valor recibido <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <span className="text-gray-400 font-semibold text-lg">$</span>
                          </div>
                          <Input
                            placeholder="0"
                            className="pl-8 pr-16 text-right font-mono text-xl h-14 rounded-xl border-2 focus:border-blue-500 transition-colors bg-green-50/50 font-bold text-gray-800"
                            {...field}
                            onChange={(e) => field.onChange(formatearPesos(e.target.value))}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                              COP
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Medio de pago — botones visuales */}
                <FormField
                  control={form.control}
                  name="medio_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        ¿Cómo pagó? <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                        {MEDIOS_PAGO.map((medio) => (
                          <BotonMedioPago
                            key={medio.value}
                            medio={medio}
                            seleccionado={field.value === medio.value}
                            onClick={() => field.onChange(medio.value)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Fecha del pago <span className="text-red-500">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal rounded-xl h-11 border-2',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {field.value
                                ? format(field.value, "d 'de' MMMM 'de' yyyy", { locale: es })
                                : 'Selecciona la fecha'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SeccionFormulario>

            {/* ══ PASO 3: COMPROBANTE Y NOTAS ══ */}
            <SeccionFormulario>
              <PasoHeader
                numero={3}
                titulo="Comprobante y notas"
                descripcion="Opcional — adjunta el comprobante o agrega observaciones."
                icono={FileCheck}
              />

              <div className="space-y-5">
                {/* Zona de carga */}
                {!archivo ? (
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                      arrastrando
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    )}
                    onClick={() => inputArchivoRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                    onDragLeave={() => setArrastrando(false)}
                    onDrop={onDrop}
                  >
                    <UploadCloud className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Arrastra el comprobante aquí o{' '}
                      <span className="text-blue-600">haz clic para buscar</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG o WEBP · Máximo 5 MB
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-green-200 bg-green-50/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        {archivo.type.startsWith('image/')
                          ? <ImageIcon className="h-5 w-5 text-blue-500" />
                          : <FileText className="h-5 w-5 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {archivo.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatearTamano(archivo.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={eliminarArchivo}
                        className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {subiendoArchivo && (
                      <div className="mt-3 space-y-1">
                        <Progress value={progresoSubida} className="h-1.5" />
                        <p className="text-xs text-gray-400 text-right">
                          {progresoSubida}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) seleccionarArchivo(file)
                  }}
                />

                {errorArchivo && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription className="text-sm">{errorArchivo}</AlertDescription>
                  </Alert>
                )}

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Notas adicionales
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observaciones opcionales sobre este pago..."
                          className="rounded-xl resize-none border-2"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-right">
                        {(field.value ?? '').length}/500 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SeccionFormulario>

            {/* ══ BOTONES DE ACCIÓN ══ */}
            <div className="flex flex-col sm:flex-row gap-3 pb-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={enviando}
                className="sm:w-auto w-full rounded-xl h-12 border-2 font-semibold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando || subiendoArchivo}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl h-12 font-semibold text-base shadow-sm shadow-green-200"
              >
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {subiendoArchivo ? 'Subiendo archivo...' : 'Guardando ingreso...'}
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Registrar ingreso
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  )
}