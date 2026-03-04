/**
 * Panel de Debug para visualizar el estado de Sedes
 * TEMPORAL - Solo para diagnóstico
 */

import { useState, useEffect } from 'react';
import { useSede } from '@/hooks/useSede';
import useSedeStore from '@/store/sedeStore';
import { useAuthStore } from '@/store/authStore';

export const SedesDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Hook useSede
  const { sedesDisponibles, cargandoSedes, sedeActual } = useSede();

  // Store directo
  const { sedes: sedesEnStore, loading: storeLoading } = useSedeStore();

  // Auth
  const { user } = useAuthStore();

  const recargarSedes = async () => {
    const { cargarSedesDesdeDB } = useSedeStore.getState();
    const resultado = await cargarSedesDesdeDB();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        🐛 Debug Sedes
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg shadow-2xl p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-purple-600">🐛 Debug Panel - Sedes</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Usuario actual */}
      <div className="mb-3 p-2 bg-blue-50 rounded">
        <strong>👤 Usuario:</strong>
        <div className="text-sm">
          <div>Email: {user?.email || 'N/A'}</div>
          <div>Role: {user?.role || 'N/A'}</div>
          <div>SedeId: {user?.sedeId || 'N/A'}</div>
        </div>
      </div>

      {/* Estado de carga */}
      <div className="mb-3 p-2 bg-yellow-50 rounded">
        <strong>⏳ Estados:</strong>
        <div className="text-sm">
          <div>Hook cargando: {cargandoSedes ? '✅ SÍ' : '❌ NO'}</div>
          <div>Store cargando: {storeLoading ? '✅ SÍ' : '❌ NO'}</div>
        </div>
      </div>

      {/* Sedes desde el Hook */}
      <div className="mb-3 p-2 bg-green-50 rounded">
        <strong>📦 sedesDisponibles (hook):</strong>
        <div className="text-sm">
          <div>Count: {sedesDisponibles.length}</div>
          {sedesDisponibles.length > 0 ? (
            <ul className="list-disc list-inside">
              {sedesDisponibles.map(s => (
                <li key={s.id}>
                  {s.nombre} (ID: {s.id}, Estado: {s.estado})
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-red-600">⚠️ Array vacío</div>
          )}
        </div>
      </div>

      {/* Sedes desde el Store */}
      <div className="mb-3 p-2 bg-indigo-50 rounded">
        <strong>🏪 sedes (store directo):</strong>
        <div className="text-sm">
          <div>Count: {sedesEnStore.length}</div>
          {sedesEnStore.length > 0 ? (
            <ul className="list-disc list-inside">
              {sedesEnStore.map(s => (
                <li key={s.id}>
                  {s.nombre} (ID: {s.id}, Estado: {s.estado})
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-red-600">⚠️ Array vacío</div>
          )}
        </div>
      </div>

      {/* Sede actual */}
      <div className="mb-3 p-2 bg-orange-50 rounded">
        <strong>📍 Sede Actual:</strong>
        <div className="text-sm">
          {sedeActual ? (
            <div>{sedeActual.nombre} (ID: {sedeActual.id})</div>
          ) : (
            <div className="text-gray-500">Ninguna</div>
          )}
        </div>
      </div>

      {/* localStorage */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <strong>💾 localStorage:</strong>
        <div className="text-sm">
          <div>
            sede-storage: {localStorage.getItem('sede-storage') ? '✅ Existe' : '❌ No existe'}
          </div>
        </div>
      </div>

      {/* Botón de recarga */}
      <button
        onClick={recargarSedes}
        className="w-full bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
      >
        🔄 Recargar Sedes
      </button>
    </div>
  );
};
