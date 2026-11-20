import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registerNewCustomer } from '../services/loyaltyService';

export default function CustomerOnboarding({ businessId, onRegistered }) {
  const [business, setBusiness] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchBusiness() {
      try {
        let data = null;

        if (businessId && businessId !== 'default') {
          const res = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .limit(1);
          data = res.data;
        }

        // Si no se encontró por ID o vino como 'default', tomar el primer negocio disponible
        if (!data || data.length === 0) {
          const fallback = await supabase.from('businesses').select('*').limit(1);
          data = fallback.data;
        }

        if (data && data.length > 0) {
          setBusiness(data[0]);
        }
      } catch (err) {
        console.error('Error cargando negocio en onboarding:', err);
      }
    }

    fetchBusiness();
  }, [businessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const targetBusinessId =
      business?.id ||
      (businessId && businessId !== 'default' ? businessId : 'default-business');

    setLoading(true);
    setErrorMsg('');

    const res = await registerNewCustomer(targetBusinessId, fullName.trim(), phone.trim());

    if (res.success) {
      localStorage.setItem('loyalty_customer_id', res.customerId);
      onRegistered(res.customerId);
    } else {
      setErrorMsg(res.error || 'Hubo un problema al crear tu tarjeta. Intenta de nuevo.');
    }
    setLoading(false);
  };;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
          <span className="text-4xl mb-2 inline-block">🎁</span>
          <h1 className="text-xl font-bold tracking-tight">
            {business?.name || 'Programa de Lealtad'}
          </h1>
          <p className="text-white/90 text-sm mt-1">
            Activa tu tarjeta digital gratuita en 10 segundos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Tu Nombre (o nombre de tu mascota)
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Carlos / Max"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 0991234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creando tu tarjeta...' : 'Obtener mi Tarjeta Digital'}
          </button>

          <p className="text-[11px] text-center text-slate-400 pt-2">
            Sin contraseñas ni descargas. Tu tarjeta quedará guardada en este navegador.
          </p>
        </form>
      </div>
    </div>
  );
}