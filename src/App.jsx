import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import ClientLoyaltyCard from './components/ClientLoyaltyCard';
import OwnerDashboard from './components/OwnerDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' o 'customer'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setLoading(false);
    });

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Consultar el rol del usuario en la tabla 'profiles'
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role || 'customer');
    } catch (err) {
      console.error('Error al obtener rol:', err.message);
      setUserRole('customer'); // Por defecto si no se encuentra perfil
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  // Si no hay sesión, mostrar pantalla de Login
  if (!session) {
    return <Login />;
  }

  // Si hay sesión, renderizar según el rol almacenado en Supabase
  return (
    <div>
      {/* Botón flotante temporal para cerrar sesión */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
      >
        Cerrar Sesión
      </button>

      {userRole === 'owner' ? <OwnerDashboard /> : <ClientLoyaltyCard />}
    </div>
  );
}