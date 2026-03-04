import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Pill,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { Medication } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useMedicationStore } from '@/store/medicationStore';
import { Modal } from '@/components/common/Modal';

type MedicationFormData = {
  nombre: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
};

const MedicationManagement = () => {
  const { user } = useAuth();
  const {
    medications,
    loading,
    loadMedications,
    addMedication,
    updateMedication,
    deleteMedication
  } = useMedicationStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<MedicationFormData>({
    nombre: '',
    concentracion: '',
    formaFarmaceutica: 'tableta',
    viaAdministracion: 'oral'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.concentracion.trim()) {
      newErrors.concentracion = 'La concentración es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingMedication) {
        // Update existing medication
        await updateMedication(editingMedication.id, formData);
      } else {
        // Create new medication
        await addMedication(formData);
      }

      closeModal();
    } catch (error) {
      setErrors({ general: 'Ocurrió un error al guardar el medicamento' });
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      nombre: medication.nombre,
      concentracion: medication.concentracion,
      formaFarmaceutica: medication.formaFarmaceutica,
      viaAdministracion: medication.viaAdministracion
    });
    setModalOpen(true);
  };

  const handleDelete = async (medication: Medication) => {
    if (window.confirm(`¿Está seguro de eliminar el medicamento "${medication.nombre}"?`)) {
      await deleteMedication(medication.id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMedication(null);
    setFormData({
      nombre: '',
      concentracion: '',
      formaFarmaceutica: 'tableta',
      viaAdministracion: 'oral'
    });
    setErrors({});
  };

  // Filter medications - Búsqueda simple por nombre y concentración
  const filteredMedications = medications.filter(med => {
    const matchesSearch =
      med.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.concentracion.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Statistics
  const stats = {
    total: medications.length,
    activos: medications.filter(m => m.isActive !== false).length,
    inactivos: medications.filter(m => m.isActive === false).length
  };

  const getStatusBadge = (medication: Medication) => {
    const isActive = medication.isActive !== false;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Medicamentos</h1>
          <p className="text-gray-600 mt-1">Administra el inventario de medicamentos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Medicamento
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Medicamentos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Pill className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medicamentos Registrados</p>
              <p className="text-2xl font-bold text-green-600">{medications.length}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Catálogo Activo</p>
              <p className="text-2xl font-bold text-indigo-600">{filteredMedications.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar medicamento por nombre o concentración..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Medicamento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Presentación</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vía de Administración</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Cargando medicamentos...
                  </td>
                </tr>
              ) : filteredMedications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron medicamentos
                  </td>
                </tr>
              ) : (
                filteredMedications.map((medication) => (
                  <tr key={medication.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{medication.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Concentración: {medication.concentracion}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 capitalize">
                        {medication.formaFarmaceutica}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 capitalize">
                        {medication.viaAdministracion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(medication)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(medication)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        size="xl"
        closeOnBackdropClick={!loading}
        closeOnEscape={!loading}
        showCloseButton={false}
      >
        {/* Header Fijo */}
        <Modal.Header className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingMedication ? 'Editar Medicamento' : 'Nuevo Medicamento'}
                </h2>
                <p className="text-sm text-white/80">Complete los datos del medicamento</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Modal.Header>

        {/* Content con scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Modal.Body className="overflow-y-auto">
            {/* Catálogo de Medicamentos - Solo información para recetas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Catálogo de Medicamentos</h3>
              <p className="text-sm text-gray-600 mb-4">
                Registre solo la información clínica básica del medicamento para su uso en recetas médicas
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Medicamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Ibuprofeno, Paracetamol, Amoxicilina"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concentración <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.concentracion}
                    onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.concentracion ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 500mg, 10mg/ml, 250mg"
                  />
                  {errors.concentracion && <p className="mt-1 text-sm text-red-600">{errors.concentracion}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presentación (Forma Farmacéutica)
                  </label>
                  <select
                    value={formData.formaFarmaceutica}
                    onChange={(e) => setFormData({ ...formData, formaFarmaceutica: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tableta">Tableta</option>
                    <option value="capsula">Cápsula</option>
                    <option value="jarabe">Jarabe</option>
                    <option value="suspension">Suspensión</option>
                    <option value="inyectable">Inyectable</option>
                    <option value="crema">Crema</option>
                    <option value="gel">Gel</option>
                    <option value="solucion">Solución</option>
                    <option value="gotas">Gotas</option>
                    <option value="ampolla">Ampolla</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vía de Administración
                  </label>
                  <select
                    value={formData.viaAdministracion}
                    onChange={(e) => setFormData({ ...formData, viaAdministracion: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="oral">Oral</option>
                    <option value="topica">Tópica</option>
                    <option value="intravenosa">Intravenosa</option>
                    <option value="intramuscular">Intramuscular</option>
                    <option value="subcutanea">Subcutánea</option>
                    <option value="sublingual">Sublingual</option>
                    <option value="oftalmica">Oftálmica</option>
                    <option value="otica">Ótica</option>
                    <option value="nasal">Nasal</option>
                    <option value="rectal">Rectal</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Al crear una receta, el médico seleccionará el nombre y concentración de este catálogo,
                  y luego completará manualmente la cantidad y las indicaciones específicas para el paciente.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}
          </Modal.Body>
        </form>

        {/* Footer Fijo */}
        <Modal.Footer>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : editingMedication ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicationManagement;
