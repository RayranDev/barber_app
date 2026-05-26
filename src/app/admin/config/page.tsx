'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, Save, Shield, Calendar, Sparkles, CheckCircle,
  Scissors, Award, Trash2, Plus, User, Type, Coffee
} from 'lucide-react';
import { BarberSettings, Service } from '@/lib/supabase';
import Link from 'next/link';

export default function BarberConfig() {
  const [settings, setSettings] = useState<BarberSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // New service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(40);

  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const session = localStorage.getItem('barber_session');
    if (!session) {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleDayToggle = (day: string) => {
    if (!settings) return;
    const schedule = settings.weeklySchedule[day];
    setSettings({
      ...settings,
      weeklySchedule: {
        ...settings.weeklySchedule,
        [day]: {
          ...schedule,
          active: !schedule.active
        }
      }
    });
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    if (!settings) return;
    const schedule = settings.weeklySchedule[day];
    setSettings({
      ...settings,
      weeklySchedule: {
        ...settings.weeklySchedule,
        [day]: {
          ...schedule,
          [type]: value
        }
      }
    });
  };

  // Service Catalog Actions
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !newServiceName) return;
    
    const newService: Service = {
      id: 'srv-' + Math.random().toString(36).substr(2, 9),
      name: newServiceName,
      duration: newServiceDuration
    };

    setSettings({
      ...settings,
      services: [...(settings.services || []), newService]
    });

    setNewServiceName('');
    setNewServiceDuration(40);
  };

  const handleRemoveService = (serviceId: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      services: settings.services.filter(s => s.id !== serviceId)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (loading || !settings) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-[#bdae9e] font-serif italic text-xs">Alineando navajas y caobas...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-6 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#d4af37]/20 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="p-2 rounded bg-[#171311] hover:bg-[#1e1917] text-[#bdae9e] border border-[#d4af37]/15 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-sans font-extrabold text-primary uppercase flex items-center gap-1.5 tracking-wider">
              Configuración <span className="text-[9px] bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded uppercase font-sans">Admin</span>
            </h1>
            <p className="text-[10px] text-muted-foreground">Personaliza JR & CO, servicios, programas de fidelidad y horarios de Juan Rairan.</p>
          </div>
        </div>
      </header>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ROW 1: BARBER IDENTITY & LOYALTY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Barber Identity */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Identidad de la Barbería
            </h2>
            <div className="vintage-panel p-5 border-[#d4af37]/15 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nombre Comercial de la Barbería</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={settings.barberName || ''}
                    onChange={(e) => setSettings({ ...settings, barberName: e.target.value })}
                    placeholder="JR & Co."
                    className="w-full pl-9 pr-3 py-2 text-xs vintage-input"
                  />
                  <Type className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8a7a6b]" />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Este nombre se mostrará como marca principal. Barbero: Juan Rairan.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Cita Base (min)</label>
                  <select
                    value={settings.slotDurationMinutes}
                    onChange={(e) => setSettings({ ...settings, slotDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs vintage-input"
                    style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                  >
                    <option value="20">20 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="40">40 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Horario Almuerzo</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={settings.lunchStart || ''}
                      onChange={(e) => setSettings({ ...settings, lunchStart: e.target.value })}
                      placeholder="13:00"
                      className="w-1/2 px-2 py-1.5 text-center text-xs vintage-input"
                    />
                    <span className="text-xs text-[#8a7a6b]">-</span>
                    <input
                      type="text"
                      value={settings.lunchEnd || ''}
                      onChange={(e) => setSettings({ ...settings, lunchEnd: e.target.value })}
                      placeholder="14:00"
                      className="w-1/2 px-2 py-1.5 text-center text-xs vintage-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Loyalty Config */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Award className="h-4 w-4" /> Tarjeta de Fidelización (Sellos)
            </h2>
            <div className="vintage-panel p-5 border-[#d4af37]/15 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Sellos requeridos para premio</label>
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={settings.loyaltyVisitsRequired}
                  onChange={(e) => setSettings({ ...settings, loyaltyVisitsRequired: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs vintage-input"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Premio / Beneficio al Completar</label>
                <input
                  type="text"
                  required
                  value={settings.loyaltyBenefit || ''}
                  onChange={(e) => setSettings({ ...settings, loyaltyBenefit: e.target.value })}
                  placeholder="50% de descuento en tu siguiente combo corte + barba"
                  className="w-full px-3 py-2 text-xs vintage-input"
                />
                <p className="text-[9px] text-[#8a7a6b] mt-1">Se muestra en la tarjeta de fidelización del cliente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: SERVICE CATALOG CATALOG */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Scissors className="h-4.5 w-4.5" /> Catálogo de Servicios (Sin Precios)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List Services */}
            <div className="md:col-span-2 vintage-panel p-5 border-[#d4af37]/15 space-y-3">
              <p className="text-[10px] text-[#8a7a6b] italic mb-2">
                Los precios de los servicios no se configuran, ya que varían por cliente. Sólo se administra el nombre y duración.
              </p>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {settings.services?.map((srv) => (
                  <div 
                    key={srv.id}
                    className="flex justify-between items-center p-4 bg-card border-2 border-primary/20 hover:border-primary/50 rounded-2xl transition-all"
                  >
                    <div>
                      <p className="text-xs text-foreground uppercase font-bold tracking-wider">{srv.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{srv.duration} minutos de duración</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(srv.id)}
                      className="p-1.5 text-[#ab4e46] hover:bg-[#ab4e46]/10 rounded transition-all"
                      title="Eliminar Servicio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Service Form */}
            <div className="vintage-panel p-5 border-[#d4af37]/15 space-y-3.5">
              <p className="text-xs text-primary font-bold uppercase tracking-wider border-b border-primary/15 pb-1">
                Añadir Nuevo Servicio
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nombre del Servicio</label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Ej: Corte con Toalla Caliente"
                    className="w-full px-3 py-2 text-xs vintage-input"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Duración del Servicio (min)</label>
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs vintage-input"
                    style={{ backgroundColor: '#110e0c', color: '#f4efea' }}
                  >
                    <option value="20">20 min</option>
                    <option value="30">30 min</option>
                    <option value="40">40 min</option>
                    <option value="50">50 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddService}
                  className="w-full py-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/35 text-[#d4af37] text-xs font-semibold rounded uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: WEEKLY CONFIG */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5" /> Horario de Trabajo Semanal
          </h2>

          <div className="vintage-panel p-5 border-[#d4af37]/15 space-y-3">
            {['1', '2', '3', '4', '5', '6', '0'].map((day) => {
              const dayName = dayNames[Number(day)];
              const schedule = settings.weeklySchedule[day];

              if (!schedule) return null;

              return (
                <div 
                  key={day} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl transition-all ${
                    schedule.active 
                      ? 'bg-card border-primary/20 hover:border-primary/50' 
                      : 'bg-card/40 border-primary/10 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={schedule.active}
                      onChange={() => handleDayToggle(day)}
                      className="rounded border-[#d4af37]/30 text-[#d4af37] focus:ring-[#d4af37] bg-[#110e0c]"
                    />
                    <span className="text-xs font-bold text-foreground min-w-[80px] uppercase tracking-wide">{dayName}</span>
                  </div>

                  {schedule.active && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <input
                        type="text"
                        value={schedule.start}
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                        placeholder="08:00"
                        className="w-16 px-2 py-1 bg-[#171311] border border-[#d4af37]/20 text-center text-xs text-white rounded"
                      />
                      <span className="text-[#8a7a6b] text-xs">a</span>
                      <input
                        type="text"
                        value={schedule.end}
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                        placeholder="20:00"
                        className="w-16 px-2 py-1 bg-[#171311] border border-[#d4af37]/20 text-center text-xs text-white rounded"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button and status */}
        <div className="flex justify-between items-center pt-2 border-t border-[#d4af37]/15">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-[#859f7d] bg-[#859f7d]/10 border border-[#859f7d]/20 px-3.5 py-2 rounded">
              <CheckCircle className="h-4 w-4" />
              <span>Configuración guardada exitosamente.</span>
            </div>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 gold-btn uppercase text-xs tracking-wider"
          >
            {saving ? 'Guardando...' : 'Guardar Todo'}
          </button>
        </div>
      </form>
    </div>
  );
}
