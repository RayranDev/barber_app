Quiero que desarrolles una aplicación web completa e inteligente para gestión de barberías usando:

- Frontend: Next.js 14+ (App Router)
- Backend: Supabase
- Base de datos: PostgreSQL (Supabase)
- Hosting: Vercel
- Notificaciones WhatsApp: OpenWA
- Estilos: TailwindCSS
- Autenticación: Supabase Auth
- Deployment: Vercel
- Todo inicialmente GRATUITO
- Arquitectura escalable para futuro VPS

NO quiero código simple de ejemplo.
Quiero arquitectura profesional, modular, escalable y lista para producción MVP.

La aplicación debe ser completamente responsive y mobile-first.

# 🎯 OBJETIVO PRINCIPAL

La aplicación NO debe ser solo una agenda.

Debe ser:

- una plataforma inteligente de optimización de agenda para barberías,
- capaz de reducir tiempos muertos,
- aumentar continuidad de citas,
- recomendar horarios,
- calcular probabilidades de confirmación,
- y ayudar al barbero a compactar su agenda.

La app debe pensar como un sistema operacional inteligente.

---

# 💈 CONCEPTO CENTRAL

Cada cita dura aproximadamente:
- 40 minutos

El barbero define:
- hora inicio,
- hora fin,
- duración de slots,
- descansos,
- días laborales.

La app debe generar automáticamente los horarios disponibles.

Ejemplo:

Horario:
- 5 PM → 9 PM

Duración:
- 40 minutos

Slots generados:
- 5:00 PM
- 5:40 PM
- 6:20 PM
- 7:00 PM
- 7:40 PM
- 8:20 PM

NO permitir horarios arbitrarios.

TODO debe basarse en bloques inteligentes.

---

# 🧠 FUNCIÓN MÁS IMPORTANTE

# MOTOR DE OPTIMIZACIÓN DE AGENDA

La app debe:

- detectar huecos muertos,
- recomendar mejores horarios,
- sugerir mover clientes,
- aumentar continuidad,
- mejorar ocupación.

Ejemplo:

Si existe:
- una cita a las 6 PM
- y otra a las 9 PM

La app debe detectar:
- baja eficiencia operativa.

Y sugerir:
- mover el cliente de las 9 PM hacia las 6:40 PM o 7 PM.

---

# 🧠 PROBABILIDAD DE CONFIRMACIÓN

La app debe calcular:
- probabilidad de aceptación,
- probabilidad de confirmación,
- probabilidad de asistencia.

Factores:

1. Cercanía entre citas
2. Historial del cliente
3. Horarios premium
4. Tiempo muerto generado
5. Horarios más demandados
6. Nivel de ocupación del día

Mientras más juntas estén las citas:
- mayor probabilidad.

Mientras más huecos:
- menor probabilidad.

---

# 📱 EXPERIENCIA DEL CLIENTE

El cliente debe poder:

- seleccionar fecha,
- visualizar horarios,
- ver horarios recomendados,
- ver etiquetas inteligentes,
- subir comprobante,
- recibir confirmaciones.

---

# 🏷️ ETIQUETAS INTELIGENTES

Mostrar mensajes como:

- “⭐ Horario recomendado”
- “🔥 Alta probabilidad de confirmación”
- “⚡ Confirmación rápida”
- “🕒 Atención más puntual”
- “📈 Horario preferido hoy”

NO mostrar mensajes internos como:
- “este horario deja menos huecos”.

La UX debe sentirse:
- elegante,
- premium,
- inteligente,
- moderna.

---

# 📊 ESTADOS DE LOS SLOTS

Cada slot puede estar:

- disponible
- ocupado
- recomendado
- premium
- pendiente
- confirmado
- reubicable
- baja eficiencia

---

# 💳 SISTEMA DE PAGOS

Inicialmente:
- pagos manuales.

El cliente:
- transfiere dinero,
- sube comprobante,
- espera validación manual.

El barbero:
- aprueba,
- rechaza,
- libera slots automáticamente.

Usar:
- Supabase Storage
- OpenWA para notificaciones

---

# 📲 WHATSAPP

Usar OpenWA inicialmente.

La app debe enviar:

- confirmación de cita,
- recordatorios,
- cancelaciones,
- validaciones,
- cambios de horario.

Todo inicialmente gratuito.

Arquitectura preparada para:
- migrar luego a VPS,
- migrar luego a WhatsApp Business API.

---

# 🔐 AUTENTICACIÓN

Usar:
- Supabase Auth

Clientes:
- NO necesitan login obligatorio.

Barbero:
- login protegido.

---

# 📊 DASHBOARD DEL BARBERO

Debe existir un dashboard inteligente con:

- agenda diaria,
- vista semanal,
- ocupación,
- tiempos muertos,
- eficiencia,
- clientes,
- ingresos,
- sugerencias de optimización,
- citas reubicables.

---

# 📈 MÉTRICAS IMPORTANTES

Mostrar:

- índice de continuidad,
- nivel de ocupación,
- horas muertas,
- productividad,
- tasa de confirmación,
- cancelaciones,
- horarios premium,
- horarios más aceptados.

---

# 🧠 MODO IA + MANUAL

La IA:
- recomienda,
- analiza,
- sugiere.

Pero el barbero decide.

NO automatizar completamente decisiones críticas.

---

# 🏗️ ARQUITECTURA

Quiero que desarrolles:

1. estructura completa de carpetas
2. arquitectura frontend
3. arquitectura backend
4. diseño base de datos
5. endpoints API
6. sistema de slots
7. lógica de optimización
8. lógica de recomendación
9. dashboard
10. flujos UX/UI
11. componentes reutilizables
12. sistema de notificaciones
13. sistema de validación de pagos
14. middleware
15. seguridad
16. manejo de estados
17. esquema completo Supabase
18. migraciones SQL
19. políticas RLS
20. integración Vercel
21. integración OpenWA
22. variables de entorno
23. estrategia de despliegue gratuito
24. arquitectura preparada para escalar a VPS

---

# 🚀 IMPORTANTE

Quiero:
- código limpio,
- arquitectura enterprise,
- separación modular,
- clean architecture,
- buenas prácticas,
- tipado estricto,
- escalabilidad.

---

# 🎨 DISEÑO

Quiero diseño:
- moderno,
- minimalista,
- premium,
- elegante,
- oscuro,
- estilo SaaS moderno,
- muy visual.

Inspiraciones:
- Linear
- Stripe
- Notion
- Calendly
- Shopify

---

# 📱 MOBILE FIRST

La experiencia móvil es PRIORIDAD.

La mayoría de usuarios usarán:
- celular.

---

# ⚡ STACK OBLIGATORIO

Frontend:
- Next.js 14
- TypeScript
- TailwindCSS
- Shadcn UI

Backend:
- Supabase
- PostgreSQL
- Edge Functions si son necesarias

Infraestructura:
- Vercel
- OpenWA

---

# 🚫 RESTRICCIONES

NO usar:
- Firebase
- Laravel
- Django
- MongoDB
- Express separado
- arquitecturas monolíticas complejas

TODO debe funcionar:
- barato,
- gratis inicialmente,
- fácil de desplegar,
- fácil de mantener.

---

# 🎯 RESULTADO ESPERADO

Quiero que generes:

- arquitectura completa,
- estructura profesional,
- diseño del sistema,
- flujos,
- componentes,
- esquema BD,
- roadmap,
- lógica operacional,
- MVP funcional,
- estrategia escalable.

Quiero que actúes como:
- arquitecto de software senior,
- experto SaaS,
- experto UX,
- experto en sistemas operacionales,
- experto en Supabase,
- experto en Vercel,
- experto en OpenWA,
- experto en productos SaaS modernos.

La app debe sentirse:
- premium,
- inteligente,
- futurista,
- operativamente eficiente.

---

# 🆕 MEJORAS DE PLAN (V2)

## 1. Sistema de Comprobante de Pago Guiado
- **Tipos de pago**: Nequi, Daviplata, Transferencia Bancaria, Efectivo y Otro.
- **Datos de transferencia explícitos**:
  - Nequi: 3213016224
  - Daviplata: @davi3213016224
- **Valor mínimo**: $5.000 COP obligatorios mostrados elegantemente sin alertas intrusivas.
- **UX Acompañada**: Flujo guiado por pasos (1. Fecha, 2. Hora, 3. Pago) para evitar confusión del cliente.

## 2. Panel Administrativo de Control Completo
- **Visualización global**: Lista completa de todas las citas del día con filtros rápidos por estado (`pending`, `confirmed`, `rejected`, `completed`, `cancelled`).
- **Control de estado completo**: Aprobación de comprobantes, cancelación y finalización de citas para cálculo de ingresos reales.
- **Calendario dinámico**: Soporte para vista diaria, semanal y mensual.
- **Reagendamiento y Modificaciones**: Mover citas de horario de manera interactiva.
- **Historial de Cliente**: Acceso al historial de reservas pasadas según el número telefónico del cliente.

## 3. Configuración Dinámica de Horarios
- Configuración detallada de días laborales, hora de inicio/fin por día individual y rangos de almuerzo/descanso.
- Bloqueo de fechas específicas o feriados desde el panel de control.
- Generación automática de slots sin valores hardcodeados en el código.

## 4. UX e Inteligencia Fluida
- Las probabilidades técnicas son internas del panel administrativo.
- La interfaz del cliente utiliza etiquetas de persuasión amigables (*⭐ Recomendado*, *🔥 Alta demanda*, etc.) basadas en algoritmos de ocupación diaria.

