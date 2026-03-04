/**
 * Step 6.5: Laboratorio de Prótesis
 *
 * Componente para registrar solicitudes al laboratorio de prótesis dental.
 * Este paso se ubica ANTES del Plan de Tratamiento.
 * Incluye:
 * - Descripción del trabajo protésico
 * - Nombre del trabajo (ej: corona, puente, etc.)
 * - Color y especificaciones
 * - Fecha de entrega al laboratorio
 * - Fecha tentativa de recepción
 * - Fecha real de recepción (cuando llegue)
 */

import { motion } from 'framer-motion';
import {
  TestTube2,
  User,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Palette,
  Tag,
  Clock,
  CheckCircle,
  Package,
  LogOut,
  Loader2
} from 'lucide-react';
import { StepHeader, SectionCard, EmptyState } from '@/components/consultation/shared';
import { useState, useEffect, memo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';
import { ProsthesisRequest } from '@/types';
import { useProsthesisStore } from '@/store/prosthesisStore';
import { appointmentsApi } from '@/services/api/appointmentsApi';

interface ProsthesisLabStepProps {
  // Datos del paciente
  selectedPatient: any;

  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;

  // Navegación
  onBack: () => void;
  onSave: () => void;
  onFinishConsultation: () => void; // Handler para finalizar consulta y resetear estado

  // Control de acceso
  readOnly?: boolean;
  userRole?: string; // Rol del usuario para control granular

  // ID de la cita para marcarla como completada
  appointmentId?: string | number;
}

interface ProsthesisFormData {
  id?: string;
  prosthesisName: string;
  description: string;
  color: string;
  specifications: string;
  deliveryDate: string;
  tentativeDate: string;
  receptionDate?: string;
  status: 'pending' | 'sent' | 'in_progress' | 'received' | 'cancelled';
}

const INITIAL_FORM_STATE: ProsthesisFormData = {
  prosthesisName: '',
  description: '',
  color: '',
  specifications: '',
  deliveryDate: formatDateToYMD(new Date()),
  tentativeDate: '',
  status: 'pending'
};

/**
 * Componente del Step 6.5: Laboratorio de Prótesis
 */
const ProsthesisLabStepComponent = ({
  selectedPatient,
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges,
  onBack,
  onSave,
  onFinishConsultation,
  readOnly = false,
  userRole,
  appointmentId
}: ProsthesisLabStepProps) => {
  const { user } = useAuth();
  const [isFinishing, setIsFinishing] = useState(false);

  // Determinar permisos granulares
  // Recepcionista, admin y super_admin pueden editar SOLO "Fecha Real de Recepción"
  const canEditReceptionDate = userRole === 'receptionist' || userRole === 'admin' || userRole === 'super_admin';
  const canEditEverything = !readOnly; // Doctor puede editar todo
  const {
    createRequest,
    updateRequest,
    deleteRequest,
    markAsReceived,
    getRequestsByPatient,
    fetchRequests,
    loading
  } = useProsthesisStore();

  const [formData, setFormData] = useState<ProsthesisFormData>(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Obtener solicitudes del paciente desde el store
  const existingRequests = selectedPatient ? getRequestsByPatient(selectedPatient.id) : [];

  // Cargar solicitudes al cambiar de paciente
  useEffect(() => {
    // El store ya maneja la carga de datos
    // Solo necesitamos triggerar una recarga si el store está vacío
    if (selectedPatient && existingRequests.length === 0) {
      // El store se carga automáticamente en otros componentes
      loadProsthesisRequests();
    }
  }, [selectedPatient]);

  const loadProsthesisRequests = async () => {
    if (!selectedPatient || !user?.sedeId) return;

    try {
      // Usar el store para cargar solicitudes desde la API
      await fetchRequests(user.sedeId);
      // El store filtra automáticamente por paciente usando getRequestsByPatient
    } catch (error) {
      toast.error('Error al cargar solicitudes de prótesis');
    }
  };

  const handleInputChange = (field: keyof ProsthesisFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setUnsavedChanges(true);
  };

  const handleAddRequest = async () => {
    // Validaciones
    if (!formData.prosthesisName.trim()) {
      toast.error('Por favor ingrese el nombre del trabajo protésico');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Por favor ingrese la descripción del trabajo');
      return;
    }

    if (!formData.deliveryDate) {
      toast.error('Por favor seleccione la fecha de entrega');
      return;
    }

    if (!formData.tentativeDate) {
      toast.error('Por favor seleccione la fecha tentativa de recepción');
      return;
    }

    if (!user || !selectedPatient) return;

    try {
      const requestData = {
        patientId: selectedPatient.id,
        doctorId: user.id,
        appointmentId: currentRecord.appointmentId,
        medicalRecordId: currentRecord.id,
        prosthesisName: formData.prosthesisName,
        description: formData.description,
        color: formData.color,
        specifications: formData.specifications,
        deliveryDate: parseLocalDate(formData.deliveryDate),
        tentativeDate: parseLocalDate(formData.tentativeDate),
        receptionDate: formData.receptionDate ? parseLocalDate(formData.receptionDate) : undefined,
        status: formData.status,
        createdBy: user.id,
        sedeId: user.sedeId || ''
      };

      if (editingId) {
        // Actualizar solicitud existente usando el store
        await updateRequest(editingId, requestData);
      } else {
        // Crear nueva solicitud usando el store
        await createRequest(requestData);
      }

      // Limpiar formulario
      setFormData(INITIAL_FORM_STATE);
      setIsEditing(false);
      setEditingId(null);
      setUnsavedChanges(true);
    } catch (error) {
      toast.error('Error al guardar la solicitud');
    }
  };

  const handleEditRequest = (request: ProsthesisRequest) => {
    setFormData({
      id: request.id,
      prosthesisName: request.prosthesisName,
      description: request.description,
      color: request.color || '',
      specifications: request.specifications || '',
      deliveryDate: formatDateToYMD(request.deliveryDate),
      tentativeDate: formatDateToYMD(request.tentativeDate),
      receptionDate: request.receptionDate ? formatDateToYMD(request.receptionDate) : undefined,
      status: request.status
    });
    setIsEditing(true);
    setEditingId(request.id);
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta solicitud?')) return;

    try {
      await deleteRequest(id);
      setUnsavedChanges(true);
    } catch (error) {
    }
  };

  const handleUpdateReceptionDate = async (id: string, receptionDate: string) => {
    if (!receptionDate) return;

    // ✅ Usar parseLocalDate para evitar desfase de timezone
    const localDate = parseLocalDate(receptionDate);

    try {
      await markAsReceived(id, localDate);
      setUnsavedChanges(true);
      toast.success('Fecha de recepción guardada');
    } catch (error) {
      toast.error('Error al guardar la fecha de recepción');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Proceso', color: 'bg-purple-100 text-purple-800' },
      received: { label: 'Recibido', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Función para finalizar la consulta
  const handleFinishConsultation = async () => {
    setIsFinishing(true);
    try {
      // Obtener el appointmentId desde las props o del currentRecord
      const apptId = appointmentId || currentRecord?.appointmentId || currentRecord?.appointment_id;

      if (apptId) {
        // Marcar la cita como completada
        const numericAppointmentId = typeof apptId === 'string' ? parseInt(apptId, 10) : apptId;
        await appointmentsApi.markAppointmentAsCompleted(numericAppointmentId);
        toast.success('Cita marcada como completada');
      }

      // Llamar al handler para finalizar y resetear la consulta
      onFinishConsultation();
      toast.success('Consulta finalizada exitosamente');
    } catch (error) {
      console.error('Error al finalizar consulta:', error);
      toast.error('Error al finalizar la consulta');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <StepHeader
        icon={TestTube2}
        title="Laboratorio de Prótesis"
        description="Registre las solicitudes de trabajos protésicos al laboratorio dental"
        color="purple"
        className="mb-6"
      />

      {/* Patient Info Card */}
      {selectedPatient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedPatient.documentType}: {selectedPatient.documentNumber}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Formulario de Nueva Solicitud - Solo visible para doctores (no readOnly) */}
      {!readOnly && (
      <SectionCard
        icon={Plus}
        title={isEditing ? 'Editar Solicitud' : 'Nueva Solicitud de Prótesis'}
        subtitle="Complete los detalles del trabajo protésico a enviar al laboratorio"
        colorScheme="purple"
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del trabajo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Nombre del Trabajo Protésico *
            </label>
            <input
              type="text"
              value={formData.prosthesisName}
              onChange={(e) => handleInputChange('prosthesisName', e.target.value)}
              placeholder="Ej: Corona de porcelana, Puente fijo, Dentadura parcial..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Descripción del Trabajo *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describa detalladamente qué se va a enviar al laboratorio..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Color */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="Ej: A2, B3, Blanco natural..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Especificaciones */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especificaciones Técnicas
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) => handleInputChange('specifications', e.target.value)}
              placeholder="Material, medidas, indicaciones especiales..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Fecha de entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de Entrega al Laboratorio *
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Fecha tentativa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Fecha Tentativa de Recepción *
            </label>
            <input
              type="date"
              value={formData.tentativeDate}
              onChange={(e) => handleInputChange('tentativeDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly}
            />
          </div>

          {/* Fecha real de recepción - EDITABLE PARA RECEPCIONISTA, ADMIN Y SUPER_ADMIN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Fecha Real de Recepción
              {canEditReceptionDate && readOnly && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Campo editable
                </span>
              )}
            </label>
            <input
              type="date"
              value={formData.receptionDate || ''}
              onChange={(e) => handleInputChange('receptionDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={readOnly && !canEditReceptionDate}
            />
            <p className="text-xs text-gray-500 mt-1">
              Complete este campo cuando el trabajo sea recibido del laboratorio
            </p>
          </div>

          {/* Estado (solo si está editando) */}
          {isEditing && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={readOnly}
              >
                <option value="pending">Pendiente</option>
                <option value="sent">Enviado</option>
                <option value="in_progress">En Proceso</option>
                <option value="received">Recibido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}
        </div>

        {/* Botón de agregar - Solo visible si NO es readOnly */}
        {!readOnly && (
          <div className="mt-4 flex justify-end">
            {isEditing && (
              <button
                onClick={() => {
                  setFormData(INITIAL_FORM_STATE);
                  setIsEditing(false);
                  setEditingId(null);
                }}
                className="mr-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleAddRequest}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isEditing ? 'Actualizar Solicitud' : 'Agregar Solicitud'}
            </button>
          </div>
        )}
      </SectionCard>
      )}

      {/* Lista de Solicitudes Existentes */}
      {existingRequests.length > 0 && (
        <SectionCard
          icon={Package}
          title="Solicitudes Registradas"
          subtitle={`${existingRequests.length} solicitud(es) de prótesis para este paciente`}
          colorScheme="purple"
          className="mb-6"
        >
          <div className="space-y-4">
            {existingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{request.prosthesisName}</h4>
                    <p className="text-sm text-gray-600">{request.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {/* Botones de editar/eliminar solo para doctores */}
                    {canEditEverything && (
                      <>
                        <button
                          onClick={() => handleEditRequest(request)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar solicitud"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {request.color && (
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <span className="ml-1 font-medium">{request.color}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Entrega:</span>
                    <span className="ml-1 font-medium">
                      {parseLocalDate(request.deliveryDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tentativa:</span>
                    <span className="ml-1 font-medium">
                      {parseLocalDate(request.tentativeDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {/* Fecha Real de Recepción - EDITABLE para recepcionista/admin */}
                  <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Fecha Real de Recepción:
                      </label>
                      {canEditReceptionDate || canEditEverything ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={request.receptionDate ? formatDateToYMD(parseLocalDate(request.receptionDate)) : ''}
                            onChange={(e) => handleUpdateReceptionDate(request.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {canEditReceptionDate && readOnly && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Editable
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {request.receptionDate
                            ? parseLocalDate(request.receptionDate).toLocaleDateString('es-ES')
                            : 'Pendiente'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Estado vacío si no hay solicitudes */}
      {existingRequests.length === 0 && readOnly && (
        <EmptyState
          icon={Package}
          title="Sin solicitudes de prótesis"
          description="No hay solicitudes de prótesis registradas para este paciente"
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex gap-3">
          {/* Botón Guardar: Para recepcionista (readOnly pero puede editar fecha),
              solo muestra mensaje de éxito ya que la fecha se guarda automáticamente */}
          {readOnly && canEditReceptionDate ? (
            <button
              onClick={() => toast.success('La fecha de recepción se guarda automáticamente al seleccionarla')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Guardado automático
            </button>
          ) : (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          )}
          <button
            onClick={handleFinishConsultation}
            disabled={isFinishing}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Finalizar Consulta
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Exportar el componente memoizado
export const ProsthesisLabStep = memo(ProsthesisLabStepComponent);
