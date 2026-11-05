import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Control de Vencimientos QR — Gastronomía INACAP",
  description:
    "Prototipo web para control de inventario gastronómico, códigos QR individuales por lote y semáforo visual de vencimientos con fotografías reales de Open Food Facts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}

