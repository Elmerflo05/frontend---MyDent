import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Heart,
  AlertTriangle,
  User,
  Calendar,
  Activity,
  Pill,
  Stethoscope,
  ClipboardList,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { MedicalHistoryApiService, type MedicalRecordEntry } from '../services/medicalHistoryApiService';
import { useAuth } from '@/hooks/useAuth';
import type { Patient, MedicalRecord } from '@/types';

const MedicalRecords = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordEntry | null>(null);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Preparar filtros para doctores (filtrar por sede)
      const filters: { branchId?: number } = {};
      if (user?.role === 'doctor' && user.branch_id) {
        filters.branchId = user.branch_id;
      }

      // ✅ Cargar datos desde las APIs reales (sin IndexedDB ni mock data)
      const [patientsData, medicalRecordsData] = await Promise.all([
        MedicalHistoryApiService.loadPatients(),
        MedicalHistoryApiService.loadMedicalHistories(filters)
      ]);

      setPatients(patientsData);
      setMedicalRecords(medicalRecordsData);

      console.log('✅ Datos cargados desde API:', {
        patients: patientsData.length,
        medicalRecords: medicalRecordsData.length
      });
    } catch (error) {
      toast.error('Error al cargar los historiales médicos');
    } finally {
      setIsLoading(false);
    }
  };

  // Get patient name by ID
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido';
  };

  // Filter records
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = searchTerm === '' ||
      getPatientName(record.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPatient = selectedPatient === 'all' || record.patientId === selectedPatient;

    return matchesSearch && matchesPatient;
  });

  // Get statistics
  const getStats = () => {
    const total = medicalRecords.length;
    const thisMonth = medicalRecords.filter(r => {
      const recordDate = new Date(r.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && 
             recordDate.getFullYear() === now.getFullYear();
    }).length;
    
    const uniquePatients = new Set(medicalRecords.map(r => r.patientId)).size;
    const withMedications = medicalRecords.filter(r => r.medications.length > 0).length;

    return { total, thisMonth, uniquePatients, withMedications };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historiales Médicos</h1>
                <p className="text-gray-600">Gestión de historiales clínicos y registros médicos</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowNewRecordModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Registros</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Este Mes</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.thisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Pacientes Únicos</p>
                  <p className="text-2xl font-bold text-green-900">{stats.uniquePatients}</p>
                </div>
                <User className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Con Medicamentos</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.withMedications}</p>
                </div>
                <Pill className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por paciente, diagnóstico o tratamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-80"
              />
            </div>
            
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Todos los pacientes</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {filteredRecords.length} de {medicalRecords.length} registros
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnóstico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tratamiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(record.date).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {getPatientName(record.patientId)}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.diagnosis}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.treatment}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {record.symptoms.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Síntomas
                            </span>
                          )}
                          {record.medications.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Pill className="w-3 h-3 mr-1" />
                              Medicamentos
                            </span>
                          )}
                          {record.vitals && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Heart className="w-3 h-3 mr-1" />
                              Vitales
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Editar registro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron registros</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros o crear un nuevo registro médico.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* New Record Modal */}
        {showNewRecordModal && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowNewRecordModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Nuevo Registro Médico</h3>
                <button
                  onClick={() => setShowNewRecordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <NewRecordForm 
                patients={patients} 
                onSave={(newRecord) => {
                  setMedicalRecords([...medicalRecords, newRecord]);
                  setShowNewRecordModal(false);
                  toast.success('Registro médico guardado exitosamente');
                }}
                onCancel={() => setShowNewRecordModal(false)}
              />
            </motion.div>
          </div>,
          document.body
        )}

        {/* Record Details Modal */}
        {selectedRecord && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Historial Médico - {getPatientName(selectedRecord.patientId)}</h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información General</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Fecha:</strong> {new Date(selectedRecord.date).toLocaleDateString('es-ES')}</div>
                    <div><strong>Paciente:</strong> {getPatientName(selectedRecord.patientId)}</div>
                    <div><strong>Diagnóstico:</strong> {selectedRecord.diagnosis}</div>
                    <div><strong>Tratamiento:</strong> {selectedRecord.treatment}</div>
                  </div>
                </div>

                {selectedRecord.vitals && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Signos Vitales</h4>
                    <div className="space-y-2 text-sm">
                      {selectedRecord.vitals.bloodPressure && (
                        <div><strong>Presión Arterial:</strong> {selectedRecord.vitals.bloodPressure} mmHg</div>
                      )}
                      {selectedRecord.vitals.temperature && (
                        <div><strong>Temperatura:</strong> {selectedRecord.vitals.temperature}°C</div>
                      )}
                      {selectedRecord.vitals.heartRate && (
                        <div><strong>Frecuencia Cardíaca:</strong> {selectedRecord.vitals.heartRate} lpm</div>
                      )}
                      {selectedRecord.vitals.weight && (
                        <div><strong>Peso:</strong> {selectedRecord.vitals.weight} kg</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRecord.symptoms.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Síntomas</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedRecord.symptoms.map((symptom, index) => (
                        <li key={index} className="text-red-700">{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecord.medications.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Medicamentos</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedRecord.medications.map((medication, index) => (
                        <li key={index} className="text-green-700">{medication}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Notas del Doctor</h4>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRecord.notes}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Editar Registro
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Descargar PDF
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </motion.div>
    </div>
  );
};

// New Record Form Component
interface NewRecordFormProps {
  patients: Patient[];
  onSave: (record: MedicalRecordEntry) => void;
  onCancel: () => void;
}

const NewRecordForm = ({ patients, onSave, onCancel }: NewRecordFormProps) => {
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    symptoms: [''],
    medications: ['']
  });

  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // Update current patient when selection changes
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setCurrentPatient(patient || null);
    } else {
      setCurrentPatient(null);
    }
  }, [formData.patientId, patients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.diagnosis) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    const newRecord: MedicalRecordEntry = {
      id: `record-${Date.now()}`,
      patientId: formData.patientId,
      date: new Date(),
      diagnosis: formData.diagnosis,
      treatment: formData.treatment,
      notes: formData.notes,
      symptoms: formData.symptoms.filter(s => s.trim() !== ''),
      medications: formData.medications.filter(m => m.trim() !== ''),
      doctorId: 'current-doctor' // En un sistema real, vendría de la sesión
    };

    onSave(newRecord);
  };

  const addSymptom = () => {
    setFormData({
      ...formData,
      symptoms: [...formData.symptoms, '']
    });
  };

  const removeSymptom = (index: number) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter((_, i) => i !== index)
    });
  };

  const updateSymptom = (index: number, value: string) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[index] = value;
    setFormData({
      ...formData,
      symptoms: newSymptoms
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, '']
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  const updateMedication = (index: number, value: string) => {
    const newMedications = [...formData.medications];
    newMedications[index] = value;
    setFormData({
      ...formData,
      medications: newMedications
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Información del Paciente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - DNI: {patient.dni}
                </option>
              ))}
            </select>
          </div>

          {currentPatient && (
            <div className="bg-white p-3 rounded border">
              <div className="text-sm">
                <div><strong>Edad:</strong> {new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear()} años</div>
                <div><strong>Género:</strong> {currentPatient.gender === 'M' ? 'Masculino' : currentPatient.gender === 'F' ? 'Femenino' : 'Otro'}</div>
                <div><strong>Teléfono:</strong> {currentPatient.phone}</div>
                {currentPatient.medicalHistory.allergies.length > 0 && (
                  <div><strong>Alergias:</strong> {currentPatient.medicalHistory.allergies.join(', ')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Symptoms */}
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-red-900">Síntomas</h4>
          <button
            type="button"
            onClick={addSymptom}
            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar síntoma
          </button>
        </div>
        <div className="space-y-2">
          {formData.symptoms.map((symptom, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Describir síntoma..."
                value={symptom}
                onChange={(e) => updateSymptom(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {formData.symptoms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSymptom(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Diagnosis & Treatment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Describir diagnóstico detallado..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tratamiento Recomendado</label>
          <textarea
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Describir tratamiento recomendado..."
          />
        </div>
      </div>

      {/* Medications */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-orange-900">Medicamentos Prescritos</h4>
          <button
            type="button"
            onClick={addMedication}
            className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar medicamento
          </button>
        </div>
        <div className="space-y-2">
          {formData.medications.map((medication, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Medicamento, dosis y frecuencia..."
                value={medication}
                onChange={(e) => updateMedication(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {formData.medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="text-orange-600 hover:text-orange-800 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notas y Observaciones</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          placeholder="Notas adicionales, observaciones, recomendaciones para el paciente..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Guardar Registro Médico
        </button>
      </div>
    </form>
  );
};

export default MedicalRecords;