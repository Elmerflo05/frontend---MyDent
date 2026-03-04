// ============================================================================
// CREATE HEALTH PLAN MODAL - Modal para crear nuevo plan de salud
// ============================================================================

import { useState, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { useAuthStore } from '@/store/authStore';
import { termsService } from '@/services/healthPlan';
import { X, FileText, Eye, EyeOff, ExternalLink, AlertCircle } from 'lucide-react';
import type {
  CreateHealthPlanDTO,
  HealthPlanType,
  BillingCycle,
  HealthPlanTerms
} from '@/types/healthPlans';

interface CreateHealthPlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateHealthPlanModal({ onClose, onSuccess }: CreateHealthPlanModalProps) {
  const { user } = useAuthStore();
  const { createPlan, loading, error } = useHealthPlanStore();

  // Estado para términos disponibles
  const [availableTerms, setAvailableTerms] = useState<HealthPlanTerms[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [selectedTermsId, setSelectedTermsId] = useState<string>('');
  const [showTermsPreview, setShowTermsPreview] = useState(false);

  const [formData, setFormData] = useState<CreateHealthPlanDTO>({
    name: '',
    description: '',
    type: 'basic' as HealthPlanType,
    price: 0,
    billingCycle: 'monthly' as BillingCycle,
    setupFee: 0,
    terms: {
      content: '',
      version: '1.0'
    },
    requiresMedicalHistory: false,
    maxSubscribers: undefined,
    minAge: undefined,
    maxAge: undefined,
    sedeId: user?.sedeId
  });

  // Cargar términos disponibles
  useEffect(() => {
    const loadTerms = async () => {
      setLoadingTerms(true);
      try {
        const terms = await termsService.getTermsHistory('');
        setAvailableTerms(terms);
      } catch (err) {
      } finally {
        setLoadingTerms(false);
      }
    };
    loadTerms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.name || !formData.description) {
      alert('Por favor completa el nombre y descripción del plan');
      return;
    }

    if (formData.price <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    if (!selectedTermsId) {
      alert('Debes seleccionar los Términos y Condiciones del plan');
      return;
    }

    if (!user) {
      alert('Error: Usuario no autenticado');
      return;
    }

    try {
      // Buscar los términos seleccionados
      const selectedTerms = availableTerms.find(t => t.id === selectedTermsId);
      if (!selectedTerms) {
        alert('Error: No se encontraron los términos seleccionados');
        return;
      }

      // Crear el plan con los términos seleccionados
      const planData: CreateHealthPlanDTO = {
        ...formData,
        terms: {
          content: selectedTerms.content,
          version: selectedTerms.version
        }
      };

      await createPlan(planData, user.id);
      alert('Plan creado exitosamente');
      onSuccess();
    } catch (err) {
      alert(error || 'Error al crear el plan');
    }
  };

  // Obtener términos seleccionados para vista previa
  const selectedTerms = availableTerms.find(t => t.id === selectedTermsId);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Plan de Salud</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Plan *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as HealthPlanType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="basic">Básico</option>
                  <option value="standard">Estándar</option>
                  <option value="premium">Premium</option>
                  <option value="family">Familiar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Precios</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciclo de Facturación *
                </label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value as BillingCycle }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="biannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Términos y Condiciones *
            </h3>

            {loadingTerms ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Cargando términos...</p>
              </div>
            ) : availableTerms.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                      No hay términos disponibles
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Debes crear términos y condiciones antes de crear un plan de salud.
                    </p>
                    <a
                      href="/admin/health-plan-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ir a Crear Términos
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona los Términos y Condiciones del Plan *
                  </label>
                  <select
                    value={selectedTermsId}
                    onChange={(e) => setSelectedTermsId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Selecciona términos --</option>
                    {availableTerms.map(terms => (
                      <option key={terms.id} value={terms.id}>
                        v{terms.version} - {new Date(terms.effectiveDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Los pacientes deberán aceptar estos términos al subir el voucher de pago
                  </p>
                </div>

                {/* Vista previa de términos */}
                {selectedTerms && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTermsPreview(!showTermsPreview)}
                      className="w-full p-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-700" />
                        <span className="font-medium text-gray-900">
                          Vista previa: Términos v{selectedTerms.version}
                        </span>
                      </div>
                      {showTermsPreview ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {showTermsPreview && (
                      <div className="p-4 bg-white border-t border-gray-200 max-h-64 overflow-y-auto">
                        <div className="text-xs text-gray-500 mb-2">
                          Fecha efectiva: {new Date(selectedTerms.effectiveDate).toLocaleDateString()}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {selectedTerms.content}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creando...
              </>
            ) : (
              'Crear Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
