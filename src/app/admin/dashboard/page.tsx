'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Calendar, TrendingUp, Clock, DollarSign, LogOut, Check, X, Send, 
  AlertTriangle, UserPlus, Filter, Shield, Settings, Eye, CheckCircle2, History, ChevronRight,
  Scissors, Award, Trash2, Plus, Phone, Heart
} from 'lucide-react';
import { Booking, BarberSettings, Service } from '@/lib/supabase';
import { ReallocationSuggestion } from '@/lib/engine/optimizer';
import Link from 'next/link';

type CalendarView = 'day' | 'week' | 'month';

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [suggestions, setSuggestions] = useState<ReallocationSuggestion[]>([]);
  const [settings, setSettings] = useState<BarberSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Customer History Modal
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<Booking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [clientLoyaltyData, setClientLoyaltyData] = useState<{ stamps: number; totalVisits: number } | null>(null);

  // Reschedule Modal
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newTime, setNewTime] = useState<string>('08:00');

  // Add Appointment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newSelectedService, setNewSelectedService] = useState<Service | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Nequi' | 'Daviplata' | 'Llaves / Transfiya' | 'Transferencia Bancaria' | 'Efectivo' | 'Otro'>('Nequi');
  
  // Metrics State
  const [metrics, setMetrics] = useState({
    occupancy: 0,
    continuity: 0,
    deadHours: 0,
    earnings: 0
  });

  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('barber_session');
    if (!session) {
      router.push('/admin/login');
    }
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, [router]);

  const fetchData = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const bookRes = await fetch(`/api/booking?date=${selectedDate}`);
      const bookData = await bookRes.json();
      
      const optRes = await fetch(`/api/admin/optimize?date=${selectedDate}`);
      const optData = await optRes.json();

      if (bookData.success && optData.success) {
        setBookings(bookData.bookings);
        setSuggestions(optData.suggestions);
        if (optData.settings) {
          setSettings(optData.settings);
          if (optData.settings.services && optData.settings.services.length > 0 && !newSelectedService) {
            setNewSelectedService(optData.settings.services[0]);
          }
        }
        
        // Calculate metrics
        const confirmedBookings = bookData.bookings.filter((b: Booking) => b.status === 'confirmed');
        const completedBookings = bookData.bookings.filter((b: Booking) => b.status === 'completed');
        const pendingBookings = bookData.bookings.filter((b: Booking) => b.status === 'pending');
        const activeCount = confirmedBookings.length + pendingBookings.length + completedBookings.length;
        
        const occupancy = Math.round((activeCount / 18) * 100);
        // Suponer un promedio estimado para métricas de 35.000 COP por servicio
        const earnings = (confirmedBookings.length + completedBookings.length) * 35000;
        const deadHours = Math.max(0, 12 - (activeCount * 40 / 60));

        setMetrics({
          occupancy: Math.min(occupancy, 100),
          continuity: optData.metrics.efficiencyScore || 0,
          deadHours: Number(deadHours.toFixed(1)),
          earnings
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleUpdateStatus = async (id: string, status: Booking['status'], booking: Booking) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          clientName: booking.clientName,
          clientPhone: booking.clientPhone,
          bookingDate: selectedDate,
          startTime: booking.startTime
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking) return;
    setActionLoading(`resched-${rescheduleBooking.id}`);
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleBooking.id,
          startTime: newTime,
          endTime: newTime
        })
      });
      const data = await res.json();
      if (data.success) {
        setRescheduleBooking(null);
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchHistory = async (phone: string) => {
    setHistoryPhone(phone);
    setLoadingHistory(true);
    setClientLoyaltyData(null);
    try {
      const res = await fetch(`/api/booking?phone=${phone}`);
      const data = await res.json();
      if (data.success) {
        setClientHistory(data.bookings);
      }

      // Fetch loyalty stamp info
      const clientRes = await fetch(`/api/booking?phone=${encodeURIComponent(phone)}&info=client`);
      const clientData = await clientRes.json();
      if (clientData.success && clientData.client) {
        setClientLoyaltyData({
          stamps: clientData.client.loyaltyStamps,
          totalVisits: clientData.client.totalVisits
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendSuggestion = async (sug: ReallocationSuggestion) => {
    setActionLoading(`sug-${sug.bookingId}`);
    try {
      const res = await fetch('/api/admin/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: sug.clientName,
          clientPhone: sug.clientPhone,
          bookingDate: selectedDate,
          currentSlot: sug.currentSlot,
          suggestedSlot: sug.suggestedSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sugerencia enviada exitosamente a ${sug.clientName} vía WhatsApp.`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSelectedService) return;

    // Calcular hora de fin según duración de servicio
    const [sh, sm] = newStartTime.split(':').map(Number);
    const totalMin = sh * 60 + sm + newSelectedService.duration;
    const eh = Math.floor(totalMin / 60);
    const em = totalMin % 60;
    const endTimeStr = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClientName,
          clientPhone: newClientPhone,
          bookingDate: selectedDate,
          startTime: newStartTime,
          endTime: endTimeStr,
          paymentMethod: newPaymentMethod,
          serviceId: newSelectedService.id,
          serviceName: newSelectedService.name,
          status: 'confirmed' // Reservas manuales se crean confirmadas por defecto
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewClientName('');
        setNewClientPhone('');
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('barber_session');
    router.push('/admin/login');
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const barberName = settings?.barberName || 'La Elegante Barbería';

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#d4af37]/20 pb-4">
        <div>
          <h1 className="text-xl font-serif text-[#d4af37] uppercase flex items-center gap-1.5 tracking-wider">
            {barberName} <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25 px-2 py-0.5 rounded font-mono uppercase font-bold">Admin Panel</span>
          </h1>
          <p className="text-[10px] text-[#bdae9e] italic">Gestión inteligente clásica, compactación de agenda y fidelidad.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/config')}
            className="px-3.5 py-2 rounded bg-[#171311] hover:bg-[#1e1917] text-[#d4af37] border border-[#d4af37]/20 transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            <Settings className="h-4 w-4" /> Configuración
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded bg-[#171311] hover:bg-[#ab4e46]/10 hover:text-[#ab4e46] text-[#bdae9e] border border-[#d4af37]/15 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* View Options & Filters */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 items-start md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#171311] border border-[#d4af37]/20 p-1 px-2.5 rounded text-xs text-[#bdae9e]">
            <Calendar className="h-4 w-4 text-[#d4af37]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-[#f4efea] outline-none font-bold"
            />
          </div>

          {/* Calendar View Switcher */}
          <div className="bg-[#171311] p-1 rounded border border-[#d4af37]/10 flex gap-1 text-[10px] uppercase font-bold text-[#8a7a6b]">
            {(['day', 'week', 'month'] as CalendarView[]).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded transition-all ${
                  calendarView === view ? 'bg-[#d4af37] text-[#1c1512]' : 'hover:text-[#f4efea]'
                }`}
              >
                {view === 'day' ? 'Día' : view === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button Group */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 gold-btn text-xs uppercase tracking-wider w-full md:w-auto"
        >
          <UserPlus className="h-3.5 w-3.5" /> Agregar Reserva Manual
        </button>
      </div>

      {/* Metrics Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="vintage-panel p-4 border-[#d4af37]/15 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#8a7a6b] font-bold uppercase tracking-wider">Ocupación</span>
            <TrendingUp className="h-4 w-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">{metrics.occupancy}%</div>
          <div className="text-[9px] text-[#8a7a6b]">Capacidad reservada hoy</div>
        </div>

        <div className="vintage-panel p-4 border-[#d4af37]/15 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#8a7a6b] font-bold uppercase tracking-wider">Compactación IA</span>
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">{metrics.continuity}%</div>
          <div className="text-[9px] text-[#8a7a6b]">Densidad y eficiencia de slots</div>
        </div>

        <div className="vintage-panel p-4 border-[#d4af37]/15 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#8a7a6b] font-bold uppercase tracking-wider">Tiempos Muertos</span>
            <Clock className="h-4 w-4 text-[#c5a880]" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">{metrics.deadHours}h</div>
          <div className="text-[9px] text-[#8a7a6b]">Horas vacías acumuladas</div>
        </div>

        <div className="vintage-panel p-4 border-[#d4af37]/15 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#8a7a6b] font-bold uppercase tracking-wider">Ingresos COP</span>
            <DollarSign className="h-4 w-4 text-[#859f7d]" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">${metrics.earnings.toLocaleString('es-CO')}</div>
          <div className="text-[9px] text-[#8a7a6b]">Citas confirmadas y completadas</div>
        </div>
      </div>

      {/* Main Administrative Layout */}
      {calendarView === 'day' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Day View Bookings List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-serif uppercase tracking-wider text-[#d4af37]">Listado de Reservas ({selectedDate})</h2>
              
              {/* Status filter bar */}
              <div className="flex items-center gap-1 bg-[#171311] border border-[#d4af37]/15 p-1 rounded text-[9px] uppercase font-bold text-[#8a7a6b]">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      statusFilter === filter ? 'bg-[#d4af37] text-[#1c1512]' : 'hover:text-[#f4efea]'
                    }`}
                  >
                    {filter === 'all' ? 'Ver todo' : filter === 'pending' ? 'Pendiente' : filter === 'confirmed' ? 'Confirmado' : filter === 'completed' ? 'Completado' : 'Cancelado'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-16 bg-[#171311] border border-[#d4af37]/5 rounded animate-pulse" />
                <div className="h-16 bg-[#171311] border border-[#d4af37]/5 rounded animate-pulse" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="vintage-panel p-8 text-center text-[#8a7a6b] italic rounded-lg">
                Ninguna cita coincide con el filtro seleccionado.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="vintage-panel p-4 border-[#d4af37]/15 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#1e1917] transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-bold text-white uppercase">{booking.clientName}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 border rounded uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'border-[#d4af37]/35 text-[#d4af37] bg-[#d4af37]/5' :
                          booking.status === 'completed' ? 'border-[#859f7d]/35 text-[#859f7d] bg-[#859f7d]/5' :
                          booking.status === 'pending' ? 'border-[#d99f59]/35 text-[#d99f59] bg-[#d99f59]/5' :
                          'border-[#ab4e46]/35 text-[#ab4e46] bg-[#ab4e46]/5'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-[#bdae9e] flex flex-wrap items-center gap-3">
                        <span className="text-[#d4af37] font-semibold">{booking.serviceName || 'Corte Clásico'}</span>
                        <span>🕒 {booking.startTime} - {booking.endTime}</span>
                        <span>📞 {booking.clientPhone}</span>
                        <span className="bg-[#110e0c] px-2 py-0.5 rounded text-[10px] text-[#bdae9e] border border-[#d4af37]/10 font-semibold">{booking.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchHistory(booking.clientPhone)}
                        className="p-2 bg-[#110e0c] hover:bg-[#171311] text-[#bdae9e] rounded border border-[#d4af37]/15 transition-all"
                        title="Historial & Fidelidad del Cliente"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setRescheduleBooking(booking);
                          setNewTime(booking.startTime);
                        }}
                        className="p-2 bg-[#110e0c] hover:bg-[#171311] text-[#bdae9e] rounded border border-[#d4af37]/15 transition-all"
                        title="Reagendar Cita"
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </button>

                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id!, 'confirmed', booking)}
                          disabled={actionLoading === booking.id}
                          className="p-2 bg-[#859f7d]/10 text-[#859f7d] hover:bg-[#859f7d]/20 rounded border border-[#859f7d]/35 transition-all"
                          title="Confirmar Cita"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id!, 'completed', booking)}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1.5 bg-[#859f7d] text-[#1c1512] font-bold text-[10px] hover:bg-[#96b08e] rounded transition-all uppercase flex items-center gap-1 shadow-md shadow-[#859f7d]/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                        </button>
                      )}

                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id!, 'cancelled', booking)}
                          disabled={actionLoading === booking.id}
                          className="p-2 bg-[#ab4e46]/10 text-[#ab4e46] hover:bg-[#ab4e46]/20 rounded border border-[#ab4e46]/35 transition-all"
                          title="Cancelar Cita"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Optimizer Recommendations Panel */}
          <div className="space-y-4">
            <h2 className="text-xs font-serif uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#d4af37]" /> Optimizador de Agenda IA
            </h2>

            <div className="vintage-panel p-5 border-[#d4af37]/15 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-white tracking-wider">Continuidad del Día</span>
                {metrics.continuity < 75 ? (
                  <span className="text-[8px] bg-[#ab4e46]/10 text-[#ab4e46] border border-[#ab4e46]/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    ⚠️ Tiempos Muertos
                  </span>
                ) : (
                  <span className="text-[8px] bg-[#859f7d]/10 text-[#859f7d] border border-[#859f7d]/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Agenda Compacta
                  </span>
                )}
              </div>

              <p className="text-xs text-[#bdae9e] leading-relaxed">
                El motor analiza la continuidad de citas. Si detecta que un cliente está aislado o genera tiempos muertos, listará propuestas para reubicarlo.
              </p>

              {suggestions.length === 0 ? (
                <div className="p-4 bg-[#110e0c] border border-dashed border-[#d4af37]/10 text-center text-xs text-[#8a7a6b] rounded-lg italic">
                  No hay oportunidades de reagendamiento sugeridas para este día.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((sug, idx) => (
                    <div key={idx} className="bg-[#d4af37]/5 border border-[#d4af37]/15 p-3.5 rounded space-y-2">
                      <p className="text-[8px] font-bold text-[#d4af37] uppercase tracking-wider">💡 Propuesta de Reubicación</p>
                      <p className="text-xs text-white">
                        Mover a <span className="font-semibold">{sug.clientName}</span> de <span className="line-through text-[#8a7a6b]">{sug.currentSlot}</span> a las <span className="font-bold text-[#d4af37]">{sug.suggestedSlot}</span>.
                      </p>
                      <p className="text-[10px] text-[#bdae9e] italic">{sug.reason}</p>
                      <button
                        onClick={() => handleSendSuggestion(sug)}
                        disabled={actionLoading === `sug-${sug.bookingId}`}
                        className="w-full mt-1.5 py-1.5 bg-[#171311] hover:bg-[#1e1917] border border-[#d4af37]/35 text-[#d4af37] rounded text-[10px] font-semibold transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
                      >
                        <Send className="h-3 w-3" />
                        {actionLoading === `sug-${sug.bookingId}` ? 'Enviando...' : 'Enviar Sugerencia WhatsApp'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : calendarView === 'week' ? (
        /* Weekly calendar display */
        <div className="vintage-panel p-6 border-[#d4af37]/15 space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xs font-serif uppercase tracking-wider text-[#d4af37]">Resumen Semanal</h2>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, idx) => {
              const dateOffset = new Date(selectedDate + 'T00:00:00');
              dateOffset.setDate(dateOffset.getDate() - dateOffset.getDay() + idx + 1);
              const dateStr = dateOffset.toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setCalendarView('day');
                  }}
                  className="p-4 bg-[#110e0c] border border-[#d4af37]/10 rounded hover:border-[#d4af37] transition-all text-left space-y-2 flex flex-col justify-between min-h-[90px]"
                >
                  <div>
                    <span className="text-[9px] font-bold text-[#8a7a6b] uppercase tracking-wider">{day}</span>
                    <p className="text-base font-serif font-bold text-white mt-1">{dateOffset.getDate()}</p>
                  </div>
                  <span className="text-[8px] text-[#d4af37] font-semibold bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20 inline-block mt-2 uppercase">Ver agenda</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Monthly calendar grid view */
        <div className="vintage-panel p-6 border-[#d4af37]/15 space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xs font-serif uppercase tracking-wider text-[#d4af37]">Vista de Mes Completo</h2>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold text-[#8a7a6b] mb-2 border-b border-[#d4af37]/15 pb-2">
            <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, idx) => {
              const dateOffset = new Date(selectedDate + 'T00:00:00');
              dateOffset.setDate(dateOffset.getDate() - dateOffset.getDay() + idx);
              const dateStr = dateOffset.toISOString().split('T')[0];
              
              const isCurrentDay = dateStr === selectedDate;
              const isSunday = dateOffset.getDay() === 0;

              return (
                <button
                  key={idx}
                  disabled={isSunday}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setCalendarView('day');
                  }}
                  className={`p-3 rounded border text-left flex flex-col justify-between min-h-[64px] transition-all ${
                    isCurrentDay ? 'bg-[#d4af37]/15 border-[#d4af37] text-white' :
                    isSunday ? 'bg-[#0d0b0a] text-[#2b2320] border-transparent cursor-not-allowed' :
                    'bg-[#110e0c] border-[#d4af37]/10 text-[#bdae9e] hover:border-[#d4af37]'
                  }`}
                >
                  <span className="text-[10px] font-bold">{dateOffset.getDate()}</span>
                  {!isSunday && <span className="text-[8px] bg-[#171311] border border-[#d4af37]/10 text-[#d4af37] px-1 py-0.5 rounded mt-1 self-start font-mono">Ver</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer History & Loyalty Modal */}
      {historyPhone && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="vintage-panel p-6 border-[#d4af37]/35 w-full max-w-md space-y-4 animate-in zoom-in duration-300 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#d4af37]/25 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4" /> Historial & Fidelidad
                </h3>
                <p className="text-[10px] text-[#bdae9e] mt-0.5">Celular: {historyPhone}</p>
              </div>
              <button onClick={() => setHistoryPhone(null)} className="text-[#8a7a6b] hover:text-white">✕</button>
            </div>
            
            {/* Stamp information if retrieved */}
            {clientLoyaltyData && (
              <div className="bg-[#110e0c] p-3 rounded border border-[#d4af37]/15 space-y-2">
                <p className="text-[9px] uppercase font-bold text-[#bdae9e] tracking-wider flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-[#d4af37]" /> Tarjeta de Fidelización
                </p>
                <div className="flex justify-between text-xs text-white">
                  <span>Sellos acumulados:</span>
                  <span className="text-[#d4af37] font-bold">{clientLoyaltyData.stamps} / {settings?.loyaltyVisitsRequired || 5}</span>
                </div>
                <div className="flex justify-between text-xs text-white">
                  <span>Visitas totales:</span>
                  <span className="text-[#d4af37] font-bold">{clientLoyaltyData.totalVisits}</span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-[#bdae9e] animate-pulse">Obteniendo historial...</div>
              ) : clientHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8a7a6b] italic">Este cliente no registra reservas pasadas.</div>
              ) : (
                clientHistory.map((h, i) => (
                  <div key={i} className="p-3 bg-[#110e0c] border border-[#d4af37]/10 rounded flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-white font-serif uppercase tracking-wide text-[11px]">{h.serviceName || 'Corte Clásico'}</p>
                      <p className="text-zinc-500 text-[10px]">{h.bookingDate} | {h.startTime} | Pago: {h.paymentMethod}</p>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                      h.status === 'confirmed' ? 'border-[#d4af37]/35 text-[#d4af37]' :
                      h.status === 'completed' ? 'border-[#859f7d]/35 text-[#859f7d]' :
                      h.status === 'pending' ? 'border-[#d99f59]/35 text-[#d99f59]' :
                      'border-[#ab4e46]/35 text-[#ab4e46]'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="vintage-panel p-6 border-[#d4af37]/35 w-full max-w-sm space-y-4 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider">Reagendar Cita</h3>
              <button onClick={() => setRescheduleBooking(null)} className="text-[#8a7a6b] hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="space-y-2 text-xs">
                <p className="text-[#bdae9e]">Cliente: <span className="text-white font-semibold font-serif uppercase">{rescheduleBooking.clientName}</span></p>
                <p className="text-[#bdae9e]">Servicio: <span className="text-[#d4af37] font-semibold">{rescheduleBooking.serviceName || 'Corte Clásico'}</span></p>
                <p className="text-[#bdae9e]">Hora actual: <span className="text-white font-semibold">{rescheduleBooking.startTime}</span></p>
              </div>

              <div>
                <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Nueva Hora de Inicio</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded text-xs vintage-input"
                  style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:20">09:20 AM</option>
                  <option value="10:40">10:40 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:40">14:40 PM</option>
                  <option value="16:00">16:00 PM</option>
                  <option value="17:20">17:20 PM</option>
                  <option value="18:40">18:40 PM</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading === `resched-${rescheduleBooking.id}`}
                className="w-full py-3 gold-btn uppercase tracking-wider text-xs"
              >
                Confirmar Cambio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="vintage-panel p-6 border-[#d4af37]/35 w-full max-w-sm space-y-4 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider">Agregar Reserva Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#8a7a6b] hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddBooking} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: David Restrepo"
                  className="w-full px-3 py-2 text-xs vintage-input"
                />
              </div>

              <div>
                <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Teléfono WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Ej: 3213016224"
                  className="w-full px-3 py-2 text-xs vintage-input"
                />
              </div>

              <div>
                <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Servicio Elegido</label>
                <select
                  value={newSelectedService?.id || ''}
                  onChange={(e) => {
                    const match = settings?.services?.find(s => s.id === e.target.value);
                    if (match) setNewSelectedService(match);
                  }}
                  className="w-full px-3 py-2 text-xs vintage-input"
                  style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                >
                  {settings?.services?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Hora Inicio</label>
                  <select
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs vintage-input"
                    style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:20">09:20 AM</option>
                    <option value="10:40">10:40 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:40">14:40 PM</option>
                    <option value="16:00">16:00 PM</option>
                    <option value="17:20">17:20 PM</option>
                    <option value="18:40">18:40 PM</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-medium text-[#bdae9e] uppercase tracking-wider block mb-1">Método Pago</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e: any) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs vintage-input"
                    style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                  >
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Llaves / Transfiya">Llaves / Transfiya</option>
                    <option value="Transferencia Bancaria">Transf. Bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 gold-btn uppercase tracking-wider text-xs"
              >
                Insertar Reserva
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
