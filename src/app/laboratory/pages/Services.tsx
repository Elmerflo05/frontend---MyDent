/**
 * Página de Servicios para Técnico de Imagen
 *
 * Vista de solo lectura de los precios de servicios de laboratorio
 * Misma estructura visual que el formulario del admin
 */

import { motion } from 'framer-motion';
import { FileImage, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import {
  useTomografia3DPricing,
  useRadiografiasPricing
} from '@/app/admin/pages/laboratory-services/hooks';
import {
  Tomografia3DSection,
  RadiografiasSection
} from '@/components/laboratory-form';
import { useAuth } from '@/hooks/useAuth';

const Services = () => {
  const { user } = useAuth();
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';

  // Tomografía 3D pricing
  const tomografia = useTomografia3DPricing();

  // Radiografías pricing
  const radiografias = useRadiografiasPricing();

  // Estado de carga
  const isLoading = tomografia.fetching || radiografias.fetching;
  const hasError = tomografia.error || radiografias.error;

  // Función para recargar precios
  const handleRefresh = () => {
    tomografia.refresh();
    radiografias.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${useCyanTheme ? 'bg-gradient-to-r from-cyan-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-purple-700'} text-white px-6 py-5 shadow-lg rounded-b-xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileImage className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold">
                  Precios de Servicios de Laboratorio
                </h1>
                <p className={`text-sm mt-1 ${useCyanTheme ? 'text-cyan-100' : 'text-purple-100'}`}>
                  Vista de precios de Tomografía 3D y Radiografías
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm">
                <Eye className="w-4 h-4" />
                Solo lectura
              </span>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{tomografia.error || radiografias.error}</span>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className={`w-10 h-10 ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'} animate-spin mx-auto mb-3`} />
              <p className="text-gray-600">Cargando precios...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Tomografía 3D Section - Modo Pricing Solo Lectura */}
            <Tomografia3DSection
              mode="pricing"
              pricing={tomografia.pricing}
              readOnly={true}
            />

            {/* Radiografías Section - Modo Pricing Solo Lectura */}
            <RadiografiasSection
              mode="pricing"
              pricing={radiografias.pricing}
              readOnly={true}
            />

            {/* Footer informativo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`mt-8 p-4 border rounded-lg text-center text-sm ${
                useCyanTheme
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                  : 'bg-purple-50 border-purple-200 text-purple-700'
              }`}
            >
              <p>
                Está viendo los precios en modo lectura. Solo el Super Administrador puede modificar estos valores.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
