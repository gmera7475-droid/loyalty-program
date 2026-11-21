import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BusinessSetup({ session, onBusinessCreated }) {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('vet');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardDescription, setRewardDescription] = useState('Servicio o producto gratis');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('businesses')
      .insert([{
        owner_id: session.user.id,
        name: name.trim(),
        business_type: businessType,
        stamps_required: Number(stampsRequired),
        reward_description: rewardDescription.trim()
      }])
      .select()
      .single();

    if (error) {
      setErrorMsg(`No se pudo crear el negocio: ${error.message}`);
    } else if (data) {
      onBusinessCreated(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
          <span className="text-3xl mb-2 inline-block">🏪</span>
          <h1 className="text-xl font-bold">Configura tu Negocio</h1>
          <p className="text-slate-300 text-sm mt-1">
            Personaliza tu programa de fidelización para empezar a registrar clientes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre del Negocio
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Café Central / Estética Bella"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Rubro / Categoría
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="vet">🐾 Veterinaria / Pet Shop</option>
              <option value="salon">✂️ Estética / Barbería / Spa</option>
              <option value="restaurant">🍴 Restaurante / Cafetería</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sellos para Premio
              </label>
              <input
                type="number"
                min="3"
                max="20"
                required
                value={stampsRequired}
                onChange={(e) => setStampsRequired(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Recompensa al Completar
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 1 Café o Postre gratis"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Guardando negocio...' : 'Crear mi Programa de Lealtad'}
          </button>
        </form>
      </div>
    </div>
  );
}