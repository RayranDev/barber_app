import { createClient } from '@supabase/supabase-js';
import { Booking as BaseBooking, BarberSettings as BaseBarberSettings } from './engine/optimizer';

export interface Service {
  id: string;
  name: string;
  duration: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  loyaltyStamps: number;
  loyaltyRedeemed: number;
}

export interface BarberSettings extends BaseBarberSettings {
  barberName: string;
  services: Service[];
  loyaltyVisitsRequired: number;
  loyaltyBenefit: string;
}

export interface Booking extends BaseBooking {
  serviceId?: string;
  serviceName?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IS_MOCKED = !process.env.NEXT_PUBLIC_SUPABASE_URL;

let mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Alex Rivera',
    phone: '+5491155551111',
    totalVisits: 3,
    loyaltyStamps: 3,
    loyaltyRedeemed: 0
  },
  {
    id: 'c2',
    name: 'Carlos Gómez',
    phone: '+5491155552222',
    totalVisits: 6,
    loyaltyStamps: 1,
    loyaltyRedeemed: 1
  }
];

let mockBookings: Booking[] = [
  {
    id: 'b1',
    clientName: 'Alex Rivera',
    clientPhone: '+5491155551111',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:40',
    status: 'confirmed',
    paymentMethod: 'Nequi',
    serviceId: 'classic',
    serviceName: 'Corte Clásico'
  },
  {
    id: 'b2',
    clientName: 'Carlos Gómez',
    clientPhone: '+5491155552222',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '16:20',
    endTime: '17:00',
    status: 'pending',
    paymentMethod: 'Daviplata',
    serviceId: 'combo',
    serviceName: 'Corte + Barba Completo'
  }
];

let mockSettings: BarberSettings = {
  barberName: 'JR & Co. Barber',
  slotDurationMinutes: 40,
  lunchStart: '13:00',
  lunchEnd: '14:00',
  weeklySchedule: {
    "1": { active: true, start: "17:00", end: "21:00" }, // Lunes corto (ejemplo solicitado)
    "2": { active: true, start: "14:00", end: "20:00" }, // Martes
    "3": { active: true, start: "08:00", end: "20:00" },
    "4": { active: true, start: "08:00", end: "20:00" },
    "5": { active: true, start: "08:00", end: "20:00" },
    "6": { active: true, start: "08:00", end: "20:00" },
    "0": { active: false, start: "08:00", end: "20:00" } // Domingo cerrado
  },
  blockedDates: [],
  services: [
    { id: 'classic', name: 'Corte Clásico', duration: 40 },
    { id: 'fade', name: 'Fade / Degradado', duration: 40 },
    { id: 'beard', name: 'Arreglo de Barba', duration: 20 },
    { id: 'combo', name: 'Corte + Barba Completo', duration: 60 },
    { id: 'shave', name: 'Afeitado Tradicional', duration: 30 }
  ],
  loyaltyVisitsRequired: 5,
  loyaltyBenefit: 'Corte gratis o 50% de descuento en combo'
};

export async function getBarberSettings(): Promise<BarberSettings> {
  if (IS_MOCKED) {
    return mockSettings;
  }
  try {
    const { data, error } = await supabase
      .from('barber_settings')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (error || !data) throw error;
    return {
      barberName: data.barber_name,
      slotDurationMinutes: data.slot_duration_minutes,
      lunchStart: data.lunch_start,
      lunchEnd: data.lunch_end,
      weeklySchedule: data.weekly_schedule,
      blockedDates: data.blocked_dates || [],
      services: data.services || [],
      loyaltyVisitsRequired: data.loyalty_visits_required,
      loyaltyBenefit: data.loyalty_benefit
    };
  } catch (e) {
    console.warn('Usando mock settings.', e);
    return mockSettings;
  }
}

export async function updateBarberSettings(settings: BarberSettings): Promise<boolean> {
  if (IS_MOCKED) {
    mockSettings = settings;
    return true;
  }
  const { error } = await supabase
    .from('barber_settings')
    .upsert({
      id: 'default',
      barber_name: settings.barberName,
      slot_duration_minutes: settings.slotDurationMinutes,
      lunch_start: settings.lunchStart,
      lunch_end: settings.lunchEnd,
      weekly_schedule: settings.weeklySchedule,
      blocked_dates: settings.blockedDates,
      services: settings.services,
      loyalty_visits_required: settings.loyaltyVisitsRequired,
      loyalty_benefit: settings.loyaltyBenefit,
      updated_at: new Date().toISOString()
    });
  return !error;
}

export async function getBookingsByDate(dateStr: string): Promise<Booking[]> {
  if (IS_MOCKED) {
    return mockBookings.filter(b => b.bookingDate === dateStr);
  }
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', dateStr);
    
    if (error) throw error;
    return data.map(b => ({
      id: b.id,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      paymentMethod: b.payment_method,
      paymentReceiptUrl: b.payment_receipt_url,
      serviceId: b.service_id,
      serviceName: b.service_name
    }));
  } catch (e) {
    console.warn('Usando mock bookings.', e);
    return mockBookings.filter(b => b.bookingDate === dateStr);
  }
}

export async function createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
  // Primero registramos/actualizamos el cliente para vincularlo
  const client = await getOrCreateClient(booking.clientName, booking.clientPhone);

  if (IS_MOCKED) {
    const newBooking = { 
      ...booking, 
      id: 'b-' + Math.random().toString(36).substr(2, 9),
      serviceId: booking.serviceId || 'classic',
      serviceName: booking.serviceName || 'Corte Clásico'
    };
    mockBookings.push(newBooking);
    return newBooking;
  }
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: client.id,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      booking_date: booking.bookingDate,
      start_time: booking.startTime,
      end_time: booking.endTime,
      status: booking.status,
      payment_method: booking.paymentMethod,
      payment_receipt_url: booking.paymentReceiptUrl,
      service_id: booking.serviceId || 'classic',
      service_name: booking.serviceName || 'Corte Clásico'
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    clientName: data.client_name,
    clientPhone: data.client_phone,
    bookingDate: data.booking_date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    paymentMethod: data.payment_method,
    paymentReceiptUrl: data.payment_receipt_url,
    serviceId: data.service_id,
    serviceName: data.service_name
  };
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<boolean> {
  if (IS_MOCKED) {
    const b = mockBookings.find(b => b.id === id);
    if (b) {
      const oldStatus = b.status;
      b.status = status;
      
      // Si pasa a completada, incrementamos el sello de fidelidad
      if (status === 'completed' && oldStatus !== 'completed') {
        const client = mockClients.find(c => c.phone === b.clientPhone);
        if (client) {
          client.totalVisits += 1;
          client.loyaltyStamps += 1;
          
          if (client.loyaltyStamps >= mockSettings.loyaltyVisitsRequired) {
            // Canjear y reiniciar o mantener el sobrante
            client.loyaltyStamps = client.loyaltyStamps % mockSettings.loyaltyVisitsRequired;
            client.loyaltyRedeemed += 1;
          }
        }
      }
      return true;
    }
    return false;
  }

  // Si pasa a completada, obtenemos la cita para actualizar la fidelidad del cliente
  if (status === 'completed') {
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('client_phone')
      .eq('id', id)
      .single();

    if (bookingData?.client_phone) {
      await addLoyaltyStamp(bookingData.client_phone);
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function updateBookingTime(id: string, startTime: string, endTime: string): Promise<boolean> {
  if (IS_MOCKED) {
    const b = mockBookings.find(b => b.id === id);
    if (b) {
      b.startTime = startTime;
      b.endTime = endTime;
      return true;
    }
    return false;
  }
  const { error } = await supabase
    .from('bookings')
    .update({ start_time: startTime, end_time: endTime, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function getClientHistory(phone: string): Promise<Booking[]> {
  if (IS_MOCKED) {
    return mockBookings.filter(b => b.clientPhone === phone);
  }
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('client_phone', phone)
    .order('booking_date', { ascending: false });
  if (error) return [];
  return data.map(b => ({
    id: b.id,
    clientName: b.client_name,
    clientPhone: b.client_phone,
    bookingDate: b.booking_date,
    startTime: b.start_time,
    endTime: b.end_time,
    status: b.status,
    paymentMethod: b.payment_method,
    serviceId: b.service_id,
    serviceName: b.service_name
  }));
}

// NUEVAS FUNCIONES DE CLIENTES Y FIDELIDAD

export async function getOrCreateClient(name: string, phone: string): Promise<Client> {
  if (IS_MOCKED) {
    let client = mockClients.find(c => c.phone === phone);
    if (!client) {
      client = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        name,
        phone,
        totalVisits: 0,
        loyaltyStamps: 0,
        loyaltyRedeemed: 0
      };
      mockClients.push(client);
    } else {
      // Actualizar nombre por si cambió
      client.name = name;
    }
    return client;
  }

  // Buscar existente
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (existing) {
    if (existing.name !== name) {
      await supabase
        .from('clients')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
    return {
      id: existing.id,
      name: existing.name,
      phone: existing.phone,
      totalVisits: existing.total_visits,
      loyaltyStamps: existing.loyalty_stamps,
      loyaltyRedeemed: existing.loyalty_redeemed
    };
  }

  // Crear nuevo
  const { data: created, error } = await supabase
    .from('clients')
    .insert({ name, phone })
    .select()
    .single();

  if (error) throw error;
  return {
    id: created.id,
    name: created.name,
    phone: created.phone,
    totalVisits: created.total_visits,
    loyaltyStamps: created.loyalty_stamps,
    loyaltyRedeemed: created.loyalty_redeemed
  };
}

export async function getClientByPhone(phone: string): Promise<Client | null> {
  if (IS_MOCKED) {
    const client = mockClients.find(c => c.phone === phone);
    return client || null;
  }
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    totalVisits: data.total_visits,
    loyaltyStamps: data.loyalty_stamps,
    loyaltyRedeemed: data.loyalty_redeemed
  };
}

export async function addLoyaltyStamp(phone: string): Promise<boolean> {
  const client = await getClientByPhone(phone);
  if (!client) return false;

  const settings = await getBarberSettings();
  const newVisits = client.totalVisits + 1;
  let newStamps = client.loyaltyStamps + 1;
  let newRedeemed = client.loyaltyRedeemed;

  if (newStamps >= settings.loyaltyVisitsRequired) {
    newStamps = newStamps % settings.loyaltyVisitsRequired;
    newRedeemed += 1;
  }

  if (IS_MOCKED) {
    const c = mockClients.find(x => x.phone === phone);
    if (c) {
      c.totalVisits = newVisits;
      c.loyaltyStamps = newStamps;
      c.loyaltyRedeemed = newRedeemed;
      return true;
    }
    return false;
  }

  const { error } = await supabase
    .from('clients')
    .update({
      total_visits: newVisits,
      loyalty_stamps: newStamps,
      loyalty_redeemed: newRedeemed,
      updated_at: new Date().toISOString()
    })
    .eq('id', client.id);

  return !error;
}

