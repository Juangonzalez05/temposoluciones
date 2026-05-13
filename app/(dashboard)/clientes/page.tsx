'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Users, Building2, Briefcase, ChevronRight, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Cliente = { id:string; nombre:string; tipo_documento:string; numero_documento:string; correo:string|null; whatsapp:string|null; tipo_afiliacion:string; created_at:string }

function BadgeAfiliacion({ tipo }: { tipo: string }) {
  const cfg: Record<string, { label: string; class: string; icono: React.ElementType }> = {
    independiente: { label: 'Independiente', class: 'border-blue-400 text-blue-700 bg-blue-50', icono: Briefcase },
    dependiente: { label: 'Dependiente', class: 'border-green-400 text-green-700 bg-green-50', icono: Users },
    empresa: { label: 'Empresa', class: 'border-purple-400 text-purple-700 bg-purple-50', icono: Building2 },
  }
  const c = cfg[tipo] ?? { label: tipo, class: 'border-gray-300 text-gray-600', icono: Users }
  const Icono = c.icono
  return <Badge variant="outline" className={`text-xs gap-1 ${c.class}`}><Icono className="h-3 w-3" />{c.label}</Badge>
}

export default function ClientesPage() {
  const router = useRouter()
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
      const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) })
      if (busqueda) params.set('busqueda', busqueda)
      const response = await fetch(`/api/clientes?${params}`)
      const result = await response.json()
      if (response.ok) {
        const filtrados = filtroAfiliacion === 'todos' ? result.data : result.data.filter((c: Cliente) => c.tipo_afiliacion === filtroAfiliacion)
        setClientes(filtrados)
        setTotal(result.total ?? 0)
        setTotalPaginas(result.totalPaginas ?? 1)
      }
    } catch (err) { console.error('Error cargando clientes:', err) } finally { setCargando(false) }
  }, [pagina, busqueda, filtroAfiliacion])

  useEffect(() => { cargarClientes() }, [cargarClientes])

  const [busquedaInput, setBusquedaInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => { setBusqueda(busquedaInput); setPagina(1) }, 350)
    return () => clearTimeout(timer)
  }, [busquedaInput])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-sky-50/60 to-emerald-50/60 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="h-8 -ml-2 px-2 w-fit"><ArrowLeft className="h-4 w-4 mr-1.5" />Volver</Button>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Clientes y afiliados</h1><Badge variant="secondary" className="rounded-full">{total.toLocaleString('es-CO')} clientes</Badge></div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl">Administra tu base de clientes con una vista limpia y accesos rápidos para búsqueda, filtro y detalle.</p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link href="/clientes/nuevo"><UserPlus className="mr-2 h-4 w-4" />Nuevo cliente</Link></Button>
        </div>
      </section>

      <Card className="border-0 shadow-sm ring-1 ring-black/5">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" />Filtros de clientes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o documento..." value={busquedaInput} onChange={(e) => setBusquedaInput(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={filtroAfiliacion} onValueChange={(v) => { setFiltroAfiliacion(v); setPagina(1) }}>
              <SelectTrigger className="h-10 w-full sm:w-[220px]"><SelectValue placeholder="Tipo de afiliación" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos los tipos</SelectItem><SelectItem value="independiente">Independientes</SelectItem><SelectItem value="dependiente">Dependientes</SelectItem><SelectItem value="empresa">Empresas</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border bg-background shadow-sm">
        <CardContent className="p-0">
          {cargando ? <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : clientes.length === 0 ? <div className="text-center py-16 text-muted-foreground space-y-2"><Users className="h-10 w-10 mx-auto opacity-30" /><p className="font-medium">No se encontraron clientes.</p><p className="text-sm">Ajusta filtros o crea un nuevo cliente.</p></div> : <>
            <div className="hidden md:block overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">Nombre</TableHead><TableHead className="text-xs">Documento</TableHead><TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">Contacto</TableHead><TableHead className="text-xs w-10" /></TableRow></TableHeader><TableBody>{clientes.map((cliente, i) => <TableRow key={cliente.id} className={`hover:bg-muted/40 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}><TableCell className="font-medium text-sm">{cliente.nombre}</TableCell><TableCell className="text-sm"><span className="text-muted-foreground text-xs mr-1">{cliente.tipo_documento}</span>{cliente.numero_documento}</TableCell><TableCell><BadgeAfiliacion tipo={cliente.tipo_afiliacion} /></TableCell><TableCell className="text-xs space-y-0.5">{cliente.correo && <p>{cliente.correo}</p>}{cliente.whatsapp && <p>{cliente.whatsapp}</p>}{!cliente.correo && !cliente.whatsapp && <span className="text-muted-foreground">Sin contacto</span>}</TableCell><TableCell><Link href={`/clientes/${cliente.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button></Link></TableCell></TableRow>)}</TableBody></Table></div>
            <div className="md:hidden space-y-3 p-3 sm:p-4">{clientes.map(cliente => <div key={cliente.id} className="rounded-xl border bg-white p-3 shadow-sm space-y-2"><p className="font-semibold text-sm">{cliente.nombre}</p><p className="text-xs text-muted-foreground">{cliente.tipo_documento} {cliente.numero_documento}</p><BadgeAfiliacion tipo={cliente.tipo_afiliacion} /><div className="text-xs text-muted-foreground">{cliente.correo || cliente.whatsapp ? <>{cliente.correo && <p>{cliente.correo}</p>}{cliente.whatsapp && <p>{cliente.whatsapp}</p>}</> : <p>Sin contacto</p>}</div><Button asChild variant="outline" className="w-full h-9"><Link href={`/clientes/${cliente.id}`}>Ver detalle</Link></Button></div>)}</div>
          </>}

          {totalPaginas > 1 && <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20"><p className="text-xs text-muted-foreground">Página {pagina} de {totalPaginas}</p><div className="flex w-full sm:w-auto gap-2"><Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1 || cargando}>Anterior</Button><Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas || cargando}>Siguiente</Button></div></div>}
        </CardContent>
      </Card>
    </div>
  )
}
