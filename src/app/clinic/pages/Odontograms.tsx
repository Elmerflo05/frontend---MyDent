import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  User,
  FileText,
  BarChart3,
  Settings,
  Save,
  Download,
  History,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import type { ToothCondition } from '@/store/odontogramStore';
import PatientSelector from '@/components/odontogram/PatientSelector';
import PatientOdontogram from '@/components/odontogram/PatientOdontogram';
import ObservationsSection from '@/components/odontogram/ObservationsSection';
import ReportPanel from '@/components/odontogram/ReportPanel';
import DetailedReportPanel from '@/components/odontogram/DetailedReportPanel';
import { UI_TEXTS } from '@/constants/ui';

const Odontograms = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentConditions, setCurrentConditions] = useState<ToothCondition[]>([]);
  const [activeView, setActiveView] = useState<'full' | 'odontogram' | 'observations' | 'report' | 'detailed-report'>('full');

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (!patient) {
      setCurrentConditions([]);
    }
  };

  const handleConditionsChange = (conditions: ToothCondition[]) => {
    setCurrentConditions(conditions);
  };

  const handleSaveSession = () => {
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente primero');
      return;
    }

    // En una implementación real, esto guardaría toda la sesión
    toast.success('Sesión de odontograma guardada exitosamente');
  };

  const handleExportSession = () => {
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente primero');
      return;
    }

    // En una implementación real, esto exportaría toda la sesión
    const sessionData = {
      patient: selectedPatient,
      conditions: currentConditions,
      timestamp: new Date().toISOString(),
      sessionId: `session-${Date.now()}`
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesion-odontograma-${selectedPatient.firstName}-${selectedPatient.lastName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Sesión exportada exitosamente');
  };

  const resetSession = () => {
    if (confirm('¿Está seguro de que desea reiniciar la sesión? Se perderán todos los cambios no guardados.')) {
      setSelectedPatient(null);
      setCurrentConditions([]);
      toast.success('Sesión reiniciada');
    }
  };

  const viewOptions = [
    { key: 'full', label: 'Vista Completa', icon: Stethoscope },
    { key: 'odontogram', label: 'Odontograma', icon: User },
    { key: 'observations', label: 'Observaciones', icon: FileText },
    { key: 'report', label: 'Reporte Estadístico', icon: BarChart3 },
    { key: 'detailed-report', label: 'Historia Clínica', icon: History }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Odontogramas</h1>
                <p className="text-sm text-gray-600">
                  Sistema integral de odontogramas digitales
                  {selectedPatient && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Controles de sesión */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetSession}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Reiniciar sesión"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar
              </button>

              <button
                onClick={handleExportSession}
                disabled={!selectedPatient}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Exportar sesión"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button
                onClick={handleSaveSession}
                disabled={!selectedPatient}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                {UI_TEXTS.BUTTONS.SAVE} Sesión
              </button>
            </div>
          </div>

          {/* Selector de vista */}
          <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-px">
            {viewOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setActiveView(option.key)}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeView === option.key
                    ? 'text-cyan-600 border-cyan-600 bg-cyan-50/50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Vista completa */}
        {activeView === 'full' && (
          <div className="space-y-6">
            {/* Selector de paciente */}
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
            />

            {/* Layout principal */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Columna izquierda: Odontograma */}
              <div className="xl:col-span-2">
                <PatientOdontogram
                  patient={selectedPatient}
                  onConditionsChange={handleConditionsChange}
                  hideStatsCards={true}
                />
              </div>

              {/* Columna derecha: Reporte detallado */}
              <div className="space-y-6">
                <DetailedReportPanel
                  patient={selectedPatient}
                  conditions={currentConditions}
                />
              </div>
            </div>

            {/* Observaciones */}
            <ObservationsSection patient={selectedPatient} />
          </div>
        )}

        {/* Vista solo odontograma */}
        {activeView === 'odontogram' && (
          <div className="space-y-6">
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
            />
            <PatientOdontogram
              patient={selectedPatient}
              onConditionsChange={handleConditionsChange}
              className="max-w-full"
            />
          </div>
        )}

        {/* Vista solo observaciones */}
        {activeView === 'observations' && (
          <div className="space-y-6">
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
            />
            <ObservationsSection patient={selectedPatient} />
          </div>
        )}

        {/* Vista solo reporte estadístico */}
        {activeView === 'report' && (
          <div className="space-y-6">
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
            />
            <ReportPanel
              patient={selectedPatient}
              conditions={currentConditions}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}

        {/* Vista historia clínica detallada */}
        {activeView === 'detailed-report' && (
          <div className="space-y-6">
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
            />
            <DetailedReportPanel
              patient={selectedPatient}
              conditions={currentConditions}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
      </div>

      {/* Panel de estado flotante */}
      {selectedPatient && currentConditions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">Estado Actual</h4>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Activo</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condiciones:</span>
              <span className="font-medium">{currentConditions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última actualización:</span>
              <span className="font-medium">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={handleSaveSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Guardar Progreso
            </button>
          </div>
        </motion.div>
      )}

      {/* Indicadores de ayuda */}
      {!selectedPatient && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 left-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">¡Comencemos!</h4>
              <p className="text-blue-700 text-xs">
                Seleccione un paciente para crear o editar su odontograma digital.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Odontograms;