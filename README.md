# StrikePool 🎱

App de reservas para bar de billar. Permite a los clientes ver la disponibilidad en tiempo real y reservar mesas, y al dueño gestionar las reservas desde un panel de administración.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** — base de datos PostgreSQL, autenticación y Realtime
- **Resend** — envío de emails de confirmación y recordatorio
- **Azure Static Web Apps** — hosting objetivo

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Resend](https://resend.com)

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/strikepool.git
cd strikepool

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus claves
```

## Configuración de Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
3. En **Authentication → Providers**, asegúrate de que Email está habilitado.
4. Crea el usuario administrador en **Authentication → Users → Invite user**.
5. Copia las claves de **Settings → API** en tu `.env.local`.

## Configuración de Resend

1. Crea una cuenta en [resend.com](https://resend.com).
2. Añade y verifica tu dominio (o usa el dominio de prueba).
3. Crea una API Key y cópiala en `.env.local` como `RESEND_API_KEY`.
4. Actualiza `RESEND_FROM_EMAIL` con una dirección de tu dominio verificado.

## Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para la vista de clientes.  
El panel de administración está en [http://localhost:3000/admin](http://localhost:3000/admin).

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Página pública (vista de mesas)
│   ├── PublicView.tsx        # Componente cliente de la vista pública
│   ├── login/page.tsx        # Login de administrador
│   ├── admin/
│   │   ├── layout.tsx        # Layout protegido (verifica sesión)
│   │   ├── page.tsx          # Panel de admin (Server Component)
│   │   └── AdminView.tsx     # Componente cliente del panel
│   ├── api/
│   │   ├── reservas/         # CRUD de reservas
│   │   ├── mesas/[id]/       # Actualizar estado de mesa
│   │   ├── bloqueos/         # Bloqueos de horarios
│   │   ├── emails/           # Envío de emails
│   │   └── auth/signout/     # Cerrar sesión
│   └── auth/callback/        # Callback OAuth de Supabase
├── components/
│   ├── MesaGrid.tsx          # Grid con Realtime
│   ├── MesaCard.tsx          # Tarjeta individual de mesa
│   ├── ReservaForm.tsx       # Formulario de reserva (cliente)
│   └── admin/
│       ├── ReservasList.tsx  # Lista de reservas del día
│       ├── WeeklyCalendar.tsx# Calendario semanal
│       └── BloqueoModal.tsx  # Modal para bloquear horarios
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Cliente browser
│   │   └── server.ts         # Cliente server-side
│   └── email.ts              # Funciones Resend
├── middleware.ts              # Protección de rutas /admin
└── types/index.ts            # Tipos TypeScript compartidos
supabase/
└── schema.sql                # Esquema completo de la base de datos
```

## Despliegue en Azure Static Web Apps

1. Conecta el repositorio de GitHub a un recurso de Azure Static Web Apps.
2. Configura el workflow de GitHub Actions con:
   - **App location**: `/`
   - **Output location**: `.next`
   - **Build command**: `npm run build`
3. Añade las variables de entorno en **Configuration → Application settings**.
4. El archivo `staticwebapp.config.json` ya está incluido con las cabeceras de seguridad.

## Variables de entorno en producción

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `RESEND_API_KEY` | API Key de Resend |
| `RESEND_FROM_EMAIL` | Email remitente verificado |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (sin barra final) |

## Recordatorios automáticos

Los recordatorios 1 hora antes de la reserva se envían llamando a `POST /api/emails` con `{ type: "recordatorio", reservaId: "..." }`.

Para automatizarlo, configura un **cron job** (Supabase Edge Functions, Azure Functions, o GitHub Actions) que cada hora:
1. Consulte las reservas confirmadas cuya `hora_inicio` sea dentro de 1 hora.
2. Llame a `POST /api/emails` por cada una.

Ejemplo de query SQL para el cron:
```sql
SELECT id FROM reservas
WHERE estado = 'confirmada'
  AND email IS NOT NULL
  AND fecha = CURRENT_DATE
  AND hora_inicio = (NOW() + INTERVAL '1 hour')::time(0);
```
