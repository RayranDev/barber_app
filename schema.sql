-- ESQUEMA DE BASE DE DATOS ACTUALIZADO V3 — BARBERÍA INTELIGENTE CLÁSICA

-- 1. Configuración de la barbería con soporte para nombre, servicios y horarios dinámicos
CREATE TABLE IF NOT EXISTS barber_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  barber_name TEXT NOT NULL DEFAULT 'JR & Co.',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 40,
  lunch_start TEXT DEFAULT '13:00',
  lunch_end TEXT DEFAULT '14:00',
  weekly_schedule JSONB NOT NULL DEFAULT '{
    "1": { "active": true, "start": "17:00", "end": "21:00" },
    "2": { "active": true, "start": "14:00", "end": "20:00" },
    "3": { "active": true, "start": "08:00", "end": "20:00" },
    "4": { "active": true, "start": "08:00", "end": "20:00" },
    "5": { "active": true, "start": "08:00", "end": "20:00" },
    "6": { "active": true, "start": "08:00", "end": "20:00" },
    "0": { "active": false, "start": "08:00", "end": "20:00" }
  }'::jsonb,
  blocked_dates TEXT[] DEFAULT '{}',
  -- Catálogo de servicios sin precios (los precios varían por cliente)
  -- Formato: [{ "id": "cut", "name": "Corte Clásico", "duration": 40 }, ...]
  services JSONB NOT NULL DEFAULT '[
    { "id": "classic", "name": "Corte Clásico", "duration": 40 },
    { "id": "fade", "name": "Fade / Degradado", "duration": 40 },
    { "id": "beard", "name": "Arreglo de Barba", "duration": 20 },
    { "id": "combo", "name": "Corte + Barba Completo", "duration": 60 },
    { "id": "shave", "name": "Afeitado Tradicional", "duration": 30 }
  ]'::jsonb,
  -- Fidelidad: cantidad de visitas para obtener beneficio
  loyalty_visits_required INTEGER NOT NULL DEFAULT 5,
  loyalty_benefit TEXT NOT NULL DEFAULT '50% de descuento en tu próximo servicio',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar configuración inicial con el nombre correcto de la barbería
INSERT INTO barber_settings (id, barber_name, loyalty_benefit)
VALUES ('default', 'JR & Co.', 'Corte gratis o 50% de descuento en combo')
ON CONFLICT (id) DO UPDATE
  SET barber_name = EXCLUDED.barber_name,
      loyalty_benefit = EXCLUDED.loyalty_benefit
  WHERE barber_settings.barber_name = 'El Barbero'
     OR barber_settings.barber_name = 'La Elegante Barbería'
     OR barber_settings.barber_name = 'Juan Rairan'
     OR barber_settings.barber_name = 'JR & Co. Barber';

-- 2. Tabla de clientes con perfil y fidelidad
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  total_visits INTEGER NOT NULL DEFAULT 0,
  loyalty_stamps INTEGER NOT NULL DEFAULT 0, -- Sellos acumulados
  loyalty_redeemed INTEGER NOT NULL DEFAULT 0, -- Veces que ha canjeado el beneficio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- 3. Reservas con soporte para servicio seleccionado
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  service_id TEXT NOT NULL DEFAULT 'classic', -- ID del servicio del catálogo
  service_name TEXT NOT NULL DEFAULT 'Corte Clásico',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')
  ),
  payment_method TEXT NOT NULL DEFAULT 'Nequi' CHECK (
    payment_method IN ('Nequi', 'Daviplata', 'Llaves / Transfiya', 'Transferencia Bancaria', 'Efectivo', 'Otro')
  ),
  payment_receipt_url TEXT,
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  reallocated_from TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(booking_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(client_phone);

-- 4. Habilitar RLS
ALTER TABLE barber_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas para barber_settings
DROP POLICY IF EXISTS "Lectura pública de configuraciones" ON barber_settings;
CREATE POLICY "Lectura pública de configuraciones"
  ON barber_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin puede modificar configuraciones" ON barber_settings;
CREATE POLICY "Admin puede modificar configuraciones"
  ON barber_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Panel admin local actualiza configuraciones" ON barber_settings;
CREATE POLICY "Panel admin local actualiza configuraciones"
  ON barber_settings FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Políticas para clients
DROP POLICY IF EXISTS "Clientes pueden ver su propio perfil por teléfono" ON clients;
CREATE POLICY "Clientes pueden ver su propio perfil por teléfono"
  ON clients FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Clientes pueden registrarse" ON clients;
CREATE POLICY "Clientes pueden registrarse"
  ON clients FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin gestiona clientes" ON clients;
CREATE POLICY "Admin gestiona clientes"
  ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para bookings
DROP POLICY IF EXISTS "Lectura pública de citas" ON bookings;
CREATE POLICY "Lectura pública de citas"
  ON bookings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Cualquiera puede crear reservas" ON bookings;
CREATE POLICY "Cualquiera puede crear reservas"
  ON bookings FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin gestiona citas" ON bookings;
CREATE POLICY "Admin gestiona citas"
  ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- El panel admin actual usa login local, no auth nativa de Supabase.
-- Esta política permite que las acciones del panel funcionen con la anon key.
DROP POLICY IF EXISTS "Panel admin local actualiza citas" ON bookings;
CREATE POLICY "Panel admin local actualiza citas"
  ON bookings FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Panel admin local borra citas" ON bookings;
CREATE POLICY "Panel admin local borra citas"
  ON bookings FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Panel admin local actualiza clientes" ON clients;
CREATE POLICY "Panel admin local actualiza clientes"
  ON clients FOR UPDATE TO public USING (true) WITH CHECK (true);
