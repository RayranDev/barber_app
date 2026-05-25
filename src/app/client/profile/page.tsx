'use client';

import { useState, useEffect } from 'react';
import { 
  User, Phone, Award, Clock, ArrowLeft, Scissors, Calendar,
  ShieldCheck, HelpCircle, AlertCircle, CheckCircle, Gift, Star
} from 'lucide-react';
import Link from 'next/link';
import { Client, Booking, BarberSettings } from '@/lib/supabase';

/* ─────────────── Reusable Bearded Man Logo ─────────────── */
function BeardedManLogo({ className = "w-10 h-10 text-primary" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Cabello cepillado arriba */}
      <path d="M 35 18 C 38 10, 60 10, 65 18 M 38 25 C 45 15, 62 15, 65 22 M 42 30 C 48 20, 60 20, 65 26" />
      {/* Contorno de cara y barba */}
      <path d="M 33 30 L 33 55 C 33 65, 35 70, 50 85 C 65 70, 67 65, 67 55 L 67 30 Z" />
      {/* Orejas */}
      <path d="M 33 42 C 28 42, 28 50, 33 50" />
      {/* Ojos cerrados / relajados */}
      <path d="M 38 41 C 41 45, 45 45, 48 41" />
      <path d="M 52 41 C 55 45, 59 45, 62 41" />
      {/* Nariz */}
      <path d="M 47 50 L 50 47 L 53 50" />
      {/* Bigote (Mostacho) */}
      <path d="M 40 58 C 45 56, 48 58, 50 60 C 52 58, 55 56, 60 58 C 62 60, 61 64, 60 65 C 57 65, 53 62, 50 62 C 47 62, 43 65, 40 65 C 39 64, 38 60, 40 58 Z" />
      {/* Líneas de detalle de la barba */}
      <path d="M 42 66 L 42 74 M 46 66 L 46 78 M 50 66 L 50 80 M 54 66 L 54 78 M 58 66 L 58 74" />
    </svg>
  );
}

export default function ClientProfile() {
  const [phoneInput, setPhoneInput] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<BarberSettings | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch settings on mount to display loyalty benefit texts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/slots');
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Pre-fill phone from query params or LocalStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const phoneParam = urlParams.get('phone');
      const storedPhone = localStorage.getItem('barber_clientPhone');
      
      const targetPhone = phoneParam || storedPhone;
      if (targetPhone) {
        setPhoneInput(targetPhone);
        handleLookup(targetPhone);
      }
    }
  }, []);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(phoneInput);
  };

  const handleLookup = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch client detail
      const clientRes = await fetch(`/api/booking?phone=${encodeURIComponent(phone)}&info=client`);
      const clientData = await clientRes.json();
      
      // 2. Fetch client booking history
      const historyRes = await fetch(`/api/booking?phone=${encodeURIComponent(phone)}`);
      const historyData = await historyRes.json();

      if (clientData.success && clientData.client) {
        setClient(clientData.client);
        setBookings(historyData.success ? historyData.bookings : []);
        setSearched(true);
        // Persist lookups
        localStorage.setItem('barber_clientPhone', phone);
      } else {
        setErrorMsg('No se encontró ningún perfil de cliente registrado con ese número celular.');
        setClient(null);
        setBookings([]);
        setSearched(true);
      }
    } catch (err) {
      setErrorMsg('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const loyaltyVisitsRequired = settings?.loyaltyVisitsRequired || 5;
  const loyaltyBenefit = settings?.loyaltyBenefit || 'Corte gratis o 50% de descuento';
  const barberName = 'Juan Rairan';

  return (
    <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-between min-h-screen text-primary">
      <div>
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
          <span className="text-[10px] text-primary/70 font-sans font-bold uppercase tracking-widest">PERFIL DEL CLIENTE</span>
        </div>

        <header className="text-center mb-6">
          <div className="barber-pole-border mb-4 rounded"></div>
          <div className="flex flex-col items-center gap-2 mt-3">
            <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center bg-card shadow-md">
              <BeardedManLogo className="w-11 h-11 text-primary" />
            </div>
            <h1 className="text-3xl font-serif tracking-widest text-primary uppercase drop-shadow-sm">
              {barberName}
            </h1>
            <p className="text-[10px] text-primary/70 tracking-wider font-sans uppercase font-bold mt-1">
              Consulta tu historial y tarjeta de fidelización
            </p>
          </div>
        </header>

        {/* 1. SEARCH BOX */}
        <div className="vintage-panel p-4 border-[#d4af37]/20 mb-6">
          <form onSubmit={handleLookupSubmit} className="space-y-3">
            <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block">
              Ingresa tu número de WhatsApp
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Ej: 3213016224"
                  className="w-full pl-9 pr-3 py-2 text-xs vintage-input"
                />
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8a7a6b]" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="gold-btn px-4 text-xs shrink-0 py-2"
              >
                {loading ? 'Buscando...' : 'Consultar'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-[#ab4e46] bg-[#ab4e46]/10 border border-[#ab4e46]/20 p-2.5 rounded mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* 2. RESULTS */}
        {searched && client && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Elegant Client card & loyalty card */}
            <div className="vintage-frame border-[#d4af37]/35 rounded shadow-xl space-y-4">
              <div className="flex justify-between items-start border-b border-[#d4af37]/20 pb-3">
                <div>
                  <h2 className="text-lg font-serif text-white uppercase">{client.name}</h2>
                  <p className="text-[10px] text-[#bdae9e] flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-[#d4af37]" /> {client.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[#8a7a6b] block uppercase">Visitas Totales</span>
                  <span className="text-base font-serif font-bold text-[#d4af37]">{client.totalVisits}</span>
                </div>
              </div>

              {/* LOYALTY CARD STAMPS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#bdae9e] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-[#d4af37]" /> Tarjeta de Fidelización
                  </span>
                  <span className="text-[10px] text-[#d4af37] font-semibold">
                    {client.loyaltyStamps} / {loyaltyVisitsRequired} Sellos
                  </span>
                </div>

                {/* Stamp Board */}
                <div className="bg-[#110e0c] p-4 rounded border border-[#d4af37]/10 flex flex-wrap justify-center gap-3">
                  {Array.from({ length: loyaltyVisitsRequired }).map((_, idx) => {
                    const isStamped = idx < client.loyaltyStamps;
                    return (
                      <div
                        key={idx}
                        className={`loyalty-stamp-slot ${isStamped ? 'loyalty-stamp-active' : ''}`}
                      >
                        {isStamped ? (
                          <Scissors className="h-5 w-5" />
                        ) : (
                          <span className="text-xs text-[#8a7a6b] font-serif">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2">
                  <p className="text-[10px] text-[#8a7a6b] italic">
                    Beneficio al completar la tarjeta:
                  </p>
                  <p className="text-xs text-[#d4af37] font-bold uppercase mt-1">
                    🎁 {loyaltyBenefit}
                  </p>
                  {client.loyaltyRedeemed > 0 && (
                    <p className="text-[9px] text-[#859f7d] mt-1.5 font-semibold">
                      ¡Has completado y canjeado esta tarjeta {client.loyaltyRedeemed} {client.loyaltyRedeemed === 1 ? 'vez' : 'veces'}!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* APPOINTMENT HISTORY */}
            <div className="space-y-3">
              <h3 className="text-xs font-serif uppercase tracking-wider text-primary flex items-center gap-1.5 font-bold">
                <Calendar className="h-4 w-4 text-primary" /> Tu Historial de Citas
              </h3>

              {bookings.length === 0 ? (
                <div className="text-center py-6 bg-card border border-primary/20 rounded text-xs text-primary/70 italic">
                  Aún no registras citas solicitadas con este celular.
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((booking: Booking) => {
                    let statusLabel = 'Pendiente';
                    let statusColor = 'border-amber-700/30 text-amber-900 bg-amber-700/5';

                    if (booking.status === 'confirmed') {
                      statusLabel = 'Confirmada';
                      statusColor = 'border-primary/35 text-primary bg-primary/5';
                    } else if (booking.status === 'completed') {
                      statusLabel = 'Completada';
                      statusColor = 'border-success/30 text-success bg-success/5';
                    } else if (booking.status === 'rejected' || booking.status === 'cancelled') {
                      statusLabel = 'Cancelada';
                      statusColor = 'border-destructive/30 text-destructive bg-destructive/5';
                    }

                    return (
                      <div 
                        key={booking.id}
                        className="bg-card border-2 border-primary p-3.5 rounded-xl flex justify-between items-center"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-serif uppercase text-primary font-bold tracking-wide">
                            {booking.serviceName || 'Corte Clásico'}
                          </p>
                          <p className="text-[10px] text-primary/80 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" /> {booking.bookingDate}
                          </p>
                          <p className="text-[10px] text-primary/70 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[8px] font-bold uppercase tracking-wider py-1 px-2 border rounded ${statusColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-[8px] text-[#8a7a6b] block">Pago: {booking.paymentMethod}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-primary/20 flex flex-col items-center gap-2">
        <p className="text-[9px] text-primary/70 uppercase tracking-wider font-bold">
          © {new Date().getFullYear()} {barberName} • JR &amp; Co.
        </p>
      </footer>
    </div>
  );
}
