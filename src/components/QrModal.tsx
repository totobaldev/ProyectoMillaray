"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  Download,
  ExternalLink,
  MapPin,
  Package,
  QrCode,
  Tag,
  X,
} from "lucide-react";
import { calcularEstadoSemaforo, LoteConProducto } from "@/types/inventory";
import SemaforoVisual from "./SemaforoVisual";

interface QrModalProps {
  lote: LoteConProducto | null;
  onClose: () => void;
}

function cargarImagenCanvas(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src}`));
    img.src = src;
  });
}

export default function QrModal({ lote, onClose }: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [urlInspeccion, setUrlInspeccion] = useState<string>("");
  const [descargandoEtiqueta, setDescargandoEtiqueta] = useState(false);

  useEffect(() => {
    if (!lote) return;
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://semaforo-vencimientos-qr-khaki.vercel.app";
    const targetUrl = `${base}/?lote=${encodeURIComponent(lote.codigo_lote)}`;
    setUrlInspeccion(targetUrl);

    QRCode.toDataURL(targetUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generando QR:", err));
  }, [lote]);

  if (!lote) return null;

  const infoSemaforo = calcularEstadoSemaforo(lote.fecha_vencimiento);

  const descargarQrPngSimple = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR-${lote.codigo_lote}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Genera un archivo PNG imprimible que incluye:
   * - Código QR del lote
   * - Fotografía real del producto gastronómico
   * - Semáforo sanitario PNG
   * - Fechas de ingreso, vencimiento y desfase
   */
  const descargarEtiquetaCompletaPng = async () => {
    if (!qrDataUrl) return;
    setDescargandoEtiqueta(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 610;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fondo blanco y marco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      // Franja superior institucional
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(16, 16, canvas.width - 32, 66);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(
        "MUESTRA QR IMPRIMIBLE CON FOTO DE PRODUCTO — GASTRONOMÍA INACAP",
        36,
        56
      );

      // Franja de color según estado del semáforo
      const colorEstado =
        lote.estado === "vencido"
          ? "#be123c"
          : lote.estado === "proximo"
          ? "#b45309"
          : "#047857";
      ctx.fillStyle = colorEstado;
      ctx.fillRect(16, 82, canvas.width - 32, 46);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 19px sans-serif";
      ctx.fillText(
        `${infoSemaforo.etiqueta.toUpperCase()}   |   LOTE: ${lote.codigo_lote}`,
        36,
        112
      );

      // 1. Dibujar QR a la izquierda
      const qrImg = await cargarImagenCanvas(qrDataUrl);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(34, 150, 340, 340);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(34, 150, 340, 340);
      ctx.drawImage(qrImg, 44, 160, 320, 320);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(`ESCANEAR QR: ${lote.codigo_lote}`, 62, 518);

      // 2. Dibujar Fotografía Real del Producto al centro
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(394, 150, 250, 340);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(394, 150, 250, 340);

      try {
        const prodImg = await cargarImagenCanvas(lote.producto.imagen_url);
        const ratio = Math.min(220 / prodImg.width, 310 / prodImg.height);
        const pw = prodImg.width * ratio;
        const ph = prodImg.height * ratio;
        const px = 394 + (250 - pw) / 2;
        const py = 150 + (340 - ph) / 2;
        ctx.drawImage(prodImg, px, py, pw, ph);
      } catch {
        // Fallback si no carga imagen
      }

      ctx.fillStyle = "#475569";
      ctx.font = "15px sans-serif";
      ctx.fillText("FOTO REAL ENVASE (OFF)", 418, 518);

      // 3. Textos a la derecha
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(lote.producto.categoria.toUpperCase(), 668, 174);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 25px sans-serif";
      const nombreCorto =
        lote.producto.nombre.length > 28
          ? lote.producto.nombre.slice(0, 28) + "..."
          : lote.producto.nombre;
      ctx.fillText(nombreCorto, 668, 208);

      ctx.fillStyle = "#334155";
      ctx.font = "19px sans-serif";
      ctx.fillText(
        `Marca: ${lote.producto.marca}  |  Formato: ${lote.producto.formato}`,
        668,
        240
      );

      // Caja de código de lote
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(668, 258, 387, 56);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(668, 258, 387, 56);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 24px monospace";
      ctx.fillText(`LOTE: ${lote.codigo_lote}`, 686, 294);

      // Fechas de ingreso y vencimiento
      ctx.fillStyle =
        lote.estado === "vencido"
          ? "#fff1f2"
          : lote.estado === "proximo"
          ? "#fffbeb"
          : "#ecfdf5";
      ctx.fillRect(668, 330, 387, 98);
      ctx.strokeStyle = colorEstado;
      ctx.strokeRect(668, 330, 387, 98);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`Fecha Ingreso:      ${lote.fecha_ingreso}`, 686, 362);

      ctx.fillStyle = colorEstado;
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`Vencimiento: ${lote.fecha_vencimiento}`, 686, 402);

      // 4. Semáforo PNG a la derecha
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(1075, 154, 129, 274);
      try {
        const semImg = await cargarImagenCanvas(infoSemaforo.imagenSemaforoPng);
        const sRatio = Math.min(115 / semImg.width, 254 / semImg.height);
        const sw = semImg.width * sRatio;
        const sh = semImg.height * sRatio;
        const sx = 1075 + (129 - sw) / 2;
        const sy = 154 + (274 - sh) / 2;
        ctx.drawImage(semImg, sx, sy, sw, sh);
      } catch {
        // Ignorar si falla
      }

      // Franja de desfase / observación
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(668, 444, 536, 50);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 15px sans-serif";
      const obsCorta = (lote.observaciones || infoSemaforo.etiqueta).slice(
        0,
        58
      );
      ctx.fillText(obsCorta, 684, 475);

      ctx.fillStyle = "#64748b";
      ctx.font = "15px sans-serif";
      ctx.fillText(urlInspeccion, 668, 524);

      const pngEtiqueta = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngEtiqueta;
      link.download = `Muestra-QR-Foto-${lote.codigo_lote}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDescargandoEtiqueta(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-qr-titulo"
    >
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 id="modal-qr-titulo" className="text-lg font-bold">
                Ficha de Lote y Muestra QR con Imagen de Producto
              </h2>
              <p className="text-xs text-slate-300">
                Código único:{" "}
                <span className="font-mono font-bold text-amber-300">
                  {lote.codigo_lote}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="grid gap-6 p-6 md:grid-cols-12">
          {/* Columna Izquierda: QR + Semáforo PNG */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-5">
            <div className="flex w-full items-center justify-around gap-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Código QR del lote ${lote.codigo_lote}`}
                  className="h-44 w-44 rounded-xl border border-slate-300 bg-white p-2 shadow-xs"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                  Generando QR...
                </div>
              )}

              <SemaforoVisual
                estado={lote.estado}
                tamano="lg"
                mostrarEtiqueta={false}
              />
            </div>

            <div className="mt-4 w-full text-center">
              <span
                className={`inline-block rounded-full px-3.5 py-1 text-xs font-extrabold tracking-wide uppercase ${
                  lote.estado === "vencido"
                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                    : lote.estado === "proximo"
                    ? "bg-amber-100 text-amber-950 border border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                }`}
              >
                {infoSemaforo.etiqueta}
              </span>
              <p className="mt-2 font-mono text-xs font-semibold text-slate-600">
                {lote.codigo_lote}
              </p>
            </div>

            {/* Botones de Descarga PNG */}
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={descargarEtiquetaCompletaPng}
                disabled={descargandoEtiqueta}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
              >
                <Tag className="h-4 w-4 text-amber-400" />
                {descargandoEtiqueta
                  ? "Generando ficha PNG..."
                  : "Descargar QR con Foto de Producto (PNG)"}
              </button>

              <button
                type="button"
                onClick={descargarQrPngSimple}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Descargar solo QR (PNG)
              </button>
            </div>
          </div>

          {/* Columna Derecha: Datos del Producto + Fechas + Fotografía Real */}
          <div className="flex flex-col justify-between space-y-4 md:col-span-7">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <img
                src={lote.producto.imagen_url}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== lote.producto.imagen_remota_url) {
                    target.src = lote.producto.imagen_remota_url;
                  }
                }}
                alt={lote.producto.nombre}
                className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1.5"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {lote.producto.categoria}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  {lote.producto.nombre}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Marca:{" "}
                  <span className="text-slate-900">{lote.producto.marca}</span> ·
                  Formato:{" "}
                  <span className="text-slate-900">{lote.producto.formato}</span>
                </p>
                <a
                  href={lote.producto.url_ficha_off}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                >
                  Fotografía real: {lote.producto.fuente_imagen} (EAN{" "}
                  {lote.producto.codigo_ean})
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Fechas y Cantidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  Fecha de Ingreso
                </div>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {lote.fecha_ingreso}
                </p>
              </div>

              <div
                className={`rounded-xl border p-3.5 ${
                  lote.estado === "vencido"
                    ? "border-rose-300 bg-rose-50"
                    : lote.estado === "proximo"
                    ? "border-amber-300 bg-amber-50"
                    : "border-emerald-300 bg-emerald-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase opacity-80">
                  <Calendar className="h-3.5 w-3.5" />
                  Fecha de Vencimiento
                </div>
                <p className="mt-1 text-base font-extrabold text-slate-900">
                  {lote.fecha_vencimiento}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                  <Package className="h-3.5 w-3.5 text-slate-600" />
                  Cantidad en Stock
                </div>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {lote.cantidad} {lote.unidad}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                  <MapPin className="h-3.5 w-3.5 text-slate-600" />
                  Ubicación en Taller
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900">
                  {lote.producto.ubicacion}
                </p>
              </div>
            </div>

            {/* Recomendación BPM según Semáforo */}
            <div
              className={`rounded-2xl border p-4 ${
                lote.estado === "vencido"
                  ? "border-rose-300 bg-rose-50/90 text-rose-950"
                  : lote.estado === "proximo"
                  ? "border-amber-300 bg-amber-50/90 text-amber-950"
                  : "border-emerald-300 bg-emerald-50/90 text-emerald-950"
              }`}
            >
              <p className="text-xs font-extrabold tracking-wide uppercase">
                Dictamen Sanitario y Desfase de Evaluación:
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed">
                {infoSemaforo.recomendacionBpm}
              </p>
              {lote.observaciones && (
                <p className="mt-2 border-t border-current/15 pt-2 text-xs font-semibold opacity-95">
                  {lote.observaciones}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2 text-[11px] text-slate-600">
              URL codificada en el QR:{" "}
              <span className="font-mono font-semibold text-slate-800 break-all">
                {urlInspeccion}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
