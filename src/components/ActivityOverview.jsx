import React from 'react';

export default function ActivityOverview({ customers, transactions }) {
  const totalCustomers = customers.length;

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const stampsToday = transactions
    .filter((tx) => tx.type === 'earn_stamp' && isToday(tx.created_at))
    .reduce((acc, tx) => acc + (tx.stamps_added || 1), 0);

  const redeemedTotal = transactions.filter((tx) => tx.type === 'redeem_reward').length;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Clientes Activos
          </p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalCustomers}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sellos Hoy
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{stampsToday}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Premios Canjeados
          </p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{redeemedTotal}</p>
        </div>
      </div>

      {/* Historial de Movimientos Recientes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Actividad Reciente</h2>
          <span className="text-xs text-slate-400 font-medium">
            Últimos {Math.min(transactions.length, 15)} movimientos
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Aún no hay movimientos registrados en este negocio.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {transactions.slice(0, 15).map((tx) => {
              const isRedeem = tx.type === 'redeem_reward';
              return (
                <div
                  key={tx.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        isRedeem
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isRedeem ? '🎁 Canje' : '⭐ +1 Sello'}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{tx.customerName}</p>
                      <p className="text-xs text-slate-400">
                        {isRedeem
                          ? 'Recompensa canjeada y tarjeta reiniciada'
                          : `Se acreditó ${tx.stamps_added || 1} sello`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 sm:text-right">
                    {formatDate(tx.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}