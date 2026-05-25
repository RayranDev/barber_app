import { NextRequest, NextResponse } from 'next/server';
import { getBarberSettings, getBookingsByDate } from '@/lib/supabase';
import { generateBaseSlots, computeSmartSlots, detectOptimizationOpportunities } from '@/lib/engine/optimizer';
import { notifications } from '@/services/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const settings = await getBarberSettings();
    const bookings = await getBookingsByDate(date);

    const baseSlots = generateBaseSlots(settings, date);
    const smartSlots = computeSmartSlots(baseSlots, bookings, settings);
    const suggestions = detectOptimizationOpportunities(smartSlots, bookings);

    return NextResponse.json({
      success: true,
      date,
      suggestions,
      metrics: {
        totalSlots: smartSlots.filter(s => s.status !== 'lunch').length,
        occupiedSlots: smartSlots.filter(s => s.status === 'confirmed' || s.status === 'pending' || s.status === 'completed').length,
        efficiencyScore: smartSlots.length > 0 
          ? Math.round(smartSlots.reduce((acc, s) => acc + s.efficiencyScore, 0) / smartSlots.length) 
          : 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Envía la sugerencia al cliente por WhatsApp (OpenWA mock / live)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, bookingDate, currentSlot, suggestedSlot } = body;

    if (!clientName || !clientPhone || !bookingDate || !currentSlot || !suggestedSlot) {
      return NextResponse.json({ success: false, error: 'Campos insuficientes' }, { status: 400 });
    }

    const sent = await notifications.sendBookingSuggestion(clientName, clientPhone, bookingDate, currentSlot, suggestedSlot);
    return NextResponse.json({ success: sent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
