import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabaseClient';
import { getOrCreateCustomerCard } from '../services/loyaltyService';

export default function ClientLoyaltyCard({ session }) {
  const [cardData, setCardData] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  const customerId = session.user.id;
  const customerName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // 1. Obtener información del negocio por defecto (o el primero activo)
      const { data: bizList } = await supabase.from('businesses').select('*').limit(1);
      
      if (bizList && bizList.length > 0) {
        const currentBiz = bizList[0];
        setBusiness(currentBiz);

        // 2. Obtener o crear la tarjeta del cliente para este negocio
        const card = await getOrCreateCustomerCard(currentBiz.id, customerId);
        setCardData(card);

        // 3. Suscribirse a cambios en tiempo real en la tarjeta (Realtime de Supabase)
        const subscription = supabase
          .channel('public:loyalty_cards')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loyalty_cards', filter: `id=eq.${card?.id}` }, 
            (payload) => {
              setCardData(payload.new);
            }
          )
          .subscribe();

        setLoading(false);
        return () => {
          supabase.removeChannel(subscription);
        };
      }
      setLoading(false);
    }

    loadData();
  }, [customerId]);

  const getThemeConfig = (type) => {
    switch (type) {
      case 'salon': return { icon: '✂️', color: 'from-pink-500 to-rose-500', reward: 'Corte o brushing gratis' };
      case 'restaurant': return { icon: '🍴', color: 'from-amber-500 to-orange-500', reward: 'Plato principal o postre gratis' };
      default: return { icon: '🐾', color: 'from-emerald-500 to-teal-600', reward: 'Baño o consulta médica gratis' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Cargando tu tarjeta digital...</p>
      </div>
    );
  }

  const theme = getThemeConfig(business?.business_type);
  const currentStamps = cardData?.current_stamps || 0;
  const maxStamps = cardData?.max_stamps || 6;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Cabecera */}
        <div className={`bg-gradient-to-r ${theme.color} p-6 text-white text-center`}>
          <span className="text-3xl mb-2 inline-block">{theme.icon}</span>
          <h1 className="text-xl font-bold tracking-tight">{business?.name || 'Mi Negocio'}</h1>
          <p className="text-white/80 text-sm mt-1">Tarjeta de Lealtad Digital</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-slate-800 text-lg font-semibold">¡Hola, {customerName}! 👋</h2>
            <p className="text-slate-500 text-sm">Acumula sellos en cada visita y gana recompensas.</p>
          </div>

          {/* Tarjeta de Sellos */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tus Sellos</span>
              <span className="text-sm font-semibold text-slate-700">{currentStamps} de {maxStamps}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: maxStamps }).map((_, index) => {
                const isStamped = index < currentStamps;
                return (
                  <div
                    key={index}
                    className={`h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                      isStamped
                        ? 'bg-white shadow-md border-2 border-emerald-500 text-emerald-600 scale-105'
                        : 'bg-slate-200/60 border-2 border-dashed border-slate-300 text-slate-400'
                    }`}
                  >
                    <span className="text-2xl">{isStamped ? theme.icon : index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Próxima recompensa</p>
              <p className="text-sm text-amber-900 font-medium">{theme.reward}</p>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>Mostrar mi Código QR</span>
          </button>
        </div>

        {/* Modal QR con el ID real del usuario en Supabase */}
        {showQrModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Escanea tu tarjeta</h3>
              <p className="text-xs text-slate-500 mb-6">Muestra este código al personal</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6 border border-slate-200 shadow-sm flex justify-center">
                <QRCodeSVG value={customerId} size={180} level={"H"} includeMargin={true} />
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}