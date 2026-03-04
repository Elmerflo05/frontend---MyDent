// ============================================================================
// HEALTH PLAN TERMS MANAGEMENT - Gestión de Términos y Condiciones (SuperAdmin)
// ============================================================================

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { termsService } from '@/services/healthPlan';
import { healthPlanService } from '@/services/healthPlan';
import AlertModal from '@/components/common/AlertModal';
import {
  FileText,
  Plus,
  Edit,
  Eye,
  History,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Trash2,
  Save
} from 'lucide-react';
import type { HealthPlanTerms, BaseHealthPlan } from '@/types/healthPlans';

export default function HealthPlanTermsManagement() {
  const { user } = useAuthStore();
  const [terms, setTerms] = useState<HealthPlanTerms[]>([]);
  const [plans, setPlans] = useState<BaseHealthPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<HealthPlanTerms | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    termsId: string;
    version: string;
  }>({ isOpen: false, termsId: '', version: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTerms, allPlans] = await Promise.all([
        termsService.getTermsHistory(''),
        healthPlanService.getAllPlans()
      ]);
      setTerms(allTerms);
      setPlans(allPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTerms = (term: HealthPlanTerms) => {
    setSelectedTerms(term);
    setShowViewModal(true);
  };

  const handleEditTerms = (term: HealthPlanTerms) => {
    setSelectedTerms(term);
    setShowEditModal(true);
  };

  const handleDeleteRequest = (term: HealthPlanTerms) => {
    setDeleteConfirmModal({
      isOpen: true,
      termsId: term.id,
      version: term.version
    });
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await termsService.deleteTerms(deleteConfirmModal.termsId);
      setDeleteConfirmModal({ isOpen: false, termsId: '', version: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar términos');
    } finally {
      setLoading(false);
    }
  };

  const filteredTerms = terms.filter(term =>
    term.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (term.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (term.termType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar términos por plan
  const getPlanNameForTerm = (term: HealthPlanTerms): string => {
    if (term.planName) return term.planName;
    const plan = plans.find(p => p.id === term.healthPlanId?.toString());
    return plan?.name || 'Plan desconocido';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Términos y Condiciones
        </h1>
        <p className="text-gray-600">
          Administra los términos y condiciones para cada plan de salud
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por plan, tipo, versión o contenido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Crear Términos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Términos</p>
              <p className="text-2xl font-bold text-gray-900">{terms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Planes con Términos</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(terms.map(t => t.healthPlanId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Última Actualización</p>
              <p className="text-sm font-medium text-gray-900">
                {terms.length > 0
                  ? new Date(terms[0].updatedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando términos...</p>
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No hay términos creados</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear primer término
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Versión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Efectiva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerms.map((term) => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {getPlanNameForTerm(term)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium capitalize">
                      {term.termType || 'general'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      v{term.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(term.effectiveDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewTerms(term)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver contenido"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTerms(term)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(term)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar términos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Terms Modal */}
      {showCreateModal && (
        <CreateTermsModal
          plans={plans}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* View Terms Modal */}
      {showViewModal && selectedTerms && (
        <ViewTermsModal
          terms={selectedTerms}
          planName={getPlanNameForTerm(selectedTerms)}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTerms(null);
          }}
        />
      )}

      {/* Edit Terms Modal */}
      {showEditModal && selectedTerms && (
        <EditTermsModal
          terms={selectedTerms}
          planName={getPlanNameForTerm(selectedTerms)}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTerms(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTerms(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setDeleteConfirmModal({ isOpen: false, termsId: '', version: '' })} />
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Eliminar Términos?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Estás a punto de eliminar los términos <strong>v{deleteConfirmModal.version}</strong>.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, termsId: '', version: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CREATE TERMS MODAL
// ============================================================================

interface CreateTermsModalProps {
  plans: BaseHealthPlan[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateTermsModal({ plans, onClose, onSuccess }: CreateTermsModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [termType, setTermType] = useState('general');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlanId || !version || !content) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!user) {
      setError('Error: Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await termsService.createTerms(
        content,
        version,
        user.id,
        parseInt(selectedPlanId, 10),
        termType
      );
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear términos');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Crear Términos y Condiciones</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan de Salud *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecciona un plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Término *
              </label>
              <select
                value={termType}
                onChange={(e) => setTermType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="cobertura">Cobertura</option>
                <option value="pago">Pago</option>
                <option value="cancelacion">Cancelación</option>
                <option value="privacidad">Privacidad</option>
                <option value="responsabilidad">Responsabilidad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Versión *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ej: 1.0, 1.1, 2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido de Términos y Condiciones *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Escribe los términos y condiciones..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              required
            />
          </div>

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
            {loading ? 'Creando...' : 'Crear Términos'}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="¡Términos Creados!"
        message="Los términos y condiciones han sido creados exitosamente."
        type="success"
      />
    </div>
  );
}

// ============================================================================
// VIEW TERMS MODAL
// ============================================================================

interface ViewTermsModalProps {
  terms: HealthPlanTerms;
  planName: string;
  onClose: () => void;
}

function ViewTermsModal({ terms, planName, onClose }: ViewTermsModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Términos y Condiciones - v{terms.version}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Plan: {planName} | Tipo: {terms.termType || 'general'} | Efectivo desde: {new Date(terms.effectiveDate).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contenido:</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {terms.content}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Creado por (ID):</span>
              <span className="ml-2 font-medium text-gray-900">{terms.createdBy}</span>
            </div>
            <div>
              <span className="text-gray-600">Fecha creación:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(terms.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT TERMS MODAL
// ============================================================================

interface EditTermsModalProps {
  terms: HealthPlanTerms;
  planName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditTermsModal({ terms, planName, onClose, onSuccess }: EditTermsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState(terms.content);
  const [version, setVersion] = useState(terms.version);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    if (!version || !content) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await termsService.updateTerms(terms.id, {
        content,
        version
      });
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar términos');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Términos</h2>
            <p className="text-sm text-gray-600 mt-1">Plan: {planName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Versión *
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>

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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="¡Términos Actualizados!"
        message="Los términos han sido actualizados exitosamente."
        type="success"
      />
    </div>
  );
}
