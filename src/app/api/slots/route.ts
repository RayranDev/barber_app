import { NextRequest, NextResponse } from 'next/server';
import { getBarberSettings, getBookingsByDate } from '@/lib/supabase';
import { generateBaseSlots, computeSmartSlots } from '@/lib/engine/optimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const settings = await getBarberSettings();
    const bookings = await getBookingsByDate(date);

    const baseSlots = generateBaseSlots(settings, date);
    const smartSlots = computeSmartSlots(baseSlots, bookings, settings);

    return NextResponse.json({
      success: true,
      date,
      slots: smartSlots,
      settings
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
