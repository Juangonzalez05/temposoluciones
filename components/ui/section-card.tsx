// src/components/ui/section-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  step: number
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  accent?: 'green' | 'red' | 'blue' | 'gray'
}

export function SectionCard({
  step,
  title,
  description,
  icon,
  children,
  accent = 'gray',
}: SectionCardProps) {
  const accentClasses = {
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    blue: 'bg-blue-600 text-white',
    gray: 'bg-gray-200 text-gray-600',
  }

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Número de paso */}
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              accentClasses[accent]
            )}
          >
            {step}
          </span>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {icon && <span className="text-gray-500">{icon}</span>}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">{children}</CardContent>
    </Card>
  )
}