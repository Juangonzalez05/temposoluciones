'use client'

import { useState, useEffect, useRef } from 'react'
import { BotonRecibo } from '@/components/BotonRecibo'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
  Image as ImageIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { subirSoporte, TIPOS_PERMITIDOS, TAMANO_MAXIMO } from '@/lib/utils/storage'

// ── Conceptos predefinidos para egresos ──────────────────────
const CONCEPTOS_EGRESO = [
  'Pago nómina',
  'Pago seguridad social empleados',
  'Arriendo oficina',
  'Servicios públicos',
  'Papelería y útiles',
  'Mantenimiento equipos',
  'Pago proveedor',
  'Gastos bancarios',
  'Impuestos y tasas',
  'Otro',
]

// ── Medios de pago ───────────────────────────────────────────
const MEDIOS_PAGO = [
  { value: 'Efectivo',      label: '💵 Efectivo' },
  { value: 'Transferencia', label: '🏦 Transferencia bancaria' },
  { value: 'Nequi',         label: '📱 Nequi' },
  { value: 'Daviplata',     label: '📱 Daviplata' },
]

// ── Esquema de validación — Zod v4 ───────────────────────────
// IMPORTANTE: En Zod v4 se usa `error` en lugar de
// `invalid_type_error` o `required_error` (eliminados en v4)
const egresoFormSchema = z.object({
  beneficiario: z
    .string({ error: 'El beneficiario es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),

  concepto: z
    .string({ error: 'El concepto es requerido' })
    .min(1, 'Selecciona un concepto'),

  concepto_personalizado: z.string().optional(),

  valor: z
    .string({ error: 'El valor es requerido' })
    .min(1, 'El valor es requerido')
    .refine(
      (val) => !isNaN(Number(val.replace(/\./g, ''))),
      { error: 'Ingresa un valor numérico válido' }
    )
    .refine(
      (val) => Number(val.replace(/\./g, '')) > 0,
      { error: 'El valor debe ser mayor a cero' }
    ),

  medio_pago: z.enum(
    ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'],
    { error: 'Selecciona el medio de pago' }
  ),

  fecha: z.date({ error: 'La fecha es requerida' }),

  notas: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
})

type EgresoFormValues = z.infer<typeof egresoFormSchema>

// ── Formatear pesos colombianos ───────────────────────────────
function formatearPesos(valor: string): string {
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  return Number(soloNumeros).toLocaleString('es-CO')
}

// ── Formatear tamaño de archivo ───────────────────────────────
function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function NuevoEgresoPage() {
  const router = useRouter()
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  // Estados del formulario
  const [conceptoPersonalizado, setConceptoPersonalizado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exitoso, setExitoso] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [movimientoId, setMovimientoId] = useState<string | null>(null)
  const [consecutivoGenerado, setConsecutivoGenerado] = useState<string>('')
  // Estados del archivo adjunto
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [progresoSubida, setProgresoSubida] = useState(0)
  const [arrastrando, setArrastrando] = useState(false)

  const form = useForm<EgresoFormValues>({
    resolver: zodResolver(egresoFormSchema),
    defaultValues: {
      beneficiario: '',
      concepto: '',
      concepto_personalizado: '',
      valor: '',
      medio_pago: undefined,
      fecha: new Date(),
      notas: '',
    },
  })

  // ── Manejo del archivo ────────────────────────────────────
  function validarArchivo(file: File): string | null {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo PDF, JPG, PNG o WEBP.'
    }
    if (file.size > TAMANO_MAXIMO) {
      return `El archivo es muy grande. Máximo ${formatearTamano(TAMANO_MAXIMO)}.`
    }
    return null
  }

  function seleccionarArchivo(file: File) {
    const error = validarArchivo(file)
    if (error) {
      setErrorArchivo(error)
      setArchivo(null)
      return
    }
    setErrorArchivo(null)
    setArchivo(file)
  }

  function onCambioInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) seleccionarArchivo(file)
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
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = ''
    }
  }

  function esImagen(tipo: string): boolean {
    return tipo.startsWith('image/')
  }

  // ── Envío del formulario ──────────────────────────────────
  async function onSubmit(values: EgresoFormValues) {
    setEnviando(true)
    setErrorServidor(null)

    let soporteUrl: string | null = null

    // Si hay archivo adjunto, subirlo primero a Storage
    if (archivo) {
      setSubiendoArchivo(true)
      setProgresoSubida(0)

      const resultado = await subirSoporte(archivo, (progreso) => {
        setProgresoSubida(progreso)
      })

      setSubiendoArchivo(false)

      if (resultado.error) {
        setErrorServidor(resultado.error)
        setEnviando(false)
        return
      }

      soporteUrl = resultado.url
    }

    try {
      // Determinar concepto final
      const conceptoFinal =
        values.concepto === 'Otro' && values.concepto_personalizado
          ? values.concepto_personalizado
          : values.concepto

      // Convertir valor formateado a número
      const valorNumerico = Number(values.valor.replace(/\./g, ''))

      const payload = {
        tipo: 'egreso',
        cliente_id: null, // Los egresos no tienen cliente asociado
        concepto: conceptoFinal,
        valor: valorNumerico,
        medio_pago: values.medio_pago,
        fecha: format(values.fecha, 'yyyy-MM-dd'),
        soporte_url: soporteUrl,
        notas: values.notas || null,
        beneficiario: values.beneficiario,
      }

      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorServidor(result.error || 'Error al guardar el egreso')
        return
      }

      setMovimientoId(result.data.id)
      setConsecutivoGenerado(result.data.consecutivo)
      setExitoso(true)

      // Redirigir al historial después de 2 segundos
      // setTimeout(() => {
      //   router.push('/historial')
      //   router.refresh()
      // }, 2000)

    } catch (error) {
      console.error('Error en onSubmit:', error)
      setErrorServidor('Error de conexión. Verifica tu internet e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Pantalla de éxito ─────────────────────────────────────
  if (exitoso && movimientoId) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-800">¡Egreso registrado!</h2>
        <p className="text-gray-500 text-sm">
          El movimiento <span className="font-mono font-bold">{consecutivoGenerado}</span> fue
          guardado correctamente.
          {archivo ? ' El soporte fue adjuntado.' : ''}
        </p>
      </div>

      <BotonRecibo
        movimientoId={movimientoId}
        consecutivo={consecutivoGenerado}
      />

      <div className="flex gap-3">
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
          className="text-sm"
        >
          Registrar otro egreso
        </Button>
        <Button
          onClick={() => router.push('/historial')}
          className="bg-blue-700 hover:bg-blue-800 text-sm"
        >
          Ir al historial
        </Button>
      </div>
    </div>
  )
}

  // ── Formulario principal ──────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar nuevo egreso</h1>
        <p className="text-gray-500 text-sm mt-1">
          Completa los datos del pago realizado y adjunta el soporte si lo tienes disponible.
        </p>
      </div>

      {/* Error del servidor */}
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ── SECCIÓN: Beneficiario ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiario del pago</CardTitle>
              <CardDescription>
                ¿A quién se le realizó el pago? (proveedor, persona, entidad)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="beneficiario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nombre del beneficiario <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Empresa de Acueducto, Juan Pérez, Proveedor XYZ..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puede ser una persona natural, empresa o entidad.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── SECCIÓN: Datos del egreso ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del egreso</CardTitle>
              <CardDescription>Información del pago realizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Concepto */}
              <FormField
                control={form.control}
                name="concepto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Concepto del egreso <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setConceptoPersonalizado(value === 'Otro')
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el concepto del gasto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONCEPTOS_EGRESO.map((concepto) => (
                          <SelectItem key={concepto} value={concepto}>
                            {concepto}
                          </SelectItem>
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
                      <FormLabel>
                        Especifica el concepto <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Describe el concepto del egreso..."
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
                    <FormLabel>
                      Valor <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          $
                        </span>
                        <Input
                          placeholder="0"
                          className="pl-7 text-right font-mono text-lg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(formatearPesos(e.target.value))
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          COP
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Valor en pesos colombianos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medio de pago */}
              <FormField
                control={form.control}
                name="medio_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Medio de pago <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="¿Cómo se realizó el pago?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDIOS_PAGO.map((medio) => (
                          <SelectItem key={medio.value} value={medio.value}>
                            {medio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha */}
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Fecha del pago <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "d 'de' MMMM 'de' yyyy", { locale: es })
                              : 'Selecciona la fecha'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Por defecto es hoy. Cámbiala si el pago fue en otra fecha.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── SECCIÓN: Soporte del egreso ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Soporte del egreso</CardTitle>
              <CardDescription>
                Adjunta la factura, recibo o comprobante del pago. Opcional pero recomendado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Zona de carga — si NO hay archivo seleccionado */}
              {!archivo && (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                    arrastrando
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  )}
                  onClick={() => inputArchivoRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={onDrop}
                >
                  <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra el archivo aquí o{' '}
                    <span className="text-blue-600 underline">haz clic para buscarlo</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG, PNG o WEBP · Máximo 5 MB
                  </p>
                </div>
              )}

              {/* Input oculto */}
              <input
                ref={inputArchivoRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={onCambioInput}
              />

              {/* Error de validación del archivo */}
              {errorArchivo && (
                <Alert variant="destructive">
                  <AlertDescription>{errorArchivo}</AlertDescription>
                </Alert>
              )}

              {/* Vista previa del archivo seleccionado */}
              {archivo && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    {esImagen(archivo.type) ? (
                      <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {archivo.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatearTamano(archivo.size)} · {archivo.type}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={eliminarArchivo}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Barra de progreso (visible mientras se sube) */}
                  {subiendoArchivo && (
                    <div className="mt-3 space-y-1">
                      <Progress value={progresoSubida} className="h-2" />
                      <p className="text-xs text-gray-400 text-right">
                        Subiendo archivo... {progresoSubida}%
                      </p>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* ── SECCIÓN: Notas ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas adicionales</CardTitle>
              <CardDescription>
                Opcional — observaciones sobre este egreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Pago correspondiente al mes de mayo. Factura N° 1234..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Máximo 500 caracteres.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Botones ── */}
          <div className="flex gap-3 justify-end pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 min-w-[160px]"
              disabled={enviando || subiendoArchivo}
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {subiendoArchivo ? 'Subiendo archivo...' : 'Guardando...'}
                </>
              ) : (
                '💾 Registrar egreso'
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  )
}