import { NextRequest, NextResponse } from 'next/server';
import { 
  createBooking, getBookingsByDate, updateBookingStatus, updateBookingTime, getClientHistory, getClientByPhone 
} from '@/lib/supabase';
import { notifications } from '@/services/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const phone = searchParams.get('phone');
    const info = searchParams.get('info');

    if (phone) {
      if (info === 'client') {
        const client = await getClientByPhone(phone);
        return NextResponse.json({ success: true, client });
      }
      const history = await getClientHistory(phone);
      return NextResponse.json({ success: true, bookings: history });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const bookings = await getBookingsByDate(targetDate);
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, bookingDate, startTime, endTime, paymentMethod, serviceId, serviceName, status } = body;

    if (!clientName || !clientPhone || !bookingDate || !startTime || !endTime || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const booking = await createBooking({
      clientName,
      clientPhone,
      bookingDate,
      startTime,
      endTime,
      status: status || 'pending',
      paymentMethod,
      serviceId: serviceId || 'classic',
      serviceName: serviceName || 'Corte Clásico'
    });

    // Enviar notificación simulada de WhatsApp
    if (status !== 'confirmed') {
      await notifications.sendBookingPending(clientName, clientPhone, bookingDate, startTime);
    } else {
      await notifications.sendBookingConfirmed(clientName, clientPhone, bookingDate, startTime);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, startTime, endTime, clientName, clientPhone, bookingDate, reason } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta ID' }, { status: 400 });
    }

    let ok = true;
    
    // Si se pasa startTime/endTime, significa reagendamiento
    if (startTime && endTime) {
      ok = await updateBookingTime(id, startTime, endTime);
    }

    // Si se pasa status, actualizar estado
    if (status) {
      ok = await updateBookingStatus(id, status);
      
      if (ok) {
        if (status === 'confirmed' && clientName && clientPhone) {
          await notifications.sendBookingConfirmed(clientName, clientPhone, bookingDate, startTime);
        } else if (status === 'rejected' && clientName && clientPhone) {
          await notifications.sendBookingRejected(clientName, clientPhone, bookingDate, startTime, reason);
        }
      }
    }

    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
