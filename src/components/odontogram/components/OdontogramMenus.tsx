/**
 * ODONTOGRAM MENUS COMPONENT
 * Centraliza todos los menús contextuales y submenús del odontograma
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { OfficialConditionsMenu } from '../OfficialConditionsMenu';
import { TreatmentModeMenu } from '../TreatmentModeMenu';
import { ConditionSubmenu } from '../ConditionSubmenu';
import { DentalCondition } from '@/constants/dentalConditions';

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId?: string;
  type: 'tooth' | 'annotation-top' | 'annotation-bottom';
  clickPosition?: { x: number; y: number };
}

interface SubmenuState {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId?: string;
  clickPosition?: { x: number; y: number };
  state?: 'good' | 'bad';
}

interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  notes?: string;
}

interface OdontogramMenusProps {
  // Context menu
  contextMenu: ContextMenu | null;
  setContextMenu: (menu: ContextMenu | null) => void;

  // Treatment mode
  treatmentMode: boolean;
  toothConditions: ToothCondition[];
  handleMarkAsTreated: (toothNumber: string) => void;
  handleConditionSelect: (condition: DentalCondition, abbreviation?: string, state?: 'good' | 'bad') => void;
  readOnly: boolean;

  // Submenus
  fractureSubmenu: SubmenuState | null;
  setFractureSubmenu: (state: SubmenuState | null) => void;
  supernumerarySubmenu: SubmenuState | null;
  setSupernumerarySubmenu: (state: SubmenuState | null) => void;
  diastemaSubmenu: SubmenuState | null;
  setDiastemaSubmenu: (state: SubmenuState | null) => void;
  giroversionSubmenu: SubmenuState | null;
  setGiroversionSubmenu: (state: SubmenuState | null) => void;
  fusionSubmenu: SubmenuState | null;
  setFusionSubmenu: (state: SubmenuState | null) => void;
  migracionSubmenu: SubmenuState | null;
  setMigracionSubmenu: (state: SubmenuState | null) => void;
  tratamientoPulparSubmenu: SubmenuState | null;
  setTratamientoPulparSubmenu: (state: SubmenuState | null) => void;

  // Submenu handlers
  handleFractureLocationSelect: (location: string) => void;
  handleSupernumeraryPositionSelect: (position: string) => void;
  handleDiastemaPositionSelect: (position: string) => void;
  handleGiroversionDirectionSelect: (direction: string) => void;
  handleFusionPositionSelect: (position: string) => void;
  handleMigracionDirectionSelect: (direction: string) => void;
  handleTratamientoPulparTypeSelect: (type: string) => void;

  // Portal container
  odontogramContainerRef: React.RefObject<HTMLDivElement>;

  // Fullscreen state - para evitar que los menús cierren el fullscreen
  isFullscreen: boolean;
}

export const OdontogramMenus: React.FC<OdontogramMenusProps> = ({
  contextMenu,
  setContextMenu,
  treatmentMode,
  toothConditions,
  handleMarkAsTreated,
  handleConditionSelect,
  readOnly,
  fractureSubmenu,
  setFractureSubmenu,
  supernumerarySubmenu,
  setSupernumerarySubmenu,
  diastemaSubmenu,
  setDiastemaSubmenu,
  giroversionSubmenu,
  setGiroversionSubmenu,
  fusionSubmenu,
  setFusionSubmenu,
  migracionSubmenu,
  setMigracionSubmenu,
  tratamientoPulparSubmenu,
  setTratamientoPulparSubmenu,
  handleFractureLocationSelect,
  handleSupernumeraryPositionSelect,
  handleDiastemaPositionSelect,
  handleGiroversionDirectionSelect,
  handleFusionPositionSelect,
  handleMigracionDirectionSelect,
  handleTratamientoPulparTypeSelect,
  odontogramContainerRef,
  isFullscreen
}) => {
  return (
    <>
      {/* Menú contextual - Modo tratamiento o modo normal */}
      <AnimatePresence>
        {contextMenu?.visible && contextMenu.type === 'tooth' && !readOnly && (
          <>
            {treatmentMode ? (
              // MENÚ SIMPLIFICADO - Modo tratamiento
              <TreatmentModeMenu
                x={contextMenu.x}
                y={contextMenu.y}
                toothNumber={contextMenu.toothNumber}
                conditions={toothConditions.filter(c => c.toothNumber === contextMenu.toothNumber)}
                onMarkAsTreated={() => handleMarkAsTreated(contextMenu.toothNumber)}
                onClose={() => setContextMenu(null)}
              />
            ) : (
              // MENÚ COMPLETO - Modo normal
              <OfficialConditionsMenu
                x={contextMenu.x}
                y={contextMenu.y}
                toothNumber={contextMenu.toothNumber}
                sectionId={contextMenu.sectionId}
                onConditionSelect={handleConditionSelect}
                onClose={() => setContextMenu(null)}
                portalContainer={odontogramContainerRef.current}
                isFullscreen={isFullscreen}
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Submenús de condiciones */}
      {[
        { state: fractureSubmenu, setState: setFractureSubmenu, type: 'fracture-location' as const, handler: handleFractureLocationSelect },
        { state: supernumerarySubmenu, setState: setSupernumerarySubmenu, type: 'supernumerary-position' as const, handler: handleSupernumeraryPositionSelect },
        { state: diastemaSubmenu, setState: setDiastemaSubmenu, type: 'diastema-position' as const, handler: handleDiastemaPositionSelect },
        { state: giroversionSubmenu, setState: setGiroversionSubmenu, type: 'giroversion-direction' as const, handler: handleGiroversionDirectionSelect },
        { state: fusionSubmenu, setState: setFusionSubmenu, type: 'fusion-position' as const, handler: handleFusionPositionSelect },
        { state: migracionSubmenu, setState: setMigracionSubmenu, type: 'migracion-direction' as const, handler: handleMigracionDirectionSelect },
        { state: tratamientoPulparSubmenu, setState: setTratamientoPulparSubmenu, type: 'tratamiento-pulpar-type' as const, handler: handleTratamientoPulparTypeSelect }
      ].map(({ state, setState, type, handler }) =>
        state?.visible && (
          <ConditionSubmenu
            key={type}
            x={state.x}
            y={state.y}
            type={type}
            toothNumber={state.toothNumber}
            clickPosition={state.clickPosition}
            onSelect={handler}
            onClose={() => setState(null)}
            portalContainer={odontogramContainerRef.current}
            isFullscreen={isFullscreen}
          />
        )
      )}
    </>
  );
};
