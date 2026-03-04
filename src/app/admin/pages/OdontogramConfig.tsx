import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Settings, Eye, DollarSign, FileText, Receipt
} from 'lucide-react';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { useAuth } from '@/hooks/useAuth';

// Import modular components
import { PreviewTab } from '../components/odontogram-config/PreviewTab';
import { PaymentPlansTab } from '../components/odontogram-config/PaymentPlansTab';
import { LegendTab } from '../components/odontogram-config/LegendTab';
import { ProcedurePricingTab } from '../components/odontogram-config/ProcedurePricingTab';

export default function OdontogramConfig() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preview');

  const {
    dentalConditions,
    customConditions
  } = useOdontogramConfigStore();

  // Control de permisos: Solo SuperAdmin puede editar
  const isSuperAdmin = user?.role === 'super_admin';
  const canEditConfiguration = isSuperAdmin;
  const isReadOnly = !isSuperAdmin;
  const allConditions = [...dentalConditions, ...customConditions];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Configuración del Odontograma</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Configure y personalice el sistema de odontogramas para su clínica</p>
              </div>
            </div>
            
            {isReadOnly && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs sm:text-sm font-medium">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                Solo lectura
              </span>
            )}
          </div>

          {/* Tabs de navegación */}
          <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-px overflow-x-auto">
            {[
              { id: 'preview', label: 'Vista Previa', icon: <Eye className="w-4 h-4" /> },
              { id: 'prices', label: 'Servicios Adicionales', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'procedure-pricing', label: 'Precios', icon: <Receipt className="w-4 h-4" /> },
              { id: 'legend', label: 'Manual de Uso', icon: <FileText className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-3 sm:p-4 md:p-6">
        <AnimatePresence mode="wait">
          {/* Tab: Vista Previa */}
          {activeTab === 'preview' && (
            <PreviewTab allConditions={allConditions} />
          )}

          {/* Tab: Servicios Adicionales */}
          {activeTab === 'prices' && (
            <PaymentPlansTab canEditConfiguration={canEditConfiguration} />
          )}

          {/* Tab: Precios de Procedimientos */}
          {activeTab === 'procedure-pricing' && (
            <ProcedurePricingTab canEditConfiguration={canEditConfiguration} />
          )}

          {/* Tab: Manual de Uso */}
          {activeTab === 'legend' && (
            <LegendTab />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
