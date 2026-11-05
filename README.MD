# Prototipo Web: Sistema de Control de Vencimientos QR (Gastronomía INACAP)

Vamos a desarrollar un prototipo funcional, pensado para que las integrantes de Gastronomía puedan utilizarlo sin conocimientos informáticos. La aplicación tendrá inventario, fotografías reales de productos, códigos QR individuales por lote y un semáforo que indique cuándo un alimento está próximo a vencer.

## 1. Stack tecnológico definitivo

| Componente | Tecnología |
| --- | --- |
| Frontend y backend | Next.js (App Router) + TypeScript |
| Diseño | Tailwind CSS + Lucide React |
| Base de datos | PostgreSQL en Supabase (`ProyectoMillaray`) |
| Seguridad de datos | Row Level Security (RLS) — Lectura pública (`SELECT`) y administración desde Supabase Table Editor |
| Hosting del prototipo | Vercel |
| Generador QR | `qrcode` (PNG descargable + etiqueta para envase) |
| Escáner con cámara | `html5-qrcode` (Cámara en vivo + lectura desde archivo PNG) |
| Imágenes de productos | Fotografías reales de envases desde Open Food Facts (`CC BY-SA 3.0`) |
| Validaciones | `Zod` |
| Repositorio | GitHub |

Esta arquitectura evita mantener un servidor tradicional y permite trabajar con una base de datos relacional alojada en la nube.

Sobre las fotografías: usamos imágenes de envases reales, nunca productos inventados mediante SVG o IA. Para las fotografías obtenidas de Open Food Facts se conserva la atribución (`CC BY-SA 3.0`) y el enlace directo a su ficha oficial.

Vercel Hobby servirá para el prototipo académico personal de la asignatura **Proyecto Integrado de Gastronomía (INACAP)**. Para una utilización comercial por parte de una empresa gastronómica será necesario revisar otro plan o proveedor, porque Hobby restringe el uso comercial.

---

## 2. Funcionalidades implementadas

1. **Dashboard con estadísticas en tiempo real**: Resumen de lotes totales, vigentes (Luz Verde), próximos a vencer en ≤ 7 días (Luz Amarilla) y vencidos (Luz Roja).
2. **Semáforo visual oficial en PNG**: Utiliza exclusivamente los recursos gráficos entregados en `public/images/semaforo-*.png` (`semaforo-verde.png`, `semaforo-amarillo.png`, `semaforo-rojo.png`, `semaforo-base.png` y capas de luz `semaforo-luz-*.png`).
3. **Inventario con fotografías reales**: Catálogo de insumos gastronómicos con fotos reales de Open Food Facts en `public/productos/` y respaldo remoto.
4. **Base de datos relacional sencilla (`productos` y `lotes`)**: Esquema completo en `supabase/schema.sql` con políticas RLS de solo lectura pública (`SELECT` para `anon`) sin exponer claves privadas ni habilitar escrituras públicas.
5. **Generación y descarga de códigos QR por lote**: Genera tanto el código QR individual en formato PNG como una etiqueta imprimible para adherir al envase gastronómico.
6. **Escáner QR óptico y consulta de estado**: Permite escanear con la cámara del celular/computador, subir una imagen PNG de un QR o simular la lectura de cualquier lote en aula.
7. **Registro validado con Zod + Generador SQL**: Permite registrar y validar lotes durante la demostración y genera automáticamente la sentencia SQL lista para pegar en Supabase.

---

## 3. Configuración paso a paso con Supabase (`ProyectoMillaray`) y Vercel

### Paso 1: Crear las tablas y cargar datos iniciales en Supabase
1. Entra a tu proyecto **ProyectoMillaray** en [Supabase Dashboard](https://supabase.com/dashboard).
2. Abre **SQL Editor** en el menú izquierdo y haz clic en **New Query**.
3. Copia todo el contenido del archivo [`supabase/schema.sql`](./supabase/schema.sql), pégalo en el editor y presiona **Run**.
4. Verifica en **Table Editor** que ya existen las tablas `productos` (8 productos reales) y `lotes` (10 lotes en estados verde, amarillo y rojo). Desde **Table Editor** puedes agregar, editar o eliminar filas en cualquier momento.

### Paso 2: Configurar las variables de entorno
1. En Supabase Dashboard ve a **Project Settings → Data API / API Keys**.
2. Copia el **Project URL** y la clave pública **anon / publishable key**.
3. En la raíz del proyecto crea un archivo `.env.local` (guiándote por `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-id-de-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-o-publishable
```

*(Nota: Si aún no defines `.env.local`, la aplicación inicia automáticamente con el catálogo demostrativo de respaldo para que siempre funcione en local).*

### Paso 3: Ejecutar en local y desplegar en Vercel
```bash
npm install
npm run dev
```
En **Vercel**, importa el repositorio desde GitHub y agrega las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Settings → Environment Variables**.
