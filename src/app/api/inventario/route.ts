import { NextResponse } from "next/server";
import { obtenerInventario } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const resultado = await obtenerInventario();
  return NextResponse.json(resultado, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

