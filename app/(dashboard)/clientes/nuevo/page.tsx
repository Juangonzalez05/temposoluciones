'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ── Esquema de validación — Zod v4 ───────────────────────────
// Recuerda: en Zod v4 se usa `error` en lugar de
// `required_error` o `invalid_type_error`
const clienteSchema = z.object({
  nombre: z
    .string({ error: 'El nombre es requerido' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),

  tipo_documento: z.enum(
    ['CC', 'NIT', 'CE', 'Pasaporte'],
    { error: 'Selecciona el tipo de documento' }
  ),

  numero_documento: z
    .string({ error: 'El número de documento es requerido' })
    .min(5, 'El número de documento debe tener al menos 5 caracteres')
    .max(20, 'El número no puede superar 20 caracteres')
    .regex(/^[0-9A-Za-z\-]+$/, 'Solo se permiten números, letras y guiones'),

  tipo_afiliacion: z.enum(
    ['independiente', 'dependiente', 'empresa'],
    { error: 'Selecciona el tipo de afiliación' }
  ),

  correo: z
    .string()
    .email('Ingresa un correo válido')
    .optional()
    .or(z.literal('')),

  whatsapp: z
    .string()
    .regex(
      /^(\+?57)?[0-9]{10}$|^$/,
      'Ingresa un número válido (ej: 3001234567 o +573001234567)'
    )
    .optional()
    .or(z.literal('')),
})

type ClienteFormValues = z.infer<typeof clienteSchema>

// ── Formatear número WhatsApp ─────────────────────────────────
function formatearWhatsApp(valor: string): string {
  // Si el número tiene 10 dígitos y empieza por 3, agregar +57
  const soloNumeros = valor.replace(/\D/g, '')
  if (soloNumeros.length === 10 && soloNumeros.startsWith('3')) {
    return `+57${soloNumeros}`
  }
  return valor
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function NuevoClientePage() {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [exitoso, setExitoso] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [clienteCreado, setClienteCreado] = useState<{ id: string; nombre: string } | null>(null)

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre:           '',
      tipo_documento:   undefined,
      numero_documento: '',
      tipo_afiliacion:  undefined,
      correo:           '',
      whatsapp:         '',
    },
  })

  async function onSubmit(values: ClienteFormValues) {
    setEnviando(true)
    setErrorServidor(null)

    try {
      // Formatear el WhatsApp antes de enviar
      const payload = {
        ...values,
        correo:    values.correo   || null,
        whatsapp:  values.whatsapp
          ? formatearWhatsApp(values.whatsapp)
          : null,
      }

      const response = await fetch('/api/clientes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
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

  // ── Pantalla de éxito ─────────────────────────────────────
  if (exitoso && clienteCreado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-800">¡Cliente creado!</h2>
          <p className="text-gray-500 text-sm">
            <span className="font-semibold">{clienteCreado.nombre}</span> fue registrado
            correctamente.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              form.reset()
              setExitoso(false)
              setClienteCreado(null)
            }}
          >
            Crear otro cliente
          </Button>
          <Button
            onClick={() => router.push(`/clientes/${clienteCreado.id}`)}
            className="bg-blue-700 hover:bg-blue-800"
          >
            Ver perfil del cliente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" size="icon"
          onClick={() => router.push('/clientes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nuevo cliente</h1>
          <p className="text-sm text-gray-400">
            Completa los datos del afiliado o empresa.
          </p>
        </div>
      </div>

      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Nombre */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datos personales</CardTitle>
              <CardDescription>Información de identificación del cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nombre completo <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: María García López"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="tipo_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo de doc. <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                        Número <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1035283043" {...field} />
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
                        <SelectTrigger>
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
                        <SelectItem value="empresa">
                          Empresa (persona jurídica)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datos de contacto</CardTitle>
              <CardDescription>
                Opcional — para el envío de recibos digitales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <FormField
                control={form.control}
                name="correo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        {...field}
                      />
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
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 3001234567"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      10 dígitos sin código de país. Se guardará como +573001234567.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-3 justify-end pb-8">
            <Button
              type="button" variant="outline"
              onClick={() => router.push('/clientes')}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 min-w-[140px]"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear cliente'
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  )
}