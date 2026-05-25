# Blackwood Barber - Sistema de Gestión y Optimización Inteligente 💈

Plataforma inteligente SaaS premium para optimización de agenda de barberías, construida con **Next.js 14+ (App Router)**, **Supabase** y **TailwindCSS**.

## 🚀 Características Clave

### 1. Reservas de Clientes (Guiado & Premium)
- **Flujo en 3 pasos**: Selección de fecha, selección de hora recomendada por IA, y confirmación de pago.
- **Múltiples métodos de pago**: Nequi, Daviplata, Transferencia Bancaria, Efectivo y Más.
- **Datos de transferencia explícitos**: Cuentas Nequi/Daviplata visibles con indicador de valor mínimo de reserva ($5.000 COP).
- **Insignias Persuasivas**: Etiquetas inteligentes amigables como *"⭐ Horario preferido hoy"* y *"🔥 Alta demanda"*.

### 2. Panel Administrativo del Barbero
- **Dashboard Integral**: Ocupación diaria, continuidad, horas muertas e ingresos estimados.
- **Gestión Completa de Citas**: Visualización de citas en todos los estados (`pending`, `confirmed`, `completed`, `cancelled`), con capacidad de confirmar pagos o marcar cortes completados.
- **Vistas de Calendario**: Navegación por Día, Semana o Mes.
- **Reagendamiento y Edición**: Modal interactivo para cambiar la hora de inicio de las citas y visualizar el historial de visitas de un cliente según su número de teléfono.
- **IA de Optimización**: El sistema sugiere reubicar citas para compactar la agenda y permite enviar la propuesta directamente a WhatsApp.

### 3. Configuración Dinámica de Horarios
- Interfaz para definir la duración de slots (30, 40, 45, 60 min).
- Tiempos de comida/almuerzo parametrizables.
- Activación y definición de horarios específicos por cada día de la semana de forma independiente (ej. Lunes de 5 PM a 9 PM, Martes de 2 PM a 8 PM).

---

## 🛠️ Comenzando

### Prerrequisitos
- Node.js (v18+) e npm.

### Instalación local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Datos de Prueba (Simulador Integrado)
El proyecto cuenta con un sistema de fallback a Base de Datos en Memoria. Si no configuras las variables de entorno de Supabase, la aplicación funcionará de manera local interactiva lista para demostraciones:

- **Panel Admin**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Credenciales por defecto**:
  - Correo: `admin@barberia.com`
  - Contraseña: `admin123`

---

## 🔐 Configuración de Supabase (Producción)

Crea un archivo `.env.local` en la raíz e ingresa tus credenciales del proyecto de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

Ejecuta el script SQL del archivo `schema.sql` en el SQL Editor de tu consola Supabase para crear las tablas y las políticas de seguridad (RLS).
