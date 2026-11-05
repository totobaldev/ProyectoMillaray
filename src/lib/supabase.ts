import { createClient } from "@supabase/supabase-js";
import {
  obtenerLotesDemostrativos,
  PRODUCTOS_DEMOSTRATIVOS,
} from "@/data/demoData";
import {
  calcularEstadoSemaforo,
  EstadisticasSemaforo,
  Lote,
  LoteConProducto,
  Producto,
  ResultadoInventario,
} from "@/types/inventory";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "https://msipsuqkwvtoqdxeddgs.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "sb_publishable_LRkMWaPmUE0gDyZbMD0IFw_qfrywmaD";

export function estaSupabaseConfigurado(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("tu-proyecto-id")
  );
}

/**
 * Cliente Supabase público de SOLO LECTURA (sin sesiones ni autenticación).
 */
export function crearClienteSupabaseLectura() {
  if (!estaSupabaseConfigurado()) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Combina productos y lotes, calcula el estado del semáforo para cada lote,
 * los ordena por fecha de vencimiento (FEFO: primero los que vencen antes)
 * y genera las estadísticas globales del dashboard.
 */
export function enriquecerInventario(
  productos: Producto[],
  lotesCrudos: Lote[],
  origen: "supabase" | "demo_respaldo",
  mensajeConexion: string
): ResultadoInventario {
  const mapaProductos = new Map<string, Producto>();
  for (const prod of productos) {
    mapaProductos.set(prod.id, prod);
  }

  const lotes: LoteConProducto[] = [];
  for (const lote of lotesCrudos) {
    const producto = mapaProductos.get(lote.producto_id);
    if (!producto) continue;

    const { estado, diasRestantes } = calcularEstadoSemaforo(
      lote.fecha_vencimiento
    );

    lotes.push({
      ...lote,
      cantidad: Number(lote.cantidad),
      producto,
      estado,
      dias_restantes: diasRestantes,
    });
  }

  // Ordenar por criterio FEFO (First Expired, First Out): menor dias_restantes primero
  lotes.sort((a, b) => a.dias_restantes - b.dias_restantes);

  const estadisticas: EstadisticasSemaforo = {
    totalLotes: lotes.length,
    totalProductos: productos.length,
    vigentes: lotes.filter((l) => l.estado === "vigente").length,
    proximos: lotes.filter((l) => l.estado === "proximo").length,
    vencidos: lotes.filter((l) => l.estado === "vencido").length,
  };

  return {
    productos,
    lotes,
    estadisticas,
    origen,
    mensajeConexion,
    fechaConsulta: new Date().toISOString(),
  };
}

/**
 * Consulta en tiempo real las tablas `productos` y `lotes` desde Supabase PostgreSQL.
 * Si las variables de entorno aún no están configuradas, entrega los datos demostrativos
 * de respaldo informando explícitamente el origen de los datos.
 */
export async function obtenerInventario(): Promise<ResultadoInventario> {
  const cliente = crearClienteSupabaseLectura();

  if (!cliente) {
    return enriquecerInventario(
      PRODUCTOS_DEMOSTRATIVOS,
      obtenerLotesDemostrativos(),
      "demo_respaldo",
      "Modo Demostrativo Local activo (Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local o Vercel para consultar ProyectoMillaray en vivo)."
    );
  }

  try {
    const [resProductos, resLotes] = await Promise.all([
      cliente
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true }),
      cliente
        .from("lotes")
        .select("*")
        .order("fecha_vencimiento", { ascending: true }),
    ]);

    if (resProductos.error) {
      throw new Error(`Tabla productos: ${resProductos.error.message}`);
    }
    if (resLotes.error) {
      throw new Error(`Tabla lotes: ${resLotes.error.message}`);
    }

    const productos = (resProductos.data || []) as Producto[];
    const lotes = (resLotes.data || []) as Lote[];

    if (productos.length === 0 && lotes.length === 0) {
      return enriquecerInventario(
        PRODUCTOS_DEMOSTRATIVOS,
        obtenerLotesDemostrativos(),
        "demo_respaldo",
        "Conectado a Supabase (ProyectoMillaray), pero las tablas están vacías. Ejecuta supabase/schema.sql en el SQL Editor de Supabase para cargar los datos iniciales."
      );
    }

    return enriquecerInventario(
      productos,
      lotes,
      "supabase",
      "Conectado en vivo a Supabase PostgreSQL (ProyectoMillaray) — Acceso público de solo lectura (RLS activo)."
    );
  } catch (err) {
    const detalle =
      err instanceof Error ? err.message : "Error desconocido al consultar DB";
    return enriquecerInventario(
      PRODUCTOS_DEMOSTRATIVOS,
      obtenerLotesDemostrativos(),
      "demo_respaldo",
      `Respaldo local activo (No se pudo consultar Supabase: ${detalle}. Asegúrate de haber ejecutado supabase/schema.sql en SQL Editor).`
    );
  }
}

