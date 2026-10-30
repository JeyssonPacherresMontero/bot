# MaintAI · Panel de Administración y Supervisión de Mantenimiento

Sistema web en español para supervisores y administradores de mantenimiento de la central térmica de cogeneración de **Vaporsur Energía S.A.C. (Refinería Bahía Norte)**. Permite monitorear, validar, editar y analizar en tiempo real los reportes generados por los técnicos desde Telegram y procesados por el flujo de n8n con IA (Whisper + GPT-4o-mini).

---

## 🏗 Arquitectura y Flujo del Sistema

1. **Telegram**: El técnico envía un audio o mensaje de texto describiendo la avería, actividades y repuestos.
2. **n8n**: Transcribe con Whisper, extrae datos técnicos estructurados con IA y realiza un `INSERT` en la tabla `reportes` de Supabase con `estado = 'pendiente'`.
3. **Panel Web (Este Proyecto)**:
   - Lee datos vía Supabase Client con RLS aplicado bajo la `ANON KEY` y autenticación de Supabase.
   - Supervisores revisan, corrigen campos, agregan comentarios y cambian el estado a `revisado` o `rechazado`.
   - Soporte en tiempo real (Supabase Realtime) para inserciones y actualizaciones inmediatas sin recargar.
4. **Database Webhook en Supabase**:
   - Al cambiar a `revisado` o `rechazado`, Supabase dispara un Database Webhook al nodo `Webhook Panel` de n8n, el cual notifica de inmediato al técnico en Telegram.

---

## 🚀 Requisitos y Configuración de Entorno

### 1. Variables de Entorno (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

> ⚠️ **Importante sobre Seguridad**: Nunca expongas la `SERVICE_ROLE_KEY` en el cliente. Toda la seguridad descansa en Supabase Auth y las políticas de Row Level Security (RLS) del esquema de base de datos.

---

## 📦 Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build

# 4. Iniciar en modo producción
npm run start

# 5. Ejecutar linter
npm run lint
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🗄 Base de Datos y Supabase

El esquema SQL oficial está disponible en [`supabase/schema.sql`](supabase/schema.sql).

### Pasos en Supabase:
1. Dirígete a **Supabase > SQL Editor** y ejecuta el archivo completo `supabase/schema.sql`.
2. Para crear el **primer usuario administrador**:
   - En **Authentication > Users**, pulsa **Add User** (crea el email y contraseña).
   - En el SQL Editor, ejecuta:
     ```sql
     insert into public.perfiles (id, nombre, rol, activo)
     select id, 'Administrador Central', 'admin', true
     from auth.users where email = 'tu-correo@dominio.com';
     ```
3. Configura el **Database Webhook** para notificar a Telegram:
   - En **Database > Webhooks > Create**:
     - **Name**: `Aviso estado reporte a n8n`
     - **Table**: `public.reportes`
     - **Events**: `UPDATE`
     - **Type**: `HTTP Request (POST)`
     - **URL**: Production URL del nodo `Webhook Panel` de n8n (ej. `https://tu-n8n.com/webhook/maintai-estado`)
     - **Headers**: `x-webhook-secret: CAMBIA_ESTE_SECRETO` (el valor configurado en el nodo `Config` de n8n)

---

## 💻 Pantallas y Funcionalidades

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Público | Autenticación institucional con email y contraseña, verificación de perfil activo. |
| `/dashboard` | Supervisor / Admin | Tarjetas KPI de `v_kpi_resumen`, filtros de tiempo (Hoy, 7 días, 30 días, Histórico), 6 gráficos analíticos y lista rápida de reportes pendientes. |
| `/reportes` | Supervisor / Admin | Tabla paginada en servidor (25 por página), filtros avanzados, ordenación, acciones en lote ("Validar seleccionados"), exportación CSV con UTF-8 BOM, alertas Realtime y resaltado para casos demorados (>24h). |
| `/reportes/[id]` | Supervisor / Admin | Ficha técnica detallada, transcripción de audio/texto original y correcciones del técnico, formulario editable (equipo, tags, actividades dinámicas, tabla de repuestos), nivel de certeza IA, visor JSON crudo, acciones de validación, rechazo y panel de historial del mismo equipo. |
| `/equipos` | Supervisor / Admin | Resumen de activos de planta con total de fallas, duración media y fecha de última intervención. |
| `/equipos/[codigo]` | Supervisor / Admin | Línea de tiempo cronológica de intervenciones, análisis de fallas recurrentes y componentes más reemplazados. |
| `/tecnicos` | Solo Admin | CRUD de lista blanca de técnicos de Telegram (`usuarios_telegram`), conteo de reportes e instrucciones para obtener Chat ID vía `/start`. |
| `/usuarios` | Solo Admin | Gestión de supervisores y administradores (`perfiles`), activación/desactivación y guía de aprovisionamiento en Supabase Auth. |

---

## 🎨 Decisiones de Diseño y Arquitectura

1. **Paginación y Filtrado en Servidor**: El filtrado por texto libre (`ilike` en equipo, código, falla, técnico, OT y texto original) y por campos discretos se realiza directamente en Supabase con conteo exacto, garantizando tiempos de carga inferiores a 2 s con grandes volúmenes de datos.
2. **Soporte de Zonas Horarias**: Toda la visualización de fechas y horas está normalizada en la zona horaria `America/Lima` con formato `dd/mm/aaaa hh:mm` según los requerimientos operativos de la planta.
3. **Resaltado de Demoras (>24 horas)**: Los reportes en estado `pendiente` o `corregido` creados hace más de 24 horas se resaltan visualmente con una insignia de urgencia `+24h` y efecto pulsante.
4. **Exportación CSV Compatible con Excel**: El exportador inyecta automáticamente el caracter UTF-8 BOM (`\uFEFF`), permitiendo que Microsoft Excel abra el archivo con tildes y caracteres especiales en español sin requerir conversión de texto.
5. **Tema Claro y Oscuro**: Implementado mediante clases de Tailwind y persistencia en `localStorage`, ideal para turnos de noche o salas de control con baja luminosidad.
6. **Flujo de Realtime Desacoplado**: Se suscribe a los eventos `INSERT` y `UPDATE` de Postgres en la tabla `reportes` para alertar en tiempo real a los supervisores cuando ingresa un nuevo reporte desde Telegram.
