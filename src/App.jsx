import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import ClientLoyaltyCard from './components/ClientLoyaltyCard';
import OwnerDashboard from './components/OwnerDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extraer un parámetro de la URL si el cliente entra por enlace directo (ej: ?client=uuid-123)
  const queryParams = new URLSearchParams(window.location.search);
  const clientIdParam = queryParams.get('client');

  useEffect(() => {
    // Verificar si hay sesión de Dueño/Personal activa en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  // CASO 1: Si la URL trae un identificador de cliente (ej: ?client=123), mostrar directamente la tarjeta sin login
  if (clientIdParam) {
    return <ClientLoyaltyCard customerId={clientIdParam} />;
  }

  // CASO 2: Si el dueño ya inició sesión en Supabase, mostrar su panel administrativo
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

  // CASO 3: Por defecto, mostrar la pantalla de Login exclusiva para el Dueño del negocio
  return <Login />;
<<<<<<< HEAD
}
=======
}
>>>>>>> ff6f287b17792e4de2534fc371b3402a2504dbbc
