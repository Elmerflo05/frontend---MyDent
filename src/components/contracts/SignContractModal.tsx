import { useState } from 'react';
import { X, FileText, Save, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { contractTemplatesApi } from '@/services/api/contractTemplatesApi';

interface ContractData {
  id: number;
  patientName: string;
  patientDni?: string;
  contractType: string;
  contractNumber: string | null;
  content: string | null;
}

interface SignContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractData;
  onSuccess?: () => void;
}

export function SignContractModal({
  isOpen,
  onClose,
  contract,
  onSuccess
}: SignContractModalProps) {
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    pacienteDomicilio: '',
    tieneRepresentante: false,
    representanteNombre: '',
    representanteDni: '',
    representanteDomicilio: '',
    observaciones: ''
  });

  const getContractTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      ortodoncia: 'Ortodoncia',
      implantes: 'Implantes Dentales',
      rehabilitacion_oral: 'Rehabilitacion Oral',
      plan_personal: 'Plan Personal',
      plan_familiar: 'Plan Familiar',
      tratamiento: 'Tratamiento',
      servicios: 'Servicios',
      otro: 'Otro'
    };
    return types[type?.toLowerCase() || 'otro'] || type || 'Otro';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pacienteDomicilio.trim()) {
      toast.error('El domicilio del paciente es requerido');
      return;
    }

    if (formData.tieneRepresentante) {
      if (!formData.representanteNombre.trim()) {
        toast.error('El nombre del representante es requerido');
        return;
      }
      if (!formData.representanteDni.trim()) {
        toast.error('El DNI del representante es requerido');
        return;
      }
      if (!formData.representanteDomicilio.trim()) {
        toast.error('El domicilio del representante es requerido');
        return;
      }
    }

    setLoading(true);

    try {
      await contractTemplatesApi.signContract(contract.id, {
        patient_address: formData.pacienteDomicilio,
        representative_name: formData.tieneRepresentante ? formData.representanteNombre : undefined,
        representative_dni: formData.tieneRepresentante ? formData.representanteDni : undefined,
        representative_address: formData.tieneRepresentante ? formData.representanteDomicilio : undefined,
        observations: formData.observaciones || undefined
      });

      toast.success('Contrato firmado exitosamente');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al firmar contrato:', error);
      toast.error('Error al firmar el contrato. Por favor intente nuevamente.');
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
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Firmar Contrato</h2>
              <p className="text-sm text-gray-600">
                {getContractTypeLabel(contract.contractType)}
                {contract.contractNumber && ` - ${contract.contractNumber}`}
              </p>
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
          {/* Preview del Contrato */}
          {contract.content && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Contenido del Contrato
              </h3>
              <div
                className="prose prose-sm max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del Paciente */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                Datos del Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={contract.patientName}
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
                    value={contract.patientDni || ''}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Ingrese su domicilio actual"
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
                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required={formData.tieneRepresentante}
                    />
                  </div>
                </div>
              )}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>

            {/* Aviso legal */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm text-teal-800">
                <strong>Importante:</strong> Al firmar este contrato, usted acepta los terminos y condiciones
                establecidos en el documento. Esta firma digital tiene la misma validez legal que una firma manuscrita.
              </p>
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
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Firmando...' : 'Firmar Contrato'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignContractModal;
