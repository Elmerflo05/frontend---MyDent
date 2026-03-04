/**
 * Modal para asignar contrato a un paciente
 * Usado desde AdditionalServicesContracts, PlanContracts, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  User,
  UserCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  PenTool,
  Upload,
  File,
  Trash2
} from 'lucide-react';
import { patientsApi, type PatientData } from '@/services/api/patientsApi';
import { contractTemplatesApi, type ContractTemplate } from '@/services/api/contractTemplatesApi';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { SignaturePad } from '@/components/consent/SignaturePad';

interface AssignContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ContractTemplate;
  onSuccess: () => void;
}

const AssignContractModal = ({ isOpen, onClose, template, onSuccess }: AssignContractModalProps) => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Campos de firma
  const [patientAddress, setPatientAddress] = useState('');
  const [hasRepresentative, setHasRepresentative] = useState(false);
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeDni, setRepresentativeDni] = useState('');
  const [representativeAddress, setRepresentativeAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [contractFile, setContractFile] = useState<File | null>(null);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setPatients([]);
      setSelectedPatient(null);
      setNotes('');
      setPatientAddress('');
      setHasRepresentative(false);
      setRepresentativeName('');
      setRepresentativeDni('');
      setRepresentativeAddress('');
      setSignature('');
      setContractFile(null);
    }
  }, [isOpen]);

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      // Validar tamaño (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar los 10MB');
        return;
      }
      setContractFile(file);
    }
  };

  // Buscar pacientes con debounce
  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPatients([]);
      return;
    }

    setSearching(true);
    try {
      const results = await patientsApi.searchPatients(term);
      setPatients(results.slice(0, 10)); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      toast.error('Error al buscar pacientes');
    } finally {
      setSearching(false);
    }
  }, []);

  // Manejar cambio de búsqueda con debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedPatient(null);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchPatients(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Seleccionar paciente
  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setPatients([]); // Limpiar resultados
  };

  // Asignar contrato
  const handleAssign = async () => {
    if (!selectedPatient || !template) {
      toast.error('Seleccione un paciente para asignar el contrato');
      return;
    }

    if (!user?.branch_id) {
      toast.error('No se pudo determinar la sede actual');
      return;
    }

    if (!patientAddress.trim()) {
      toast.error('El domicilio del paciente es requerido');
      return;
    }

    if (!signature) {
      toast.error('La firma digital es requerida');
      return;
    }

    if (hasRepresentative) {
      if (!representativeName.trim()) {
        toast.error('El nombre del representante es requerido');
        return;
      }
      if (!representativeDni.trim()) {
        toast.error('El DNI del representante es requerido');
        return;
      }
      if (!representativeAddress.trim()) {
        toast.error('El domicilio del representante es requerido');
        return;
      }
    }

    setAssigning(true);
    try {
      // Usar FormData para poder incluir archivo
      const formData = new FormData();
      formData.append('patient_id', selectedPatient.patient_id!.toString());
      formData.append('template_id', template.id.toString());
      formData.append('branch_id', user.branch_id.toString());
      formData.append('patient_address', patientAddress);
      formData.append('signature_data', signature);

      if (notes) {
        formData.append('notes', notes);
      }

      if (hasRepresentative) {
        formData.append('representative_name', representativeName);
        formData.append('representative_dni', representativeDni);
        formData.append('representative_address', representativeAddress);
      }

      if (contractFile) {
        formData.append('contract_file', contractFile);
      }

      await contractTemplatesApi.assignContractToPatientWithFile(formData);

      toast.success(`Contrato "${template.nombre}" firmado y asignado a ${selectedPatient.first_name} ${selectedPatient.last_name}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error asignando contrato:', error);
      toast.error(error.response?.data?.error || 'Error al asignar el contrato');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Asignar Contrato a Paciente</h2>
              <p className="text-purple-100 text-sm mt-1">
                {template.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Resumen del contrato */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" />
                Resumen del Contrato
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">
                    {template.tipo.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    S/ {template.precio.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Duración:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {template.duracion || 'No especificada'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Categoría:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">
                    {template.categoria}
                  </span>
                </div>
              </div>
            </div>

            {/* Buscador de pacientes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Paciente *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar por nombre, DNI o email..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
                )}
              </div>

              {/* Resultados de búsqueda */}
              {patients.length > 0 && !selectedPatient && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                  {patients.map((patient) => (
                    <button
                      key={patient.patient_id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          DNI: {patient.identification_number} • {patient.email || 'Sin email'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Paciente seleccionado */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-green-700">
                      DNI: {selectedPatient.identification_number}
                      {selectedPatient.mobile && ` • Tel: ${selectedPatient.mobile}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchTerm('');
                    }}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Datos de firma - Solo mostrar si hay paciente seleccionado */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Domicilio del paciente */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Domicilio del Paciente
                  </h4>
                  <input
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="Ingrese el domicilio del paciente *"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Representante Legal */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Representante Legal
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasRepresentative}
                        onChange={(e) => setHasRepresentative(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">Tiene representante</span>
                    </label>
                  </div>

                  {hasRepresentative && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <input
                        type="text"
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        placeholder="Nombre completo *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={representativeDni}
                        onChange={(e) => setRepresentativeDni(e.target.value)}
                        placeholder="DNI *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={representativeAddress}
                        onChange={(e) => setRepresentativeAddress(e.target.value)}
                        placeholder="Domicilio del representante *"
                        className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Firma Digital */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-green-600" />
                    Firma Digital del Paciente
                  </h4>
                  <SignaturePad
                    value={signature}
                    onChange={setSignature}
                    label="Firme aqui para aceptar el contrato"
                    required
                  />
                </div>

                {/* Archivo adjunto */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    Archivo Adjunto (Opcional)
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Puede adjuntar una copia escaneada del contrato firmado (PDF o imagen)
                  </p>

                  {!contractFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <File className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-purple-600">Click para seleccionar</span> o arrastre el archivo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG (max. 10MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">{contractFile.name}</p>
                          <p className="text-xs text-green-600">{(contractFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContractFile(null)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Observaciones sobre la asignación del contrato..."
              />
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Información importante:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>El contrato quedará vinculado al paciente seleccionado</li>
                  <li>El paciente podrá ver este contrato en su portal "Mis Contratos"</li>
                  <li>Se registrará la fecha actual como fecha de firma</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 flex gap-3">
            <button
              onClick={handleAssign}
              disabled={!selectedPatient || assigning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                selectedPatient && !assigning
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {assigning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Firmar y Asignar
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={assigning}
              className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignContractModal;
