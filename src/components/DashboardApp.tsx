"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  Database,
  ExternalLink,
  Filter,
  Layers,
  MapPin,
  Package,
  PlusCircle,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
} from "lucide-react";
import {
  calcularEstadoSemaforo,
  EstadoSemaforo,
  LoteConProducto,
  Producto,
  ResultadoInventario,
} from "@/types/inventory";
import SemaforoVisual from "./SemaforoVisual";
import QrModal from "./QrModal";
import QrScanner from "./QrScanner";
import RegistroLoteForm from "./RegistroLoteForm";

interface DashboardAppProps {
  datosIniciales: ResultadoInventario;
  loteQueryInicial?: string | null;
}

type PestanaActiva =
  | "inventario"
  | "escaner"
  | "registro"
  | "catalogo"
  | "muestras";

const MUESTRAS_IMPRIMIBLES = [
  {
    archivo: "01-VENCIDO-ROJO-LOT-2026-COL-00-Leche-Colun.png",
    lote: "LOT-2026-COL-00",
    titulo: "Muestra #01 — Leche Entera Colun 1 L (VENCIDO)",
    desfase: "Desfase: -11 días respecto al lunes de evaluación (Luz Roja)",
  },
  {
    archivo: "02-VENCIDO-ROJO-LOT-2026-MKG-01-Pasta-Mani.png",
    lote: "LOT-2026-MKG-01",
    titulo: "Muestra #02 — Pasta de Maní Natural 485 g (VENCIDO)",
    desfase: "Desfase: -7 días respecto al lunes de evaluación (Luz Roja)",
  },
  {
    archivo: "03-PROXIMO-AMARILLO-LOT-2026-SAN-01-Galletas-Maria.png",
    lote: "LOT-2026-SAN-01",
    titulo: "Muestra #03 — Galletas María Sin Gluten 180 g (PRÓXIMO)",
    desfase: "Desfase corto: +1 día desde el lunes de evaluación (Luz Amarilla)",
  },
  {
    archivo: "04-PROXIMO-AMARILLO-LOT-2026-COL-01-Leche-Colun.png",
    lote: "LOT-2026-COL-01",
    titulo: "Muestra #04 — Leche Entera Colun 1 L (PRÓXIMO)",
    desfase: "Desfase medio: +2 días desde el lunes de evaluación (Luz Amarilla)",
  },
  {
    archivo: "05-PROXIMO-AMARILLO-LOT-2026-KRA-01-Mayonesa-Kraft.png",
    lote: "LOT-2026-KRA-01",
    titulo: "Muestra #05 — Mayonesa Real Mayo Kraft 887 ml (PRÓXIMO)",
    desfase: "Desfase preventivo: +3 días desde el lunes de evaluación (Luz Amarilla)",
  },
  {
    archivo: "06-VIGENTE-VERDE-LOT-2026-COL-02-Leche-Colun.png",
    lote: "LOT-2026-COL-02",
    titulo: "Muestra #06 — Leche Entera Colun 1 L Reposición (VIGENTE)",
    desfase: "Desfase quincenal: +15 días desde el lunes de evaluación (Luz Verde)",
  },
  {
    archivo: "07-VIGENTE-VERDE-LOT-2026-VAL-70-Chocolate-Valor.png",
    lote: "LOT-2026-VAL-70",
    titulo: "Muestra #07 — Chocolate Negro 70% Cacao Valor (VIGENTE)",
    desfase: "Desfase mensual: +31 días (+1 mes) desde evaluación (Luz Verde)",
  },
  {
    archivo: "08-VIGENTE-VERDE-LOT-2026-BOR-01-Vinagre-Borges.png",
    lote: "LOT-2026-BOR-01",
    titulo: "Muestra #08 — Vinagre Balsámico de Módena Borges (VIGENTE)",
    desfase: "Desfase bimestral: +67 días (+2 meses) desde evaluación (Luz Verde)",
  },
  {
    archivo: "09-VIGENTE-VERDE-LOT-2026-DIV-27-Harina-Integral.png",
    lote: "LOT-2026-DIV-27",
    titulo: "Muestra #09 — Harina de Trigo Integral Biográ 500 g (VIGENTE)",
    desfase: "Desfase cuatrimestral: +126 días (+4 meses) desde evaluación (Luz Verde)",
  },
  {
    archivo: "10-VIGENTE-VERDE-LOT-2026-DIV-08-Harina-Trigo.png",
    lote: "LOT-2026-DIV-08",
    titulo: "Muestra #10 — Harina de Trigo 100% Natural 1 kg (VIGENTE)",
    desfase: "Desfase semestral: +192 días (+6 meses) desde evaluación (Luz Verde)",
  },
];

export default function DashboardApp({
  datosIniciales,
  loteQueryInicial = null,
}: DashboardAppProps) {
  const [productos, setProductos] = useState<Producto[]>(
    datosIniciales.productos
  );
  const [lotes, setLotes] = useState<LoteConProducto[]>(datosIniciales.lotes);
  const [origen, setOrigen] = useState<"supabase" | "demo_respaldo">(
    datosIniciales.origen
  );
  const [mensajeConexion, setMensajeConexion] = useState<string>(
    datosIniciales.mensajeConexion
  );
  const [sincronizando, setSincronizando] = useState(false);

  const [pestana, setPestana] = useState<PestanaActiva>(
    loteQueryInicial ? "escaner" : "inventario"
  );
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoSemaforo>(
    "todos"
  );
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");

  const [loteModalQr, setLoteModalQr] = useState<LoteConProducto | null>(null);
  const [loteEscaneadoCodigo, setLoteEscaneadoCodigo] = useState<string | null>(
    loteQueryInicial
  );

  // Si se abre con ?lote=CODIGO desde un celular, abrir también la ficha si existe
  useEffect(() => {
    if (loteQueryInicial) {
      const encontrado = lotes.find(
        (l) => l.codigo_lote.toUpperCase() === loteQueryInicial.toUpperCase()
      );
      if (encontrado) {
        setLoteEscaneadoCodigo(encontrado.codigo_lote);
        setPestana("escaner");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteQueryInicial]);

  const estadisticas = useMemo(() => {
    return {
      totalLotes: lotes.length,
      totalProductos: productos.length,
      vigentes: lotes.filter((l) => l.estado === "vigente").length,
      proximos: lotes.filter((l) => l.estado === "proximo").length,
      vencidos: lotes.filter((l) => l.estado === "vencido").length,
    };
  }, [lotes, productos]);

  const categoriasDisponibles = useMemo(() => {
    const setCats = new Set<string>();
    for (const p of productos) {
      setCats.add(p.categoria);
    }
    return Array.from(setCats);
  }, [productos]);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      if (filtroEstado !== "todos" && lote.estado !== filtroEstado) {
        return false;
      }
      if (
        filtroCategoria !== "todas" &&
        lote.producto.categoria !== filtroCategoria
      ) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincide =
          lote.producto.nombre.toLowerCase().includes(q) ||
          lote.producto.marca.toLowerCase().includes(q) ||
          lote.codigo_lote.toLowerCase().includes(q) ||
          lote.producto.categoria.toLowerCase().includes(q) ||
          lote.producto.codigo_ean.toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [lotes, filtroEstado, filtroCategoria, busqueda]);

  const sincronizarConSupabase = async () => {
    setSincronizando(true);
    try {
      const res = await fetch("/api/inventario", { cache: "no-store" });
      if (res.ok) {
        const data: ResultadoInventario = await res.json();
        setProductos(data.productos);
        setLotes(data.lotes);
        setOrigen(data.origen);
        setMensajeConexion(data.mensajeConexion);
      }
    } catch {
      // Mantener estado actual si falla red
    } finally {
      setSincronizando(false);
    }
  };

  const handleLoteRegistradoLocal = (
    nuevoLote: LoteConProducto,
    nuevoProducto?: Producto
  ) => {
    if (nuevoProducto) {
      setProductos((prev) => [nuevoProducto, ...prev]);
    }
    setLotes((prev) => {
      const actualizados = [
        nuevoLote,
        ...prev.filter((l) => l.codigo_lote !== nuevoLote.codigo_lote),
      ];
      actualizados.sort((a, b) => a.dias_restantes - b.dias_restantes);
      return actualizados;
    });
    setLoteModalQr(nuevoLote);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Cabecera Institucional Gastronomía INACAP */}
      <header className="border-b border-slate-800 bg-slate-950 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <ChefHat className="h-8 w-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-300 uppercase">
                    Proyecto Integrado de Gastronomía · INACAP
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      origen === "supabase"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    <Database className="h-3 w-3" />
                    {origen === "supabase"
                      ? "Supabase PostgreSQL Activo (ProyectoMillaray)"
                      : "Catálogo Demostrativo Activo"}
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Sistema de Control de Vencimientos QR
                </h1>
                <p className="text-xs text-slate-300 sm:text-sm">
                  Trazabilidad por lote, semáforo sanitario visual y fotografías
                  reales de envases (Open Food Facts)
                </p>
              </div>
            </div>

            {/* Botones de Acción Rápida en Cabecera */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={sincronizarConSupabase}
                disabled={sincronizando}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                title="Consultar cambios realizados en Supabase Table Editor"
              >
                <RefreshCw
                  className={`h-4 w-4 text-amber-400 ${
                    sincronizando ? "animate-spin" : ""
                  }`}
                />
                {sincronizando ? "Sincronizando..." : "Sincronizar Supabase"}
              </button>

              <button
                type="button"
                onClick={() => setPestana("escaner")}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-xs transition hover:bg-amber-300"
              >
                <ScanLine className="h-4 w-4" />
                Escanear Código QR
              </button>
            </div>
          </div>

          {/* Barra de Navegación Principal */}
          <nav
            aria-label="Secciones principales"
            className="mt-5 flex flex-wrap gap-2 border-t border-slate-800/90 pt-4"
          >
            <button
              type="button"
              onClick={() => setPestana("inventario")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm ${
                pestana === "inventario"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" />
              1. Dashboard e Inventario por Lote ({lotes.length})
            </button>

            <button
              type="button"
              onClick={() => setPestana("escaner")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm ${
                pestana === "escaner"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ScanLine className="h-4 w-4" />
              2. Escáner QR y Consulta de Semáforo
            </button>

            <button
              type="button"
              onClick={() => setPestana("registro")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm ${
                pestana === "registro"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              3. Registro de Lote y Generador QR
            </button>

            <button
              type="button"
              onClick={() => setPestana("catalogo")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm ${
                pestana === "catalogo"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Package className="h-4 w-4" />
              4. Catálogo de Productos ({productos.length})
            </button>

            <button
              type="button"
              onClick={() => setPestana("muestras")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm ${
                pestana === "muestras"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "bg-slate-900 text-amber-300 hover:bg-slate-800 hover:text-amber-200"
              }`}
            >
              <Printer className="h-4 w-4" />
              5. Muestras QR Imprimibles (Evaluación Lunes)
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Banner informativo de conexión a base de datos */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                origen === "supabase" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="font-medium">{mensajeConexion}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Política RLS: Lectura pública (SELECT) · Administración: Supabase Table Editor
          </span>
        </div>

        {/* ===============================================================
            TARJETAS DE ESTADÍSTICAS CON SEMÁFORO PNG (SIEMPRE VISIBLES)
           =============================================================== */}
        <section aria-label="Resumen del semáforo de vencimientos" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Inventario */}
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("todos");
                setPestana("inventario");
              }}
              className={`flex items-center justify-between rounded-3xl border p-5 text-left transition ${
                filtroEstado === "todos" && pestana === "inventario"
                  ? "border-slate-900 bg-white ring-2 ring-slate-900/15 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div>
                <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                  Total Lotes Activos
                </p>
                <p className="mt-2 text-4xl font-black text-slate-900">
                  {estadisticas.totalLotes}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  en {estadisticas.totalProductos} productos gastronómicos
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/images/semaforo-base.png"
                  alt="Semáforo base"
                  className="h-20 w-auto object-contain drop-shadow-xs"
                />
              </div>
            </button>

            {/* Vigentes — Luz Verde PNG */}
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("vigente");
                setPestana("inventario");
              }}
              className={`flex items-center justify-between rounded-3xl border p-5 text-left transition ${
                filtroEstado === "vigente" && pestana === "inventario"
                  ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/25 shadow-sm"
                  : "border-emerald-200 bg-white hover:bg-emerald-50/40 shadow-2xs"
              }`}
            >
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900 uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Luz Verde
                </span>
                <p className="mt-2 text-4xl font-black text-emerald-700">
                  {estadisticas.vigentes}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  Productos Vigentes (&gt; 7 días)
                </p>
              </div>
              <SemaforoVisual estado="vigente" tamano="md" />
            </button>

            {/* Próximos a Vencer — Luz Amarilla PNG */}
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("proximo");
                setPestana("inventario");
              }}
              className={`flex items-center justify-between rounded-3xl border p-5 text-left transition ${
                filtroEstado === "proximo" && pestana === "inventario"
                  ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30 shadow-sm"
                  : "border-amber-200 bg-white hover:bg-amber-50/40 shadow-2xs"
              }`}
            >
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-950 uppercase">
                  <Clock className="h-3.5 w-3.5" />
                  Luz Amarilla
                </span>
                <p className="mt-2 text-4xl font-black text-amber-600">
                  {estadisticas.proximos}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  Próximos a Vencer (≤ 7 días)
                </p>
              </div>
              <SemaforoVisual estado="proximo" tamano="md" />
            </button>

            {/* Vencidos — Luz Roja PNG */}
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("vencido");
                setPestana("inventario");
              }}
              className={`flex items-center justify-between rounded-3xl border p-5 text-left transition ${
                filtroEstado === "vencido" && pestana === "inventario"
                  ? "border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/25 shadow-sm"
                  : "border-rose-200 bg-white hover:bg-rose-50/40 shadow-2xs"
              }`}
            >
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-900 uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Luz Roja
                </span>
                <p className="mt-2 text-4xl font-black text-rose-600">
                  {estadisticas.vencidos}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  Vencidos (Retirar / Merma)
                </p>
              </div>
              <SemaforoVisual estado="vencido" tamano="md" />
            </button>
          </div>
        </section>

        {/* ===============================================================
            PESTAÑA 1: INVENTARIO DE LOTES Y SEMÁFORO SANITARIO
           =============================================================== */}
        {pestana === "inventario" && (
          <section className="space-y-6">
            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase">
                  <Filter className="h-4 w-4 text-slate-500" />
                  Semáforo:
                </span>
                {(
                  [
                    { id: "todos", label: `Todos (${estadisticas.totalLotes})` },
                    {
                      id: "vencido",
                      label: `Rojo: Vencidos (${estadisticas.vencidos})`,
                    },
                    {
                      id: "proximo",
                      label: `Amarillo: Próximos (${estadisticas.proximos})`,
                    },
                    {
                      id: "vigente",
                      label: `Verde: Vigentes (${estadisticas.vigentes})`,
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltroEstado(item.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      filtroEstado === item.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Filtrar por categoría gastronómica"
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="todas">Todas las categorías</option>
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto, marca o lote..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Grilla de Tarjetas de Lotes con Fotografías Reales + Semáforo PNG + Botón QR */}
            {lotesFiltrados.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
                <p className="text-base font-bold text-slate-800">
                  No se encontraron lotes para los filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado("todos");
                    setFiltroCategoria("todas");
                    setBusqueda("");
                  }}
                  className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                >
                  Mostrar todo el inventario
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {lotesFiltrados.map((lote) => {
                  const info = calcularEstadoSemaforo(lote.fecha_vencimiento);

                  const cardBorder =
                    lote.estado === "vencido"
                      ? "border-rose-300 bg-white"
                      : lote.estado === "proximo"
                      ? "border-amber-300 bg-white"
                      : "border-slate-200 bg-white";

                  const topBar =
                    lote.estado === "vencido"
                      ? "bg-rose-600 text-white"
                      : lote.estado === "proximo"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-emerald-600 text-white";

                  return (
                    <article
                      key={lote.id}
                      className={`flex flex-col justify-between overflow-hidden rounded-3xl border shadow-xs transition hover:shadow-md ${cardBorder}`}
                    >
                      {/* Franja Superior de Estado y Código de Lote */}
                      <div
                        className={`flex items-center justify-between px-5 py-2.5 text-xs font-extrabold ${topBar}`}
                      >
                        <span className="tracking-wide uppercase">
                          {info.etiqueta}
                        </span>
                        <span className="rounded-md bg-black/15 px-2.5 py-0.5 font-mono text-xs">
                          {lote.codigo_lote}
                        </span>
                      </div>

                      {/* Cuerpo de la Tarjeta: Foto Real + Datos + Semáforo PNG */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          {/* Fotografía Real del Envase (Open Food Facts) */}
                          <div className="flex items-start gap-4">
                            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                              <img
                                src={lote.producto.imagen_url}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (
                                    target.src !==
                                    lote.producto.imagen_remota_url
                                  ) {
                                    target.src = lote.producto.imagen_remota_url;
                                  }
                                }}
                                alt={lote.producto.nombre}
                                className="h-full w-full object-contain"
                              />
                            </div>

                            <div>
                              <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                                {lote.producto.categoria}
                              </span>
                              <h3 className="mt-1 text-lg font-extrabold leading-snug text-slate-900">
                                {lote.producto.nombre}
                              </h3>
                              <p className="text-xs font-semibold text-slate-600">
                                Marca:{" "}
                                <span className="text-slate-900">
                                  {lote.producto.marca}
                                </span>{" "}
                                · Formato:{" "}
                                <span className="text-slate-900">
                                  {lote.producto.formato}
                                </span>
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-900">
                                  <Package className="h-3.5 w-3.5 text-slate-600" />
                                  {lote.cantidad} {lote.unidad}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                  {lote.producto.ubicacion}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Semáforo PNG exclusivo */}
                          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-900 p-2.5 shadow-inner">
                            <SemaforoVisual
                              estado={lote.estado}
                              tamano="md"
                              mostrarEtiqueta={false}
                            />
                          </div>
                        </div>

                        {/* Fechas de Ingreso y Vencimiento */}
                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                              <Calendar className="h-3 w-3" />
                              Fecha de Ingreso
                            </span>
                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                              {lote.fecha_ingreso}
                            </p>
                          </div>

                          <div>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                              <Calendar className="h-3 w-3" />
                              Fecha de Vencimiento
                            </span>
                            <p
                              className={`mt-0.5 text-sm font-black ${
                                lote.estado === "vencido"
                                  ? "text-rose-700"
                                  : lote.estado === "proximo"
                                  ? "text-amber-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              {lote.fecha_vencimiento}
                            </p>
                          </div>
                        </div>

                        {lote.observaciones && (
                          <p className="mt-3 text-xs text-slate-600 italic">
                            “{lote.observaciones}”
                          </p>
                        )}
                      </div>

                      {/* Pie de Tarjeta: Atribución Open Food Facts + Acciones QR */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-3">
                        <a
                          href={lote.producto.url_ficha_off}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:underline"
                        >
                          Foto: {lote.producto.fuente_imagen}
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLoteEscaneadoCodigo(lote.codigo_lote);
                              setPestana("escaner");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100"
                          >
                            <ScanLine className="h-3.5 w-3.5" />
                            Consultar en Escáner
                          </button>

                          <button
                            type="button"
                            onClick={() => setLoteModalQr(lote)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
                          >
                            <QrCode className="h-3.5 w-3.5 text-amber-400" />
                            Generar / Descargar QR
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===============================================================
            PESTAÑA 2: ESCÁNER DE CÓDIGOS QR Y CONSULTA DE SEMÁFORO
           =============================================================== */}
        {pestana === "escaner" && (
          <QrScanner
            lotes={lotes}
            loteInicialCodigo={loteEscaneadoCodigo}
            onVerQrModal={(lote) => setLoteModalQr(lote)}
          />
        )}

        {/* ===============================================================
            PESTAÑA 3: REGISTRO DE PRODUCTO / LOTE Y GENERACIÓN QR
           =============================================================== */}
        {pestana === "registro" && (
          <RegistroLoteForm
            productos={productos}
            onLoteRegistradoLocal={handleLoteRegistradoLocal}
            onAbrirQrModal={(lote) => setLoteModalQr(lote)}
          />
        )}

        {/* ===============================================================
            PESTAÑA 4: CATÁLOGO DE PRODUCTOS CON FOTOS REALES (OPEN FOOD FACTS)
           =============================================================== */}
        {pestana === "catalogo" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <h2 className="text-lg font-extrabold text-slate-900">
                Catálogo Maestro de Productos Gastronómicos (`public.productos`)
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Todas las fotografías corresponden a envases reales obtenidos de{" "}
                <strong>Open Food Facts</strong> bajo licencia{" "}
                <strong>Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)</strong>
                , conservando su atribución y código EAN oficial.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {productos.map((prod) => {
                  const lotesDelProducto = lotes.filter(
                    (l) => l.producto_id === prod.id
                  );
                  return (
                    <div
                      key={prod.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-xs"
                    >
                      <div>
                        <div className="flex h-44 w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-3">
                          <img
                            src={prod.imagen_url}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== prod.imagen_remota_url) {
                                target.src = prod.imagen_remota_url;
                              }
                            }}
                            alt={prod.nombre}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <span className="mt-3 inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {prod.categoria}
                        </span>
                        <h3 className="mt-1 text-base font-extrabold text-slate-900">
                          {prod.nombre}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600">
                          {prod.marca} · {prod.formato}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          EAN: {prod.codigo_ean}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {prod.ubicacion}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            Lotes asociados: {lotesDelProducto.length}
                          </span>
                          <a
                            href={prod.url_ficha_off}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline"
                          >
                            Ficha OFF
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===============================================================
            PESTAÑA 5: MUESTRAS QR IMPRIMIBLES CON FOTO Y DESFASES (EVALUACIÓN LUNES)
           =============================================================== */}
        {pestana === "muestras" && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
                <div>
                  <span className="inline-block rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-950 uppercase">
                    Material Listo para Impresión y Demostración en Aula
                  </span>
                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    10 Muestras QR con Fotografías Reales y Desfases (Evaluación Lunes)
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Incluye exactamente{" "}
                    <strong className="text-rose-700">2 lotes vencidos (Rojo)</strong>,{" "}
                    <strong className="text-amber-700">
                      3 lotes próximos a vencer con desfase de +1, +2 y +3 días (Amarillo)
                    </strong>{" "}
                    y{" "}
                    <strong className="text-emerald-700">
                      5 lotes vigentes con desfases de +15 días a +6 meses (Verde)
                    </strong>
                    . También están guardadas en la carpeta{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                      /muestras-qr-imprimibles
                    </code>
                    .
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="/muestras-qr/00-LAMINA-COMPLETA-10-MUESTRAS-QR-EVALUACION-LUNES.png"
                    download="00-LAMINA-COMPLETA-10-MUESTRAS-QR-EVALUACION-LUNES.png"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-slate-800"
                  >
                    <Printer className="h-4 w-4 text-amber-400" />
                    Descargar Lámina Completa Imprimible (10 QR)
                  </a>
                </div>
              </div>

              {/* Grilla de las 10 tarjetas PNG listas para imprimir o escanear desde pantalla */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {MUESTRAS_IMPRIMIBLES.map((m) => (
                  <div
                    key={m.lote}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {m.titulo}
                        </h3>
                        <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                          {m.lote}
                        </span>
                      </div>
                      <p className="mb-3 text-xs font-semibold text-slate-600">
                        {m.desfase}
                      </p>

                      <img
                        src={`/muestras-qr/${m.archivo}`}
                        alt={m.titulo}
                        className="w-full rounded-xl border border-slate-300 bg-white shadow-2xs"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoteEscaneadoCodigo(m.lote);
                          setPestana("escaner");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                        Probar en Escáner
                      </button>

                      <a
                        href={`/muestras-qr/${m.archivo}`}
                        download={m.archivo}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        <QrCode className="h-3.5 w-3.5 text-amber-400" />
                        Descargar PNG Imprimible
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Pie de página académico */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-700">
            Prototipo Académico — Asignatura Proyecto Integrado de Gastronomía
            (INACAP)
          </p>
          <p>
            Fotografías reales de productos con atribución a{" "}
            <a
              href="https://cl.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 underline"
            >
              Open Food Facts (CC BY-SA 3.0)
            </a>{" "}
            · Base de datos: Supabase PostgreSQL (`ProyectoMillaray`)
          </p>
        </div>
      </footer>

      {/* Modal de Código QR y Descarga de Etiqueta PNG */}
      <QrModal lote={loteModalQr} onClose={() => setLoteModalQr(null)} />
    </div>
  );
}

