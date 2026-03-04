import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { ProcedureForm } from './ProcedureForm';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Patient, TreatmentPlan, TreatmentProcedure } from '@/types';

interface NewTreatmentModalProps {
  isOpen: boolean;
  patients: Patient[];
  onClose: () => void;
  onSave: (treatment: TreatmentPlan) => void;
}

export const NewTreatmentModal = ({
  isOpen,
  patients,
  onClose,
  onSave
}: NewTreatmentModalProps) => {
  const [formData, setFormData] = useState({
    patientId: '',
    title: '',
    description: '',
    priority: 'normal' as const,
    startDate: formatDateToYMD(new Date()),
    estimatedEndDate: '',
    totalCost: 0,
    notes: ''
  });

  const [procedures, setProcedures] = useState<TreatmentProcedure[]>([
    {
      id: `proc-${Date.now()}`,
      name: '',
      description: '',
      status: 'pending',
      cost: 0,
      duration: 30,
      tooth: ''
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.title || procedures.length === 0) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    const validProcedures = procedures.filter(p => p.name.trim() !== '');
    if (validProcedures.length === 0) {
      toast.error('Agregue al menos un procedimiento válido');
      return;
    }

    const newTreatment: TreatmentPlan = {
      id: `treatment-${Date.now()}`,
      patientId: formData.patientId,
      title: formData.title,
      description: formData.description,
      status: 'draft',
      priority: formData.priority,
      startDate: new Date(formData.startDate),
      estimatedEndDate: formData.estimatedEndDate ? new Date(formData.estimatedEndDate) : undefined,
      totalCost: validProcedures.reduce((sum, p) => sum + p.cost, 0),
      doctorId: 'current-doctor',
      procedures: validProcedures,
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSave(newTreatment);

    // Reset form
    setFormData({
      patientId: '',
      title: '',
      description: '',
      priority: 'normal',
      startDate: formatDateToYMD(new Date()),
      estimatedEndDate: '',
      totalCost: 0,
      notes: ''
    });
    setProcedures([{
      id: `proc-${Date.now()}`,
      name: '',
      description: '',
      status: 'pending',
      cost: 0,
      duration: 30,
      tooth: ''
    }]);
  };

  const addProcedure = () => {
    setProcedures([...procedures, {
      id: `proc-${Date.now()}`,
      name: '',
      description: '',
      status: 'pending',
      cost: 0,
      duration: 30,
      tooth: ''
    }]);
  };

  const removeProcedure = (index: number) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter((_, i) => i !== index));
    }
  };

  const updateProcedure = (index: number, field: keyof TreatmentProcedure, value: any) => {
    const updatedProcedures = [...procedures];
    updatedProcedures[index] = { ...updatedProcedures[index], [field]: value };
    setProcedures(updatedProcedures);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Nuevo Plan de Tratamiento</h3>
                    <p className="text-sm text-gray-600">Cree un plan detallado para el paciente</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Seleccione un paciente</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName} - DNI: {patient.dni}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Tratamiento *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Rehabilitación Oral Completa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada del plan de tratamiento"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Estimada de Finalización
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedEndDate}
                    onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Procedures Section */}
              <ProcedureForm
                procedures={procedures}
                onAddProcedure={addProcedure}
                onRemoveProcedure={removeProcedure}
                onUpdateProcedure={updateProcedure}
              />

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones o instrucciones especiales"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crear Plan de Tratamiento
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
