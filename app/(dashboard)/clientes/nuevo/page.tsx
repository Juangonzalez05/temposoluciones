'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserRound,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

const clienteSchema = z.object({
  nombre: z
    .string({ error: 'El nombre es requerido' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),

  tipo_documento: z.enum(['CC', 'NIT', 'CE', 'Pasaporte'], { error: 'Selecciona el tipo de documento' }),

  numero_documento: z
    .string({ error: 'El número de documento es requerido' })
    .min(5, 'El número de documento debe tener al menos 5 caracteres')
    .max(20, 'El número no puede superar 20 caracteres')
    .regex(/^[0-9A-Za-z\-]+$/, 'Solo se permiten números, letras y guiones'),

  tipo_afiliacion: z.enum(['independiente', 'dependiente', 'empresa'], {
    error: 'Selecciona el tipo de afiliación',
  }),

  correo: z.string().email('Ingresa un correo válido').optional().or(z.literal('')),

  whatsapp: z
    .string()
    .regex(/^(\+?57)?[0-9]{10}$|^$/, 'Ingresa un número válido (ej: 3001234567 o +573001234567)')
    .optional()
    .or(z.literal('')),
})

type ClienteFormValues = z.infer<typeof clienteSchema>

function formatearWhatsApp(valor: string): string {
  const soloNumeros = valor.replace(/\D/g, '')
  if (soloNumeros.length === 10 && soloNumeros.startsWith('3')) {
    return `+57${soloNumeros}`
  }
  return valor
}

export default function NuevoClientePage() {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [exitoso, setExitoso] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [clienteCreado, setClienteCreado] = useState<{ id: string; nombre: string } | null>(null)

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      tipo_documento: undefined,
      numero_documento: '',
      tipo_afiliacion: undefined,
      correo: '',
      whatsapp: '',
    },
  })

  async function onSubmit(values: ClienteFormValues) {
    setEnviando(true)
    setErrorServidor(null)

    try {
      const payload = {
        ...values,
        correo: values.correo || null,
        whatsapp: values.whatsapp ? formatearWhatsApp(values.whatsapp) : null,
      }

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorServidor(result.error ?? 'Error al crear el cliente')
        return
      }

      setClienteCreado({ id: result.data.id, nombre: result.data.nombre })
      setExitoso(true)
    } catch (err) {
      console.error('Error en onSubmit:', err)
      setErrorServidor('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (exitoso && clienteCreado) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="overflow-hidden border-emerald-200/70 shadow-xl shadow-emerald-100/40">
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-8 text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">Registro exitoso</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">¡Cliente creado correctamente!</h2>
            <p className="mt-2 text-sm sm:text-base text-emerald-50/90">
              <span className="font-semibold">{clienteCreado.nombre}</span> ya está disponible en tu base de
              clientes.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => {
                  form.reset()
                  setExitoso(false)
                  setClienteCreado(null)
                }}
              >
                Crear otro cliente
              </Button>
              <Button onClick={() => router.push(`/clientes/${clienteCreado.id}`)} className="h-11">
                Ver perfil del cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Card className="overflow-hidden border-slate-200/70 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-7 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28),transparent_45%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/clientes')}
                  className="h-9 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a clientes
                </Button>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Nuevo registro
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nuevo cliente</h1>
                <p className="mt-1.5 text-sm sm:text-base text-slate-200/90 max-w-2xl">
                  Registra afiliados, dependientes o empresas con datos claros para agilizar procesos operativos y
                  seguimiento comercial.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorServidor && (
        <Alert className="border-red-300 bg-red-50 text-red-900">
          <AlertDescription className="flex items-start gap-2 text-sm">
            <BadgeCheck className="h-4 w-4 mt-0.5 text-red-700" />
            <span>{errorServidor}</span>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <UserRound className="h-5 w-5 text-indigo-600" />
                Datos personales
              </CardTitle>
              <CardDescription>Campos obligatorios para identificar correctamente al cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nombre completo <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: María García López" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo de documento <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CC">CC — Cédula</SelectItem>
                          <SelectItem value="NIT">NIT</SelectItem>
                          <SelectItem value="CE">CE — Extranjería</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Número de documento <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1035283043" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tipo_afiliacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo de afiliación <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="¿Cómo está vinculado?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="independiente">
                          Independiente (persona natural sin empleador)
                        </SelectItem>
                        <SelectItem value="dependiente">
                          Dependiente (vinculado bajo TempoSoluciones)
                        </SelectItem>
                        <SelectItem value="empresa">Empresa (persona jurídica)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Datos de contacto
              </CardTitle>
              <CardDescription>
                Opcional. Estos datos facilitan notificaciones, facturación y seguimiento digital.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" /> Correo electrónico
                        <span className="text-xs text-slate-400">(Opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ejemplo@correo.com" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" /> WhatsApp
                        <span className="text-xs text-slate-400">(Opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 3001234567" className="h-11" {...field} />
                      </FormControl>
                      <FormDescription>
                        10 dígitos sin código de país. Se guardará automáticamente como +573001234567.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-0 z-20 pb-2">
            <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg p-3 sm:p-4">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/clientes')}
                  disabled={enviando}
                  className="h-11 w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={enviando} className="h-11 w-full sm:w-auto min-w-[170px]">
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando cliente...
                    </>
                  ) : (
                    'Crear cliente'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
