/**
 * Step 4B: Receta Medica
 *
 * Componente INDEPENDIENTE para gestionar recetas medicas.
 * Incluye:
 * - Selector de medicamentos desde el catalogo (via API)
 * - Campos manuales: Cantidad e Indicaciones
 * - Auto-completado: Nombre y Concentracion
 * - Fecha automatica de prescripcion
 * - Firma digital del medico
 *
 * INTEGRACION: Usa prescriptionsApi para cargar el catalogo de medicamentos
 */

import { useCallback, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, Trash2, ChevronLeft, ChevronRight, Save, User, AlertCircle, Calendar, Clock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { StepHeader, SectionCard, EmptyState } from '@/components/consultation/shared';
import { SignaturePad } from '../SignaturePad';
import { prescriptionsApi, MedicationData, PrescriptionWithItemsData } from '@/services/api/prescriptionsApi';

// Componente para input con estado local (evita lag por debounce)
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: 'text' | 'textarea';
  rows?: number;
}

const DebouncedInput = memo(({ value, onChange, placeholder, className, disabled, type = 'text', rows = 2 }: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar con valor externo cuando cambie
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounce para notificar al padre
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localValue]);

  if (type === 'textarea') {
    return (
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

export interface Medication {
  id: string;
  name: string; // Jalado del catálogo
  concentracion: string; // Jalado del catálogo
  cantidad: string; // Manual
  indicaciones: string; // Manual
  createdAt: string; // Fecha de creación de la receta
  prescribedBy?: string; // ID del médico
  prescribedByName?: string; // Nombre del médico
  prescribedByCOP?: string; // Número de colegiatura del médico
  // Campos legacy para compatibilidad
  presentation?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

// Interfaz para recetas del historial
interface PrescriptionHistoryItem {
  prescription_id: number;
  prescription_date: string;
  dentist_name: string;
  dentist_license?: string;
  signature?: string | null;
  items: {
    medication_name: string;
    concentration?: string;
    quantity: string;
    instructions: string;
  }[];
}

interface PrescriptionStepProps {
  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Medicamentos
  medications: Medication[];
  setMedications: (meds: Medication[] | ((prev: Medication[]) => Medication[])) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegación
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;

  // Usuario actual (médico)
  user?: any;

  // ID del paciente para cargar historial
  patientId?: string | number;
}

/**
 * Componente del Step 4B: Receta Médica
 */
const PrescriptionStepComponent = ({
  currentRecord,
  setCurrentRecord,
  medications,
  setMedications,
  setUnsavedChanges,
  readOnly = false,
  onBack,
  onSave,
  onContinue,
  user,
  patientId
}: PrescriptionStepProps) => {

  // Estado para el catalogo de medicamentos (desde API)
  const [catalogMedications, setCatalogMedications] = useState<MedicationData[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Estado para busqueda de medicamentos
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({});

  // Estado para el historial de recetas
  const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Set<number>>(new Set());
  const [historyReloadTrigger, setHistoryReloadTrigger] = useState(0);
  const prevMedicationsLengthRef = useRef<number>(medications.length);

  // Cargar catalogo de medicamentos desde la API
  useEffect(() => {
    const loadMedicationCatalog = async () => {
      try {
        setLoadingCatalog(true);
        setCatalogError(null);
        const meds = await prescriptionsApi.getMedicationCatalog();
        setCatalogMedications(meds);
      } catch (error) {
        console.error('Error al cargar catalogo de medicamentos:', error);
        setCatalogError('No se pudo cargar el catalogo de medicamentos');
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadMedicationCatalog();
  }, []);

  // Función para cargar el historial de recetas (reutilizable)
  const loadPrescriptionHistory = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoadingHistory(true);
      const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;

      if (isNaN(patientIdNum)) return;

      // Obtener todas las prescripciones del paciente
      const response = await prescriptionsApi.getPrescriptions({
        patient_id: patientIdNum,
        limit: 50 // Últimas 50 recetas
      });

      if (response.success && response.data && response.data.length > 0) {
        // Para cada prescripción, obtener sus items completos
        const historyWithItems: PrescriptionHistoryItem[] = [];

        for (const prescription of response.data) {
          try {
            const detailResponse = await prescriptionsApi.getPrescriptionComplete(prescription.prescription_id!);
            if (detailResponse.success && detailResponse.data) {
              historyWithItems.push({
                prescription_id: detailResponse.data.prescription_id!,
                prescription_date: detailResponse.data.prescription_date || '',
                dentist_name: detailResponse.data.dentist_name || '',
                dentist_license: detailResponse.data.dentist_license,
                signature: detailResponse.data.signature,
                items: (detailResponse.data.items || []).map((item: any) => ({
                  medication_name: item.medication_name || '',
                  concentration: item.concentration || '',
                  quantity: item.quantity || '',
                  instructions: item.instructions || ''
                }))
              });
            }
          } catch (err) {
            console.log('Error al cargar detalles de prescripción:', prescription.prescription_id);
          }
        }

        // Ordenar por fecha descendente (más reciente primero)
        historyWithItems.sort((a, b) => {
          return new Date(b.prescription_date).getTime() - new Date(a.prescription_date).getTime();
        });

        setPrescriptionHistory(historyWithItems);
        // Mostrar automáticamente el historial si hay recetas
        if (historyWithItems.length > 0) {
          setShowHistory(true);
        }
      } else {
        setPrescriptionHistory([]);
      }
    } catch (error) {
      console.error('Error al cargar historial de recetas:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [patientId]);

  // Cargar historial de recetas del paciente cuando cambia el patientId o se recarga
  useEffect(() => {
    loadPrescriptionHistory();
  }, [patientId, historyReloadTrigger, loadPrescriptionHistory]);

  // Detectar cuando se guarda una receta (medications cambia de tener items a estar vacío)
  // Esto indica que se guardó y se limpió el formulario
  useEffect(() => {
    const prevLength = prevMedicationsLengthRef.current;

    // Si teníamos medicamentos y ahora no tenemos, significa que se guardó la receta
    if (prevLength > 0 && medications.length === 0) {
      console.log('🔄 Receta guardada detectada - recargando historial...');
      // Recargar historial después de un pequeño delay para dar tiempo a la BD
      setTimeout(() => {
        setHistoryReloadTrigger(prev => prev + 1);
      }, 500);
    }

    // Actualizar el ref con la longitud actual
    prevMedicationsLengthRef.current = medications.length;
  }, [medications.length]);

  // Toggle para expandir/colapsar una prescripción del historial
  const togglePrescriptionExpand = (prescriptionId: number) => {
    setExpandedPrescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prescriptionId)) {
        newSet.delete(prescriptionId);
      } else {
        newSet.add(prescriptionId);
      }
      return newSet;
    });
  };

  // Formatear fecha para mostrar (sin desfase por timezone)
  const formatDate = (dateStr: string) => {
    try {
      // Para fechas tipo DATE ("2026-03-01" o "2026-03-01T00:00:00.000Z"),
      // parsear componentes directamente para evitar conversión UTC→local
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Cerrar comboboxes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.combobox-container')) {
        setOpenComboboxes({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers para medicamentos
  const addMedication = () => {
    const newMed: Medication = {
      id: Date.now().toString(),
      name: '',
      concentracion: '',
      cantidad: '',
      indicaciones: '',
      createdAt: new Date().toISOString(), // Fecha automática
      prescribedBy: currentRecord?.doctorId || user?.id,
      prescribedByName: currentRecord?.doctorName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim(),
      prescribedByCOP: user?.profile?.licenseNumber || ''
    };
    setMedications(prev => [...prev, newMed]);
    setUnsavedChanges(true);
  };

  // Handler para abrir/cerrar combobox
  const toggleCombobox = (medId: string) => {
    setOpenComboboxes(prev => ({ ...prev, [medId]: !prev[medId] }));
  };

  // Handler para búsqueda en combobox
  const handleSearchMedication = (medId: string, searchValue: string) => {
    setSearchTerms(prev => ({ ...prev, [medId]: searchValue }));
    setOpenComboboxes(prev => ({ ...prev, [medId]: true })); // Abrir al escribir
  };

  // Handler para seleccionar medicamento del combobox
  const selectMedicationFromCombobox = (medId: string, catalogMed: MedicationData) => {
    setMedications(prev => prev.map(med =>
      med.id === medId ? {
        ...med,
        name: catalogMed.medication_name,
        concentracion: catalogMed.concentration || ''
      } : med
    ));
    const displayText = catalogMed.concentration
      ? `${catalogMed.medication_name} - ${catalogMed.concentration}`
      : catalogMed.medication_name;
    setSearchTerms(prev => ({ ...prev, [medId]: displayText }));
    setOpenComboboxes(prev => ({ ...prev, [medId]: false })); // Cerrar despues de seleccionar
    setUnsavedChanges(true);
  };

  // Obtener sugerencias filtradas para un medicamento
  const getFilteredSuggestions = (medId: string) => {
    const searchTerm = searchTerms[medId] || '';
    if (!searchTerm) return catalogMedications;

    const searchLower = searchTerm.toLowerCase();
    return catalogMedications.filter(med =>
      med.medication_name.toLowerCase().includes(searchLower) ||
      (med.concentration && med.concentration.toLowerCase().includes(searchLower)) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchLower))
    );
  };

  // Función directa para actualizar medicamentos (sin debounce - el componente DebouncedInput lo maneja)
  const updateMedication = useCallback((id: string, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
    setUnsavedChanges(true);
  }, [setMedications, setUnsavedChanges]);

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
    setUnsavedChanges(true);
  };

  const handleSignatureChange = useCallback((signature: string | null) => {
    console.log('📝 PrescriptionStep - handleSignatureChange llamado:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0
    });
    setCurrentRecord((prev: any) => {
      const updated = {
        ...prev,
        prescriptionSignature: signature
      };
      return updated;
    });
    setUnsavedChanges(true);
  }, [setCurrentRecord, setUnsavedChanges]);

  const handleContinue = () => {
    // Validar que si hay medicamentos, tengan los campos requeridos
    const invalidMeds = medications.filter(med =>
      med.name.trim() === '' ||
      med.concentracion.trim() === '' ||
      med.cantidad.trim() === '' ||
      med.indicaciones.trim() === ''
    );
    if (invalidMeds.length > 0) {
      alert('Por favor complete todos los campos requeridos (Medicamento, Concentración, Cantidad e Indicaciones) o elimine los medicamentos incompletos');
      return;
    }

    // Guardar y continuar
    onSave();
    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <StepHeader
        icon={Pill}
        title="Receta Médica"
        subtitle="Prescriba los medicamentos necesarios para el tratamiento del paciente"
        stepNumber="4B"
      />

      {/* Historial de Recetas */}
      {prescriptionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
            {/* Header del historial */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Historial de Recetas</h3>
                  <p className="text-sm text-gray-600">
                    {prescriptionHistory.length} receta{prescriptionHistory.length !== 1 ? 's' : ''} anterior{prescriptionHistory.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loadingHistory && (
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                )}
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Contenido del historial */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-3 max-h-96 overflow-y-auto">
                    {prescriptionHistory.map((prescription) => (
                      <div
                        key={prescription.prescription_id}
                        className="bg-white rounded-lg border border-amber-200 overflow-hidden"
                      >
                        {/* Header de la receta */}
                        <button
                          onClick={() => togglePrescriptionExpand(prescription.prescription_id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <div className="text-left">
                              <p className="font-medium text-gray-900 text-sm">
                                {formatDate(prescription.prescription_date)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Dr(a). {prescription.dentist_name}
                                {prescription.dentist_license && ` - COP: ${prescription.dentist_license}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              {prescription.items.length} medicamento{prescription.items.length !== 1 ? 's' : ''}
                            </span>
                            {expandedPrescriptions.has(prescription.prescription_id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Detalle de la receta */}
                        <AnimatePresence>
                          {expandedPrescriptions.has(prescription.prescription_id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <div className="mt-3 space-y-2">
                                  {prescription.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 rounded-lg p-3 text-sm"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">
                                            {item.medication_name}
                                            {item.concentration && (
                                              <span className="text-gray-500 font-normal"> - {item.concentration}</span>
                                            )}
                                          </p>
                                          <p className="text-gray-600 text-xs mt-1">
                                            <span className="font-medium">Cantidad:</span> {item.quantity}
                                          </p>
                                          <p className="text-gray-600 text-xs">
                                            <span className="font-medium">Indicaciones:</span> {item.instructions}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {prescription.signature && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">Firma digital:</p>
                                    <img
                                      src={prescription.signature}
                                      alt="Firma del médico"
                                      className="h-12 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Receta Médica */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionCard
          icon={Pill}
          title="Receta Médica"
          subtitle="Configure los medicamentos prescritos"
          colorScheme="indigo"
          animationDelay={0}
        >
          <div className="space-y-4">
            {/* Lista de Medicamentos */}
            {medications.length === 0 ? (
              <EmptyState
                icon={Pill}
                message="No hay medicamentos en la receta"
              />
            ) : (
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-200 relative"
                  >
                    <button
                      onClick={() => removeMedication(med.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                      disabled={readOnly}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3">
                      {/* Combobox de Medicamentos */}
                      <div className="combobox-container">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Buscar Medicamento <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          {/* Input de búsqueda con botón dropdown */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={searchTerms[med.id] || ''}
                              onChange={(e) => handleSearchMedication(med.id, e.target.value)}
                              onFocus={() => setOpenComboboxes(prev => ({ ...prev, [med.id]: true }))}
                              placeholder={loadingCatalog ? 'Cargando medicamentos...' : 'Escriba para buscar...'}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                              disabled={readOnly || loadingCatalog}
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              onClick={() => toggleCombobox(med.id)}
                              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              disabled={readOnly || loadingCatalog}
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Dropdown con lista de medicamentos */}
                          {openComboboxes[med.id] && !loadingCatalog && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {catalogError ? (
                                <div className="px-3 py-2 text-sm text-red-500 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  {catalogError}
                                </div>
                              ) : getFilteredSuggestions(med.id).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No se encontraron medicamentos
                                </div>
                              ) : (
                                getFilteredSuggestions(med.id).map(catalogMed => (
                                  <button
                                    key={catalogMed.medication_id}
                                    type="button"
                                    onClick={() => selectMedicationFromCombobox(med.id, catalogMed)}
                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{catalogMed.medication_name}</div>
                                    <div className="text-xs text-gray-500">
                                      {catalogMed.concentration || catalogMed.generic_name || 'Sin concentracion especificada'}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Escriba para buscar o haga clic en la flecha para ver todos
                        </p>
                      </div>

                      {/* Campos auto-completados (solo lectura) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Medicamento Seleccionado
                          </label>
                          <input
                            type="text"
                            value={med.name}
                            readOnly
                            placeholder="Seleccione del catálogo"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Concentración
                          </label>
                          <input
                            type="text"
                            value={med.concentracion}
                            readOnly
                            placeholder="Auto-completado"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
                          />
                        </div>
                      </div>

                      {/* Campos manuales - Usando DebouncedInput para escritura fluida */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cantidad <span className="text-red-500">*</span>
                          </label>
                          <DebouncedInput
                            value={med.cantidad}
                            onChange={(value) => updateMedication(med.id, 'cantidad', value)}
                            placeholder="Ej: 20 tabletas, 1 frasco"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            disabled={readOnly}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Indicaciones <span className="text-red-500">*</span>
                          </label>
                          <DebouncedInput
                            type="textarea"
                            value={med.indicaciones}
                            onChange={(value) => updateMedication(med.id, 'indicaciones', value)}
                            placeholder="Ej: Tomar 1 tableta cada 8 horas por 7 días"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Botón Agregar Medicamento */}
            <button
              onClick={addMedication}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={readOnly}
            >
              <Plus className="w-4 h-4" />
              Agregar Medicamento
            </button>

            {/* Firma Digital - Canvas */}
            <div className={medications.length === 0 ? 'hidden' : 'mt-6 pt-6 border-t border-indigo-200'}>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Firma Digital del Médico</h4>
              <p className="text-xs text-gray-500 mb-3">Firme para validar esta receta médica</p>
              <SignaturePad
                key={`prescription-signature-${medications.length > 0 ? 'visible' : 'hidden'}`}
                onSignatureChange={handleSignatureChange}
                signatureData={currentRecord?.prescriptionSignature || null}
                disabled={readOnly}
              />

              {/* Información del médico */}
              {user && (
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Dr(a). {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                      </p>
                      {user.profile?.licenseNumber && (
                        <p className="text-xs text-gray-600">
                          COP: <span className="font-semibold">{user.profile.licenseNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {user.profile?.specialties && user.profile.specialties.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Especialidad: {user.profile.specialties.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Botones de Navegación */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-2.5 text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Guardar Progreso
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Exportar el componente memoizado
export const PrescriptionStep = memo(PrescriptionStepComponent);
