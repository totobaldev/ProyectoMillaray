"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ExternalLink,
  FileUp,
  QrCode,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { calcularEstadoSemaforo, LoteConProducto } from "@/types/inventory";
import SemaforoVisual from "./SemaforoVisual";

interface QrScannerProps {
  lotes: LoteConProducto[];
  loteInicialCodigo?: string | null;
  onVerQrModal: (lote: LoteConProducto) => void;
}

/**
 * Extrae el código de lote desde el contenido escaneado en un QR.
 * Soporta tanto URLs completas (ej: https://.../?lote=LOT-2026-COL-01)
 * como el código directo (ej: LOT-2026-COL-01).
 */
export function extraerCodigoLoteDeQr(textoQr: string): string {
  const limpio = textoQr.trim();
  try {
    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      const url = new URL(limpio);
      const paramLote = url.searchParams.get("lote");
      if (paramLote) return paramLote.trim().toUpperCase();
    }
  } catch {
    // Continuar con coincidencia directa
  }
  const matchParam = limpio.match(/[?&]lote=([A-Za-z0-9-_]+)/i);
  if (matchParam?.[1]) {
    return matchParam[1].toUpperCase();
  }
  return limpio.toUpperCase();
}

export default function QrScanner({
  lotes,
  loteInicialCodigo,
  onVerQrModal,
}: QrScannerProps) {
  const regionId = useId().replace(/:/g, "-");
  const readerDomId = `qr-reader-${regionId}`;
  const fileReaderDomId = `qr-file-reader-${regionId}`;

  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [codigoBuscado, setCodigoBuscado] = useState<string>(
    loteInicialCodigo || ""
  );
  const [ultimoTextoQr, setUltimoTextoQr] = useState<string | null>(null);
  const [loteEncontrado, setLoteEncontrado] =
    useState<LoteConProducto | null>(null);
  const [noEncontradoMsg, setNoEncontradoMsg] = useState<string | null>(null);

  const resolverCodigoLote = (textoCrudo: string) => {
    const codigo = extraerCodigoLoteDeQr(textoCrudo);
    setUltimoTextoQr(textoCrudo);
    setCodigoBuscado(codigo);

    const hallado = lotes.find(
      (l) => l.codigo_lote.toUpperCase() === codigo.toUpperCase()
    );

    if (hallado) {
      setLoteEncontrado(hallado);
      setNoEncontradoMsg(null);
    } else {
      setLoteEncontrado(null);
      setNoEncontradoMsg(
        `No se encontró ningún lote registrado con el código "${codigo}". Verifica el código QR o sincroniza con Supabase.`
      );
    }
  };

  useEffect(() => {
    if (loteInicialCodigo) {
      resolverCodigoLote(loteInicialCodigo);
    } else if (!loteEncontrado && lotes.length > 0) {
      // Seleccionar por defecto el primer lote para mostrar cómo luce la consulta del semáforo
      setLoteEncontrado(lotes[0]);
      setCodigoBuscado(lotes[0].codigo_lote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteInicialCodigo, lotes]);

  const detenerCamara = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignorar si ya estaba detenido
      }
      scannerRef.current = null;
    }
    setCamaraActiva(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
      }
    };
  }, []);

  const iniciarCamara = async () => {
    setErrorCamara(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await detenerCamara();

      const html5QrCode = new Html5Qrcode(readerDomId);
      setCamaraActiva(true);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
        },
        (decodedText) => {
          resolverCodigoLote(decodedText);
          detenerCamara();
        },
        () => {
          // Fotograma sin QR aún
        }
      );

      scannerRef.current = html5QrCode;
    } catch (err) {
      setCamaraActiva(false);
      const mensaje =
        err instanceof Error
          ? err.message
          : "No se pudo acceder a la cámara del dispositivo.";
      setErrorCamara(
        `No fue posible activar la cámara (${mensaje}). Puedes subir la imagen PNG del QR descargado o usar los botones de prueba rápida.`
      );
    }
  };

  const escanearArchivoImagen = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorCamara(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode(fileReaderDomId);
      const decodedText = await html5QrCode.scanFile(file, false);
      html5QrCode.clear();
      resolverCodigoLote(decodedText);
    } catch {
      setErrorCamara(
        "No se detectó un código QR válido en la imagen seleccionada. Asegúrate de subir un archivo PNG generado por el sistema."
      );
    } finally {
      e.target.value = "";
    }
  };

  const infoSemaforo = loteEncontrado
    ? calcularEstadoSemaforo(loteEncontrado.fecha_vencimiento)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Columna Izquierda: Lector QR con Cámara + Subida de Imagen PNG + Búsqueda */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Escáner de Códigos QR por Lote
              </h2>
              <p className="text-xs text-slate-600">
                Apunta la cámara al envase o sube la etiqueta QR descargada
              </p>
            </div>
          </div>

          {/* Visor de Cámara html5-qrcode */}
          <div className="mt-5 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-950 text-white">
            <div
              id={readerDomId}
              className={`w-full ${camaraActiva ? "min-h-[280px]" : "hidden"}`}
            />
            <div id={fileReaderDomId} className="hidden" />

            {!camaraActiva && (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-amber-400">
                  <Camera className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-bold text-white">
                  Lector óptico con cámara listo
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-300">
                  Escanea el código QR adherido al envase gastronómico para
                  consultar inmediatamente su semáforo de vencimiento.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={iniciarCamara}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-xs transition hover:bg-amber-300"
                  >
                    <Camera className="h-4 w-4" />
                    Activar Cámara QR
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-100 transition hover:bg-slate-700">
                    <FileUp className="h-4 w-4 text-amber-300" />
                    Leer QR desde Imagen PNG
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={escanearArchivoImagen}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {camaraActiva && (
              <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
                  Cámara activa buscando QR...
                </span>
                <button
                  type="button"
                  onClick={detenerCamara}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                >
                  <CameraOff className="h-3.5 w-3.5" />
                  Detener cámara
                </button>
              </div>
            )}
          </div>

          {errorCamara && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <span>{errorCamara}</span>
            </div>
          )}

          {/* Consulta manual o lector pistola USB */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (codigoBuscado.trim()) {
                resolverCodigoLote(codigoBuscado);
              }
            }}
            className="mt-4"
          >
            <label
              htmlFor="input-codigo-lote"
              className="block text-xs font-bold text-slate-700"
            >
              Consulta por código de lote o URL QR:
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="input-codigo-lote"
                type="text"
                value={codigoBuscado}
                onChange={(e) => setCodigoBuscado(e.target.value)}
                placeholder="Ej: LOT-2026-COL-01"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Search className="h-4 w-4" />
                Consultar
              </button>
            </div>
          </form>

          {/* Simulador rápido de escaneo para demostración académica en aula */}
          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Simulación rápida de escaneo (Demostración en Aula):
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Haz clic en cualquier lote para simular la lectura de su etiqueta QR y
              ver el cambio inmediato en el semáforo PNG:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {lotes.map((l) => {
                const activo = l.codigo_lote === loteEncontrado?.codigo_lote;
                const dotColor =
                  l.estado === "vencido"
                    ? "bg-rose-500"
                    : l.estado === "proximo"
                    ? "bg-amber-500"
                    : "bg-emerald-500";
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => resolverCodigoLote(l.codigo_lote)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold transition ${
                      activo
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                    {l.codigo_lote}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Resultado del Semáforo PNG al escanear el QR */}
      <div className="lg:col-span-7">
        {noEncontradoMsg && (
          <div className="rounded-3xl border border-rose-300 bg-rose-50 p-6 text-rose-950 shadow-xs">
            <h3 className="text-base font-extrabold">
              Código QR no encontrado en el inventario
            </h3>
            <p className="mt-1 text-sm">{noEncontradoMsg}</p>
          </div>
        )}

        {loteEncontrado && infoSemaforo && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* Banner superior de estado según semáforo */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 ${
                loteEncontrado.estado === "vencido"
                  ? "border-rose-300 bg-rose-600 text-white"
                  : loteEncontrado.estado === "proximo"
                  ? "border-amber-300 bg-amber-400 text-slate-950"
                  : "border-emerald-300 bg-emerald-600 text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                    Resultado de Lectura QR — Lote {loteEncontrado.codigo_lote}
                  </p>
                  <h3 className="text-lg font-extrabold">
                    {infoSemaforo.etiqueta}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onVerQrModal(loteEncontrado)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-extrabold text-slate-900 shadow-xs transition hover:bg-white"
              >
                <QrCode className="h-4 w-4" />
                Descargar Etiqueta QR
              </button>
            </div>

            {/* Cuerpo principal: Semáforo PNG grande + Datos del Producto y Lote */}
            <div className="grid gap-6 p-6 sm:grid-cols-12">
              {/* Semáforo visual PNG */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white sm:col-span-4">
                <p className="mb-3 text-center text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                  Semáforo Sanitario
                </p>
                <SemaforoVisual
                  estado={loteEncontrado.estado}
                  tamano="xl"
                  mostrarEtiqueta={false}
                />
                <span
                  className={`mt-4 rounded-xl px-3 py-1 text-center text-xs font-extrabold uppercase ${
                    loteEncontrado.estado === "vencido"
                      ? "bg-rose-500 text-white"
                      : loteEncontrado.estado === "proximo"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {loteEncontrado.estado === "vencido"
                    ? "LUZ ROJA: NO USAR"
                    : loteEncontrado.estado === "proximo"
                    ? "LUZ AMARILLA: USAR PRONTO"
                    : "LUZ VERDE: VIGENTE"}
                </span>
              </div>

              {/* Información detallada del alimento escaneado */}
              <div className="flex flex-col justify-between space-y-4 sm:col-span-8">
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <img
                    src={loteEncontrado.producto.imagen_url}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (
                        target.src !==
                        loteEncontrado.producto.imagen_remota_url
                      ) {
                        target.src = loteEncontrado.producto.imagen_remota_url;
                      }
                    }}
                    alt={loteEncontrado.producto.nombre}
                    className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"
                  />
                  <div>
                    <span className="inline-block rounded-md bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {loteEncontrado.producto.categoria}
                    </span>
                    <h4 className="mt-1 text-xl font-extrabold text-slate-900">
                      {loteEncontrado.producto.nombre}
                    </h4>
                    <p className="text-sm font-medium text-slate-600">
                      Marca:{" "}
                      <strong className="text-slate-900">
                        {loteEncontrado.producto.marca}
                      </strong>{" "}
                      · Formato:{" "}
                      <strong className="text-slate-900">
                        {loteEncontrado.producto.formato}
                      </strong>
                    </p>
                    <a
                      href={loteEncontrado.producto.url_ficha_off}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                    >
                      Fuente foto: {loteEncontrado.producto.fuente_imagen}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Tabla de datos clave del lote */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      Código de Lote
                    </p>
                    <p className="mt-0.5 font-mono text-base font-extrabold text-slate-900">
                      {loteEncontrado.codigo_lote}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      Cantidad Disponible
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {loteEncontrado.cantidad} {loteEncontrado.unidad}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      Fecha de Ingreso
                    </p>
                    <p className="mt-0.5 text-base font-bold text-slate-800">
                      {loteEncontrado.fecha_ingreso}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-3.5 ${
                      loteEncontrado.estado === "vencido"
                        ? "border-rose-300 bg-rose-50"
                        : loteEncontrado.estado === "proximo"
                        ? "border-amber-300 bg-amber-50"
                        : "border-emerald-300 bg-emerald-50"
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase opacity-75">
                      Fecha de Vencimiento
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {loteEncontrado.fecha_vencimiento}
                    </p>
                  </div>
                </div>

                {/* Instrucción Sanitaria para el estudiante de Gastronomía */}
                <div
                  className={`rounded-2xl border p-4 ${
                    loteEncontrado.estado === "vencido"
                      ? "border-rose-300 bg-rose-50 text-rose-950"
                      : loteEncontrado.estado === "proximo"
                      ? "border-amber-300 bg-amber-50 text-amber-950"
                      : "border-emerald-300 bg-emerald-50 text-emerald-950"
                  }`}
                >
                  <p className="text-xs font-extrabold uppercase">
                    Acción recomendada en cocina / bodega:
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {infoSemaforo.recomendacionBpm}
                  </p>
                  <p className="mt-2 text-xs font-semibold opacity-80">
                    Ubicación asignada: {loteEncontrado.producto.ubicacion}
                  </p>
                </div>

                {ultimoTextoQr && (
                  <p className="text-[11px] text-slate-500">
                    Última lectura procesada:{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                      {ultimoTextoQr}
                    </code>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

