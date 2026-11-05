import { z } from "zod";

export type EstadoSemaforo = "vigente" | "proximo" | "vencido";

export interface Producto {
  id: string;
  codigo_ean: string;
  nombre: string;
  marca: string;
  categoria: string;
  formato: string;
  ubicacion: string;
  imagen_url: string;
  imagen_remota_url: string;
  fuente_imagen: string;
  url_ficha_off: string;
  created_at?: string;
}

export interface Lote {
  id: string;
  codigo_lote: string;
  producto_id: string;
  cantidad: number;
  unidad: string;
  fecha_ingreso: string; // YYYY-MM-DD
  fecha_vencimiento: string; // YYYY-MM-DD
  observaciones: string | null;
  created_at?: string;
}

export interface LoteConProducto extends Lote {
  producto: Producto;
  estado: EstadoSemaforo;
  dias_restantes: number;
}

export interface EstadisticasSemaforo {
  totalLotes: number;
  totalProductos: number;
  vigentes: number;
  proximos: number;
  vencidos: number;
}

export interface ResultadoInventario {
  productos: Producto[];
  lotes: LoteConProducto[];
  estadisticas: EstadisticasSemaforo;
  origen: "supabase" | "demo_respaldo";
  mensajeConexion: string;
  fechaConsulta: string;
}

/**
 * Umbral en días para alerta preventiva (Luz Amarilla: Próximo a vencer).
 * Cualquier lote que venza entre hoy (0 días) y 7 días se marca como "proximo".
 */
export const DIAS_ALERTA_AMARILLA = 7;

/**
 * Calcula los días restantes entre la fecha actual local y la fecha de vencimiento (YYYY-MM-DD)
 * y determina el estado del semáforo sanitario.
 */
export function calcularEstadoSemaforo(fechaVencimientoStr: string): {
  estado: EstadoSemaforo;
  diasRestantes: number;
  etiqueta: string;
  recomendacionBpm: string;
  imagenSemaforoPng: string;
  imagenLuzPng: string;
} {
  const hoy = new Date();
  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const partes = fechaVencimientoStr.split("-").map(Number);
  const vencUtc =
    partes.length === 3
      ? Date.UTC(partes[0], partes[1] - 1, partes[2])
      : hoyUtc;

  const diffMs = vencUtc - hoyUtc;
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    const diasVencido = Math.abs(diasRestantes);
    return {
      estado: "vencido",
      diasRestantes,
      etiqueta:
        diasVencido === 1
          ? "VENCIDO (hace 1 día)"
          : `VENCIDO (hace ${diasVencido} días)`,
      recomendacionBpm:
        "NO UTILIZAR. Retirar inmediatamente de estantería o cámara y trasladar al área de merma según protocolo BPM.",
      imagenSemaforoPng: "/images/semaforo-rojo.png",
      imagenLuzPng: "/images/semaforo-luz-roja.png",
    };
  }

  if (diasRestantes <= DIAS_ALERTA_AMARILLA) {
    return {
      estado: "proximo",
      diasRestantes,
      etiqueta:
        diasRestantes === 0
          ? "VENCE HOY (Alerta Crítica)"
          : diasRestantes === 1
          ? "PRÓXIMO A VENCER (1 día)"
          : `PRÓXIMO A VENCER (${diasRestantes} días)`,
      recomendacionBpm:
        "PRIORIDAD FEFO (First Expired, First Out). Ubicar al frente del estante y priorizar en las preparaciones de taller de esta semana.",
      imagenSemaforoPng: "/images/semaforo-amarillo.png",
      imagenLuzPng: "/images/semaforo-luz-amarilla.png",
    };
  }

  return {
    estado: "vigente",
    diasRestantes,
    etiqueta: `VIGENTE (${diasRestantes} días disponibles)`,
    recomendacionBpm:
      "APTO PARA CONSUMO Y PRODUCCIÓN. Mantener almacenamiento según condiciones de temperatura y humedad del envase.",
    imagenSemaforoPng: "/images/semaforo-verde.png",
    imagenLuzPng: "/images/semaforo-luz-verde.png",
  };
}

/**
 * Esquema Zod para validar el registro de lotes y productos gastronómicos
 */
export const CATEGORIAS_GASTRONOMIA = [
  "Lácteos y Refrigerados",
  "Aceites, Vinagres y Aderezos",
  "Pastas, Arroces y Secos",
  "Repostería y Pastelería",
  "Conservas y Enlatados",
  "Harinas, Granos y Legumbres",
] as const;

export const RegistroLoteSchema = z
  .object({
    modoProducto: z.enum(["existente", "nuevo"]),
    producto_id: z.string().optional(),
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre del producto debe tener al menos 3 caracteres")
      .optional(),
    marca: z
      .string()
      .trim()
      .min(2, "Ingresa la marca del fabricante")
      .optional(),
    categoria: z.string().min(2, "Selecciona una categoría gastronómica"),
    formato: z.string().trim().min(1, "Indica el formato (ej: 1 L, 500 g)"),
    ubicacion: z
      .string()
      .trim()
      .min(3, "Indica la ubicación en bodega o cuarto frío"),
    codigo_lote: z
      .string()
      .trim()
      .min(4, "El código de lote debe tener al menos 4 caracteres")
      .regex(
        /^[A-Za-z0-9-_]+$/,
        "Usa solo letras, números, guiones (-) o guion bajo (_)"
      ),
    cantidad: z.coerce
      .number({ invalid_type_error: "Ingresa una cantidad numérica válida" })
      .positive("La cantidad debe ser mayor a 0"),
    unidad: z.string().trim().min(1, "Indica la unidad (ej: cajas, botellas)"),
    fecha_ingreso: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de ingreso inválida"),
    fecha_vencimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de vencimiento inválida"),
    observaciones: z.string().trim().max(240).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.modoProducto === "existente" && !data.producto_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["producto_id"],
        message: "Selecciona un producto del catálogo",
      });
    }
    if (data.modoProducto === "nuevo") {
      if (!data.nombre || data.nombre.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nombre"],
          message: "Ingresa el nombre del nuevo producto",
        });
      }
      if (!data.marca || data.marca.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["marca"],
          message: "Ingresa la marca del producto",
        });
      }
    }
  });

export type RegistroLoteInput = z.infer<typeof RegistroLoteSchema>;

