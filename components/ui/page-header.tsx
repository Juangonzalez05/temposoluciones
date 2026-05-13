'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description: string
  tipo: 'ingreso' | 'egreso'
  icon: React.ReactNode
}

export function PageHeader({ title, description, tipo, icon }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Botón de retroceso */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="mt-1 shrink-0 rounded-full hover:bg-gray-100"
        aria-label="Volver"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Ícono de tipo */}
      <div
        className={cn(
          'hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          tipo === 'ingreso'
            ? 'bg-green-100 text-green-600'
            : 'bg-red-100 text-red-600'
        )}
      >
        {icon}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-semibold uppercase tracking-wide',
              tipo === 'ingreso'
                ? 'border-green-300 text-green-700 bg-green-50'
                : 'border-red-300 text-red-700 bg-red-50'
            )}
          >
            {tipo}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}