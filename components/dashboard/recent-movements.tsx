// components/dashboard/recent-movements.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Movimiento } from "@/types";
import { formatCOP } from "./stats-card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface RecentMovementsProps {
  movimientos: Movimiento[];
}

export function RecentMovements({ movimientos }: RecentMovementsProps) {
  if (movimientos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Movimientos de Hoy</CardTitle>
          <CardDescription>Los movimientos registrados hoy aparecerán aquí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Sin movimientos hoy</p>
            <p className="text-xs mt-1">Registra el primer ingreso o egreso del día</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Movimientos de Hoy</CardTitle>
        <CardDescription>
          Últimos {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""} registrados
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Consecutivo</TableHead>
              <TableHead>Cliente / Proveedor</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Medio</TableHead>
              <TableHead className="text-right pr-6">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((mov) => (
              <TableRow key={mov.id} className="hover:bg-muted/40">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1 rounded-full ${
                        mov.tipo === "ingreso"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {mov.tipo === "ingreso" ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {mov.consecutivo}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {mov.clientes?.nombre ?? (
                    <span className="text-muted-foreground italic text-xs">Sin cliente</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                  {mov.concepto}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">
                    {mov.medio_pago}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <span
                    className={`font-semibold text-sm ${
                      mov.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {mov.tipo === "ingreso" ? "+" : "-"}
                    {formatCOP(Number(mov.valor))}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}