// MOTOR DE OPTIMIZACIÓN E INTELIGENCIA DE SLOTS (ACTUALIZADO V2)

export interface TimeSlot {
  time: string; // Ej: "08:00"
  endTime: string; // Ej: "08:40"
  status: 'available' | 'confirmed' | 'pending' | 'premium' | 'recommended' | 'lunch' | 'completed' | 'cancelled';
  label?: string; // Etiqueta UX premium y amigable
  probabilityScore: number; // 0 to 100 (Uso administrativo interno)
  efficiencyScore: number; // 0 to 100
}

export interface DaySchedule {
  active: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface BarberSettings {
  slotDurationMinutes: number;
  lunchStart?: string;
  lunchEnd?: string;
  weeklySchedule: {
    [key: string]: DaySchedule; // "0" (Domingo) al "6" (Sábado)
  };
  blockedDates: string[]; // Fechas bloqueadas "YYYY-MM-DD"
}

export interface Booking {
  id?: string;
  clientName: string;
  clientPhone: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  paymentMethod: 'Nequi' | 'Daviplata' | 'Transferencia Bancaria' | 'Efectivo' | 'Otro';
  paymentReceiptUrl?: string;
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Genera todos los slots de tiempo en base a la fecha seleccionada y la configuración de horarios de ese día de la semana.
 */
export function generateBaseSlots(settings: BarberSettings, dateStr: string): TimeSlot[] {
  // Evitar días bloqueados expresamente
  if (settings.blockedDates.includes(dateStr)) {
    return [];
  }

  // Obtener día de la semana de la fecha (0 = Domingo, 1 = Lunes, etc.)
  // Usar "T00:00:00" para evitar desvíos por zona horaria local
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay().toString();
  const schedule = settings.weeklySchedule[dayOfWeek];

  if (!schedule || !schedule.active) {
    return []; // Cerrado
  }

  const slots: TimeSlot[] = [];
  const startMins = timeToMinutes(schedule.start);
  const endMins = timeToMinutes(schedule.end);
  const duration = settings.slotDurationMinutes;
  
  const lunchStartMins = settings.lunchStart ? timeToMinutes(settings.lunchStart) : -1;
  const lunchEndMins = settings.lunchEnd ? timeToMinutes(settings.lunchEnd) : -1;

  let currentMins = startMins;

  while (currentMins + duration <= endMins) {
    const slotStartStr = minutesToTime(currentMins);
    const slotEndStr = minutesToTime(currentMins + duration);
    
    // Verificar almuerzo
    const isLunch = lunchStartMins !== -1 && lunchEndMins !== -1 && 
                    currentMins >= lunchStartMins && currentMins < lunchEndMins;

    slots.push({
      time: slotStartStr,
      endTime: slotEndStr,
      status: isLunch ? 'lunch' : 'available',
      probabilityScore: 50,
      efficiencyScore: 50
    });

    currentMins += duration;
  }

  return slots;
}

/**
 * Procesa y enriquece los slots con IA y recomendaciones fluidas
 */
export function computeSmartSlots(
  baseSlots: TimeSlot[],
  bookings: Booking[],
  settings: BarberSettings
): TimeSlot[] {
  if (baseSlots.length === 0) return [];

  // Mapa de citas activas por hora
  const bookingsMap = new Map<string, Booking>();
  bookings.forEach(b => {
    if (b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed') {
      bookingsMap.set(b.startTime, b);
    }
  });

  const processedSlots = baseSlots.map(slot => {
    if (slot.status === 'lunch') return slot;
    
    const booking = bookingsMap.get(slot.time);
    if (booking) {
      let finalStatus: TimeSlot['status'] = 'confirmed';
      if (booking.status === 'pending') finalStatus = 'pending';
      if (booking.status === 'completed') finalStatus = 'completed';

      return {
        ...slot,
        status: finalStatus,
        probabilityScore: 100,
        efficiencyScore: 100
      };
    }
    return slot;
  });

  const totalSlotsCount = processedSlots.filter(s => s.status !== 'lunch').length;
  const occupiedSlotsCount = processedSlots.filter(s => s.status === 'confirmed' || s.status === 'pending' || s.status === 'completed').length;
  const dayOcupationRate = totalSlotsCount > 0 ? (occupiedSlotsCount / totalSlotsCount) * 100 : 0;

  return processedSlots.map((slot, index) => {
    if (slot.status !== 'available') return slot;

    const prevSlot = index > 0 ? processedSlots[index - 1] : null;
    const nextSlot = index < processedSlots.length - 1 ? processedSlots[index + 1] : null;

    const isPrevOccupied = prevSlot ? (prevSlot.status === 'confirmed' || prevSlot.status === 'pending' || prevSlot.status === 'completed') : false;
    const isNextOccupied = nextSlot ? (nextSlot.status === 'confirmed' || nextSlot.status === 'pending' || nextSlot.status === 'completed') : false;

    let efficiencyScore = 50;
    let probabilityScore = 60;
    let label = '';
    let status: TimeSlot['status'] = 'available';

    // Inteligencia de cercanía y compactación
    if (isPrevOccupied && isNextOccupied) {
      efficiencyScore = 98;
      probabilityScore = 95;
      label = '⭐ Horario preferido hoy';
      status = 'recommended';
    } else if (isPrevOccupied || isNextOccupied) {
      efficiencyScore = 85;
      probabilityScore = 85;
      label = '🔥 Alta demanda de citas';
      status = 'recommended';
    }

    // Horarios premium
    const mins = timeToMinutes(slot.time);
    const isPremiumTime = mins >= 1020 && mins <= 1200; // 5 PM a 8 PM
    if (isPremiumTime) {
      probabilityScore += 10;
      if (status !== 'recommended') {
        status = 'premium';
        label = '🕒 Atención más puntual';
      }
    }

    // Punctuality
    const isFirstSlot = prevSlot === null || prevSlot.status === 'lunch';
    if (isFirstSlot && status === 'available') {
      label = '⚡ Confirmación ultra rápida';
    }

    // Boost si hay pocas citas para consolidar la agenda
    if (dayOcupationRate > 0 && dayOcupationRate < 25 && (isPrevOccupied || isNextOccupied)) {
      probabilityScore = Math.min(probabilityScore + 10, 95);
    }

    return {
      ...slot,
      status,
      label: label || undefined,
      probabilityScore: Math.min(probabilityScore, 100),
      efficiencyScore: Math.min(efficiencyScore, 100)
    };
  });
}

export interface ReallocationSuggestion {
  bookingId: string;
  clientName: string;
  clientPhone: string;
  currentSlot: string;
  suggestedSlot: string;
  efficiencyGain: number;
  reason: string;
}

export function detectOptimizationOpportunities(
  slots: TimeSlot[],
  bookings: Booking[]
): ReallocationSuggestion[] {
  const suggestions: ReallocationSuggestion[] = [];
  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  
  if (activeBookings.length <= 1) return [];

  activeBookings.forEach(booking => {
    const bookingIndex = slots.findIndex(s => s.time === booking.startTime);
    if (bookingIndex === -1) return;

    const prev1 = bookingIndex > 0 ? slots[bookingIndex - 1] : null;
    const next1 = bookingIndex < slots.length - 1 ? slots[bookingIndex + 1] : null;

    const isIsolated = (!prev1 || prev1.status === 'available' || prev1.status === 'lunch') &&
                       (!next1 || next1.status === 'available' || next1.status === 'lunch');

    if (isIsolated) {
      // Buscar slots recomendados
      const targetSlot = slots.find(s => 
        (s.status === 'recommended' || s.status === 'premium') && 
        s.time !== booking.startTime
      );

      if (targetSlot) {
        suggestions.push({
          bookingId: booking.id || '',
          clientName: booking.clientName,
          clientPhone: booking.clientPhone,
          currentSlot: booking.startTime,
          suggestedSlot: targetSlot.time,
          efficiencyGain: 40,
          reason: `Reubicar de ${booking.startTime} a ${targetSlot.time} compactará la agenda en un +40% de continuidad.`
        });
      }
    }
  });

  return suggestions;
}
