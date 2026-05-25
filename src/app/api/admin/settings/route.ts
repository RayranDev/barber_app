import { NextRequest, NextResponse } from 'next/server';
import { getBarberSettings, updateBarberSettings } from '@/lib/supabase';

export async function GET() {
  try {
    const settings = await getBarberSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    const ok = await updateBarberSettings(settings);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
