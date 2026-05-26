import { NextRequest, NextResponse } from 'next/server';
import { 
  createBooking, deleteBooking, getBookingsByDate, updateBookingStatus, updateBookingTime, getClientHistory, getClientByPhone 
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
    const { clientName, clientPhone, bookingDate, startTime, endTime, paymentMethod, paymentReceiptUrl, serviceId, serviceName, status } = body;

    if (!clientName || !clientPhone || !bookingDate || !startTime || !endTime || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Evitar reservas dobles: verificar solapamiento de rangos de tiempo
    const existingBookings = await getBookingsByDate(bookingDate);
    
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    
    // Hay conflicto si el nuevo rango solapa con cualquier cita activa (no cancelada)
    const hasConflict = existingBookings.some(b => {
      if (b.status === 'cancelled' || b.status === 'rejected') return false;
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      // Solapamiento: nuevo inicio < fin existente Y nuevo fin > inicio existente
      return newStart < bEnd && newEnd > bStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: 'Este espacio ya está reservado o hay un traslape de horario. Por favor elige otro.' },
        { status: 409 }
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
      paymentReceiptUrl,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta ID' }, { status: 400 });
    }

    const ok = await deleteBooking(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
