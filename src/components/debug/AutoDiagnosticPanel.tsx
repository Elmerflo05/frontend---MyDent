/**
 * Panel de Auto-Diagnóstico para Sedes
 * Se ejecuta automáticamente al montar el componente
 */

import { useState, useEffect } from 'react';
import { useSede } from '@/hooks/useSede';
import useSedeStore from '@/store/sedeStore';
import { useAuthStore } from '@/store/authStore';
import httpClient from '@/services/api/httpClient';

interface DiagnosticLog {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export const AutoDiagnosticPanel = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Hooks
  const { sedesDisponibles, cargandoSedes } = useSede();
  const { sedes: sedesEnStore } = useSedeStore();
  const { user } = useAuthStore();

  const addLog = (type: DiagnosticLog['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, { type, message, data }]);

    // También loguear en consola
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];

  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setLogs([]);

    addLog('info', '═══════════════════════════════════════');
    addLog('info', '🔍 DIAGNÓSTICO AUTOMÁTICO INICIADO');
    addLog('info', '═══════════════════════════════════════');

    try {
      // PASO 1: Verificar Token
      addLog('info', '');
      addLog('info', '📋 PASO 1: Verificando Token JWT');
      const token = localStorage.getItem('dental_clinic_token');

      if (!token) {
        addLog('error', 'No se encontró token en localStorage');
        return;
      }

      addLog('success', `Token encontrado (${token.length} caracteres)`);

      // Decodificar token
      try {
        const payload = JSON.parse(atob(token));
        addLog('success', 'Token decodificado correctamente', {
          email: payload.user?.email,
          role: payload.user?.role,
          sedeId: payload.user?.sedeId
        });
      } catch (e) {
        addLog('warning', 'No se pudo decodificar el token');
      }

      // PASO 2: Estado del Usuario
      addLog('info', '');
      addLog('info', '📋 PASO 2: Usuario Autenticado');
      if (user) {
        addLog('success', `Usuario: ${user.email}`, {
          role: user.role,
          sedeId: user.sedeId,
          sedesAcceso: user.sedesAcceso
        });
      } else {
        addLog('error', 'No hay usuario autenticado');
        return;
      }

      // PASO 3: Petición Directa a API
      addLog('info', '');
      addLog('info', '📋 PASO 3: Petición Directa a /api/branches');

      const startTime = Date.now();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';
      const response = await fetch(`${apiUrl}/branches?limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const elapsed = Date.now() - startTime;

      addLog('info', `Tiempo de respuesta: ${elapsed}ms`);
      addLog(response.ok ? 'success' : 'error', `Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog('error', 'Error en respuesta HTTP', errorText);
        return;
      }

      const apiData = await response.json();
      addLog('success', 'Respuesta JSON parseada correctamente');
      addLog('info', 'Estructura de respuesta:', {
        hasSuccess: 'success' in apiData,
        successValue: apiData.success,
        hasData: 'data' in apiData,
        dataType: typeof apiData.data,
        isArray: Array.isArray(apiData.data),
        dataLength: apiData.data?.length
      });

      if (!apiData.data || !Array.isArray(apiData.data)) {
        addLog('error', 'response.data NO es un array válido', apiData);
        return;
      }

      addLog('success', `API retornó ${apiData.data.length} branches`);

      // PASO 4: Analizar Branches
      addLog('info', '');
      addLog('info', '📋 PASO 4: Analizando Branches Individuales');

      if (apiData.data.length === 0) {
        addLog('warning', 'La API no retornó ningún branch');
      } else {
        apiData.data.forEach((branch: any, index: number) => {
          const hasId = !!branch.branch_id;
          const hasName = !!branch.branch_name;

          addLog(
            hasId && hasName ? 'success' : 'error',
            `Branch #${index + 1}: ${branch.branch_name || 'SIN NOMBRE'}`,
            {
              branch_id: branch.branch_id,
              branch_code: branch.branch_code,
              is_active: branch.is_active,
              hasRequiredFields: hasId && hasName
            }
          );
        });

        // Mostrar primer branch completo
        addLog('info', 'Primer branch (completo):', apiData.data[0]);
      }

      // PASO 5: Estado del Store
      addLog('info', '');
      addLog('info', '📋 PASO 5: Estado del Zustand Store');
      addLog('info', `Sedes en store: ${sedesEnStore.length}`, sedesEnStore);

      // PASO 6: Estado del Hook
      addLog('info', '');
      addLog('info', '📋 PASO 6: Estado del Hook useSede()');
      addLog('info', `sedesDisponibles: ${sedesDisponibles.length}`, sedesDisponibles);
      addLog('info', `cargandoSedes: ${cargandoSedes}`);

      // PASO 7: localStorage
      addLog('info', '');
      addLog('info', '📋 PASO 7: Estado del localStorage');
      const sedeStorage = localStorage.getItem('sede-storage');
      if (sedeStorage) {
        try {
          const parsed = JSON.parse(sedeStorage);
          addLog('success', 'sede-storage existe y es válido', {
            sedesCount: parsed.state?.sedes?.length
          });
        } catch (e) {
          addLog('error', 'sede-storage existe pero está corrupto');
        }
      } else {
        addLog('warning', 'sede-storage NO existe en localStorage');
      }

      // RESULTADO FINAL
      addLog('info', '');
      addLog('info', '═══════════════════════════════════════');
      addLog('info', '📊 RESUMEN DIAGNÓSTICO');
      addLog('info', '═══════════════════════════════════════');

      const summary = {
        token: !!token,
        user: !!user,
        apiResponse: apiData.data.length,
        sedesEnStore: sedesEnStore.length,
        sedesDisponibles: sedesDisponibles.length,
        cargandoSedes
      };

      addLog('info', 'Estado general:', summary);

      if (apiData.data.length > 0 && sedesDisponibles.length === 0) {
        addLog('error', '🚨 PROBLEMA DETECTADO: API tiene datos pero sedesDisponibles está vacío');
        addLog('warning', 'Posible causa: Error en el mapeo o en el flujo de datos del store al hook');
      } else if (apiData.data.length > 0 && sedesDisponibles.length > 0) {
        addLog('success', '✅ TODO FUNCIONANDO CORRECTAMENTE');
      } else if (apiData.data.length === 0) {
        addLog('error', '🚨 PROBLEMA: No hay branches en la base de datos');
      }

    } catch (error: any) {
      addLog('error', `ERROR CRÍTICO: ${error.message}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-ejecutar al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      runDiagnostic();
    }, 1000); // Esperar 1 segundo para que todo se inicialice

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 z-50 animate-pulse"
      >
        🔍 Diagnóstico Automático
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <h3 className="text-lg font-bold text-gray-800">
              🔍 Auto-Diagnóstico de Sedes {isRunning && '(Ejecutando...)'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Re-ejecutar
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-50">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Esperando ejecución del diagnóstico...
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded ${
                  log.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
                  log.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500' :
                  log.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
                  'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
                }`}
              >
                <div>{log.message}</div>
                {log.data && (
                  <pre className="mt-1 text-xs overflow-x-auto bg-white bg-opacity-50 p-2 rounded">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-100">
          <div className="text-xs text-gray-600 text-center">
            Total de logs: {logs.length} |
            Errores: {logs.filter(l => l.type === 'error').length} |
            Warnings: {logs.filter(l => l.type === 'warning').length} |
            Éxitos: {logs.filter(l => l.type === 'success').length}
          </div>
        </div>
      </div>
    </div>
  );
};
