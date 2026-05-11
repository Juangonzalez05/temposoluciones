// components/dashboard/stats-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  variant?: "default" | "ingreso" | "egreso" | "saldo";
  isLoading?: boolean;
}

// Formatea números como pesos colombianos
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  isLoading = false,
}: StatsCardProps) {
  const variantStyles = {
    default: {
      card: "border-border",
      icon: "bg-muted text-muted-foreground",
      value: "text-foreground",
    },
    ingreso: {
      card: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      value: "text-emerald-700 dark:text-emerald-400",
    },
    egreso: {
      card: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
      icon: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      value: "text-red-700 dark:text-red-400",
    },
    saldo: {
      card: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
      icon: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      value: "text-blue-700 dark:text-blue-400",
    },
  };

  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", styles.card)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="h-7 w-32 bg-muted rounded mb-1" />
          <div className="h-3 w-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", styles.card)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tracking-tight", styles.value)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}