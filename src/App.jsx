import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import ClientLoyaltyCard from './components/ClientLoyaltyCard';
import OwnerDashboard from './components/OwnerDashboard';
import CustomerOnboarding from './components/CustomerOnboarding';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeClientId, setActiveClientId] = useState(null);

  const queryParams = new URLSearchParams(window.location.search);
  const clientIdParam = queryParams.get('client');
  const registerBusinessId = queryParams.get('register');

  useEffect(() => {
    // 1. Verificar si hay cliente en URL o guardado en el teléfono
    if (clientIdParam) {
      localStorage.setItem('loyalty_customer_id', clientIdParam);
      setActiveClientId(clientIdParam);
    } else if (!registerBusinessId) {
      const savedClient = localStorage.getItem('loyalty_customer_id');
      if (savedClient) {
        setActiveClientId(savedClient);
      }
    }

    // 2. Verificar sesión de Dueño
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [clientIdParam, registerBusinessId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  // CASO 1: Dueño autenticado -> Panel de administración
  if (session) {
    return (
      <div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          Cerrar Sesión Dueño
        </button>
        <OwnerDashboard session={session} />
      </div>
    );
  }

  // CASO 2: Cliente nuevo escaneando el QR del mostrador (?register=...)
  if (registerBusinessId) {
    return (
      <CustomerOnboarding
        businessId={registerBusinessId}
        onRegistered={(newId) => {
          // Limpiar el ?register de la URL y mostrar su nueva tarjeta
          window.history.replaceState({}, '', `/?client=${newId}`);
          setActiveClientId(newId);
        }}
      />
    );
  }

  // CASO 3: Cliente recurrente (vía URL ?client= o recordado en su navegador)
  if (activeClientId) {
    return <ClientLoyaltyCard customerId={activeClientId} />;
  }

  // CASO 4: Acceso por defecto en la raíz -> Login para el Dueño
  return <Login />;
}