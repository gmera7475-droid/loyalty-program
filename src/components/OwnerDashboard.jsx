import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';
import { addStamp, redeemReward, getOrCreateCustomerCard } from '../services/loyaltyService';
import { QRCodeSVG } from 'qrcode.react';

export default function OwnerDashboard({ session }) {
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegisterQrModal, setShowRegisterQrModal] = useState(false);

  const staffId = session.user.id;

  // Cargar datos reales del negocio y sus tarjetas vinculadas
  useEffect(() => {
    async function loadOwnerData() {
      setLoading(true);
      // 1. Obtener negocio
      const { data: bizList } = await supabase.from('businesses').select('*').limit(1);
      if (bizList && bizList.length > 0) {
        const currentBiz = bizList[0];
        setBusiness(currentBiz);

        // 2. Obtener tarjetas de lealtad de este negocio con información del perfil del cliente
        const { data: cards, error } = await supabase
          .from('loyalty_cards')
          .select('id, current_stamps, max_stamps, customer_id, profiles(full_name, phone)')
          .eq('business_id', currentBiz.id);

        if (!error && cards) {
          const formatted = cards.map(c => ({
            cardId: c.id,
            customerId: c.customer_id,
            name: c.profiles?.full_name || 'Cliente sin nombre',
            phone: c.profiles?.phone || 'Sin teléfono',
            stamps: c.current_stamps,
            maxStamps: c.max_stamps
          }));
          setCustomers(formatted);
        }
      }
      setLoading(false);
    }

    loadOwnerData();
  }, []);

  // Manejar el escaneo QR y acreditación de sello en base de datos
  useEffect(() => {
    let scanner = null;
    if (showScannerModal && business) {
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
        
        scanner.render(
          async (decodedText) => {
            scanner.clear();
            setShowScannerModal(false);

            // decodedText contiene el customer_id escaneado
            const card = await getOrCreateCustomerCard(business.id, decodedText);
            if (card) {
              const res = await addStamp(card.id, staffId);
              if (res.success) {
                alert('¡Sello acreditado exitosamente en Supabase!');
                window.location.reload(); // Recargar para actualizar la tabla
              } else {
                alert('Error al acreditar sello.');
              }
            } else {
              alert('No se pudo encontrar o crear la tarjeta para este cliente.');
            }
          },
          (error) => {}
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) scanner.clear().catch(err => console.error(err));
      };
    }
  }, [showScannerModal, business, staffId]);

  const handleAddStampButton = async (cardId) => {
    const res = await addStamp(cardId, staffId);
    if (res.success) {
      setCustomers(customers.map(c => c.cardId === cardId ? { ...c, stamps: res.card.current_stamps } : c));
      alert('¡Sello sumado correctamente!');
    } else {
      alert('Error al sumar sello.');
    }
  };

  const handleRedeemButton = async (cardId) => {
    const res = await redeemReward(cardId, staffId);
    if (res.success) {
      setCustomers(customers.map(c => c.cardId === cardId ? { ...c, stamps: res.card.current_stamps } : c));
      alert('🎁 ¡Recompensa canjeada con éxito!');
    } else {
      alert('Error al canjear recompensa.');
    }
  };

  const getThemeConfig = (type) => {
    switch (type) {
      case 'salon': return { icon: '✂️', color: 'bg-pink-500', badge: 'Estética' };
      case 'restaurant': return { icon: '🍴', color: 'bg-orange-500', badge: 'Restaurante' };
      default: return { icon: '🐾', color: 'bg-emerald-600', badge: 'Veterinaria' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  const theme = getThemeConfig(business?.business_type);
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl ${theme.color} flex items-center justify-center text-white text-3xl shadow-md`}>
              {theme.icon}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Panel de Negocio ({theme.badge})
              </span>
              <h1 className="text-2xl font-bold text-slate-800 mt-1">{business?.name || 'Mi Negocio'}</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowRegisterQrModal(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium py-3 px-4 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <span>QR Nuevo Cliente</span>
            </button>
            <button
              onClick={() => setShowScannerModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 text-sm"
            >
              <span>Escanear QR de Cliente</span>
            </button>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-slate-800">Clientes Registrados</h2>
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Teléfono</th>
                  <th className="pb-3 font-semibold">Progreso Tarjeta</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">No hay clientes con tarjetas activas todavía.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.cardId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 font-semibold text-slate-800">{customer.name}</td>
                      <td className="py-4 text-slate-600">{customer.phone}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-600">{customer.stamps} / {customer.maxStamps}</span>
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${(customer.stamps / customer.maxStamps) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleAddStampButton(customer.cardId)}
                          disabled={customer.stamps >= customer.maxStamps}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40"
                        >
                          +1 Sello
                        </button>
                        <button
                          onClick={() => handleRedeemButton(customer.cardId)}
                          disabled={customer.stamps < customer.maxStamps}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40"
                        >
                          Canjear 🎁
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal QR de Registro para Mostrador */}
{showRegisterQrModal && business && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
      <h3 className="text-lg font-bold text-slate-800 mb-1">QR de Registro</h3>
      <p className="text-xs text-slate-500 mb-5">
        Pide al cliente nuevo que escanee este código para activar su tarjeta
      </p>

      <div className="bg-white p-4 rounded-2xl inline-block mb-4 border border-slate-200 shadow-sm">
        <QRCodeSVG 
          value={`${window.location.origin}/?register=${business.id}`} 
          size={180} 
          level="H" 
          includeMargin={true} 
        />
      </div>

      <p className="text-[10px] text-slate-400 mb-5 break-all">
        {`${window.location.origin}/?register=${business.id}`}
      </p>

      <button
        onClick={() => setShowRegisterQrModal(false)}
        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 rounded-xl transition-all"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

        {/* Modal de Cámara */}
        {showScannerModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Escáner de Tarjeta QR</h3>
              <p className="text-xs text-slate-500 mb-4">Apunta la cámara al código del cliente</p>
              
              <div id="reader" className="overflow-hidden rounded-2xl mb-4"></div>

              <button
                onClick={() => setShowScannerModal(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 rounded-xl transition-all"
              >
                Cerrar Escáner
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}