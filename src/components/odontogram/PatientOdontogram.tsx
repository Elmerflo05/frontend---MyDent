import { useState, useEffect, useMemo, useRef } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import useOdontogramStore, { type ToothCondition } from '@/store/odontogramStore';
import usePatientTreatmentStore from '@/store/patientTreatmentStore';
import type { Patient } from '@/types';
import AdditionalServicesModal from './AdditionalServicesModal';
import { Odontogram, Tooth } from './classes';
import { useOdontogramState } from './hooks';
import { logger } from '@/lib/logger';
import {
  PatientOdontogramHeader,
  OdontogramControls,
  ToothContextMenu,
  EditConditionModal,
  PriceConfirmModal,
  HoverPriceModal,
  ToothSVG
} from './components';

interface PatientOdontogramProps {
  patient?: Patient | any | null;
  patientId?: string;
  onConditionsChange?: (conditions: ToothCondition[]) => void;
  onToothUpdate?: (toothData: any) => void;
  className?: string;
  hideStatsCards?: boolean;
}

// Adult teeth positions and types
const ADULT_TEETH_CONFIG = [
  // Quadrant 1 (Upper Right)
  { number: '18', type: 'molar' as const, position: { x: 150, y: 270 } },
  { number: '17', type: 'molar' as const, position: { x: 250, y: 245 } },
  { number: '16', type: 'molar' as const, position: { x: 350, y: 225 } },
  { number: '15', type: 'premolar' as const, position: { x: 450, y: 210 } },
  { number: '14', type: 'premolar' as const, position: { x: 550, y: 200 } },
  { number: '13', type: 'canine' as const, position: { x: 650, y: 195 } },
  { number: '12', type: 'incisor' as const, position: { x: 750, y: 193 } },
  { number: '11', type: 'incisor' as const, position: { x: 850, y: 192 } },
  // Quadrant 2 (Upper Left)
  { number: '21', type: 'incisor' as const, position: { x: 950, y: 192 } },
  { number: '22', type: 'incisor' as const, position: { x: 1050, y: 193 } },
  { number: '23', type: 'canine' as const, position: { x: 1150, y: 195 } },
  { number: '24', type: 'premolar' as const, position: { x: 1250, y: 200 } },
  { number: '25', type: 'premolar' as const, position: { x: 1350, y: 210 } },
  { number: '26', type: 'molar' as const, position: { x: 1450, y: 225 } },
  { number: '27', type: 'molar' as const, position: { x: 1550, y: 245 } },
  { number: '28', type: 'molar' as const, position: { x: 1650, y: 270 } },
  // Quadrant 3 (Lower Left)
  { number: '38', type: 'molar' as const, position: { x: 1650, y: 430 } },
  { number: '37', type: 'molar' as const, position: { x: 1550, y: 455 } },
  { number: '36', type: 'molar' as const, position: { x: 1450, y: 475 } },
  { number: '35', type: 'premolar' as const, position: { x: 1350, y: 490 } },
  { number: '34', type: 'premolar' as const, position: { x: 1250, y: 500 } },
  { number: '33', type: 'canine' as const, position: { x: 1150, y: 505 } },
  { number: '32', type: 'incisor' as const, position: { x: 1050, y: 507 } },
  { number: '31', type: 'incisor' as const, position: { x: 950, y: 508 } },
  // Quadrant 4 (Lower Right)
  { number: '41', type: 'incisor' as const, position: { x: 850, y: 508 } },
  { number: '42', type: 'incisor' as const, position: { x: 750, y: 507 } },
  { number: '43', type: 'canine' as const, position: { x: 650, y: 505 } },
  { number: '44', type: 'premolar' as const, position: { x: 550, y: 500 } },
  { number: '45', type: 'premolar' as const, position: { x: 450, y: 490 } },
  { number: '46', type: 'molar' as const, position: { x: 350, y: 475 } },
  { number: '47', type: 'molar' as const, position: { x: 250, y: 455 } },
  { number: '48', type: 'molar' as const, position: { x: 150, y: 430 } }
];

// Función para normalizar tooth_number al formato con punto (ej: "18" -> "1.8")
const normalizeToothNumber = (toothNumber: string): string => {
  if (!toothNumber) return toothNumber;
  // Si ya tiene punto, retornar tal cual
  if (toothNumber.includes('.')) return toothNumber;
  // Si tiene 2 dígitos, insertar punto (ej: "18" -> "1.8")
  if (toothNumber.length === 2) {
    return `${toothNumber[0]}.${toothNumber[1]}`;
  }
  return toothNumber;
};

const PatientOdontogram = ({
  patient,
  patientId,
  onConditionsChange,
  onToothUpdate,
  className = '',
  hideStatsCards = false
}: PatientOdontogramProps) => {
  const {
    dentalConditions,
    customConditions,
    visualSettings
  } = useOdontogramConfigStore();

  const {
    getPatientOdontogram,
    addConditionToPatient,
    removeConditionFromPatient,
    updateConditionPrice,
    exportOdontogram,
    getPatientStatistics,
    loadPatientOdontogramFromDB,
    isLoading
  } = useOdontogramStore();

  const {
    addServicesToPatient,
    getTreatmentPlan,
    getServicesForPatient
  } = usePatientTreatmentStore();

  // Get effective patient ID
  const effectivePatientId = patientId || patient?.id;

  // Initialize Odontogram POO instance
  const odontogram = useMemo(() => {
    if (!effectivePatientId) return null;
    const og = new Odontogram(effectivePatientId);

    // Initialize teeth with their positions
    ADULT_TEETH_CONFIG.forEach(config => {
      const tooth = new Tooth(config.number, config.type, parseInt(config.number) < 30 ? 'upper' : 'lower');
      og['teeth'].set(config.number, tooth);
    });

    return og;
  }, [effectivePatientId]);

  // Load conditions into Odontogram
  useEffect(() => {
    if (odontogram && effectivePatientId) {
      const conditions = getPatientOdontogram(effectivePatientId);
      conditions.forEach(condition => {
        odontogram.addCondition(condition.toothNumber, condition);
      });
    }
  }, [odontogram, effectivePatientId, getPatientOdontogram]);

  // UI State management
  const {
    patientConditions,
    setPatientConditions,
    hoveredTooth,
    setHoveredTooth,
    showLabels,
    setShowLabels,
    showRoots,
    setShowRoots,
    showServicesModal,
    setShowServicesModal,
    hoverPriceModal,
    setHoverPriceModal,
    contextMenu,
    setContextMenu,
    editConditionModal,
    setEditConditionModal,
    priceConfirmModal,
    setPriceConfirmModal
  } = useOdontogramState(visualSettings);

  // Estado local para controlar carga inicial
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false);
  const loadedPatientRef = useRef<string | null>(null);

  // Load patient conditions from DB on mount or patient change
  useEffect(() => {
    const loadFromDB = async () => {
      if (!effectivePatientId) {
        setPatientConditions([]);
        return;
      }

      // Evitar cargar dos veces para el mismo paciente
      if (loadedPatientRef.current === effectivePatientId) {
        const conditions = getPatientOdontogram(effectivePatientId);
        setPatientConditions(conditions);
        return;
      }

      try {
        setIsLoadingFromDB(true);
        logger.info(`[PatientOdontogram] Cargando odontograma desde BD para paciente ${effectivePatientId}...`);

        // Intentar cargar desde la BD
        const patientIdNum = parseInt(effectivePatientId, 10);
        if (!isNaN(patientIdNum)) {
          const conditions = await loadPatientOdontogramFromDB(patientIdNum);
          setPatientConditions(conditions);
          loadedPatientRef.current = effectivePatientId;
          logger.info(`[PatientOdontogram] ✅ Cargadas ${conditions.length} condiciones desde BD`);
        } else {
          // Si no es un ID numérico válido, usar el store local
          const conditions = getPatientOdontogram(effectivePatientId);
          setPatientConditions(conditions);
        }
      } catch (error) {
        logger.error('[PatientOdontogram] Error al cargar odontograma desde BD:', error);
        // Fallback: cargar desde store local
        const conditions = getPatientOdontogram(effectivePatientId);
        setPatientConditions(conditions);
        toast.error('No se pudo cargar el odontograma desde el servidor');
      } finally {
        setIsLoadingFromDB(false);
      }
    };

    loadFromDB();
  }, [effectivePatientId, getPatientOdontogram, loadPatientOdontogramFromDB, setPatientConditions]);

  // Notify changes
  useEffect(() => {
    if (onConditionsChange) {
      onConditionsChange(patientConditions);
    }
  }, [patientConditions, onConditionsChange]);

  // Combine active conditions
  const DENTAL_CONDITIONS = useMemo(() => {
    const allConditions = [...dentalConditions, ...customConditions];
    return allConditions
      .filter(c => c.active)
      .map(c => ({
        id: c.id,
        label: c.label,
        color: c.color,
        description: c.description || '',
        price: c.price_base || c.default_price || 0
      }));
  }, [dentalConditions, customConditions]);

  // Handlers
  const handleToothSectionClick = (event: React.MouseEvent, toothNumber: string, sectionId: string) => {
    if (!patient && !effectivePatientId) {
      toast.error('Debe seleccionar un paciente primero');
      return;
    }

    event.stopPropagation();

    const normalizedTooth = normalizeToothNumber(toothNumber);
    const allToothConditions = patientConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedTooth);

    if (allToothConditions.length >= 2) {
      setEditConditionModal({
        visible: true,
        toothNumber,
        sectionId,
        conditions: allToothConditions
      });
    } else {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        toothNumber,
        sectionId
      });
    }
  };

  const handleConditionSelect = (conditionId: string) => {
    if (!contextMenu || !effectivePatientId) return;

    if (conditionId === 'remove') {
      const normalizedContextTooth = normalizeToothNumber(contextMenu.toothNumber);
      const conditionToRemove = patientConditions.find(
        c => normalizeToothNumber(c.toothNumber) === normalizedContextTooth && c.sectionId === contextMenu.sectionId
      );

      removeConditionFromPatient(effectivePatientId, contextMenu.toothNumber, contextMenu.sectionId);

      if (conditionToRemove?.price && conditionToRemove.price > 0) {
        const conditionConfig = [...dentalConditions, ...customConditions].find(c => c.id === conditionToRemove.condition);
        toast.info(
          `${conditionConfig?.label || 'Condición'} removida: -S/ ${conditionToRemove.price.toFixed(2)} del presupuesto`,
          { duration: 3000 }
        );
      } else {
        toast.info('Condición removida del odontograma');
      }

      const updatedConditions = getPatientOdontogram(effectivePatientId);
      setPatientConditions(updatedConditions);
      setContextMenu(null);
    } else {
      const condition = DENTAL_CONDITIONS.find(c => c.id === conditionId);
      if (condition) {
        const conditionConfig = [...dentalConditions, ...customConditions].find(c => c.id === conditionId);
        // Usar price_base primero, luego default_price como fallback
        const defaultPrice = conditionConfig?.price_base || conditionConfig?.default_price || 0;

        addConditionToPatient(effectivePatientId, {
          toothNumber: contextMenu.toothNumber,
          sectionId: contextMenu.sectionId,
          condition: condition.id,
          color: condition.color,
          date: new Date(),
          patientId: effectivePatientId,
          price: defaultPrice,
          // Campos para la BD - homologación con tablas
          dental_condition_id: conditionConfig?.condition_id,
          condition_name: conditionConfig?.label || condition.label
        });

        const updatedConditions = getPatientOdontogram(effectivePatientId);
        setPatientConditions(updatedConditions);

        const normalizedMenuTooth = normalizeToothNumber(contextMenu.toothNumber);
        const allToothConditions = updatedConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedMenuTooth);

        if (allToothConditions.length >= 2) {
          setEditConditionModal({
            visible: true,
            toothNumber: contextMenu.toothNumber,
            sectionId: contextMenu.sectionId,
            conditions: allToothConditions
          });

          toast.success(
            `${condition.label} agregado. Ahora puede editar los precios`,
            { duration: 3000 }
          );
        } else {
          if (defaultPrice > 0) {
            toast.success(
              `${condition.label} agregado: +S/ ${defaultPrice.toFixed(2)} al presupuesto`,
              { duration: 3000 }
            );
          } else {
            toast.success(`${condition.label} aplicado al diente ${contextMenu.toothNumber}`);
          }
        }

        setContextMenu(null);
      }
    }
  };

  const handleConfirmPrice = (conditionId: string, toothNumber: string, sectionId: string, price: number) => {
    if (!effectivePatientId) return;

    const condition = DENTAL_CONDITIONS.find(c => c.id === conditionId);
    const conditionConfig = [...dentalConditions, ...customConditions].find(c => c.id === conditionId);
    if (condition) {
      addConditionToPatient(effectivePatientId, {
        toothNumber,
        sectionId,
        condition: condition.id,
        color: condition.color,
        date: new Date(),
        patientId: effectivePatientId,
        price,
        // Campos para la BD - homologación con tablas
        dental_condition_id: conditionConfig?.condition_id,
        condition_name: conditionConfig?.label || condition.label
      });

      if (price > 0) {
        toast.success(
          `${condition.label} agregado: +S/ ${price.toFixed(2)} al presupuesto`,
          { duration: 3000 }
        );
      } else {
        toast.success(`${condition.label} aplicado al diente ${toothNumber}`);
      }

      const updatedConditions = getPatientOdontogram(effectivePatientId);
      setPatientConditions(updatedConditions);

      if (editConditionModal?.visible) {
        const normalizedEditTooth = normalizeToothNumber(editConditionModal.toothNumber);
        setEditConditionModal({
          ...editConditionModal,
          conditions: updatedConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedEditTooth)
        });
      }
    }
  };

  const handleToothTotalPriceChange = (toothNumber: string, newTotalPrice: number) => {
    if (!effectivePatientId || !odontogram) return;

    odontogram.updateToothTotalPrice(toothNumber, newTotalPrice);

    // Sync with store
    const tooth = odontogram.getTooth(toothNumber);
    if (tooth) {
      const conditions = tooth.getConditions();
      conditions.forEach(condition => {
        updateConditionPrice(effectivePatientId, condition.toothNumber, condition.sectionId, condition.price || 0);
      });
    }

    const updatedConditions = getPatientOdontogram(effectivePatientId);
    setPatientConditions(updatedConditions);

    toast.success(`Precio del diente ${toothNumber} actualizado: S/ ${newTotalPrice.toFixed(2)}`);
  };

  const handleUpdatePrice = (toothNumber: string, sectionId: string, newPrice: number) => {
    if (!effectivePatientId) return;

    updateConditionPrice(effectivePatientId, toothNumber, sectionId, newPrice);
    const updatedConditions = getPatientOdontogram(effectivePatientId);
    setPatientConditions(updatedConditions);

    if (editConditionModal?.visible) {
      const normalizedEditTooth2 = normalizeToothNumber(editConditionModal.toothNumber);
      setEditConditionModal({
        ...editConditionModal,
        conditions: updatedConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedEditTooth2)
      });
    }
  };

  const handleRemoveCondition = (toothNumber: string, sectionId: string) => {
    if (!effectivePatientId) return;

    removeConditionFromPatient(effectivePatientId, toothNumber, sectionId);
    const updatedConditions = getPatientOdontogram(effectivePatientId);
    setPatientConditions(updatedConditions);

    if (editConditionModal?.visible) {
      const normalizedEditTooth3 = normalizeToothNumber(editConditionModal.toothNumber);
      setEditConditionModal({
        ...editConditionModal,
        conditions: updatedConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedEditTooth3)
      });
    }

    toast.success('Condición eliminada');
  };

  const handleReset = () => {
    if (!effectivePatientId) return;

    if (confirm('¿Está seguro de que desea limpiar todo el odontograma?')) {
      patientConditions.forEach(condition => {
        removeConditionFromPatient(effectivePatientId, condition.toothNumber, condition.sectionId);
      });

      setPatientConditions([]);
      toast.success('Odontograma limpiado exitosamente');
    }
  };

  const handleSave = () => {
    if (!effectivePatientId) return;
    toast.success('Odontograma guardado correctamente');
  };

  const handleExport = () => {
    if (!effectivePatientId) return;

    const data = exportOdontogram(effectivePatientId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const patientName = patient ? `${patient.firstName}-${patient.lastName}` : 'paciente';
    a.download = `odontograma-${patientName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Odontograma exportado exitosamente');
  };

  const handleServicesSelected = (selectedServices: any[]) => {
    if (!effectivePatientId) return;

    addServicesToPatient(effectivePatientId, selectedServices);
    const treatmentPlan = getTreatmentPlan(effectivePatientId);
    const totalCost = treatmentPlan?.totalCost || 0;

    toast.success(
      `${selectedServices.length} servicios agregados al plan de tratamiento. Total: S/ ${totalCost.toFixed(2)}`,
      { duration: 4000 }
    );
  };

  const handleToothHover = (event: React.MouseEvent, toothNumber: string) => {
    if (!odontogram) return;

    const tooth = odontogram.getTooth(toothNumber);
    if (!tooth || !tooth.hasPricedConditions()) return;

    const rect = (event.currentTarget as Element).getBoundingClientRect();
    setHoverPriceModal({
      visible: true,
      toothNumber,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleToothHoverLeave = () => {
    setHoverPriceModal(null);
  };

  const getSectionColor = (toothNumber: string, sectionId: string) => {
    // Normalizar el toothNumber para comparar (ej: "18" -> "1.8")
    const normalizedToothNumber = normalizeToothNumber(toothNumber);
    const condition = patientConditions.find(
      c => normalizeToothNumber(c.toothNumber) === normalizedToothNumber && c.sectionId === sectionId
    );
    return condition ? condition.color : '#ffffff';
  };

  const getPatientStats = () => {
    if (!effectivePatientId) return null;
    return getPatientStatistics(effectivePatientId);
  };

  const getToothPricedConditions = (toothNumber: string) => {
    const normalizedToothNumber = normalizeToothNumber(toothNumber);
    return patientConditions.filter(c => normalizeToothNumber(c.toothNumber) === normalizedToothNumber && c.price && c.price > 0);
  };

  const getToothTotalPrice = (toothNumber: string) => {
    const toothConditions = getToothPricedConditions(toothNumber);
    return toothConditions.reduce((total, condition) => total + (condition.price || 0), 0);
  };

  // No patient selected
  if (!patient && !effectivePatientId) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Seleccione un Paciente</h3>
        <p className="text-gray-600">Para crear un odontograma, primero debe seleccionar un paciente.</p>
      </div>
    );
  }

  // Loading state
  if (isLoadingFromDB) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando Odontograma</h3>
        <p className="text-gray-600">Obteniendo información dental del paciente...</p>
      </div>
    );
  }

  const stats = getPatientStats();
  const totalBudget = patientConditions.reduce((total, condition) => total + (condition.price || 0), 0);
  const servicesCount = effectivePatientId ? getServicesForPatient(effectivePatientId).length : 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} onClick={() => setContextMenu(null)}>
      {/* Header */}
      <PatientOdontogramHeader
        patient={patient}
        stats={stats}
        totalBudget={totalBudget}
        servicesCount={servicesCount}
        hideStatsCards={hideStatsCards}
        onExport={handleExport}
        onShowServices={() => setShowServicesModal(true)}
        onReset={handleReset}
        onSave={handleSave}
      />

      {/* Controls */}
      <OdontogramControls
        showLabels={showLabels}
        showRoots={showRoots}
        onShowLabelsChange={setShowLabels}
        onShowRootsChange={setShowRoots}
        legendConditions={DENTAL_CONDITIONS.slice(0, 4)}
      />

      {/* Odontogram SVG */}
      <div className="p-6">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 overflow-auto">
          <svg
            width="1800"
            height="900"
            viewBox="0 0 1800 900"
            className="mx-auto"
          >
            {/* Definitions */}
            <defs>
              <radialGradient id="toothGradient">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f9fafb" />
              </radialGradient>
              <filter id="toothGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Guide arcs */}
            <path
              d="M 150 270 Q 900 150 1650 270"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
            <path
              d="M 150 430 Q 900 550 1650 430"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />

            {/* Quadrant lines */}
            <line x1="900" y1="100" x2="900" y2="600" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.6" />
            <line x1="100" y1="350" x2="1700" y2="350" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.6" />

            {/* Quadrant labels */}
            <text x="450" y="60" className="fill-gray-600 text-sm font-semibold">Cuadrante 1 (Superior Derecho)</text>
            <text x="1050" y="60" className="fill-gray-600 text-sm font-semibold">Cuadrante 2 (Superior Izquierdo)</text>
            <text x="1050" y="650" className="fill-gray-600 text-sm font-semibold">Cuadrante 3 (Inferior Izquierdo)</text>
            <text x="450" y="650" className="fill-gray-600 text-sm font-semibold">Cuadrante 4 (Inferior Derecho)</text>

            {/* Render teeth */}
            {ADULT_TEETH_CONFIG.map((toothConfig) => {
              const tooth = odontogram?.getTooth(toothConfig.number);
              if (!tooth) return null;

              return (
                <ToothSVG
                  key={toothConfig.number}
                  tooth={tooth}
                  showLabels={showLabels}
                  showRoots={showRoots}
                  hoveredTooth={hoveredTooth}
                  highlightHover={visualSettings.highlightHover}
                  enableAnimations={visualSettings.enableAnimations}
                  onToothSectionClick={handleToothSectionClick}
                  onToothHover={handleToothHover}
                  onToothHoverLeave={handleToothHoverLeave}
                  getSectionColor={getSectionColor}
                  position={toothConfig.position}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Context Menu */}
      <ToothContextMenu
        visible={contextMenu?.visible || false}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        toothNumber={contextMenu?.toothNumber || ''}
        sectionId={contextMenu?.sectionId || ''}
        conditions={DENTAL_CONDITIONS}
        hasExistingCondition={
          contextMenu ? patientConditions.some(
            c => normalizeToothNumber(c.toothNumber) === normalizeToothNumber(contextMenu.toothNumber) && c.sectionId === contextMenu.sectionId
          ) : false
        }
        onConditionSelect={handleConditionSelect}
        onClose={() => setContextMenu(null)}
      />

      {/* Edit Condition Modal */}
      <EditConditionModal
        visible={editConditionModal?.visible || false}
        toothNumber={editConditionModal?.toothNumber || ''}
        sectionId={editConditionModal?.sectionId || ''}
        conditions={editConditionModal?.conditions || []}
        dentalConditions={dentalConditions}
        customConditions={customConditions}
        onClose={() => setEditConditionModal(null)}
        onUpdatePrice={handleUpdatePrice}
        onRemoveCondition={handleRemoveCondition}
        onConditionsUpdate={setPatientConditions}
      />

      {/* Price Confirm Modal */}
      {priceConfirmModal?.visible && (
        <PriceConfirmModal
          visible={priceConfirmModal.visible}
          conditionId={priceConfirmModal.conditionId}
          conditionLabel={priceConfirmModal.conditionLabel}
          conditionColor={DENTAL_CONDITIONS.find(c => c.id === priceConfirmModal.conditionId)?.color || '#3B82F6'}
          defaultPrice={priceConfirmModal.defaultPrice}
          toothNumber={priceConfirmModal.toothNumber}
          sectionId={priceConfirmModal.sectionId}
          onConfirm={handleConfirmPrice}
          onClose={() => setPriceConfirmModal(null)}
        />
      )}

      {/* Hover Price Modal */}
      {hoverPriceModal?.visible && effectivePatientId && (
        <HoverPriceModal
          visible={hoverPriceModal.visible}
          toothNumber={hoverPriceModal.toothNumber}
          x={hoverPriceModal.x}
          y={hoverPriceModal.y}
          conditions={getToothPricedConditions(hoverPriceModal.toothNumber)}
          totalPrice={getToothTotalPrice(hoverPriceModal.toothNumber)}
          dentalConditions={dentalConditions}
          customConditions={customConditions}
          onTotalPriceChange={handleToothTotalPriceChange}
          onMouseEnter={() => setHoverPriceModal(hoverPriceModal)}
          onMouseLeave={handleToothHoverLeave}
        />
      )}

      {/* Additional Services Modal */}
      {effectivePatientId && (
        <AdditionalServicesModal
          isOpen={showServicesModal}
          onClose={() => setShowServicesModal(false)}
          patient={patient}
          onServicesSelected={handleServicesSelected}
        />
      )}
    </div>
  );
};

export default PatientOdontogram;
