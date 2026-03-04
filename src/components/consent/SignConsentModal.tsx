import { useState } from 'react';
import { X, FileText, Save, User, UserCheck, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { consentsApi } from '@/services/api/consentsApi';
import { useAuthStore } from '@/store/authStore';
import { formatDateToYMD } from '@/utils/dateUtils';

interface SignConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientDni: string;
  consentId: string;
  consentTitle: string;
  consentCategory: string;
  consentContent: string;
  onSuccess?: () => void;
}

export function SignConsentModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientDni,
  consentId,
  consentTitle,
  consentCategory,
  consentContent,
  onSuccess
}: SignConsentModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    pacienteDomicilio: '',
    tieneRepresentante: false,
    representanteNombre: '',
    representanteDni: '',
    representanteDomicilio: '',
    doctorNombre: user?.profile.firstName + ' ' + user?.profile.lastName || '',
    doctorCop: user?.profile.licenseNumber || '',
    observaciones: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construir notas con información adicional del representante y doctor
      let notesContent = formData.observaciones || '';
      if (formData.tieneRepresentante) {
        notesContent += `\n\nRepresentante Legal:\n- Nombre: ${formData.representanteNombre}\n- DNI: ${formData.representanteDni}\n- Domicilio: ${formData.representanteDomicilio}`;
      }
      notesContent += `\n\nDomicilio del paciente: ${formData.pacienteDomicilio}`;
      notesContent += `\n\nDoctor: ${formData.doctorNombre} (COP: ${formData.doctorCop})`;

      // Crear consentimiento usando la API
      await consentsApi.createConsent({
        patient_id: parseInt(patientId),
        consent_template_id: consentId ? parseInt(consentId) : undefined,
        consent_date: formatDateToYMD(new Date()),
        consent_content: consentContent,
        signed_by: user?.id ? parseInt(user.id) : undefined,
        witness_name: formData.tieneRepresentante ? formData.representanteNombre : undefined,
        notes: notesContent.trim()
      });

      toast.success('Consentimiento firmado y guardado correctamente');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar consentimiento:', error);
      toast.error('Error al guardar el consentimiento. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenido del modal */}
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{consentTitle}</h2>
              <p className="text-sm text-gray-600">{consentCategory}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview del Consentimiento */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contenido del Consentimiento Informado
            </h3>
            <div
              className="prose prose-sm max-w-none text-justify"
              dangerouslySetInnerHTML={{ __html: consentContent }}
            />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del Paciente */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Datos del Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={patientDni}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domicilio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pacienteDomicilio}
                    onChange={(e) => setFormData({ ...formData, pacienteDomicilio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Representante Legal */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Representante Legal
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tieneRepresentante}
                    onChange={(e) => setFormData({ ...formData, tieneRepresentante: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Tiene representante legal</span>
                </label>
              </div>

              {formData.tieneRepresentante && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.representanteNombre}
                      onChange={(e) => setFormData({ ...formData, representanteNombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={formData.tieneRepresentante}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.representanteDni}
                      onChange={(e) => setFormData({ ...formData, representanteDni: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={formData.tieneRepresentante}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domicilio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.representanteDomicilio}
                      onChange={(e) => setFormData({ ...formData, representanteDomicilio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={formData.tieneRepresentante}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Datos del Doctor */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-green-600" />
                Datos del Cirujano Dentista
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.doctorNombre}
                    onChange={(e) => setFormData({ ...formData, doctorNombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    COP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.doctorCop}
                    onChange={(e) => setFormData({ ...formData, doctorCop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>

            {/* Footer con Botones */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Firmar y Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
