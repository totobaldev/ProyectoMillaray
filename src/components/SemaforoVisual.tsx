"use client";

import React from "react";
import { EstadoSemaforo } from "@/types/inventory";

interface SemaforoVisualProps {
  estado: EstadoSemaforo;
  tamano?: "sm" | "md" | "lg" | "xl";
  mostrarEtiqueta?: boolean;
  animado?: boolean;
}

const CONFIG_SEMAFORO: Record<
  EstadoSemaforo,
  {
    imagenCompleta: string;
    imagenLuz: string;
    titulo: string;
    subtitulo: string;
    badgeClass: string;
  }
> = {
  vigente: {
    imagenCompleta: "/images/semaforo-verde.png",
    imagenLuz: "/images/semaforo-luz-verde.png",
    titulo: "VIGENTE",
    subtitulo: "Luz Verde — Apto para uso",
    badgeClass:
      "bg-emerald-50 text-emerald-900 border-emerald-300 ring-emerald-500/20",
  },
  proximo: {
    imagenCompleta: "/images/semaforo-amarillo.png",
    imagenLuz: "/images/semaforo-luz-amarilla.png",
    titulo: "PRÓXIMO A VENCER",
    subtitulo: "Luz Amarilla — Prioridad FEFO (≤ 7 días)",
    badgeClass:
      "bg-amber-50 text-amber-950 border-amber-300 ring-amber-500/20",
  },
  vencido: {
    imagenCompleta: "/images/semaforo-rojo.png",
    imagenLuz: "/images/semaforo-luz-roja.png",
    titulo: "VENCIDO",
    subtitulo: "Luz Roja — Bloqueado / Merma",
    badgeClass: "bg-rose-50 text-rose-950 border-rose-300 ring-rose-500/20",
  },
};

const DIMENSIONES = {
  sm: "h-16 w-auto",
  md: "h-24 w-auto",
  lg: "h-36 w-auto",
  xl: "h-48 w-auto",
};

/**
 * Componente de Semáforo Sanitario que utiliza EXCLUSIVAMENTE los recursos PNG
 * oficiales entregados en /public/images/semaforo-*.png.
 */
export default function SemaforoVisual({
  estado,
  tamano = "md",
  mostrarEtiqueta = false,
  animado = true,
}: SemaforoVisualProps) {
  const cfg = CONFIG_SEMAFORO[estado];

  return (
    <div className="inline-flex flex-col items-center gap-2 select-none">
      <div className="relative inline-flex items-center justify-center">
        {/* Imagen PNG base + estado del semáforo */}
        <img
          src={cfg.imagenCompleta}
          alt={`Semáforo sanitario en estado ${cfg.titulo}`}
          className={`${DIMENSIONES[tamano]} object-contain drop-shadow-md`}
          loading="eager"
        />
        {/* Capa PNG de luz activa superpuesta para resaltar el brillo real del PNG */}
        {animado && (
          <img
            src={cfg.imagenLuz}
            alt=""
            aria-hidden="true"
            className={`${DIMENSIONES[tamano]} pointer-events-none absolute inset-0 object-contain animate-pulse`}
          />
        )}
      </div>

      {mostrarEtiqueta && (
        <div
          className={`rounded-xl border px-3 py-1 text-center ring-2 ${cfg.badgeClass}`}
        >
          <p className="text-xs font-extrabold tracking-wide uppercase">
            {cfg.titulo}
          </p>
          <p className="text-[11px] font-medium opacity-85">{cfg.subtitulo}</p>
        </div>
      )}
    </div>
  );
}

