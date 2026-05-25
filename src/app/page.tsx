'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, AlertCircle, Upload, ShieldCheck, 
  HelpCircle, CreditCard, ChevronRight, User, Scissors, Star, 
  Sparkles, Award, Phone, CheckCircle2, Compass, ArrowRight, ArrowLeft
} from 'lucide-react';
import { TimeSlot } from '@/lib/engine/optimizer';
import { Service, BarberSettings } from '@/lib/supabase';
import Link from 'next/link';

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
      <path d="M 67 42 C 72 42, 72 50, 67 50" />
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

/* ─────────────── Scissors Page Transition ─────────────── */
function ScissorsTransition({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(46,30,27,0.95)', backdropFilter: 'blur(6px)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Scissors SVG with clip animation */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          className="scissors-anim animate-pulse"
          fill="none"
          stroke="#FDF7EE"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
        <p className="text-[#FDF7EE] text-xs uppercase tracking-widest font-serif font-bold">Juan Rairan</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<BarberSettings | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dates, setDates] = useState<{ dayName: string; dayNum: string; dateStr: string }[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  // Guided steps:
  // 0 = Pantalla de bienvenida (splash)
  // 1 = Seleccionar servicio
  // 2 = Seleccionar fecha
  // 3 = Elegir horario
  // 4 = Confirmar datos y pago
  const [activeStep, setActiveStep] = useState<number>(0);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nequi');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load client details from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('barber_clientName');
      const storedPhone = localStorage.getItem('barber_clientPhone');
      if (storedName) setClientName(storedName);
      if (storedPhone) setClientPhone(storedPhone);
    }
  }, []);

  // Fetch Barber settings and initial slots
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/slots?date=${todayStr}`);
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          // Default to first service if available
          if (data.settings.services && data.settings.services.length > 0) {
            setSelectedService(data.settings.services[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Generate 7 working days
  useEffect(() => {
    const list = [];
    const today = new Date();
    const daysSpanish = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let added = 0;
    let offset = 0;
    while (added < 7) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + offset);
      
      // Excluir domingos
      if (nextDate.getDay() !== 0) {
        const dateStr = nextDate.toISOString().split('T')[0];
        list.push({
          dayName: daysSpanish[nextDate.getDay()],
          dayNum: nextDate.getDate().toString(),
          dateStr
        });
        added++;
      }
      offset++;
    }
    
    setDates(list);
    if (list.length > 0) {
      setSelectedDate(list[0].dateStr);
    }
  }, []);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchSlots = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        const data = await res.json();
        if (data.success) {
          setSlots(data.slots);
          if (data.settings) setSettings(data.settings);
          
          // Clear slot if no longer valid
          if (selectedSlot && !data.slots.some((s: TimeSlot) => s.time === selectedSlot.time && s.status === 'available')) {
            setSelectedSlot(null);
          }
        } else {
          setErrorMsg('No laboral o cerrado para este día.');
          setSlots([]);
        }
      } catch (err) {
        setErrorMsg('Falla de conexión al servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedService) return;
    if (!clientName || !clientPhone) {
      setErrorMsg('Por favor completa tu nombre y celular.');
      return;
    }
    if (paymentMethod !== 'Efectivo' && !receiptUploaded) {
      setErrorMsg('Por favor sube tu comprobante de pago.');
      return;
    }

    try {
      // Save client details to LocalStorage for convenience
      localStorage.setItem('barber_clientName', clientName);
      localStorage.setItem('barber_clientPhone', clientPhone);

      // Calcular hora fin basándonos en la duración del servicio seleccionado
      const [sh, sm] = selectedSlot.time.split(':').map(Number);
      const totalMin = sh * 60 + sm + selectedService.duration;
      const eh = Math.floor(totalMin / 60);
      const em = totalMin % 60;
      const endTimeStr = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          bookingDate: selectedDate,
          startTime: selectedSlot.time,
          endTime: endTimeStr,
          paymentMethod,
          serviceId: selectedService.id,
          serviceName: selectedService.name
        })
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
      } else {
        setErrorMsg(data.error || 'Ocurrió un error al agendar.');
      }
    } catch (err) {
      setErrorMsg('No se pudo enviar la reserva.');
    }
  };

  const goToStep = useCallback((next: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveStep(next);
      setTransitioning(false);
    }, 700);
  }, []);

  const nextStep = () => {
    setErrorMsg('');
    if (activeStep === 0) {
      goToStep(1);
    } else if (activeStep === 1) {
      if (!selectedService) {
        setErrorMsg('Por favor selecciona un servicio.');
        return;
      }
      goToStep(2);
    } else if (activeStep === 2) {
      if (!selectedDate) {
        setErrorMsg('Selecciona una fecha.');
        return;
      }
      goToStep(3);
    } else if (activeStep === 3) {
      if (!selectedSlot) {
        setErrorMsg('Selecciona un horario disponible.');
        return;
      }
      goToStep(4);
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  const currentBarberName = 'Juan Rairan';

  return (
    <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-between min-h-screen text-primary">
      <ScissorsTransition visible={transitioning} />
      {/* Header */}
      <header className="text-center mb-6 animate-in fade-in duration-300">
        <div className="barber-pole-border mb-4 rounded"></div>
        <div className="flex flex-col items-center gap-2 mt-3">
          <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center bg-card shadow-md">
            <BeardedManLogo className="w-11 h-11 text-primary" />
          </div>
          <h1 className="text-3xl font-serif tracking-widest text-primary uppercase drop-shadow-sm">
            {currentBarberName}
          </h1>
          <p className="text-[10px] text-primary/70 tracking-widest font-sans uppercase font-extrabold">
            JR &amp; Co.
          </p>
        </div>
      </header>

      {/* Guided Progress Indicator */}
      {activeStep > 0 && !bookingSuccess && (
        <div className="flex items-center justify-between px-3 mb-6 bg-card py-3 rounded-xl border-2 border-primary">
          <button 
            type="button"
            onClick={() => setActiveStep(1)}
            className="flex flex-col items-center cursor-pointer"
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${activeStep >= 1 ? 'bg-primary text-primary-foreground font-extrabold' : 'bg-background text-primary/45 border border-primary/30'}`}>1</div>
            <span className="text-[8px] text-primary mt-1 font-bold">Servicio</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-primary/50" />
          <button 
            type="button"
            disabled={activeStep < 2}
            onClick={() => setActiveStep(2)}
            className="flex flex-col items-center cursor-pointer disabled:opacity-40"
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${activeStep >= 2 ? 'bg-primary text-primary-foreground font-extrabold' : 'bg-background text-primary/45 border border-primary/30'}`}>2</div>
            <span className="text-[8px] text-primary mt-1 font-bold">Fecha</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-primary/50" />
          <button 
            type="button"
            disabled={activeStep < 3}
            onClick={() => setActiveStep(3)}
            className="flex flex-col items-center cursor-pointer disabled:opacity-40"
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${activeStep >= 3 ? 'bg-primary text-primary-foreground font-extrabold' : 'bg-background text-primary/45 border border-primary/30'}`}>3</div>
            <span className="text-[8px] text-primary mt-1 font-bold">Hora</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-primary/50" />
          <div className="flex flex-col items-center">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${activeStep >= 4 ? 'bg-primary text-primary-foreground font-extrabold' : 'bg-background text-primary/45 border border-primary/30'}`}>4</div>
            <span className="text-[8px] text-primary mt-1 font-bold">Confirmar</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center">
        {bookingSuccess ? (
          <div className="vip-panel p-6 text-center animate-in fade-in zoom-in duration-300 space-y-6">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/30">
              <Award className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-sans font-extrabold text-primary uppercase tracking-wide">¡Reserva Solicitada!</h2>
              <p className="text-xs text-muted-foreground mt-2">
                Tu cita ha quedado pre-agendada en JR &amp; Co. Barber. Te notificaremos por WhatsApp y validaremos tu transferencia a la brevedad.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-4 text-left border-2 border-primary/20 space-y-2 text-xs">
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground font-medium">Cliente:</span>
                <span className="text-foreground font-semibold">{clientName}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground font-medium">Servicio:</span>
                <span className="text-accent font-bold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground font-medium">Fecha:</span>
                <span className="text-foreground font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground font-medium">Hora de Inicio:</span>
                <span className="text-foreground font-semibold">{selectedSlot?.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Método de Pago:</span>
                <span className="text-foreground font-semibold">{paymentMethod}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setBookingSuccess(false);
                setSelectedSlot(null);
                setReceiptUploaded(false);
                setActiveStep(1);
              }}
              className="w-full py-3 gold-btn"
            >
              Volver a Agendar
            </button>

            <div className="pt-2">
              <Link 
                href={`/client/profile?phone=${encodeURIComponent(clientPhone)}`}
                className="text-xs text-[#C8A96B] hover:underline inline-flex items-center gap-1.5"
              >
                <Compass className="h-4 w-4" /> Ver mi Tarjeta de Fidelización
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-[#9c423b] bg-[#9c423b]/10 border border-[#9c423b]/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* PASO 0: PANTALLA DE BIENVENIDA */}
            {activeStep === 0 && (
              <div className="text-center py-6 space-y-8 animate-in fade-in duration-300">
                {/* Hero de Portada */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-primary bg-card p-8 min-h-[220px] flex flex-col justify-center space-y-4 shadow-md">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-serif text-primary font-extrabold leading-tight">
                      Menos espera.
                      <br />
                      Mejor experiencia.
                    </h2>
                    <p className="text-[10px] text-primary/70 tracking-wider uppercase font-bold">
                      VIP Ejecutivo • Exclusivo &amp; Sofisticado
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-4 gold-btn text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-2"
                >
                  Reservar Ahora <ArrowRight className="h-4.5 w-4.5" />
                </button>

                <div className="text-center pt-2">
                  <Link href="/client/profile" className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-bold">
                    <User className="h-3.5 w-3.5" /> ¿Ya tienes una cita? Consulta tu perfil
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 1: SERVICE SELECTOR */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Scissors className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Paso 1: Servicio</span>
                  </div>
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                  >
                    Atrás
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground italic">El precio se acuerda en la cita, varía según el cliente y el trabajo.</p>
                
                <div className="space-y-2.5">
                  {settings?.services?.map((service) => (
                    <button
                      type="button"
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border-2 flex justify-between items-center ${
                        selectedService?.id === service.id
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                          : 'bg-card border-primary/20 hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${
                          selectedService?.id === service.id ? 'text-primary-foreground' : 'text-foreground'
                        }`}>
                          {service.name}
                        </h3>
                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${
                          selectedService?.id === service.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-3 w-3" /> {service.duration} min
                        </p>
                      </div>
                      {selectedService?.id === service.id && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground"></span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-3 gold-btn flex items-center justify-center gap-1.5"
                >
                  Continuar a Fecha <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 2: DATE SELECTOR */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Paso 2: Fecha</span>
                  </div>
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                  >
                    Atrás
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {dates.map((d) => (
                    <button
                      type="button"
                      key={d.dateStr}
                      onClick={() => {
                        setSelectedDate(d.dateStr);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all border-2 ${
                        selectedDate === d.dateStr
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                          : 'bg-card border-primary/20 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold">{d.dayName}</span>
                      <span className="text-base font-bold mt-1">{d.dayNum}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-3 gold-btn flex items-center justify-center gap-1.5"
                >
                  Continuar a Horario <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 3: TIME SLOTS */}
            {activeStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Paso 3: Horario</span>
                  </div>
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                  >
                    Atrás
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 bg-primary/10 border border-primary/15 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 bg-card border-2 border-primary/15 rounded-2xl text-xs text-muted-foreground italic">
                    La barbería está cerrada o no labora el {selectedDate}.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const isOccupied = slot.status === 'confirmed' || slot.status === 'pending' || slot.status === 'completed';
                      const isLunch = slot.status === 'lunch';
                      
                      let borderClass = 'border-primary/20 bg-card text-foreground hover:border-primary/50';
                      let badge = null;

                      if (slot.status === 'recommended') {
                        borderClass = 'border-accent bg-accent/10 text-accent font-bold hover:bg-accent/20';
                        badge = <span className="absolute -top-1.5 -right-1 bg-accent text-[7px] font-bold px-1.5 py-0.5 rounded text-white tracking-wide uppercase animate-pulse">IA</span>;
                      } else if (slot.status === 'premium') {
                        borderClass = 'border-primary/40 bg-primary/5 text-primary hover:border-primary';
                        badge = <span className="absolute -top-1.5 -right-1 bg-primary text-[7px] font-bold px-1.5 py-0.5 rounded text-primary-foreground tracking-wide uppercase">Top</span>;
                      } else if (isOccupied || isLunch) {
                        borderClass = 'border-primary/8 bg-primary/5 text-muted-foreground/40 line-through cursor-not-allowed';
                      }

                      if (selectedSlot?.time === slot.time) {
                        borderClass = 'border-primary bg-primary text-primary-foreground font-extrabold shadow-lg scale-95';
                      }

                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={isOccupied || isLunch}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setErrorMsg('');
                          }}
                          className={`relative py-3 px-1 rounded-xl text-center text-xs font-bold transition-all border-2 ${borderClass}`}
                        >
                          {slot.time}
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Intelligent recommendation explanation */}
                {selectedSlot?.label && (
                  <div className="flex items-center gap-2 text-xs bg-accent/10 border border-accent/30 text-accent p-3 rounded-xl italic">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>{selectedSlot.label}</span>
                  </div>
                )}

                {selectedSlot && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 gold-btn flex items-center justify-center gap-1.5"
                  >
                    Confirmar Datos <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* STEP 4: CONFIRMATION & PAYMENT DETAILS */}
            {activeStep === 4 && selectedSlot && selectedService && (
              <form onSubmit={handleBookingSubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <CreditCard className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Paso 4: Confirmación</span>
                  </div>
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                  >
                    Atrás
                  </button>
                </div>

                <div className="vip-panel p-5 space-y-4">
                  {/* Summary */}
                  <div className="bg-primary/8 p-4 rounded-xl border-2 border-primary/20 text-xs">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Tu Reserva:</p>
                    <p className="text-foreground mt-1 font-bold text-sm">
                      {selectedService.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {selectedDate} a las <span className="text-primary font-bold">{selectedSlot.time}</span> ({selectedService.duration} min)
                    </p>
                  </div>

                  {/* Client Data */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Tu Nombre Completo</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Ej: Sebastián Ospina"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-xs vip-input"
                        />
                        <User className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">WhatsApp Celular</label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Ej: 3213016224"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-xs vip-input"
                        />
                        <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Método de Pago / Garantía</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setReceiptUploaded(false);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-lg text-xs vip-input"
                      >
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Llaves / Transfiya">Llaves / Transfiya</option>
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        <option value="Efectivo">Efectivo en Barbería</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment accounts detail */}
                  {paymentMethod !== 'Efectivo' ? (
                    <div className="bg-card rounded-xl p-4 border-2 border-primary/20 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold bg-accent/15 p-2 rounded-lg">
                        <span>💰 Garantía de Cita: $5.000 COP</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Cuentas de Transferencia:</p>
                        
                        {(paymentMethod === 'Nequi' || paymentMethod === 'Daviplata') && (
                          <div className="p-3 bg-primary/8 border-2 border-primary/15 rounded-lg animate-in fade-in">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold">Nequi y Daviplata</p>
                            <p className="font-bold text-foreground text-base mt-1 tracking-wider">321 301 6224</p>
                            <p className="text-[9px] text-muted-foreground mt-1">Envía tu transferencia a este celular.</p>
                          </div>
                        )}

                        {paymentMethod === 'Llaves / Transfiya' && (
                          <div className="p-3 bg-primary/8 border-2 border-primary/15 rounded-lg animate-in fade-in">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold">Llaves / Transfiya</p>
                            <p className="font-bold text-foreground text-base mt-1 tracking-wider">@davi3213016224</p>
                            <p className="text-[9px] text-muted-foreground mt-1">Transfiya usando nuestra llave única.</p>
                          </div>
                        )}

                        {paymentMethod === 'Transferencia Bancaria' && (
                          <div className="p-3 bg-primary/8 border-2 border-primary/15 rounded-lg text-xs text-muted-foreground space-y-1 animate-in fade-in">
                            <p className="text-accent font-bold">Bancolombia Ahorros</p>
                            <p>Número: <span className="text-foreground font-bold">123-456789-01</span></p>
                            <p>A nombre de: <span className="text-foreground font-semibold">JR &amp; Co. Barber</span></p>
                          </div>
                        )}

                        {paymentMethod === 'Otro' && (
                          <p className="text-[10px] text-muted-foreground italic">Coordina con tu barbero al WhatsApp.</p>
                        )}
                      </div>

                      {/* Mock Uploader */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setReceiptUploaded(true)}
                          className={`w-full py-2.5 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 text-xs transition-all ${
                            receiptUploaded 
                              ? 'border-success/50 bg-success/10 text-success' 
                              : 'border-primary/25 hover:border-primary/50 text-muted-foreground'
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {receiptUploaded ? '¡Comprobante Cargado!' : 'Sube foto del comprobante'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-accent/10 rounded-xl p-4 border-2 border-accent/25 text-xs text-foreground flex items-center gap-2">
                      <CreditCard className="h-4.5 w-4.5 text-accent" />
                      <span>Se cancelará directamente en la barbería.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 gold-btn uppercase tracking-wider"
                  >
                    Confirmar Cita
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer & Navigation links */}
      <footer className="mt-8 pt-4 border-t border-primary/20 flex flex-col items-center gap-3">
        <div className="flex gap-4 text-xs font-sans uppercase tracking-wider font-bold">
          <Link href="/client/profile" className="text-primary hover:underline flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Mi Perfil / Sellos
          </Link>
          <span className="text-primary/40">•</span>
          <Link href="/admin/dashboard" className="text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </Link>
        </div>
        <p className="text-[9px] text-primary/70 uppercase tracking-wider font-bold">
          © {new Date().getFullYear()} {currentBarberName} • JR &amp; Co.
        </p>
      </footer>
    </div>
  );
}
