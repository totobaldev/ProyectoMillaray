import DashboardApp from "@/components/DashboardApp";
import { obtenerInventario } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ lote?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const loteQuery = typeof params?.lote === "string" ? params.lote : null;
  const datosIniciales = await obtenerInventario();

  return (
    <DashboardApp
      datosIniciales={datosIniciales}
      loteQueryInicial={loteQuery}
    />
  );
}

