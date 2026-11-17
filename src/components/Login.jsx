import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Autenticación por enlace mágico (Magic Link) o inicio rápido
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('¡Revisa tu correo electrónico para el enlace de acceso!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <span className="text-3xl mb-2 inline-block">🐾</span>
          <h1 className="text-2xl font-bold text-slate-800">Acceso a Fidelización</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa con tu correo para ver tu tarjeta o panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Enviando enlace...' : 'Continuar con Correo'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-xs text-center ${message.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}