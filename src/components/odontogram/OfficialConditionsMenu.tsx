/**
 * MENÚ DE CONDICIONES OFICIALES - COLEGIO ODONTOLÓGICO DEL PERÚ
 * Sistema híbrido responsive:
 * - Desktop (>1024px): Menú flotante contextual
 * - Tablet (768-1024px): Bottom drawer (60% altura)
 * - Mobile (<768px): Full screen modal
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CONDITION_CATEGORIES, DentalCondition, OFFICIAL_COLORS } from '@/constants/dentalConditions';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { ChevronRight, X } from 'lucide-react';
import { useViewportSize } from '@/hooks/useViewportSize';

interface OfficialConditionsMenuProps {
  x: number;
  y: number;
  toothNumber: string;
  sectionId?: string;
  onConditionSelect: (condition: DentalCondition, abbreviation?: string, state?: 'good' | 'bad') => void;
  onClose: () => void;
  portalContainer?: HTMLElement | null; // Contenedor para portal (fullscreen support)
  isFullscreen?: boolean; // Estado de fullscreen para evitar cerrar accidentalmente
}

export const OfficialConditionsMenu = ({
  x,
  y,
  toothNumber,
  sectionId,
  onConditionSelect,
  onClose,
  portalContainer,
  isFullscreen = false
}: OfficialConditionsMenuProps) => {
  const { mode } = useViewportSize();

  // Obtener condiciones desde el store (base de datos)
  const { dentalConditions, customConditions, isLoadingConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<DentalCondition | null>(null);
  const [selectedAbbreviation, setSelectedAbbreviation] = useState<string | null>(null);

  // Filtrar condiciones por categoría
  const getConditionsByCategory = (categoryId: string) => {
    return OFFICIAL_DENTAL_CONDITIONS.filter(c => c.category === categoryId);
  };

  // Si una condición tiene múltiples abreviaturas O tiene estado condicional, mostrar submenú
  const handleConditionClick = (condition: DentalCondition) => {
    if (condition.abbreviations || condition.colorConditional) {
      setSelectedCondition(condition);
    } else {
      onConditionSelect(condition, condition.abbreviation);
      onClose();
    }
  };

  // Seleccionar abreviatura específica
  const handleAbbreviationSelect = (abbreviation: string) => {
    if (selectedCondition) {
      // CASO ESPECIAL: Corona Definitiva - CMC automáticamente en estado 'bad' (rojo)
      if (selectedCondition.id === 'corona-definitiva' && abbreviation === 'CMC') {
        onConditionSelect(selectedCondition, abbreviation, 'bad');
        onClose();
        return;
      }

      // Si no tiene estado, aplicar directamente
      onConditionSelect(selectedCondition, abbreviation);
      onClose();
    }
  };

  // Seleccionar estado (bueno/malo) para condiciones con colorConditional
  const handleStateSelect = (state: 'good' | 'bad', abbreviation?: string) => {
    if (selectedCondition) {
      onConditionSelect(selectedCondition, abbreviation, state);
      onClose();
    }
  };

  // ==================== CONFIGURACIÓN POR MODO ====================

  // Animaciones según el modo
  const getAnimationVariants = () => {
    switch (mode) {
      case 'mobile':
        // Fullscreen: slide desde abajo
        return {
          initial: { y: '100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '100%', opacity: 0 }
        };
      case 'tablet':
        // Bottom drawer: slide desde abajo
        return {
          initial: { y: '100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '100%', opacity: 0 }
        };
      case 'desktop':
        // Flotante: scale + fade
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 }
        };
    }
  };

  // Estilos del contenedor según el modo
  const getContainerStyles = () => {
    switch (mode) {
      case 'mobile':
        // Fullscreen modal
        return {
          position: 'fixed' as const,
          inset: 0,
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          borderRadius: 0
        };
      case 'tablet':
        // Bottom drawer (60% de altura)
        return {
          position: 'fixed' as const,
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '60vh',
          maxHeight: '60vh',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem'
        };
      case 'desktop':
        // Flotante contextual - PEGADO AL DIENTE
        const menuWidth = selectedCategory || selectedCondition ? 400 : 280;
        const maxHeight = 500;
        const minHeight = 200;
        const padding = 10;

        // Usar directamente las coordenadas pasadas (ya calculadas óptimamente)
        let finalX = x;
        let finalY = y;

        // Solo ajustar si se sale completamente del viewport
        // Ajuste horizontal mínimo
        if (finalX + menuWidth > window.innerWidth - padding) {
          finalX = window.innerWidth - menuWidth - padding;
        }
        if (finalX < padding) {
          finalX = padding;
        }

        // Calcular altura disponible
        const spaceBelow = window.innerHeight - finalY - padding;
        const menuHeight = Math.max(minHeight, Math.min(maxHeight, spaceBelow));

        // Ajuste vertical mínimo
        if (finalY + menuHeight > window.innerHeight - padding) {
          finalY = window.innerHeight - menuHeight - padding;
        }
        if (finalY < padding) {
          finalY = padding;
        }

        return {
          position: 'fixed' as const,
          left: finalX,
          top: finalY,
          width: menuWidth,
          maxHeight: menuHeight,
          borderRadius: '0.5rem'
        };
    }
  };

  const containerStyles = getContainerStyles();
  const animationVariants = getAnimationVariants();

  // Debug: Log de posición recibida y calculada
  console.log('[OfficialConditionsMenu] Props x:', x, 'y:', y);
  console.log('[OfficialConditionsMenu] Mode:', mode);
  console.log('[OfficialConditionsMenu] containerStyles:', containerStyles);
  console.log('[OfficialConditionsMenu] portalContainer:', portalContainer, 'usando:', portalContainer || document.body);

  // ==================== RENDERIZADO ====================

  // En fullscreen: usar portalContainer (necesario para que aparezca dentro del fullscreen)
  // En modo normal: usar document.body (para que position:fixed funcione correctamente)
  const portalTarget = isFullscreen && portalContainer ? portalContainer : document.body;

  return createPortal(
    <>
      {/* Backdrop - Solo en mobile y tablet, NUNCA en fullscreen */}
      {!isFullscreen && (mode === 'mobile' || mode === 'tablet') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Contenedor clickeable para desktop (sin backdrop) - NUNCA en fullscreen */}
      {!isFullscreen && mode === 'desktop' && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Menú principal */}
      <motion.div
        key="official-conditions-menu"
        initial={animationVariants.initial}
        animate={animationVariants.animate}
        exit={animationVariants.exit}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="official-conditions-menu bg-white shadow-2xl border border-gray-200 overflow-hidden z-50"
        style={containerStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900 truncate">
              Diente {toothNumber} {sectionId ? `- ${sectionId}` : ''}
            </p>
            <p className="text-xs text-blue-700 mt-0.5 truncate">
              Normas del Colegio Odontológico del Perú
            </p>
          </div>

          {/* Botón cerrar */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-md bg-white hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-row" style={{
          height: mode === 'desktop'
            ? `calc(${containerStyles.maxHeight}px - 60px)`
            : mode === 'tablet'
              ? 'calc(60vh - 60px)'
              : 'calc(100vh - 60px)'
        }}>
          {/* Categorías */}
          <div className={`border-r border-gray-200 overflow-y-auto flex-shrink-0 ${mode === 'desktop' ? 'w-40' : 'w-1/3'}`}>
            {CONDITION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedCondition(null);
                }}
                className={`w-full px-3 py-3 text-left text-xs font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="flex-1 hidden sm:block">{category.label}</span>
                <ChevronRight className="w-3 h-3 hidden sm:block" />
              </button>
            ))}
          </div>

          {/* Condiciones de la categoría seleccionada */}
          {selectedCategory && !selectedCondition && (
            <div className="flex-1 overflow-y-auto">
              {getConditionsByCategory(selectedCategory).map((condition) => (
                <button
                  key={condition.id}
                  onClick={() => handleConditionClick(condition)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    {/* Indicador de color */}
                    <div
                      className="w-3 h-3 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: OFFICIAL_COLORS[condition.color] }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{condition.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {condition.description}
                      </p>
                      {condition.abbreviation && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          {condition.abbreviation}
                        </span>
                      )}
                      {condition.abbreviations && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          Ver opciones →
                        </span>
                      )}
                      {condition.colorConditional && !condition.abbreviations && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Seleccionar estado →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Submenú de abreviaturas Y/O estados */}
          {selectedCondition && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  ← Volver
                </button>
                <p className="text-sm font-semibold text-gray-800 mt-2">
                  {selectedCondition.label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {selectedCondition.abbreviations
                    ? 'Seleccione el tipo específico:'
                    : selectedCondition.colorConditional
                      ? 'Seleccione el estado clínico:'
                      : 'Confirmar aplicación'}
                </p>
              </div>

              {/* Opciones de abreviaturas (si existen Y no se ha seleccionado una) */}
              {selectedCondition.abbreviations && !selectedAbbreviation && Object.entries(selectedCondition.abbreviations).map(([abbr, description]) => {
                // CASO ESPECIAL: CMC se marca en ROJO
                const isCMC = selectedCondition.id === 'corona-definitiva' && abbr === 'CMC';
                const badgeColor = isCMC ? 'bg-red-600' : 'bg-blue-600';

                return (
                  <button
                    key={abbr}
                    onClick={() => handleAbbreviationSelect(abbr)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-white text-xs font-bold rounded min-w-[40px] text-center ${badgeColor}`}
                      >
                        {abbr}
                      </span>
                      <span className="text-sm text-gray-700 flex-1">{description}</span>
                      {isCMC && (
                        <span className="text-xs text-red-600 font-semibold">ROJO</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Opciones de estado (si tiene colorConditional Y (NO tiene abbreviations O ya seleccionó una)) */}
              {selectedCondition.colorConditional && (!selectedCondition.abbreviations || selectedAbbreviation) && (() => {
                // Verificar si la abreviatura seleccionada permite AMBOS estados (bueno Y malo)
                const abbr = selectedAbbreviation || selectedCondition.abbreviation;
                const allowsBadState = !selectedCondition.colorConditional.onlyForAbbreviations ||
                  selectedCondition.colorConditional.onlyForAbbreviations.includes(abbr || '');

                return (
                  <>
                    {/* Buen Estado - SIEMPRE disponible */}
                    <button
                      onClick={() => handleStateSelect('good', abbr)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border-2 flex-shrink-0"
                          style={{
                            backgroundColor: OFFICIAL_COLORS[selectedCondition.colorConditional.goodState],
                            borderColor: OFFICIAL_COLORS[selectedCondition.colorConditional.goodState]
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">Buen Estado</p>
                          <p className="text-xs text-gray-600">Tratamiento exitoso, sin complicaciones</p>
                        </div>
                      </div>
                    </button>

                    {/* Mal Estado - SOLO si allowsBadState es true */}
                    {allowsBadState && (
                      <button
                        onClick={() => handleStateSelect('bad', abbr)}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded border-2 flex-shrink-0"
                            style={{
                              backgroundColor: OFFICIAL_COLORS[selectedCondition.colorConditional.badState],
                              borderColor: OFFICIAL_COLORS[selectedCondition.colorConditional.badState]
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Mal Estado</p>
                            <p className="text-xs text-gray-600">Tratamiento fallido, requiere atención</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Placeholder cuando no hay categoría seleccionada */}
          {!selectedCategory && !isLoadingConditions && (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-4">
                <p className="text-sm text-gray-600">
                  Seleccione una categoría para ver las condiciones disponibles
                </p>
              </div>
            </div>
          )}

          {/* Indicador de carga */}
          {!selectedCategory && isLoadingConditions && (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">
                  Cargando condiciones dentales...
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>,
    portalTarget
  );
};
