'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Building2,
  Edit,
  Loader2,
  CheckCircle2,
  UploadCloud,
  X,
  Image as ImageIcon,
  Settings,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { RazonSocial } from '@/types'
import { convertirLogoABase64, validarLogoArchivo, LOGO_TAMANO_MAXIMO } from '@/lib/utils/logo-upload'

// ── Zod schema ────────────────────────────────────────────────
const razonSocialFormSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  nombre_corto: z
    .string()
    .max(50, 'El nombre corto no puede superar 50 caracteres')
    .optional()
    .or(z.literal('')),
  nit: z
    .string()
    .min(8, 'El NIT debe tener al menos 8 caracteres')
    .max(15, 'El NIT no puede superar 15 caracteres')
    .regex(/^[0-9\-]+$/, 'Solo se permiten números y guiones'),
  direccion: z
    .string()
    .max(200, 'La dirección no puede superar 200 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(15, 'El teléfono no puede superar 15 caracteres')
    .regex(/^[0-9\+\-\s]+$/, 'Solo se permiten números, +, - y espacios')
    .optional()
    .or(z.literal('')),
  correo: z
    .string()
    .email('Ingresa un correo válido')
    .optional()
    .or(z.literal('')),
})

type RazonSocialFormValues = z.infer<typeof razonSocialFormSchema>

// ── Helpers ───────────────────────────────────────────────────
function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Componente: Logo Preview ───────────────────────────────────
function LogoPreview({ 
  logoBase64, 
  logoFormato, 
  onRemove 
}: { 
  logoBase64: string | null
  logoFormato: 'jpeg' | 'png' | null
  onRemove: () => void 
}) {
  if (!logoBase64) return null

  const dataUrl = `data:image/${logoFormato};base64,${logoBase64}`

  return (
    <div className="relative inline-block">
      <img
        src={dataUrl}
        alt="Logo"
        className="h-16 w-16 rounded-lg object-cover border border-gray-200"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function RazonesSocialesPage() {
  const router = useRouter()
  const inputLogoRef = useRef<HTMLInputElement>(null)

  // Estados de la página
  const [razones, setRazones] = useState<RazonSocial[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados del diálogo de edición
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editandoRazon, setEditandoRazon] = useState<RazonSocial | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [exitoso, setExitoso] = useState(false)

  // Estados del logo
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [errorLogo, setErrorLogo] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<{ base64: string; formato: 'jpeg' | 'png' } | null>(null)
  const [arrastrando, setArrastrando] = useState(false)

  const form = useForm<RazonSocialFormValues>({
    resolver: zodResolver(razonSocialFormSchema),
    defaultValues: {
      nombre: '',
      nombre_corto: '',
      nit: '',
      direccion: '',
      telefono: '',
      correo: '',
    },
  })

  // Cargar razones sociales
  useEffect(() => {
    async function cargarRazones() {
      setCargando(true)
      setError(null)
      try {
        const response = await fetch('/api/razones-sociales')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar razones sociales')
        }
        setRazones(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setCargando(false)
      }
    }
    cargarRazones()
  }, [])

  // Abrir diálogo de edición
  async function abrirEditar(razon: RazonSocial) {
    setEditandoRazon(razon)
    setDialogOpen(true)
    setErrorServidor(null)
    setExitoso(false)
    setArchivoLogo(null)
    setErrorLogo(null)
    setLogoPreview(null)
    
    // Cargar datos en el formulario
    form.reset({
      nombre: razon.nombre,
      nombre_corto: razon.nombre_corto || '',
      nit: razon.nit,
      direccion: razon.direccion || '',
      telefono: razon.telefono || '',
      correo: razon.correo || '',
    })

    // Si ya tiene logo, establecer preview
    if (razon.logo_base64 && razon.logo_formato) {
      setLogoPreview({
        base64: razon.logo_base64,
        formato: razon.logo_formato,
      })
    }
  }

  // Cerrar diálogo
  function cerrarDialog() {
    setDialogOpen(false)
    setEditandoRazon(null)
    form.reset()
    setArchivoLogo(null)
    setErrorLogo(null)
    setLogoPreview(null)
    setErrorServidor(null)
    setExitoso(false)
  }

  // Manejo de logo
  function seleccionarLogo(file: File) {
    const error = validarLogoArchivo(file)
    if (error) {
      setErrorLogo(error)
      setArchivoLogo(null)
      return
    }
    setErrorLogo(null)
    setArchivoLogo(file)
  }

  function onDropLogo(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) seleccionarLogo(file)
  }

  function eliminarLogo() {
    setArchivoLogo(null)
    setErrorLogo(null)
    setLogoPreview(null)
    if (inputLogoRef.current) inputLogoRef.current.value = ''
  }

  // Envío del formulario
  async function onSubmit(values: RazonSocialFormValues) {
    if (!editandoRazon) return

    setGuardando(true)
    setErrorServidor(null)

    let logoBase64 = logoPreview?.base64 || null
    let logoFormato = logoPreview?.formato || null

    // Si hay un nuevo archivo, convertirlo a base64
    if (archivoLogo) {
      const resultado = await convertirLogoABase64(archivoLogo)
      if (resultado.error) {
        setErrorServidor(resultado.error)
        setGuardando(false)
        return
      }
      logoBase64 = resultado.base64
      logoFormato = resultado.formato
    }

    try {
      const payload = {
        nombre: values.nombre,
        nombre_corto: values.nombre_corto || null,
        nit: values.nit,
        direccion: values.direccion || null,
        telefono: values.telefono || null,
        correo: values.correo || null,
        logo_base64: logoBase64,
        logo_formato: logoFormato,
      }

      const response = await fetch(`/api/razones-sociales/${editandoRazon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorServidor(result.error || 'Error al actualizar la razón social')
        return
      }

      setExitoso(true)

      // Recargar la lista
      const responseRazones = await fetch('/api/razones-sociales')
      const dataRazones = await responseRazones.json()
      if (responseRazones.ok) {
        setRazones(dataRazones)
      }

      // Cerrar diálogo después de un breve delay
      setTimeout(() => {
        cerrarDialog()
      }, 1500)
    } catch {
      setErrorServidor('Error de conexión. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 md:space-y-8">
      {/* ── Encabezado ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-slate-50/60 to-indigo-50/60 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-slate-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="h-8 -ml-2 px-2 w-fit">
              <ArrowLeft className="h-4 w-4 mr-1.5" />Volver
            </Button>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Razones Sociales</h1>
                <Badge variant="secondary" className="rounded-full">{razones.length} activas</Badge>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl">
                Administra la información de las razones sociales: nombre, NIT, contacto y logo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Ajustes</span>
          </div>
        </div>
      </section>

      {/* ── Error de carga ── */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Lista de razones sociales ── */}
      <Card className="overflow-hidden border bg-background shadow-sm">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : razones.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Building2 className="h-10 w-10 mx-auto opacity-30" />
              <p className="font-medium">No hay razones sociales activas.</p>
            </div>
          ) : (
            <>
              {/* Vista desktop: tabla */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-24">Logo</TableHead>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">NIT</TableHead>
                      <TableHead className="text-xs">Teléfono</TableHead>
                      <TableHead className="text-xs">Correo</TableHead>
                      <TableHead className="text-xs w-24">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {razones.map((razon, i) => (
                      <TableRow 
                        key={razon.id} 
                        className={`hover:bg-muted/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}
                      >
                        <TableCell>
                          {razon.logo_base64 && razon.logo_formato ? (
                            <img
                              src={`data:image/${razon.logo_formato};base64,${razon.logo_base64}`}
                              alt={razon.nombre_corto || razon.nombre}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{razon.nombre}</div>
                          {razon.nombre_corto && (
                            <div className="text-xs text-muted-foreground">{razon.nombre_corto}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{razon.nit}</TableCell>
                        <TableCell className="text-sm">
                          {razon.telefono ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {razon.telefono}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Sin teléfono</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {razon.correo ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{razon.correo}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Sin correo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirEditar(razon)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista móvil: tarjetas */}
              <div className="md:hidden space-y-3 p-3 sm:p-4">
                {razones.map((razon) => (
                  <div key={razon.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                      {razon.logo_base64 && razon.logo_formato ? (
                        <img
                          src={`data:image/${razon.logo_formato};base64,${razon.logo_base64}`}
                          alt={razon.nombre_corto || razon.nombre}
                          className="h-14 w-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{razon.nombre}</p>
                        {razon.nombre_corto && (
                          <p className="text-xs text-muted-foreground">{razon.nombre_corto}</p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground mt-1">{razon.nit}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {razon.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {razon.telefono}
                        </div>
                      )}
                      {razon.correo && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{razon.correo}</span>
                        </div>
                      )}
                      {razon.direccion && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{razon.direccion}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-9"
                      onClick={() => abrirEditar(razon)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Diálogo de edición ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editar razón social
            </DialogTitle>
            <DialogDescription>
              Actualiza la información de {editandoRazon?.nombre}
            </DialogDescription>
          </DialogHeader>

          {exitoso ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">¡Actualizado correctamente!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Los cambios han sido guardados.
                </p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {errorServidor && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{errorServidor}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: TempoSoluciones SAS" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombre_corto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre corto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Tempo" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIT <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 900123456-1" className="h-10 font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Dirección
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Calle 123 #45-67" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: +57 300 123 4567" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="correo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Correo
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contacto@ejemplo.com" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Logo
                  </FormLabel>
                  
                  {logoPreview ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <LogoPreview
                        logoBase64={logoPreview.base64}
                        logoFormato={logoPreview.formato}
                        onRemove={eliminarLogo}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Logo actual</p>
                        <p className="text-xs text-muted-foreground">
                          Formato: {logoPreview.formato.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!archivoLogo ? (
                        <div
                          className={cn(
                            'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
                            arrastrando
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                          )}
                          onClick={() => inputLogoRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                          onDragLeave={() => setArrastrando(false)}
                          onDrop={onDropLogo}
                        >
                          <UploadCloud className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600">
                            Arrastra el logo aquí o{' '}
                            <span className="text-blue-600">haz clic para buscar</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, JPEG o PNG · Máximo 2 MB
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50/50 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {archivoLogo.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatearTamano(archivoLogo.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={eliminarLogo}
                            className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <input
                        ref={inputLogoRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) seleccionarLogo(file)
                        }}
                      />
                    </>
                  )}

                  {errorLogo && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription className="text-sm">{errorLogo}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cerrarDialog}
                    disabled={guardando}
                    className="h-10"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando} className="h-10 min-w-[120px]">
                    {guardando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
