/**
 * Vista de Odontograma para Pacientes
 * Muestra dos tabs: Odontograma Inicial y Odontograma de Evolución
 * Reutiliza el componente oficial de Odontograma en modo solo lectura
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  FileText,
  Calendar,
  User,
  Activity,
  Info,
  Download,
  Clock,
  Heart,
  AlertCircle,
  Phone,
  History,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { odontogramsApi, OdontogramData, OdontogramConditionData, OdontogramHistoryItem, PatientOdontogramsWithHistory } from '@/services/api/odontogramsApi';
import Odontogram from '@/components/odontogram/Odontogram';
import DetailedReportPanel from '@/components/odontogram/DetailedReportPanel';
import type { ToothCondition } from '@/store/odontogramStore';

/**
 * Convertir condiciones de la BD al formato del componente Odontogram
 * El componente Odontogram espera:
 * - toothNumber: string (ej: "1.1", "2.1", "1.8") - IMPORTANTE: formato con punto
 * - sectionId: string opcional (superficie: "vestibular", "mesial", "distal", etc.)
 * - conditionId: string (código de la condición: "caries-mb", "caries-ce", "sellante", etc.)
 * - state: 'good' | 'bad' (bad=rojo para condiciones a tratar, good=azul para tratadas)
 * - abbreviation: abreviatura de la condición
 */
const convertDBConditionToOdontogramFormat = (dbCondition: OdontogramConditionData): any => {
  // Mapeo de surface_code de BD a sectionId del frontend
  const DB_TO_FRONTEND_SURFACE: Record<string, string> = {
    'V': 'vestibular',
    'L': 'lingual',
    'M': 'mesial',
    'D': 'distal',
    'C': 'corona',
    'O': 'corona',
    'I': 'corona',
    'P': 'palatino'
  };

  // Determinar sectionId correcto
  let sectionId = 'general';
  if (dbCondition.surface_section) {
    sectionId = dbCondition.surface_section;
  } else if (dbCondition.surface_code) {
    sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_code] || dbCondition.surface_code;
  }

  // IMPORTANTE: Convertir tooth_number de formato BD ("11") a formato frontend ("1.1")
  // La BD guarda "11", "21", "18", etc., pero el componente espera "1.1", "2.1", "1.8"
  let toothNumber = dbCondition.tooth_number;
  if (toothNumber && !toothNumber.includes('.') && toothNumber.length === 2) {
    toothNumber = `${toothNumber[0]}.${toothNumber[1]}`;
  }

  // Determinar el estado basado en color_type
  // red = condición a tratar (bad), blue = tratado (good)
  const state = dbCondition.color_type === 'blue' ? 'good' : 'bad';

  // IMPORTANTE: conditionId debe coincidir con el 'id' del store de condiciones
  // El store usa condition_code como id (ej: "caries-mb", "caries-ce", "sellante")
  const conditionId = dbCondition.dental_condition_code || dbCondition.condition_name || 'unknown';

  const result = {
    toothNumber: toothNumber,
    sectionId: sectionId,
    conditionId: conditionId,
    // 'condition' es necesario para la transformación en useToothConditions
    condition: conditionId,
    abbreviation: dbCondition.abbreviation,
    state: state,
    color: dbCondition.color_type || 'gray',
    notes: dbCondition.notes || dbCondition.description,
    // Campos visuales CRÍTICOS para el renderizado correcto
    // Sin estos, el odontograma no puede determinar qué símbolo dibujar
    symbol_type: dbCondition.symbol_type,
    fill_surfaces: dbCondition.fill_surfaces,
    // Campos adicionales para compatibilidad completa
    dental_condition_id: dbCondition.dental_condition_id,
    tooth_position_id: dbCondition.tooth_position_id,
    tooth_surface_id: dbCondition.tooth_surface_id,
    condition_name: dbCondition.condition_name,
    // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
    connectedToothNumber: dbCondition.connected_tooth_number
  };

  return result;
};

// Convertir para DetailedReportPanel
const convertToReportFormat = (dbCondition: OdontogramConditionData, patientId: string): ToothCondition => {
  // Mapeo de surface_code de BD a sectionId del frontend
  const DB_TO_FRONTEND_SURFACE: Record<string, string> = {
    'V': 'vestibular',
    'L': 'lingual',
    'M': 'mesial',
    'D': 'distal',
    'C': 'corona',
    'O': 'corona',
    'I': 'corona',
    'P': 'palatino'
  };

  // Determinar sectionId correcto
  let sectionId = 'general';
  if (dbCondition.surface_section) {
    sectionId = dbCondition.surface_section;
  } else if (dbCondition.surface_code) {
    sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_code] || dbCondition.surface_code;
  }

  // Convertir tooth_number de formato BD ("11") a formato frontend ("1.1")
  let toothNumber = dbCondition.tooth_number;
  if (toothNumber && !toothNumber.includes('.') && toothNumber.length === 2) {
    toothNumber = `${toothNumber[0]}.${toothNumber[1]}`;
  }

  return {
    toothNumber: toothNumber,
    sectionId: sectionId,
    condition: dbCondition.dental_condition_code || dbCondition.condition_name || 'unknown',
    color: dbCondition.color_type || 'gray',
    notes: dbCondition.notes || dbCondition.description,
    date: dbCondition.created_at ? new Date(dbCondition.created_at) : new Date(),
    patientId: patientId,
    price: dbCondition.price || dbCondition.config_price_base || 0,
    dental_condition_id: dbCondition.dental_condition_id,
    tooth_position_id: dbCondition.tooth_position_id,
    tooth_surface_id: dbCondition.tooth_surface_id,
    condition_name: dbCondition.condition_name
  };
};

// Componente para el selector de historial
const HistorySelector = ({
  history,
  selectedId,
  onSelect,
  isLoading
}: {
  history: OdontogramHistoryItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = history.find(h => h.odontogram_id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-cyan-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-cyan-600" />
          {selectedItem ? (
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {new Date(selectedItem.odontogram_date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="text-sm text-gray-500">
                Dr(a). {selectedItem.dentist_name} - {selectedItem.conditions_count} condiciones
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Selecciona una fecha del historial</span>
          )}
        </div>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay historial disponible
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.odontogram_id}
                onClick={() => {
                  onSelect(item.odontogram_id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  selectedId === item.odontogram_id ? 'bg-cyan-50' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${item.is_current_version ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">
                    {new Date(item.odontogram_date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                    {item.is_current_version && (
                      <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Dr(a). {item.dentist_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.conditions_count} condiciones registradas
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal
const PatientOdontogram = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'initial' | 'evolution'>('initial');

  // Estado para los datos del backend
  const [odontogramData, setOdontogramData] = useState<PatientOdontogramsWithHistory | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [selectedHistoryOdontogram, setSelectedHistoryOdontogram] = useState<OdontogramData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cargar datos del backend
  const loadOdontogramData = useCallback(async () => {
    if (!user?.profile?.patientId) {
      toast.error('No se pudo identificar al paciente');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const patientId = typeof user.profile.patientId === 'string'
        ? parseInt(user.profile.patientId)
        : user.profile.patientId;

      const data = await odontogramsApi.getPatientOdontogramsWithHistory(patientId);
      setOdontogramData(data);

      // Si hay evolución actual, seleccionarla por defecto
      if (data.currentEvolution?.odontogram_id) {
        setSelectedHistoryId(data.currentEvolution.odontogram_id);
      } else if (data.evolutionHistory.length > 0) {
        setSelectedHistoryId(data.evolutionHistory[0].odontogram_id);
      }
    } catch (error) {
      console.error('Error al cargar odontograma:', error);
      toast.error('Error al cargar el odontograma');
    } finally {
      setLoading(false);
    }
  }, [user?.profile?.patientId]);

  useEffect(() => {
    loadOdontogramData();
  }, [loadOdontogramData]);

  // Cargar odontograma del historial cuando cambia la selección
  const handleHistorySelect = useCallback(async (odontogramId: number) => {
    setSelectedHistoryId(odontogramId);

    // Si es el odontograma actual de evolución, usar los datos ya cargados
    if (odontogramData?.currentEvolution?.odontogram_id === odontogramId) {
      setSelectedHistoryOdontogram(odontogramData.currentEvolution);
      return;
    }

    // Si es el odontograma inicial, usar los datos ya cargados
    if (odontogramData?.initialOdontogram?.odontogram_id === odontogramId) {
      setSelectedHistoryOdontogram(odontogramData.initialOdontogram);
      return;
    }

    // Cargar del backend
    try {
      setLoadingHistory(true);
      const odontogram = await odontogramsApi.getOdontogramFull(odontogramId);
      setSelectedHistoryOdontogram(odontogram);
    } catch (error) {
      console.error('Error al cargar odontograma del historial:', error);
      toast.error('Error al cargar el odontograma seleccionado');
    } finally {
      setLoadingHistory(false);
    }
  }, [odontogramData]);

  // Obtener el odontograma actual según el tab (memoizado)
  const currentOdontogram = useMemo((): OdontogramData | null => {
    if (activeTab === 'initial') {
      return odontogramData?.initialOdontogram || null;
    }

    // Para evolución, usar el seleccionado del historial o el actual
    if (selectedHistoryOdontogram) {
      return selectedHistoryOdontogram;
    }
    return odontogramData?.currentEvolution || null;
  }, [activeTab, odontogramData?.initialOdontogram, selectedHistoryOdontogram, odontogramData?.currentEvolution]);

  // Memoizar las condiciones del odontograma para evitar re-renders innecesarios
  const odontogramConditions = useMemo(() => {
    if (!currentOdontogram?.conditions) {
      return [];
    }

    return currentOdontogram.conditions.map(c => convertDBConditionToOdontogramFormat(c));
  }, [currentOdontogram?.conditions]);

  // Memoizar las condiciones para el DetailedReportPanel
  const reportConditions = useMemo(() => {
    if (!currentOdontogram?.conditions) return [];
    const patientId = user?.profile?.patientId?.toString() || '0';
    return currentOdontogram.conditions.map(c => convertToReportFormat(c, patientId));
  }, [currentOdontogram?.conditions, user?.profile?.patientId]);

  const generateReport = () => {
    if (!user?.profile) return;

    const reportData = {
      patient: {
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        email: user.email
      },
      date: new Date().toLocaleDateString('es-ES'),
      conditions: reportConditions,
      summary: {
        total: reportConditions.length,
        treated: reportConditions.filter(c => ['filled', 'crown', 'restoration'].includes(c.condition)).length,
        needsAttention: reportConditions.filter(c => ['caries', 'infection', 'fracture'].includes(c.condition)).length
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-odontograma-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Reporte descargado exitosamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          <span className="text-gray-600">Cargando tu odontograma...</span>
        </div>
      </div>
    );
  }

  // Mock de datos del paciente para el DetailedReportPanel
  const mockPatient = user?.profile ? {
    id: user.profile.patientId?.toString() || '1',
    firstName: user.profile.firstName || '',
    lastName: user.profile.lastName || '',
    dni: user.profile.dni || '',
    birthDate: user.profile.birthDate || new Date().toISOString(),
    email: user.email || '',
    phone: user.profile.phone || '',
    address: user.profile.address || '',
    emergencyContact: user.profile.emergencyContact || '',
    medicalHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } : null;

  const hasInitialOdontogram = odontogramData?.initialOdontogram !== null;
  const hasEvolutionHistory = (odontogramData?.evolutionHistory?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Odontograma</h1>
              <p className="text-gray-600">
                Estado de tu salud dental registrado en tu atención integral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentOdontogram && (
              <div className="text-right mr-4">
                {currentOdontogram.dentist_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Dr(a). {currentOdontogram.dentist_name}</span>
                  </div>
                )}
                {currentOdontogram.odontogram_date && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(currentOdontogram.odontogram_date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={generateReport}
              disabled={reportConditions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Descargar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('initial')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'initial'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            Odontograma Inicial
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'evolution'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-5 h-5" />
            Odontograma de Evolución
          </button>
        </div>
      </div>

      {/* Información del tab activo */}
      {activeTab === 'initial' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Odontograma Inicial</h3>
              <p className="text-blue-800 text-sm">
                Este es el primer odontograma registrado en tu atención integral.
                Refleja el estado inicial de tu salud dental al momento de tu primer diagnóstico.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Odontograma de Evolución</h3>
                <p className="text-green-800 text-sm">
                  Muestra la evolución de tu tratamiento dental a lo largo del tiempo.
                  Puedes seleccionar una fecha del historial para ver el estado en ese momento.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de historial */}
          {hasEvolutionHistory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial de Odontogramas
              </h4>
              <HistorySelector
                history={odontogramData?.evolutionHistory || []}
                selectedId={selectedHistoryId}
                onSelect={handleHistorySelect}
                isLoading={loadingHistory}
              />
            </div>
          )}
        </>
      )}

      {/* Contenido del odontograma */}
      {(activeTab === 'initial' && !hasInitialOdontogram) ||
       (activeTab === 'evolution' && !hasEvolutionHistory) ? (
        /* Estado sin odontograma */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'initial'
                ? 'Aún no tienes un odontograma inicial registrado'
                : 'Aún no tienes historial de evolución'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {activeTab === 'initial'
                ? 'Tu odontograma inicial será creado durante tu primera consulta de atención integral con el dentista.'
                : 'El historial de evolución se generará conforme avances en tu tratamiento dental.'}
            </p>
            <div className="flex justify-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                <Calendar className="w-4 h-4" />
                Agendar Cita
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" />
                Contactar Clínica
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Contenido principal con odontograma real */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Columna izquierda: Odontograma oficial */}
          <div className="xl:col-span-2">
            {loadingHistory ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex items-center justify-center min-h-96">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                  <span className="text-gray-600">Cargando odontograma...</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Encabezado con info del dentista */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                        <Stethoscope className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {activeTab === 'initial' ? 'Odontograma Inicial' : 'Odontograma de Evolución'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'initial'
                            ? 'Estado dental al inicio de tu atención'
                            : 'Evolución de tu tratamiento dental'}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                      Solo lectura
                    </div>
                  </div>
                </div>

                {/* Componente Odontograma oficial en modo solo lectura */}
                <Odontogram
                  patientId={user?.profile?.patientId?.toString()}
                  initialConditions={odontogramConditions}
                  readOnly={true}
                  hideStatsCards={true}
                  className="p-4"
                />
              </div>
            )}
          </div>

          {/* Columna derecha: Historia clínica detallada */}
          <div>
            <DetailedReportPanel
              patient={mockPatient}
              conditions={reportConditions}
            />
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {reportConditions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recomendaciones de Cuidado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Higiene Diaria</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cepillado 3 veces al día</li>
                <li>• Uso de hilo dental diariamente</li>
                <li>• Enjuague bucal antibacteriano</li>
                <li>• Evitar alimentos muy azucarados</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Seguimiento Médico</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revisiones cada 6 meses</li>
                <li>• Limpieza dental profesional</li>
                <li>• Atención inmediata ante dolor</li>
                <li>• Seguimiento de tratamientos</li>
              </ul>
            </div>
          </div>

          {reportConditions.some(c => ['caries', 'infection', 'fracture'].includes(c.condition)) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-900">Atención Requerida</span>
              </div>
              <p className="text-red-800 text-sm mt-1">
                Tienes condiciones que requieren atención médica. Agenda una cita pronto.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientOdontogram;
