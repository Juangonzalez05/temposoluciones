// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { DashboardLayoutClient } from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Verificar autenticación en el servidor ──
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Si no hay usuario autenticado, redirigir al login
  if (error || !user) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient userEmail={user.email}>
      {children}
    </DashboardLayoutClient>
  );
}