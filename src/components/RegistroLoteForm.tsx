"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Database,
  PlusCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import {
  calcularEstadoSemaforo,
  CATEGORIAS_GASTRONOMIA,
  LoteConProducto,
  Producto,
  RegistroLoteSchema,
} from "@/types/inventory";
import SemaforoVisual from "./SemaforoVisual";

interface RegistroLoteFormProps {
  productos: Producto[];
  onLoteRegistradoLocal: (
    nuevoLote: LoteConProducto,
    nuevoProducto?: Producto
  ) => void;
  onAbrirQrModal: (lote: LoteConProducto) => void;
}

function hoyStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function futuroStr(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RegistroLoteForm({
  productos,
  onLoteRegistradoLocal,
  onAbrirQrModal,
}: RegistroLoteFormProps) {
  const prodDefault = productos[0];

  const [modoProducto, setModoProducto] = useState<"existente" | "nuevo">(
    "existente"
  );
  const [productoId, setProductoId] = useState<string>(prodDefault?.id || "");
  const [nombre, setNombre] = useState<string>("");
  const [marca, setMarca] = useState<string>("");
  const [categoria, setCategoria] = useState<string>(
    prodDefault?.categoria || CATEGORIAS_GASTRONOMIA[0]
  );
  const [formato, setFormato] = useState<string>(prodDefault?.formato || "1 L");
  const [ubicacion, setUbicacion] = useState<string>(
    prodDefault?.ubicacion || "Cámara Refrigerada N°1 — Taller Gastronomía"
  );
  const [codigoLote, setCodigoLote] = useState<string>("LOT-2026-GAS-09");
  const [cantidad, setCantidad] = useState<string>("12");
  const [unidad, setUnidad] = useState<string>("unidades");
  const [fechaIngreso, setFechaIngreso] = useState<string>(hoyStr());
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(
    futuroStr(5)
  );
  const [observaciones, setObservaciones] = useState<string>(
    "Ingreso para taller práctico de Gastronomía INACAP."
  );

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ultimoRegistrado, setUltimoRegistrado] =
    useState<LoteConProducto | null>(null);
  const [sqlGenerado, setSqlGenerado] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  const handleCambioProductoExistente = (idSeleccionado: string) => {
    setProductoId(idSeleccionado);
    const prod = productos.find((p) => p.id === idSeleccionado);
    if (prod) {
      setCategoria(prod.categoria);
      setFormato(prod.formato);
      setUbicacion(prod.ubicacion);
    }
  };

  const previewSemaforo = calcularEstadoSemaforo(fechaVencimiento);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    const validacion = RegistroLoteSchema.safeParse({
      modoProducto,
      producto_id: modoProducto === "existente" ? productoId : undefined,
      nombre: modoProducto === "nuevo" ? nombre : undefined,
      marca: modoProducto === "nuevo" ? marca : undefined,
      categoria,
      formato,
      ubicacion,
      codigo_lote: codigoLote.toUpperCase(),
      cantidad,
      unidad,
      fecha_ingreso: fechaIngreso,
      fecha_vencimiento: fechaVencimiento,
      observaciones,
    });

    if (!validacion.success) {
      const mapaErrores: Record<string, string> = {};
      for (const issue of validacion.error.issues) {
        const key = String(issue.path[0] || "general");
        if (!mapaErrores[key]) {
          mapaErrores[key] = issue.message;
        }
      }
      setErrores(mapaErrores);
      return;
    }

    const datos = validacion.data;
    let productoAsociado: Producto | undefined;
    let nuevoProductoCreado: Producto | undefined;

    if (datos.modoProducto === "existente") {
      productoAsociado = productos.find((p) => p.id === datos.producto_id);
    } else {
      const baseFoto = productos[0];
      nuevoProductoCreado = {
        id: crypto.randomUUID(),
        codigo_ean: `780${Math.floor(1000000000 + Math.random() * 8999999999)}`,
        nombre: datos.nombre!,
        marca: datos.marca!,
        categoria: datos.categoria,
        formato: datos.formato,
        ubicacion: datos.ubicacion,
        imagen_url: baseFoto.imagen_url,
        imagen_remota_url: baseFoto.imagen_remota_url,
        fuente_imagen: "Open Food Facts (CC BY-SA 3.0)",
        url_ficha_off: baseFoto.url_ficha_off,
      };
      productoAsociado = nuevoProductoCreado;
    }

    if (!productoAsociado) return;

    const { estado, diasRestantes } = calcularEstadoSemaforo(
      datos.fecha_vencimiento
    );

    const nuevoLote: LoteConProducto = {
      id: crypto.randomUUID(),
      codigo_lote: datos.codigo_lote.toUpperCase(),
      producto_id: productoAsociado.id,
      cantidad: datos.cantidad,
      unidad: datos.unidad,
      fecha_ingreso: datos.fecha_ingreso,
      fecha_vencimiento: datos.fecha_vencimiento,
      observaciones: datos.observaciones || null,
      producto: productoAsociado,
      estado,
      dias_restantes: diasRestantes,
    };

    const sql = `-- Insertar lote en Supabase SQL Editor (ProyectoMillaray)
insert into public.lotes (codigo_lote, producto_id, cantidad, unidad, fecha_ingreso, fecha_vencimiento, observaciones)
values (
  '${nuevoLote.codigo_lote}',
  '${productoAsociado.id}',
  ${nuevoLote.cantidad},
  '${nuevoLote.unidad.replace(/'/g, "''")}',
  '${nuevoLote.fecha_ingreso}',
  '${nuevoLote.fecha_vencimiento}',
  '${(nuevoLote.observaciones || "").replace(/'/g, "''")}'
);`;

    setSqlGenerado(sql);
    setUltimoRegistrado(nuevoLote);
    onLoteRegistradoLocal(nuevoLote, nuevoProductoCreado);
  };

  const copiarSql = async () => {
    if (!sqlGenerado) return;
    await navigator.clipboard.writeText(sqlGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Formulario de Registro */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Registro de Producto, Lote y Generación QR
              </h2>
              <p className="text-xs text-slate-600">
                Registra nombre, categoría, cantidad, fecha de ingreso y
                vencimiento (Validado con Zod)
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Selector de modo: Producto del catálogo o Nuevo producto */}
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setModoProducto("existente")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                modoProducto === "existente"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Usar producto del catálogo ({productos.length})
            </button>
            <button
              type="button"
              onClick={() => setModoProducto("nuevo")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                modoProducto === "nuevo"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Registrar nuevo producto gastronómico
            </button>
          </div>

          {modoProducto === "existente" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Producto Gastronómico *
              </label>
              <select
                value={productoId}
                onChange={(e) => handleCambioProductoExistente(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.marca} ({p.formato}) [{p.categoria}]
                  </option>
                ))}
              </select>
              {errores.producto_id && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errores.producto_id}
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Crema de Leche UHT 35% Materia Grasa"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
                {errores.nombre && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errores.nombre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Marca / Fabricante *
                </label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej: Colun / Soprole"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
                {errores.marca && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errores.marca}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Categoría y Ubicación */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Categoría Gastronómica *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              >
                {CATEGORIAS_GASTRONOMIA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Ubicación en Bodega / Cuarto Frío *
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Código de Lote, Cantidad y Unidad */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Código Único de Lote (QR) *
              </label>
              <input
                type="text"
                value={codigoLote}
                onChange={(e) => setCodigoLote(e.target.value.toUpperCase())}
                placeholder="LOT-2026-GAS-09"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-sm font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              {errores.codigo_lote && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errores.codigo_lote}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              {errores.cantidad && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errores.cantidad}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Unidad / Formato *
              </label>
              <input
                type="text"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="cajas, botellas, kg..."
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Fechas de Ingreso y Vencimiento */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              {errores.fecha_ingreso && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errores.fecha_ingreso}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-extrabold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              {errores.fecha_vencimiento && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errores.fecha_vencimiento}
                </p>
              )}
            </div>
          </div>

          {/* Botones rápidos para probar distintos estados del semáforo en la fecha */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-bold text-slate-600">
              Preajuste rápido de fecha para prueba:
            </span>
            <button
              type="button"
              onClick={() => setFechaVencimiento(futuroStr(60))}
              className="rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-900 hover:bg-emerald-200"
            >
              +60 días (Verde)
            </button>
            <button
              type="button"
              onClick={() => setFechaVencimiento(futuroStr(4))}
              className="rounded-lg bg-amber-100 px-2.5 py-1 font-bold text-amber-950 hover:bg-amber-200"
            >
              +4 días (Amarillo)
            </button>
            <button
              type="button"
              onClick={() => setFechaVencimiento(futuroStr(-3))}
              className="rounded-lg bg-rose-100 px-2.5 py-1 font-bold text-rose-900 hover:bg-rose-200"
            >
              -3 días (Rojo)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Observaciones Sanitarias / Lote (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Priorizar uso en taller de pastelería (FEFO)"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800"
          >
            <QrCode className="h-5 w-5 text-amber-400" />
            Registrar Lote y Generar Código QR Individual
          </button>
        </form>
      </div>

      {/* Panel Derecho: Vista previa en tiempo real del Semáforo PNG + Guía Supabase Table Editor */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-extrabold tracking-wide text-slate-900 uppercase">
            Previsualización del Semáforo Sanitario
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">
            El semáforo calcula automáticamente el estado según la fecha de
            vencimiento ingresada:
          </p>

          <div className="mt-4 flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
            <SemaforoVisual
              estado={previewSemaforo.estado}
              tamano="lg"
              mostrarEtiqueta={false}
            />
            <div>
              <span
                className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase ${
                  previewSemaforo.estado === "vencido"
                    ? "bg-rose-500 text-white"
                    : previewSemaforo.estado === "proximo"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {previewSemaforo.etiqueta}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {previewSemaforo.recomendacionBpm}
              </p>
            </div>
          </div>

          {ultimoRegistrado && (
            <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-emerald-950 uppercase">
                    Lote registrado en la sesión demostrativa
                  </p>
                  <p className="font-mono text-sm font-bold text-emerald-900">
                    {ultimoRegistrado.codigo_lote} —{" "}
                    {ultimoRegistrado.producto.nombre}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAbrirQrModal(ultimoRegistrado)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <QrCode className="h-4 w-4" />
                  Ver / Descargar QR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Seguridad RLS y Administración en Supabase Table Editor */}
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-400">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-extrabold uppercase">
              Arquitectura Segura: Lectura Pública RLS + Supabase Table Editor
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Por seguridad académica, la aplicación web consulta{" "}
            <strong className="text-white">ProyectoMillaray</strong> mediante
            acceso público de{" "}
            <strong className="text-emerald-400">solo lectura (SELECT)</strong>{" "}
            sin exponer claves privadas ni permitir escrituras anónimas. La
            administración persistente se realiza directamente desde{" "}
            <strong className="text-white">Supabase Table Editor</strong> o{" "}
            <strong className="text-white">SQL Editor</strong>.
          </p>

          {sqlGenerado && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Database className="h-3.5 w-3.5" />
                  Sentencia SQL lista para Supabase:
                </span>
                <button
                  type="button"
                  onClick={copiarSql}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  {copiado ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300">
                {sqlGenerado}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

