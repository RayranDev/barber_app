'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, Scissors } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@barberia.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (email === 'admin@barberia.com' && password === 'admin123') {
      setTimeout(() => {
        localStorage.setItem('barber_session', 'true');
        router.push('/admin/dashboard');
      }, 800);
    } else {
      setErrorMsg('Credenciales inválidas. Usa las credenciales de prueba.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-sm mx-auto px-4 py-16 flex flex-col justify-center min-h-screen">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-2 border-[#C8A96B] bg-[#121212] shadow-[0_0_24px_rgba(200,169,107,0.2)] mb-4">
          <Scissors className="h-7 w-7 text-[#C8A96B]" />
        </div>
        <h1 className="text-2xl font-serif text-[#C8A96B] uppercase tracking-widest">
          JR &amp; Co. Barber
        </h1>
        <p className="text-[10px] text-[#a39f96] uppercase tracking-wider mt-1">
          Panel Administrativo VIP
        </p>
      </div>

      {/* Login Card */}
      <div className="vip-panel p-7 space-y-6">
        {/* Barber pole accent line */}
        <div className="barber-pole-border rounded mb-2" />

        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-[#C8A96B]/10 border border-[#C8A96B]/20 mb-3">
            <Lock className="h-5 w-5 text-[#C8A96B]" />
          </div>
          <h2 className="text-base font-serif text-[#F5F1E8] tracking-wide">Acceso Administrativo</h2>
          <p className="text-[11px] text-[#a39f96] mt-1">
            Gestiona citas, aprueba pagos y optimiza tu agenda.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium text-[#a39f96] uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@barberia.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-xs vip-input"
              />
            </div>

            <div>
              <label className="text-[9px] font-medium text-[#a39f96] uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-xs vip-input"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-[#9c423b] bg-[#9c423b]/10 border border-[#9c423b]/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gold-btn flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {loading ? 'Verificando acceso...' : 'Ingresar al Panel'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="bg-[#C8A96B]/5 border border-[#C8A96B]/15 p-3.5 rounded-xl text-center">
          <p className="text-[10px] text-[#a39f96]">
            🔒 Credenciales de prueba pre-completadas por defecto.
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] text-[#a39f96] uppercase tracking-wider mt-6">
        © {new Date().getFullYear()} JR &amp; Co. Barber • VIP Executive Salon
      </p>
    </div>
  );
}
