import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BusinessSettingsModal({ business, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('vet');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardDescription, setRewardDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setBusinessType(business.business_type || 'vet');
      setStampsRequired(business.stamps_required || 10);
      setRewardDescription(business.reward_description || 'Servicio o producto gratis');
    }
  }, [business]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!business?.id) return;

    setSaving(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('businesses')
      .update({
        name: name.trim(),
        business_type: businessType,
        stamps_required: Number(stampsRequired),
        reward_description: rewardDescription.trim(),
      })
      .eq('id', business.id)
      .select()
      .single();

    if (error) {
      setErrorMsg(`No se pudieron guardar los cambios: ${error.message}`);
    } else if (data) {
      onSaved(data);
      onClose();
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Configuración del Negocio</h3>
            <p className="text-xs text-slate-500">Personaliza tu marca y las reglas de recompensa</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre del Negocio
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Rubro / Categoría
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="vet">🐾 Veterinaria / Pet Shop</option>
              <option value="salon">✂️ Estética / Barbería / Spa</option>
              <option value="restaurant">🍴 Restaurante / Cafetería</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sellos para Premio
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={stampsRequired}
                onChange={(e) => setStampsRequired(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Premio / Recompensa
              </label>
              <input
                type="text"
                required
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}