// lib/actions/dashboard.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { ResumenCaja, Movimiento } from "@/types";
import { format } from "date-fns";

/**
 * Obtiene el resumen de caja del día actual
 */
export async function getResumenHoy(): Promise<ResumenCaja> {
  const supabase = await createClient();
  const hoy = format(new Date(), "yyyy-MM-dd");

  // Consulta de ingresos del día
  const { data: ingresos, error: errorIngresos } = await supabase
    .from("movimientos")
    .select("valor")
    .eq("tipo", "ingreso")
    .eq("fecha", hoy);

  // Consulta de egresos del día
  const { data: egresos, error: errorEgresos } = await supabase
    .from("movimientos")
    .select("valor")
    .eq("tipo", "egreso")
    .eq("fecha", hoy);

  if (errorIngresos || errorEgresos) {
    console.error("Error al obtener resumen:", errorIngresos || errorEgresos);
    return { totalIngresos: 0, totalEgresos: 0, saldo: 0, cantidadMovimientos: 0 };
  }

  const totalIngresos = ingresos?.reduce((sum, m) => sum + Number(m.valor), 0) ?? 0;
  const totalEgresos = egresos?.reduce((sum, m) => sum + Number(m.valor), 0) ?? 0;

  return {
    totalIngresos,
    totalEgresos,
    saldo: totalIngresos - totalEgresos,
    cantidadMovimientos: (ingresos?.length ?? 0) + (egresos?.length ?? 0),
  };
}

/**
 * Obtiene los últimos 5 movimientos del día para mostrar en el dashboard
 */
export async function getMovimientosRecientes(): Promise<Movimiento[]> {
  const supabase = await createClient();
  const hoy = format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      *,
      clientes (
        nombre,
        correo,
        whatsapp
      )
    `)
    .eq("fecha", hoy)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error al obtener movimientos recientes:", error);
    return [];
  }

  return data as Movimiento[];
}