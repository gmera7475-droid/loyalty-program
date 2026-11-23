import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabaseClient';

export default function ClientLoyaltyCard({ customerId }) {
  const [cardData, setCardData] = useState(null);
  const [business, setBusiness] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  const activeCustomerId = customerId || 'cliente-demo-manuel';

  const loadClientData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', activeCustomerId)
        .maybeSingle();

      if (profileData?.full_name) {
        setCustomerName(profileData.full_name);
      }

      const { data: card, error: cardError } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('current_stamps', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cardError && card) {
        setCardData(card);

        if (card.business_id) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('id, name, business_type, stamps_required, reward_description')
            .eq('id', card.business_id)
            .maybeSingle();

          if (biz) {
            setBusiness(biz);
          }
        }
      } else {
        const { data: bizList } = await supabase.from('businesses').select('*').limit(1);
        if (bizList && bizList.length > 0) {
          setBusiness(bizList[0]);
        }
      }
    } catch (err) {
      console.error('Error cargando tarjeta del cliente:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCustomerId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  useEffect(() => {
    if (!cardData?.id) return;

    const subscription = supabase
      .channel(`card:${cardData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loyalty_cards',
          filter: `id=eq.${cardData.id}`,
        },
        (payload) => {
          setCardData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [cardData?.id]);

  const getThemeConfig = (type) => {
    switch (type) {
      case 'salon':
        return {
          icon: '✂️',
          color: 'from-pink-500 to-rose-500',
          defaultReward: 'Corte o brushing gratis',
        };
      case 'restaurant':
        return {
          icon: '🍴',
          color: 'from-amber-500 to-orange-500',
          defaultReward: 'Plato principal o postre gratis',
        };
      default:
        return {
          icon: '🐾',
          color: 'from-emerald-500 to-teal-600',
          defaultReward: 'Baño o consulta médica gratis',
        };
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
  const maxStamps = cardData?.max_stamps || business?.stamps_required || 10;
  const currentStamps = Math.min(cardData?.current_stamps || 0, maxStamps);
  const rewardReady = currentStamps >= maxStamps;
  const rewardText = business?.reward_description || theme.defaultReward;
  const clientUrl = `${window.location.origin}/?client=${activeCustomerId}`;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Cabecera */}
        <div className={`bg-gradient-to-r ${theme.color} p-6 text-white text-center`}>
          <span className="text-3xl mb-2 inline-block">{theme.icon}</span>
          <h1 className="text-xl font-bold tracking-tight">
            {business?.name || 'Programa de Lealtad'}
          </h1>
          <p className="text-white/80 text-sm mt-1">Tarjeta de Lealtad Digital</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-slate-800 text-lg font-semibold">
              ¡Hola{customerName ? `, ${customerName}` : ' de nuevo'}! 👋
            </h2>
            <p className="text-slate-500 text-sm">
              Acumula sellos en cada visita y gana recompensas.
            </p>
          </div>

          {rewardReady && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 mb-5 text-center">
              <p className="text-sm font-bold text-amber-800">
                🎉 ¡Tarjeta completada! Tienes tu premio listo:
              </p>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">{rewardText}</p>
            </div>
          )}

          {/* Tarjeta de Sellos */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tus Sellos
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {currentStamps} de {maxStamps}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: maxStamps }).map((_, index) => {
                const isStamped = index < currentStamps;
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                      isStamped
                        ? 'bg-white shadow-md border-2 border-emerald-500 text-emerald-600 scale-105'
                        : 'bg-slate-200/60 border-2 border-dashed border-slate-300 text-slate-400'
                    }`}
                  >
                    <span className="text-xl">{isStamped ? theme.icon : index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Próxima recompensa
              </p>
              <p className="text-sm text-amber-900 font-medium">{rewardText}</p>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>Mostrar mi Código QR</span>
          </button>
        </div>

        {/* Modal QR con el enlace único del cliente */}
        {showQrModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Tu Tarjeta Digital</h3>
              <p className="text-xs text-slate-500 mb-6">
                Muestra este código al personal del local
              </p>

              <div className="bg-white p-4 rounded-2xl inline-block mb-4 border border-slate-200 shadow-sm flex justify-center">
                <QRCodeSVG value={clientUrl} size={180} level="H" includeMargin={true} />
              </div>

              <p className="text-[10px] text-slate-400 mb-6 break-all">
                Guarda este enlace en favoritos para consultar tus sellos siempre.
              </p>

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