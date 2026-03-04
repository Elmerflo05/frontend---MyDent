/**
 * Página de configuración de precios de servicios de laboratorio
 *
 * Usuario: SuperAdmin (role_id: 1) - Edición completa
 * Usuario: Admin Sede (role_id: 2) - Solo lectura
 * Funcionalidad: Configurar precios de Tomografía 3D y Radiografías
 * Almacenamiento: Base de datos (tabla laboratory_pricing)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileImage, RefreshCw, AlertCircle, Eye, Save, Check } from 'lucide-react';
import {
  useTomografia3DPricing,
  useRadiografiasPricing
} from './laboratory-services/hooks';
import {
  Tomografia3DSection,
  RadiografiasSection
} from '@/components/laboratory-form';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LaboratoryServicesPage = () => {
  const { user } = useAuth();
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Control de permisos: Solo SuperAdmin puede editar
  const isSuperAdmin = user?.role === 'super_admin';
  const isReadOnly = !isSuperAdmin;

  // Tomografía 3D pricing - Ahora usa API backend
  const tomografia = useTomografia3DPricing();

  // Radiografías pricing - Ahora usa API backend
  const radiografias = useRadiografiasPricing();

  // Estado de carga inicial
  const isLoading = tomografia.fetching || radiografias.fetching;
  const hasError = tomografia.error || radiografias.error;

  // Función para recargar precios
  const handleRefresh = () => {
    tomografia.refresh();
    radiografias.refresh();
  };

  // Función para guardar todo (silent: true suprime toasts individuales)
  const handleSaveAll = async () => {
    if (isReadOnly) return;

    setIsSavingAll(true);
    setSaveSuccess(false);

    const results = await Promise.allSettled([
      tomografia.handleSave({ silent: true }),
      radiografias.handleSave({ silent: true })
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');

    if (failures.length === 0) {
      setSaveSuccess(true);
      toast.success('Todos los precios guardados exitosamente');
      setTimeout(() => setSaveSuccess(false), 2000);
    } else if (successes.length > 0) {
      const sectionNames = [
        results[0].status === 'rejected' ? 'Tomografía 3D' : null,
        results[1].status === 'rejected' ? 'Radiografías' : null
      ].filter(Boolean).join(', ');
      toast.error(`Error al guardar: ${sectionNames}. Las demás secciones se guardaron correctamente.`);
    } else {
      toast.error('Error al guardar todas las secciones');
    }

    setIsSavingAll(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 shadow-lg rounded-b-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileImage className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold">
                  Configuración de Precios - Servicios de Laboratorio
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  {isReadOnly
                    ? 'Vista de precios de Tomografía 3D y Radiografías (Solo lectura)'
                    : 'Administre los precios de Tomografía 3D y Radiografías'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isReadOnly && (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm">
                  <Eye className="w-4 h-4" />
                  Solo lectura
                </span>
              )}
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
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Cargando precios...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Tomografía 3D Section - Modo Pricing */}
            <Tomografia3DSection
              mode="pricing"
              pricing={tomografia.pricing}
              onPricingChange={isReadOnly ? undefined : tomografia.updatePrice}
              onSave={isReadOnly ? undefined : tomografia.handleSave}
              loading={tomografia.loading}
              readOnly={isReadOnly}
            />

            {/* Radiografías Section - Modo Pricing */}
            <RadiografiasSection
              mode="pricing"
              pricing={radiografias.pricing}
              onPricingChange={isReadOnly ? undefined : radiografias.updatePrice}
              onSave={isReadOnly ? undefined : radiografias.handleSave}
              loading={radiografias.loading}
              readOnly={isReadOnly}
            />

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`mt-8 p-4 border rounded-lg text-center text-sm ${
                isReadOnly
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <p>
                {isReadOnly
                  ? 'Está viendo los precios en modo lectura. Solo el Super Administrador puede modificar estos valores.'
                  : 'Los precios se almacenan en la base de datos y se sincronizan automáticamente. Use el botón "Guardar Todo" o guarde cada sección individualmente.'
                }
              </p>
            </motion.div>

            {/* Espaciado para que el botón flotante no tape el contenido */}
            {!isReadOnly && <div className="h-16" />}
          </div>
        )}

        {/* Botón flotante de Guardar Todo - Solo visible para SuperAdmin */}
        {!isReadOnly && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll || tomografia.loading || radiografias.loading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full shadow-lg
                font-semibold text-white transition-all duration-300
                ${saveSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                transform hover:scale-105 active:scale-95
              `}
            >
              {isSavingAll ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Todo
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LaboratoryServicesPage;
