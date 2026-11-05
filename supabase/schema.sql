-- =============================================================================
-- PROYECTO MILLARAY — SISTEMA DE CONTROL DE VENCIMIENTOS QR (INACAP GASTRONOMÍA)
-- Esquema Relacional PostgreSQL + Políticas RLS (Solo Lectura Pública) + Semilla
-- Configurado para la Evaluación del Lunes (2 vencidos + desfases escalonados)
-- =============================================================================

-- 1. Extensiones requeridas
create extension if not exists "pgcrypto";

-- 2. Tabla de Productos Gastronómicos
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo_ean text not null unique,
  nombre text not null,
  marca text not null,
  categoria text not null,
  formato text not null,
  ubicacion text not null default 'Bodega Central - Taller Gastronomía',
  imagen_url text not null,
  imagen_remota_url text not null,
  fuente_imagen text not null default 'Open Food Facts (CC BY-SA 3.0)',
  url_ficha_off text not null,
  created_at timestamptz not null default now()
);

-- 3. Tabla Relacional de Lotes (con fechas de ingreso, vencimiento y código QR único)
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  codigo_lote text not null unique,
  producto_id uuid not null references public.productos(id) on delete cascade,
  cantidad numeric(10, 2) not null check (cantidad >= 0),
  unidad text not null default 'unidades',
  fecha_ingreso date not null default current_date,
  fecha_vencimiento date not null,
  observaciones text,
  created_at timestamptz not null default now(),
  constraint chk_fechas_validas check (fecha_vencimiento >= fecha_ingreso - interval '365 days')
);

-- 4. Índices de rendimiento (Foreign Keys y ordenamiento por fecha de vencimiento)
create index if not exists idx_lotes_producto_id on public.lotes(producto_id);
create index if not exists idx_lotes_fecha_vencimiento on public.lotes(fecha_vencimiento);
create index if not exists idx_productos_categoria on public.productos(categoria);

-- 5. Seguridad Row Level Security (RLS) — Acceso público ESTRICTAMENTE DE SOLO LECTURA
-- La administración (INSERT / UPDATE / DELETE) se realiza exclusivamente desde Supabase Table Editor.
alter table public.productos enable row level security;
alter table public.lotes enable row level security;

-- Permisos de esquema y tablas para el Data API (solo SELECT para anon y authenticated)
grant usage on schema public to anon, authenticated;
grant select on public.productos to anon, authenticated;
grant select on public.lotes to anon, authenticated;
revoke insert, update, delete, truncate on public.productos from anon, authenticated;
revoke insert, update, delete, truncate on public.lotes from anon, authenticated;

-- Políticas de lectura pública
drop policy if exists "Lectura publica de productos" on public.productos;
create policy "Lectura publica de productos"
  on public.productos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Lectura publica de lotes" on public.lotes;
create policy "Lectura publica de lotes"
  on public.lotes
  for select
  to anon, authenticated
  using (true);

-- =============================================================================
-- 6. DATOS DEMOSTRATIVOS INICIALES (Fotografías reales de Open Food Facts)
-- =============================================================================

insert into public.productos (
  id,
  codigo_ean,
  nombre,
  marca,
  categoria,
  formato,
  ubicacion,
  imagen_url,
  imagen_remota_url,
  fuente_imagen,
  url_ficha_off
) values
  (
    '11111111-1111-4111-8111-111111111101',
    '7802920777542',
    'Leche Entera Natural 100%',
    'Colun',
    'Lácteos y Refrigerados',
    '1 L',
    'Cámara Refrigerada N°1 — Estante Superior',
    '/productos/leche-colun-7802920777542.jpg',
    'https://images.openfoodfacts.org/images/products/780/292/077/7542/front_es.23.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/7802920777542'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    '8410179306148',
    'Vinagre Balsámico de Módena',
    'Borges',
    'Aceites, Vinagres y Aderezos',
    '250 ml',
    'Bodega Seca — Pasillo A2',
    '/productos/vinagre-borges-8410179306148.jpg',
    'https://images.openfoodfacts.org/images/products/841/017/930/6148/front_es.49.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/8410179306148'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    '8005121000085',
    'Spaghetti Ristorante N°8 Sémola Trigo Duro',
    'Divella',
    'Pastas, Arroces y Secos',
    '500 g',
    'Bodega Seca — Estantería B1',
    '/productos/spaghetti-divella-8005121000085.jpg',
    'https://images.openfoodfacts.org/images/products/800/512/100/0085/front_es.39.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/8005121000085'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    '8005121000276',
    'Penne Ziti Rigate N°27 Trigo Duro',
    'Divella',
    'Pastas, Arroces y Secos',
    '500 g',
    'Bodega Seca — Estantería B1',
    '/productos/penne-divella-8005121000276.jpg',
    'https://images.openfoodfacts.org/images/products/800/512/100/0276/front_it.43.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/8005121000276'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    '0021000026326',
    'Mayonesa Real Mayo Creamy & Smooth',
    'Kraft',
    'Aceites, Vinagres y Aderezos',
    '887 ml',
    'Cámara Refrigerada N°2 — Puerta Lateral',
    '/productos/mayonesa-kraft-0021000026326.jpg',
    'https://images.openfoodfacts.org/images/products/002/100/002/6326/front_es.40.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/0021000026326'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    '8410109050882',
    'Chocolate Negro 70% Cacao Repostería',
    'Valor',
    'Repostería y Pastelería',
    '100 g',
    'Taller de Pastelería — Gabinete C1',
    '/productos/chocolate-valor-8410109050882.jpg',
    'https://images.openfoodfacts.org/images/products/841/010/905/0882/front_es.61.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/8410109050882'
  ),
  (
    '11111111-1111-4111-8111-111111111107',
    '7798151952332',
    'Pasta de Maní 100% Natural Alto Oleico',
    'Maní King',
    'Repostería y Pastelería',
    '485 g',
    'Taller de Pastelería — Gabinete C2',
    '/productos/pasta-mani-7798151952332.jpg',
    'https://images.openfoodfacts.org/images/products/779/815/195/2332/front_es.99.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/7798151952332'
  ),
  (
    '11111111-1111-4111-8111-111111111108',
    '8412170011434',
    'Galletas María Sin Gluten ni Lactosa',
    'Santiveri Noglut',
    'Repostería y Pastelería',
    '180 g',
    'Taller de Pastelería — Estante Sin Alérgenos',
    '/productos/galletas-maria-8412170011434.jpg',
    'https://images.openfoodfacts.org/images/products/841/217/001/1434/front_es.68.400.jpg',
    'Open Food Facts (CC BY-SA 3.0)',
    'https://cl.openfoodfacts.org/producto/8412170011434'
  )
on conflict (codigo_ean) do update set
  nombre = excluded.nombre,
  marca = excluded.marca,
  categoria = excluded.categoria,
  formato = excluded.formato,
  ubicacion = excluded.ubicacion,
  imagen_url = excluded.imagen_url,
  imagen_remota_url = excluded.imagen_remota_url,
  fuente_imagen = excluded.fuente_imagen,
  url_ficha_off = excluded.url_ficha_off;

-- =============================================================================
-- 7. LOTES CON DESFASES ESCALONADOS PARA EVALUACIÓN DEL LUNES (09/11/2026)
-- Exactamente 2 lotes VENCIDOS (Rojo), 3 PRÓXIMOS A VENCER (Amarillo) y 5 VIGENTES (Verde)
-- =============================================================================

delete from public.lotes;

insert into public.lotes (
  id,
  codigo_lote,
  producto_id,
  cantidad,
  unidad,
  fecha_ingreso,
  fecha_vencimiento,
  observaciones
) values
  -- 1) EXACTAMENTE 2 LOTES VENCIDOS (LUZ ROJA)
  (
    '22222222-2222-4222-8222-222222222204',
    'LOT-2026-COL-00',
    '11111111-1111-4111-8111-111111111101',
    4,
    'cajas 1 L',
    '2026-10-01',
    '2026-10-29',
    'DESFASE CRÍTICO (-11 días al lunes): BLOQUEADO PARA USO GASTRONÓMICO. Separar en área de merma según protocolo BPM.'
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'LOT-2026-MKG-01',
    '11111111-1111-4111-8111-111111111107',
    3,
    'frascos 485 g',
    '2026-08-15',
    '2026-11-02',
    'DESFASE VENCIDO (-7 días al lunes): Vencido en estantería de pastelería. No utilizar en preparaciones.'
  ),

  -- 2) 3 LOTES PRÓXIMOS A VENCER CON DESFASES ESCALONADOS (LUZ AMARILLA)
  (
    '22222222-2222-4222-8222-222222222203',
    'LOT-2026-SAN-01',
    '11111111-1111-4111-8111-111111111108',
    10,
    'paquetes 180 g',
    '2026-09-25',
    '2026-11-10',
    'DESFASE CORTO (+1 día desde el lunes de evaluación): Prioridad FEFO inmediata en bases de pastelería sin gluten.'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    'LOT-2026-COL-01',
    '11111111-1111-4111-8111-111111111101',
    18,
    'cajas 1 L',
    '2026-10-18',
    '2026-11-11',
    'DESFASE MEDIO (+2 días desde el lunes de evaluación): Priorizar uso en taller de salsas madres y crema pastelera (FEFO).'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'LOT-2026-KRA-01',
    '11111111-1111-4111-8111-111111111105',
    6,
    'frascos 887 ml',
    '2026-10-12',
    '2026-11-12',
    'DESFASE PREVENTIVO (+3 días desde el lunes de evaluación): Lote en cuarto frío, consumir antes del cierre semanal.'
  ),

  -- 3) 5 LOTES VIGENTES CON DESFASES ESCALONADOS DE 15 DÍAS A 6 MESES (LUZ VERDE)
  (
    '22222222-2222-4222-8222-222222222210',
    'LOT-2026-COL-02',
    '11111111-1111-4111-8111-111111111101',
    40,
    'cajas 1 L',
    '2026-11-02',
    '2026-11-24',
    'DESFASE QUINCENAL (+15 días desde el lunes): Lote UHT de reposición. Usar después de agotar LOT-2026-COL-01.'
  ),
  (
    '22222222-2222-4222-8222-222222222209',
    'LOT-2026-VAL-70',
    '11111111-1111-4111-8111-111111111106',
    24,
    'tabletas 100 g',
    '2026-10-20',
    '2026-12-10',
    'DESFASE MENSUAL (+1 mes): Mantener entre 15°C y 18°C para chocolatería fina.'
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'LOT-2026-BOR-01',
    '11111111-1111-4111-8111-111111111102',
    12,
    'botellas 250 ml',
    '2026-10-15',
    '2027-01-15',
    'DESFASE BIMESTRAL (+2 meses): Óptimas condiciones de almacenamiento en bodega seca.'
  ),
  (
    '22222222-2222-4222-8222-222222222208',
    'LOT-2026-DIV-27',
    '11111111-1111-4111-8111-111111111104',
    28,
    'paquetes 500 g',
    '2026-10-25',
    '2027-03-15',
    'DESFASE CUATRIMESTRAL (+4 meses): Almacenado en contenedor hermético rotulado.'
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    'LOT-2026-DIV-08',
    '11111111-1111-4111-8111-111111111103',
    35,
    'paquetes 500 g',
    '2026-10-25',
    '2027-05-20',
    'DESFASE SEMESTRAL (+6 meses): Stock principal para módulo de Cocina Italiana e Internacional.'
  );
