'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  UserPlus, Search, Users, Building2,
  Briefcase, ChevronRight, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ── Tipo cliente ──────────────────────────────────────────────
type Cliente = {
  id: string
  nombre: string
  tipo_documento: string
  numero_documento: string
  correo: string | null
  whatsapp: string | null
  tipo_afiliacion: string
  created_at: string
}

// ── Badge por tipo de afiliación ──────────────────────────────
function BadgeAfiliacion({ tipo }: { tipo: string }) {
  const cfg: Record<string, { label: string; class: string; icono: React.ElementType }> = {
    independiente: { label: 'Independiente', class: 'border-blue-400 text-blue-700 bg-blue-50',   icono: Briefcase },
    dependiente:   { label: 'Dependiente',   class: 'border-green-400 text-green-700 bg-green-50', icono: Users },
    empresa:       { label: 'Empresa',        class: 'border-purple-400 text-purple-700 bg-purple-50', icono: Building2 },
  }
  const c = cfg[tipo] ?? { label: tipo, class: 'border-gray-300 text-gray-600', icono: Users }
  const Icono = c.icono
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${c.class}`}>
      <Icono className="h-3 w-3" />
      {c.label}
    </Badge>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAfiliacion, setFiltroAfiliacion] = useState<string>('todos')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const porPagina = 20

  const cargarClientes = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        pagina:    String(pagina),
        porPagina: String(porPagina),
      })
      if (busqueda) params.set('busqueda', busqueda)

      const response = await fetch(`/api/clientes?${params}`)
      const result   = await response.json()

      if (response.ok) {
        // Filtro de afiliación del lado del cliente (ya que viene todo paginado)
        const filtrados = filtroAfiliacion === 'todos'
          ? result.data
          : result.data.filter((c: Cliente) => c.tipo_afiliacion === filtroAfiliacion)

        setClientes(filtrados)
        setTotal(result.total ?? 0)
        setTotalPaginas(result.totalPaginas ?? 1)
      }
    } catch (err) {
      console.error('Error cargando clientes:', err)
    } finally {
      setCargando(false)
    }
  }, [pagina, busqueda, filtroAfiliacion])

  useEffect(() => { cargarClientes() }, [cargarClientes])

  // Debounce para la búsqueda (evita llamadas en cada tecla)
  const [busquedaInput, setBusquedaInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaInput)
      setPagina(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [busquedaInput])

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes y afiliados</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total.toLocaleString('es-CO')} clientes registrados en total.
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="bg-blue-700 hover:bg-blue-800">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={filtroAfiliacion}
              onValueChange={(v) => { setFiltroAfiliacion(v); setPagina(1) }}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Tipo de afiliación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="independiente">Independientes</SelectItem>
                <SelectItem value="dependiente">Dependientes</SelectItem>
                <SelectItem value="empresa">Empresas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Users className="h-10 w-10 mx-auto opacity-30" />
              <p>No se encontraron clientes con esos filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Documento</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Contacto</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente, i) => (
                    <TableRow
                      key={cliente.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                      }`}
                    >
                      <TableCell className="font-medium text-sm text-gray-800">
                        {cliente.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <span className="text-gray-400 text-xs mr-1">
                          {cliente.tipo_documento}
                        </span>
                        {cliente.numero_documento}
                      </TableCell>
                      <TableCell>
                        <BadgeAfiliacion tipo={cliente.tipo_afiliacion} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 space-y-0.5">
                        {cliente.correo && <p>{cliente.correo}</p>}
                        {cliente.whatsapp && <p>{cliente.whatsapp}</p>}
                        {!cliente.correo && !cliente.whatsapp && (
                          <span className="text-gray-300">Sin contacto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/clientes/${cliente.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación simple */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-gray-500">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1 || cargando}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas || cargando}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}