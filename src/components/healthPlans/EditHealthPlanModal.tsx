// ============================================================================
// EDIT HEALTH PLAN MODAL - Modal para editar plan de salud existente
// ============================================================================

import { useState, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { termsService } from '@/services/healthPlan';
import { X, Save, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type {
  BaseHealthPlan,
  UpdateHealthPlanDTO,
  HealthPlanTerms
} from '@/types/healthPlans';
import { getPlanBenefitText } from '@/types/healthPlans';

interface EditHealthPlanModalProps {
  plan: BaseHealthPlan;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

export default function EditHealthPlanModal({ plan, onClose, onSuccess, readOnly = false }: EditHealthPlanModalProps) {
  const { updatePlan, loading, error } = useHealthPlanStore();

  // Estado para términos (solo lectura)
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [planTerms, setPlanTerms] = useState<HealthPlanTerms[]>([]);
  const [showTermsContent, setShowTermsContent] = useState<string | false>(false);

  const [formData, setFormData] = useState<UpdateHealthPlanDTO>({
    name: plan.name,
    description: plan.description,
    price: plan.price,
    billingCycle: 'monthly', // Siempre mensual por defecto
    setupFee: plan.setupFee,
    maxSubscribers: plan.maxSubscribers
  });

  // Cargar términos del plan (solo lectura)
  useEffect(() => {
    const loadTerms = async () => {
      setLoadingTerms(true);
      try {
        const planId = parseInt(plan.id, 10);
        if (!isNaN(planId)) {
          const terms = await termsService.getTermsByPlan(planId);
          setPlanTerms(terms);
        }
      } catch (err) {
        // Silenciar error - los términos son informativos
      } finally {
        setLoadingTerms(false);
      }
    };
    loadTerms();
  }, [plan.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert('Por favor completa el nombre y descripción del plan');
      return;
    }

    if (formData.price && formData.price <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    try {
      await updatePlan(plan.id, formData);
      alert('Plan actualizado exitosamente');
      onSuccess();
    } catch (err) {
      alert(error || 'Error al actualizar el plan');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">{readOnly ? 'Detalle del Plan de Salud' : 'Editar Plan de Salud'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Plan *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                required
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                required
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Precios</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Mensual (S/) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                required
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Términos y Condiciones (Solo lectura) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Términos y Condiciones
            </h3>

            {loadingTerms ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Cargando términos...</p>
              </div>
            ) : planTerms.length > 0 ? (
              <div className="space-y-3">
                {planTerms.map((term) => (
                  <div key={term.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium capitalize">
                          {term.termType || 'general'}
                        </span>
                        <span className="text-sm font-semibold text-blue-900">v{term.version}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTermsContent(showTermsContent === term.id ? false : term.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Ver contenido"
                      >
                        {showTermsContent === term.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-blue-700">
                      Fecha efectiva: {new Date(term.effectiveDate).toLocaleDateString()}
                    </p>
                    {showTermsContent === term.id && (
                      <div className="mt-3 p-3 bg-white rounded border border-blue-100 max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {term.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  Los términos se gestionan desde la pestaña "Términos y Condiciones"
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">No hay términos asociados a este plan</p>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Puedes crearlos desde la pestaña "Términos y Condiciones"
                </p>
              </div>
            )}
          </div>

          {/* Precios Preferenciales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Precios Preferenciales</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 leading-relaxed">
                {getPlanBenefitText(plan.planCode)}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Los precios preferenciales se configuran desde Tratamientos, Sub-Procedimientos y Servicios Adicionales.
              </p>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuración Adicional</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Suscriptores
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxSubscribers ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxSubscribers: parseInt(e.target.value) || undefined }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                placeholder="Sin límite"
                disabled={readOnly}
              />
              <p className="text-xs text-gray-500 mt-1">Dejar vacío para no tener límite</p>
            </div>
          </div>

          {/* Plan Info */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900">Información del Plan</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">{plan.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Creado:</span>
                <span className="ml-2 font-medium">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Actualizado:</span>
                <span className="ml-2 font-medium">
                  {new Date(plan.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
