/**
 * LEYENDA COMPLETA DEL ODONTOGRAMA
 * Manual de uso detallado con condiciones cargadas desde la base de datos
 * NO EDITABLE - Solo consulta
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import {
  filterConditions,
  getAllAbbreviations,
  LegendHeader,
  LegendTabs,
  LegendSearchBar,
  LegendFooter,
  SymbolsTab,
  ColorsTab,
  AbbreviationsTab,
  NomenclatureTab
} from './legend';

interface OdontogramLegendProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const OdontogramLegend = ({ isOpen, onClose, isEmbedded = false }: OdontogramLegendProps) => {
  // Obtener condiciones desde el store de Zustand
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  const [activeTab, setActiveTab] = useState<'symbols' | 'colors' | 'abbreviations' | 'nomenclature'>('symbols');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Aplicar filtro de búsqueda
  const filteredConditions = filterConditions(OFFICIAL_DENTAL_CONDITIONS, searchTerm);

  // Obtener todas las abreviaturas únicas (filtradas)
  const allAbbreviations = getAllAbbreviations(filteredConditions);

  // Contenido del manual (sin modal wrapper si está embebido)
  const content = (
    <>
      {/* Header - Solo mostrar si no está embebido */}
      {!isEmbedded && (
        <LegendHeader onClose={onClose} />
      )}

      {/* Tabs */}
      <LegendTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Buscador */}
      <LegendSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB: SÍMBOLOS Y CONDICIONES */}
        {activeTab === 'symbols' && (
          <SymbolsTab
            filteredConditions={filteredConditions}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        )}

        {/* TAB: CÓDIGO DE COLORES */}
        {activeTab === 'colors' && (
          <ColorsTab filteredConditions={filteredConditions} />
        )}

        {/* TAB: ABREVIATURAS */}
        {activeTab === 'abbreviations' && (
          <AbbreviationsTab allAbbreviations={allAbbreviations} />
        )}

        {/* TAB: NOMENCLATURA FDI */}
        {activeTab === 'nomenclature' && (
          <NomenclatureTab />
        )}
      </div>

      {/* Footer */}
      <LegendFooter onClose={onClose} />
    </>
  );

  // Si está embebido, devolver solo el contenido
  if (isEmbedded) {
    return content;
  }

  // Si es modal, envolver con AnimatePresence y backdrop
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
