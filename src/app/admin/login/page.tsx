'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

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

  const barberName = "Juan Rairan";

  return (
    <div className="flex-1 w-full max-w-sm mx-auto px-4 py-16 flex flex-col justify-center min-h-screen text-primary">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border-2 border-primary bg-card shadow-md mb-4">
          <BeardedManLogo className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-serif text-primary uppercase tracking-widest">
          {barberName}
        </h1>
        <p className="text-[10px] text-primary/70 uppercase tracking-wider font-bold mt-1">
          Panel Administrativo VIP
        </p>
      </div>

      {/* Login Card */}
      <div className="vip-panel p-7 space-y-6">
        {/* Barber pole accent line */}
        <div className="barber-pole-border rounded mb-2" />

        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-background border border-primary/20 mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-base font-serif text-primary tracking-wide">Acceso Administrativo</h2>
          <p className="text-[11px] text-primary/70 mt-1">
            Gestiona citas, aprueba pagos y optimiza tu agenda.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium text-primary/80 uppercase tracking-wider block mb-1">
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
              <label className="text-[9px] font-medium text-primary/80 uppercase tracking-wider block mb-1">
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
            <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
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

        <div className="bg-background/40 border border-primary/20 p-3.5 rounded-xl text-center">
          <p className="text-[10px] text-primary/80">
            🔒 Credenciales de prueba pre-completadas por defecto.
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] text-primary/70 uppercase tracking-wider mt-6 font-bold">
        © {new Date().getFullYear()} {barberName} • JR &amp; Co.
      </p>
    </div>
  );
}
