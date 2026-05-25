// SERVICIO DE NOTIFICACIONES COMPATIBLE CON OPENWA / WHATSAPP API (BARBER_PLAN.md)

export interface NotificationPayload {
  phone: string;
  message: string;
}

/**
 * Servicio modular de notificaciones.
 * Diseñado para ser gratuito inicialmente mediante consola/simulación
 * y escalable a OpenWA (VPS) o WhatsApp Business API simplemente agregando la URL de su Webhook.
 */
class NotificationService {
  private openWaEndpoint: string | null = null;

  constructor() {
    this.openWaEndpoint = process.env.OPENWA_WEBHOOK_URL || null;
  }

  async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    console.log(`[WhatsApp Notifications] Enviando a ${phone}:`);
    console.log(`-----------------------------------------------`);
    console.log(message);
    console.log(`-----------------------------------------------`);

    if (this.openWaEndpoint) {
      try {
        const response = await fetch(this.openWaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENWA_API_KEY || ''}`
          },
          body: JSON.stringify({ phone, message })
        });
        return response.ok;
      } catch (error) {
        console.error('Error al conectar con OpenWA API:', error);
        return false;
      }
    }

    // Retorna true en simulación
    return true;
  }

  async sendBookingPending(clientName: string, phone: string, date: string, time: string): Promise<boolean> {
    const msg = `¡Hola, ${clientName}! 👋\n\nHemos recibido tu solicitud de reserva en la barbería para el día *${date}* a las *${time}*.\n\nPor favor realiza la transferencia y sube tu comprobante en la web para confirmar tu cita. ¡Te esperamos! 💈`;
    return this.sendWhatsApp(phone, msg);
  }

  async sendBookingConfirmed(clientName: string, phone: string, date: string, time: string): Promise<boolean> {
    const msg = `¡Tu cita está CONFIRMADA! 🎉\n\nHola, ${clientName}, tu pago ha sido validado correctamente. Tu cita es el *${date}* a las *${time}*.\n\n¡Prepárate para tu mejor corte! ✂️💈`;
    return this.sendWhatsApp(phone, msg);
  }

  async sendBookingRejected(clientName: string, phone: string, date: string, time: string, reason?: string): Promise<boolean> {
    const msg = `Hola, ${clientName}. ⚠️\n\nTu solicitud de cita para el *${date}* a las *${time}* no pudo ser confirmada.\n\n${reason ? `Motivo: ${reason}` : 'Motivo: No se recibió un comprobante de pago válido.'}\n\nPor favor ingresa de nuevo a la plataforma para seleccionar otro horario.`;
    return this.sendWhatsApp(phone, msg);
  }

  async sendBookingSuggestion(clientName: string, phone: string, date: string, currentTile: string, newTime: string): Promise<boolean> {
    const msg = `Hola, ${clientName}! 💈\n\nPara ofrecerte una mejor atención, tenemos disponible una reubicación de horario para tu cita del *${date}*:\n\nDe: *${currentTile}* ➡️ A: *${newTime}* (⭐ Horario VIP recomendado con atención más puntual).\n\n¿Te gustaría que realicemos este cambio? Responde a este mensaje para confirmar.`;
    return this.sendWhatsApp(phone, msg);
  }
}

export const notifications = new NotificationService();
