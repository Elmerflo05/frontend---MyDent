/**
 * PatientHealthPlanBadge Component
 * Muestra informacion del plan de salud activo del paciente
 * Para uso en consulta del dentista
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  Gift,
  Calendar,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { pricingApi, CoverageSummary } from '@/services/api/pricingApi';

interface PatientHealthPlanBadgeProps {
  patientId: number | string;
  onPlanLoaded?: (hasPlan: boolean, planData: CoverageSummary | null) => void;
  compact?: boolean;
  className?: string;
  /** Datos pre-cargados para evitar fetch duplicado */
  preloadedCoverage?: CoverageSummary | null;
}

const PatientHealthPlanBadge = memo(({
  patientId,
  onPlanLoaded,
  compact = false,
  className = '',
  preloadedCoverage
}: PatientHealthPlanBadgeProps) => {
  const [loading, setLoading] = useState(!preloadedCoverage);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageSummary | null>(preloadedCoverage || null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Si hay datos pre-cargados, no hacer fetch
    if (preloadedCoverage !== undefined) {
      setCoverage(preloadedCoverage);
      setLoading(false);
      return;
    }

    const loadCoverage = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;

        if (isNaN(numericId)) {
          setLoading(false);
          return;
        }

        const response = await pricingApi.getPatientCoverageSummary(numericId);

        if (response.success && response.data) {
          setCoverage(response.data);
          onPlanLoaded?.(response.data.has_coverage, response.data);
        } else {
          setCoverage(null);
          onPlanLoaded?.(false, null);
        }
      } catch (err) {
        console.error('Error loading patient coverage:', err);
        setError('Error al cargar cobertura');
        onPlanLoaded?.(false, null);
      } finally {
        setLoading(false);
      }
    };

    loadCoverage();
  }, [patientId, onPlanLoaded, preloadedCoverage]);

  // No mostrar nada si esta cargando y es compacto
  if (loading && compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Verificando plan...</span>
      </div>
    );
  }

  // Loading state completo
  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="text-gray-600">Verificando plan de salud...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // No tiene plan
  if (!coverage || !coverage.has_coverage) {
    if (compact) {
      return null; // No mostrar nada en modo compacto si no tiene plan
    }

    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-600">Sin plan de salud</p>
            <p className="text-sm text-gray-500">Precios regulares aplican</p>
          </div>
        </div>
      </div>
    );
  }

  // Determinar colores segun el plan
  const getPlanColors = (planCode?: string) => {
    switch (planCode?.toLowerCase()) {
      case 'platinium':
        return {
          bg: 'bg-gradient-to-r from-gray-700 to-gray-900',
          border: 'border-gray-600',
          badge: 'bg-gray-100 text-gray-800',
          light: 'bg-gray-50'
        };
      case 'oro':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-600',
          border: 'border-yellow-400',
          badge: 'bg-yellow-100 text-yellow-800',
          light: 'bg-yellow-50'
        };
      case 'familiar':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-700',
          border: 'border-blue-400',
          badge: 'bg-blue-100 text-blue-800',
          light: 'bg-blue-50'
        };
      case 'personal':
      default:
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          border: 'border-green-400',
          badge: 'bg-green-100 text-green-800',
          light: 'bg-green-50'
        };
    }
  };

  const colors = getPlanColors(coverage.plan_code);

  // Formato de fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Modo compacto - solo badge
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.badge} rounded-full`}>
          <Shield className="w-4 h-4" />
          <span className="text-sm font-semibold">{coverage.plan_name}</span>
          {coverage.coverage_type === 'dependiente' && (
            <Users className="w-4 h-4" />
          )}
        </div>
        {coverage.first_free_consultation?.available && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
            <Gift className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">1ra consulta gratis</span>
          </div>
        )}
      </div>
    );
  }

  // Modo completo - tarjeta expandible
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl overflow-hidden border ${colors.border} ${className}`}
    >
      {/* Header del plan */}
      <div className={`${colors.bg} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{coverage.plan_name}</span>
                {coverage.coverage_type === 'dependiente' && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    Dependiente
                  </span>
                )}
              </div>
              <span className="text-white/80 text-sm">{coverage.coverage_label}</span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Primera consulta gratis - destacado */}
      {coverage.first_free_consultation?.available && (
        <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold">Primera Consulta Gratis Disponible</p>
              <p className="text-sm text-white/80">
                Esta consulta puede ser sin costo para el paciente
              </p>
            </div>
            <CheckCircle className="w-6 h-6 ml-auto" />
          </div>
        </div>
      )}

      {/* Detalles expandibles */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`${colors.light} px-4 py-3`}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Vigencia */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Vigencia</p>
                  <p className="text-sm font-medium">
                    {formatDate(coverage.start_date)} - {coverage.end_date ? formatDate(coverage.end_date) : 'Indefinido'}
                  </p>
                </div>
              </div>

              {/* Cuota mensual */}
              {coverage.monthly_fee !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-lg font-bold">S/</span>
                  <div>
                    <p className="text-xs text-gray-500">Cuota mensual</p>
                    <p className="text-sm font-bold text-gray-900">
                      {coverage.monthly_fee.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tipo de cobertura */}
              <div className="flex items-center gap-2">
                {coverage.coverage_type === 'titular' ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <Users className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-sm font-medium capitalize">
                    {coverage.coverage_type}
                  </p>
                </div>
              </div>

              {/* Primera consulta ya usada */}
              {!coverage.first_free_consultation?.available && coverage.first_free_consultation?.used_date && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">1ra consulta usada</p>
                    <p className="text-sm font-medium">
                      {formatDate(coverage.first_free_consultation.used_date)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje adicional */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {coverage.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PatientHealthPlanBadge.displayName = 'PatientHealthPlanBadge';

export default PatientHealthPlanBadge;
