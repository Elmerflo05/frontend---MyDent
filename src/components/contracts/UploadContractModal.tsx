import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { patientContractsApi } from '@/services/api/patientContractsApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDateToYMD } from '@/utils/dateUtils';

interface UploadContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

export const UploadContractModal = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}: UploadContractModalProps) => {
  const { user } = useAuth();
  const [contractName, setContractName] = useState('');
  const [contractType, setContractType] = useState('tratamiento');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('El archivo no debe superar los 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractName.trim()) {
      toast.error('Ingrese un nombre para el contrato');
      return;
    }

    if (!selectedFile) {
      toast.error('Seleccione un archivo PDF');
      return;
    }

    try {
      setIsLoading(true);

      const today = formatDateToYMD(new Date());

      // Crear contrato usando FormData (subida de archivo físico)
      await patientContractsApi.uploadContractWithFile(
        {
          patient_id: parseInt(patientId),
          branch_id: user?.branch_id || 1,
          contract_type: contractType,
          contract_date: today,
          start_date: today,
          notes: `${contractName.trim()}${notes.trim() ? ` - ${notes.trim()}` : ''}`,
          contract_content: `Contrato: ${contractName.trim()}`
        },
        selectedFile
      );

      toast.success('Contrato adjuntado exitosamente');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error al adjuntar el contrato:', error);
      toast.error('Error al adjuntar el contrato');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setContractName('');
    setContractType('tratamiento');
    setSelectedFile(null);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
        {/* Overlay oscuro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Contenido del modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Adjuntar Contrato
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Paciente: {patientName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Contract Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Contrato *
              </label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="Ej: Contrato de Tratamiento de Ortodoncia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Contrato
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="tratamiento">Tratamiento</option>
                <option value="pago">Plan de Pago</option>
                <option value="confidencialidad">Confidencialidad</option>
                <option value="consentimiento">Consentimiento Informado</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo PDF *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="contract-file"
                />
                <label
                  htmlFor="contract-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3 text-green-600">
                      <FileText className="w-8 h-8" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click para seleccionar un archivo PDF
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tamaño máximo: 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Observaciones o instrucciones adicionales..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">El paciente deberá firmar</p>
                <p>
                  El contrato quedará en estado "Pendiente" hasta que el paciente
                  lo firme digitalmente desde su portal.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adjuntando...' : 'Adjuntar Contrato'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
