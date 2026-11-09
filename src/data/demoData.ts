import { Lote, Producto } from "@/types/inventory";

export const PRODUCTOS_DEMOSTRATIVOS: Producto[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    codigo_ean: "7802920777542",
    nombre: "Leche Entera Natural 100%",
    marca: "Colun",
    categoria: "Lácteos y Refrigerados",
    formato: "1 L",
    ubicacion: "Cámara Refrigerada N°1 — Estante Superior",
    imagen_url: "/productos/leche-colun-7802920777542.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/780/292/077/7542/front_es.23.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/7802920777542",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    codigo_ean: "8410179306148",
    nombre: "Vinagre Balsámico de Módena",
    marca: "Borges",
    categoria: "Aceites, Vinagres y Aderezos",
    formato: "250 ml",
    ubicacion: "Bodega Seca — Pasillo A2",
    imagen_url: "/productos/vinagre-borges-8410179306148.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/841/017/930/6148/front_es.49.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/8410179306148",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    codigo_ean: "8437000623113",
    nombre: "Harina de Trigo 100% Natural Panadería",
    marca: "Haricaman",
    categoria: "Harinas, Granos y Panadería",
    formato: "1 kg",
    ubicacion: "Bodega Panadería — Estantería Harinas B1",
    imagen_url: "/productos/harina-trigo-8437000623113.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/843/700/062/3113/front_en.55.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://world.openfoodfacts.org/product/8437000623113",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    codigo_ean: "8426904172834",
    nombre: "Harina de Trigo Integral Panadería",
    marca: "Biográ",
    categoria: "Harinas, Granos y Panadería",
    formato: "500 g",
    ubicacion: "Bodega Panadería — Estantería Harinas B2",
    imagen_url: "/productos/harina-integral-8426904172834.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/842/690/417/2834/front_en.3.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://world.openfoodfacts.org/product/8426904172834",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    codigo_ean: "0021000026326",
    nombre: "Mayonesa Real Mayo Creamy & Smooth",
    marca: "Kraft",
    categoria: "Aceites, Vinagres y Aderezos",
    formato: "887 ml",
    ubicacion: "Cámara Refrigerada N°2 — Puerta Lateral",
    imagen_url: "/productos/mayonesa-kraft-0021000026326.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/002/100/002/6326/front_es.40.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/0021000026326",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    codigo_ean: "8410109050882",
    nombre: "Chocolate Negro 70% Cacao Repostería",
    marca: "Valor",
    categoria: "Repostería y Pastelería",
    formato: "100 g",
    ubicacion: "Taller de Pastelería — Gabinete C1",
    imagen_url: "/productos/chocolate-valor-8410109050882.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/841/010/905/0882/front_es.61.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/8410109050882",
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    codigo_ean: "7798151952332",
    nombre: "Pasta de Maní 100% Natural Alto Oleico",
    marca: "Maní King",
    categoria: "Repostería y Pastelería",
    formato: "485 g",
    ubicacion: "Taller de Pastelería — Gabinete C2",
    imagen_url: "/productos/pasta-mani-7798151952332.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/779/815/195/2332/front_es.99.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/7798151952332",
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    codigo_ean: "8412170011434",
    nombre: "Galletas María Sin Gluten ni Lactosa",
    marca: "Santiveri Noglut",
    categoria: "Repostería y Pastelería",
    formato: "180 g",
    ubicacion: "Taller de Pastelería — Estante Sin Alérgenos",
    imagen_url: "/productos/galletas-maria-8412170011434.jpg",
    imagen_remota_url:
      "https://images.openfoodfacts.org/images/products/841/217/001/1434/front_es.68.400.jpg",
    fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
    url_ficha_off: "https://cl.openfoodfacts.org/producto/8412170011434",
  },
];

export function obtenerLotesDemostrativos(): Lote[] {
  return [
    // 1) EXACTAMENTE 2 LOTES VENCIDOS (LUZ ROJA)
    {
      id: "22222222-2222-4222-8222-222222222204",
      codigo_lote: "LOT-2026-COL-00",
      producto_id: "11111111-1111-4111-8111-111111111101",
      cantidad: 4,
      unidad: "cajas 1 L",
      fecha_ingreso: "2026-10-01",
      fecha_vencimiento: "2026-10-29",
      observaciones:
        "DESFASE CRÍTICO (-11 días al lunes): BLOQUEADO PARA USO GASTRONÓMICO. Separar en área de merma según protocolo BPM.",
    },
    {
      id: "22222222-2222-4222-8222-222222222205",
      codigo_lote: "LOT-2026-MKG-01",
      producto_id: "11111111-1111-4111-8111-111111111107",
      cantidad: 3,
      unidad: "frascos 485 g",
      fecha_ingreso: "2026-08-15",
      fecha_vencimiento: "2026-11-02",
      observaciones:
        "DESFASE VENCIDO (-7 días al lunes): Vencido en estantería de pastelería. No utilizar en preparaciones.",
    },

    // 2) 3 LOTES PRÓXIMOS A VENCER CON DESFASES ESCALONADOS (LUZ AMARILLA)
    {
      id: "22222222-2222-4222-8222-222222222203",
      codigo_lote: "LOT-2026-SAN-01",
      producto_id: "11111111-1111-4111-8111-111111111108",
      cantidad: 10,
      unidad: "paquetes 180 g",
      fecha_ingreso: "2026-09-25",
      fecha_vencimiento: "2026-11-10",
      observaciones:
        "DESFASE CORTO (+1 día desde el lunes de evaluación): Prioridad FEFO inmediata en bases de pastelería sin gluten.",
    },
    {
      id: "22222222-2222-4222-8222-222222222201",
      codigo_lote: "LOT-2026-COL-01",
      producto_id: "11111111-1111-4111-8111-111111111101",
      cantidad: 18,
      unidad: "cajas 1 L",
      fecha_ingreso: "2026-10-18",
      fecha_vencimiento: "2026-11-11",
      observaciones:
        "DESFASE MEDIO (+2 días desde el lunes de evaluación): Priorizar uso en taller de salsas madres y crema pastelera (FEFO).",
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      codigo_lote: "LOT-2026-KRA-01",
      producto_id: "11111111-1111-4111-8111-111111111105",
      cantidad: 6,
      unidad: "frascos 887 ml",
      fecha_ingreso: "2026-10-12",
      fecha_vencimiento: "2026-11-12",
      observaciones:
        "DESFASE PREVENTIVO (+3 días desde el lunes de evaluación): Lote en cuarto frío, consumir antes del cierre semanal.",
    },

    // 3) 5 LOTES VIGENTES CON DESFASES ESCALONADOS DE 15 DÍAS A 6 MESES (LUZ VERDE)
    {
      id: "22222222-2222-4222-8222-222222222210",
      codigo_lote: "LOT-2026-COL-02",
      producto_id: "11111111-1111-4111-8111-111111111101",
      cantidad: 40,
      unidad: "cajas 1 L",
      fecha_ingreso: "2026-11-02",
      fecha_vencimiento: "2026-11-24",
      observaciones:
        "DESFASE QUINCENAL (+15 días desde el lunes): Lote UHT de reposición. Usar después de agotar LOT-2026-COL-01.",
    },
    {
      id: "22222222-2222-4222-8222-222222222209",
      codigo_lote: "LOT-2026-VAL-70",
      producto_id: "11111111-1111-4111-8111-111111111106",
      cantidad: 24,
      unidad: "tabletas 100 g",
      fecha_ingreso: "2026-10-20",
      fecha_vencimiento: "2026-12-10",
      observaciones:
        "DESFASE MENSUAL (+1 mes): Mantener entre 15°C y 18°C para chocolatería fina.",
    },
    {
      id: "22222222-2222-4222-8222-222222222206",
      codigo_lote: "LOT-2026-BOR-01",
      producto_id: "11111111-1111-4111-8111-111111111102",
      cantidad: 12,
      unidad: "botellas 250 ml",
      fecha_ingreso: "2026-10-15",
      fecha_vencimiento: "2027-01-15",
      observaciones:
        "DESFASE BIMESTRAL (+2 meses): Óptimas condiciones de almacenamiento en bodega seca.",
    },
    {
      id: "22222222-2222-4222-8222-222222222208",
      codigo_lote: "LOT-2026-DIV-27",
      producto_id: "11111111-1111-4111-8111-111111111104",
      cantidad: 28,
      unidad: "paquetes 500 g",
      fecha_ingreso: "2026-10-25",
      fecha_vencimiento: "2027-03-15",
      observaciones:
        "DESFASE CUATRIMESTRAL (+4 meses): Almacenado en contenedor hermético rotulado.",
    },
    {
      id: "22222222-2222-4222-8222-222222222207",
      codigo_lote: "LOT-2026-DIV-08",
      producto_id: "11111111-1111-4111-8111-111111111103",
      cantidad: 35,
      unidad: "paquetes 500 g",
      fecha_ingreso: "2026-10-25",
      fecha_vencimiento: "2027-05-20",
      observaciones:
        "DESFASE SEMESTRAL (+6 meses): Stock principal para módulo de Cocina Italiana e Internacional.",
    },
  ];
}
