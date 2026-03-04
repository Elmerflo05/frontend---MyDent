import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Save,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import { UI_TEXTS } from '@/constants/ui';

interface Observation {
  id: string;
  content: string;
  date: Date;
  doctorId?: string;
  doctorName?: string;
  category: 'general' | 'diagnostic' | 'treatment' | 'followup';
  priority: 'low' | 'medium' | 'high';
}

interface ObservationsSectionProps {
  patient: Patient | null;
  className?: string;
}

const ObservationsSection = ({ patient, className = '' }: ObservationsSectionProps) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [newObservation, setNewObservation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Observation['category']>('general');
  const [selectedPriority, setSelectedPriority] = useState<Observation['priority']>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const categories = [
    { value: 'general', label: 'General', icon: FileText, color: 'blue' },
    { value: 'diagnostic', label: 'Diagnóstico', icon: Stethoscope, color: 'purple' },
    { value: 'treatment', label: 'Tratamiento', icon: User, color: 'green' },
    { value: 'followup', label: 'Seguimiento', icon: Clock, color: 'orange' }
  ] as const;

  const priorities = [
    { value: 'low', label: 'Baja', color: 'gray' },
    { value: 'medium', label: 'Media', color: 'yellow' },
    { value: 'high', label: 'Alta', color: 'red' }
  ] as const;

  // Cargar observaciones del paciente (mock data por ahora)
  useEffect(() => {
    if (patient) {
      // En una implementación real, esto cargaría desde el backend
      loadPatientObservations(patient.id);
    } else {
      setObservations([]);
    }
  }, [patient]);

  const loadPatientObservations = async (patientId: string) => {
    // Mock data - en la implementación real se cargaría desde la base de datos
    const mockObservations: Observation[] = [
      {
        id: '1',
        content: 'Paciente presenta sensibilidad en molares superiores. Recomendar pasta dental especializada.',
        date: new Date(Date.now() - 86400000), // Ayer
        doctorName: 'Dr. García',
        category: 'diagnostic',
        priority: 'medium'
      },
      {
        id: '2',
        content: 'Control post-operatorio: La cicatrización está progresando correctamente.',
        date: new Date(Date.now() - 172800000), // Hace 2 días
        doctorName: 'Dr. Martínez',
        category: 'followup',
        priority: 'low'
      }
    ];

    setObservations(mockObservations);
  };

  const handleAddObservation = () => {
    if (!patient) {
      toast.error('Debe seleccionar un paciente primero');
      return;
    }

    if (!newObservation.trim()) {
      toast.error('La observación no puede estar vacía');
      return;
    }

    const observation: Observation = {
      id: Date.now().toString(),
      content: newObservation.trim(),
      date: new Date(),
      doctorName: 'Dr. Usuario', // En implementación real vendría del contexto de usuario
      category: selectedCategory,
      priority: selectedPriority
    };

    setObservations(prev => [observation, ...prev]);
    setNewObservation('');
    toast.success('Observación agregada exitosamente');
  };

  const handleEditObservation = (id: string) => {
    const observation = observations.find(obs => obs.id === id);
    if (observation) {
      setEditingId(id);
      setEditContent(observation.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error('La observación no puede estar vacía');
      return;
    }

    setObservations(prev =>
      prev.map(obs =>
        obs.id === editingId
          ? { ...obs, content: editContent.trim() }
          : obs
      )
    );

    setEditingId(null);
    setEditContent('');
    toast.success('Observación actualizada exitosamente');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteObservation = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta observación?')) {
      setObservations(prev => prev.filter(obs => obs.id !== id));
      toast.success('Observación eliminada exitosamente');
    }
  };

  const getCategoryConfig = (category: Observation['category']) => {
    return categories.find(cat => cat.value === category);
  };

  const getPriorityConfig = (priority: Observation['priority']) => {
    return priorities.find(pri => pri.value === priority);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!patient) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Observaciones Clínicas</h3>
        <p className="text-gray-600">Seleccione un paciente para ver y agregar observaciones.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Observaciones Clínicas</h2>
            <p className="text-sm text-gray-600">
              Registro de observaciones para {patient.firstName} {patient.lastName}
            </p>
          </div>
        </div>

        {/* Formulario para nueva observación */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Observation['category'])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as Observation['priority'])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  Prioridad {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <textarea
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Escriba una nueva observación clínica..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <button
              onClick={handleAddObservation}
              disabled={!newObservation.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de observaciones */}
      <div className="p-6">
        {observations.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay observaciones registradas</p>
            <p className="text-sm text-gray-400">Agregue la primera observación para este paciente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {observations.map((observation) => {
              const categoryConfig = getCategoryConfig(observation.category);
              const priorityConfig = getPriorityConfig(observation.priority);
              const isEditing = editingId === observation.id;

              return (
                <motion.div
                  key={observation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {categoryConfig && (
                        <div className={`p-2 bg-${categoryConfig.color}-100 rounded-lg`}>
                          <categoryConfig.icon className={`w-4 h-4 text-${categoryConfig.color}-600`} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {categoryConfig?.label}
                          </span>
                          {priorityConfig && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${priorityConfig.color}-100 text-${priorityConfig.color}-800`}>
                              {priorityConfig.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(observation.date)}
                          </div>
                          {observation.doctorName && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {observation.doctorName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditObservation(observation.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar observación"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteObservation(observation.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar observación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          {UI_TEXTS.BUTTONS.CANCEL}
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          {UI_TEXTS.BUTTONS.SAVE}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{observation.content}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen de observaciones */}
      {observations.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Total: <span className="font-medium">{observations.length}</span> observaciones
              </span>
              <div className="flex items-center gap-3">
                {priorities.map(priority => {
                  const count = observations.filter(obs => obs.priority === priority.value).length;
                  if (count === 0) return null;

                  return (
                    <span key={priority.value} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${priority.color}-100 text-${priority.color}-800`}>
                      {count} {priority.label.toLowerCase()}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Última actualización: {observations.length > 0 && formatDate(observations[0].date)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationsSection;