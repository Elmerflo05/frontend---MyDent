import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { companiesApi } from '@/services/api/companiesApi';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ValidityEntry {
  validity_history_id: number;
  previous_vigencia_fin: string;
  new_vigencia_fin: string;
  extension_reason: string;
  extended_by_name: string;
  date_time_registration: string;
}

interface Props {
  companyId: number;
  companyName: string;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  onClose: () => void;
  onExtended?: () => void;
}

export default function CompanyValidityHistory({ companyId, companyName, vigenciaInicio, vigenciaFin, onClose, onExtended }: Props) {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<ValidityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [extending, setExtending] = useState(false);

  const isSuperAdmin = user?.role_id === 1;

  useEffect(() => {
    loadHistory();
  }, [companyId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.getCompanyValidityHistory(companyId);
      setHistory(response.data || []);
    } catch (error) {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const getVigenciaStatus = () => {
    if (!vigenciaFin) return { label: 'Sin definir', color: 'bg-gray-100 text-gray-800' };
    const fin = new Date(vigenciaFin);
    const now = new Date();
    const daysRemaining = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return { label: 'Vencida', color: 'bg-red-100 text-red-800' };
    if (daysRemaining <= 30) return { label: `Vence en ${daysRemaining} dias`, color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Vigente', color: 'bg-green-100 text-green-800' };
  };

  const handleExtend = async () => {
    if (!newDate || !reason) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (reason.length < 10) {
      toast.error('La razon debe tener al menos 10 caracteres');
      return;
    }

    if (!confirm('Confirmar extension de vigencia?')) return;

    try {
      setExtending(true);
      await companiesApi.extendCompanyValidity(companyId, {
        new_vigencia_fin: newDate,
        extension_reason: reason
      });
      toast.success('Vigencia extendida exitosamente');
      setShowExtendForm(false);
      setNewDate('');
      setReason('');
      loadHistory();
      onExtended?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al extender vigencia');
    } finally {
      setExtending(false);
    }
  };

  const status = getVigenciaStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Vigencia - {companyName}</h2>
            <p className="text-blue-100 text-sm">Historial de extensiones</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Vigencia actual */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vigencia actual</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-semibold text-gray-900">
                  {vigenciaInicio ? format(new Date(vigenciaInicio), 'dd/MM/yyyy') : 'N/A'}
                  {' - '}
                  {vigenciaFin ? format(new Date(vigenciaFin), 'dd/MM/yyyy') : 'N/A'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
            {isSuperAdmin && vigenciaFin && (
              <button
                onClick={() => setShowExtendForm(!showExtendForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Extender Vigencia
              </button>
            )}
          </div>

          {/* Formulario de extension */}
          {showExtendForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha de fin</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={vigenciaFin ? format(new Date(new Date(vigenciaFin).getTime() + 86400000), 'yyyy-MM-dd') : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razon de la extension (min. 10 caracteres)</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describa el motivo de la extension..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExtend}
                    disabled={extending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                  >
                    {extending ? 'Guardando...' : 'Confirmar Extension'}
                  </button>
                  <button
                    onClick={() => setShowExtendForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Historial */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Cargando historial...</p>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin historial</h3>
              <p className="text-sm text-gray-500">No se han registrado extensiones de vigencia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.validity_history_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(entry.previous_vigencia_fin), 'dd/MM/yyyy')}
                          {' → '}
                          {format(new Date(entry.new_vigencia_fin), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{entry.extension_reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.extended_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(entry.date_time_registration), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
