import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MapPin,
  Droplets,
  AlertTriangle,
  Pill,
  Heart,
  Phone,
  User,
  Save,
  X,
  Loader2,
  CreditCard,
  Building2
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import type { Patient, Company } from '@/types';
import { patientsApi } from '@/services/api/patientsApi';
import { medicalHistoriesApi } from '@/services/api/medicalHistoriesApi';
import { PatientApiService } from '../../services/patientApiService';

interface CompletePatientInfoModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Empresa
  companyId: string;
  // Dirección
  address: string;
  city: string;
  department: string;
  // Tipo de sangre
  bloodTypeId: string;
  // Historia médica
  hasAllergies: boolean;
  allergiesDescription: string;
  hasChronicDiseases: boolean;
  chronicDiseasesDescription: string;
  hasMedications: boolean;
  currentMedications: string;
  // Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const BLOOD_TYPES = [
  { id: '1', name: 'A+' },
  { id: '2', name: 'A-' },
  { id: '3', name: 'B+' },
  { id: '4', name: 'B-' },
  { id: '5', name: 'AB+' },
  { id: '6', name: 'AB-' },
  { id: '7', name: 'O+' },
  { id: '8', name: 'O-' },
];

const RELATIONSHIPS = [
  'Padre',
  'Madre',
  'Hermano/a',
  'Esposo/a',
  'Hijo/a',
  'Tío/a',
  'Abuelo/a',
  'Primo/a',
  'Amigo/a',
  'Otro'
];

export const CompletePatientInfoModal = ({
  isOpen,
  patient,
  onClose,
  onSuccess
}: CompletePatientInfoModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<FormData>({
    companyId: '',
    address: '',
    city: '',
    department: '',
    bloodTypeId: '',
    hasAllergies: false,
    allergiesDescription: '',
    hasChronicDiseases: false,
    chronicDiseasesDescription: '',
    hasMedications: false,
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  // Cargar datos existentes del paciente
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patient?.id) return;

      // Debug: Ver qué datos tiene el objeto patient (props)
      console.log('[CompletePatientInfoModal] Props patient:', {
        id: patient.id,
        dni: patient.dni,
        firstName: patient.firstName,
        lastName: patient.lastName,
        address: patient.address
      });

      setIsLoadingData(true);
      try {
        // Cargar empresas y datos del paciente en paralelo
        const [patientResponse, allCompanies] = await Promise.all([
          patientsApi.getPatientById(parseInt(patient.id)),
          PatientApiService.loadCompanies().catch(() => [] as Company[])
        ]);
        const activeCompanies = allCompanies.filter((c: any) => c.is_active !== false);
        setCompanies(activeCompanies);

        const patientData = patientResponse.data;

        // Cargar historia médica existente
        let medicalHistory = null;
        try {
          const medicalResponse = await medicalHistoriesApi.getPatientMedicalHistory(parseInt(patient.id));
          medicalHistory = medicalResponse?.data || null;
        } catch {
          // No hay historia médica, está bien
        }

        // Debug: Ver datos cargados del backend
        console.log('[CompletePatientInfoModal] Datos del paciente cargados:', {
          patient_id: patientData.patient_id,
          identification_number: patientData.identification_number,
          blood_type_id: patientData.blood_type_id,
          blood_type_name: patientData.blood_type_name,
          address: patientData.address,
          city: patientData.city,
          state: patientData.state
        });

        // Pre-llenar el formulario con datos existentes
        setFormData({
          companyId: patientData.company_id?.toString() || patient.companyId || '',
          address: patientData.address || patient.address || '',
          city: patientData.city || '',
          department: patientData.state || '',
          bloodTypeId: patientData.blood_type_id?.toString() || '',
          hasAllergies: medicalHistory?.has_allergies || false,
          allergiesDescription: medicalHistory?.allergies_description || '',
          hasChronicDiseases: medicalHistory?.has_chronic_diseases || false,
          chronicDiseasesDescription: medicalHistory?.chronic_diseases_description || '',
          hasMedications: medicalHistory?.has_medications || false,
          currentMedications: medicalHistory?.current_medications || '',
          emergencyContactName: patientData.emergency_contact_name || patient.emergencyContact?.name || '',
          emergencyContactPhone: patientData.emergency_contact_phone || patient.emergencyContact?.phone || '',
          emergencyContactRelationship: patientData.emergency_contact_relationship || patient.emergencyContact?.relationship || ''
        });
      } catch (error) {
        console.error('Error al cargar datos del paciente:', error);
        toast.error('Error al cargar los datos del paciente');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isOpen) {
      loadPatientData();
    }
  }, [isOpen, patient?.id]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.address.trim()) {
      toast.error('La dirección es requerida');
      return;
    }
    if (!formData.emergencyContactName.trim()) {
      toast.error('El nombre del contacto de emergencia es requerido');
      return;
    }
    if (!formData.emergencyContactPhone.trim()) {
      toast.error('El teléfono del contacto de emergencia es requerido');
      return;
    }

    setIsLoading(true);
    try {
      // Debug: Ver qué datos se van a enviar
      const patientUpdateData = {
        company_id: formData.companyId ? parseInt(formData.companyId) : 0,
        address: formData.address,
        city: formData.city,
        state: formData.department,
        blood_type_id: formData.bloodTypeId ? parseInt(formData.bloodTypeId) : undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relationship: formData.emergencyContactRelationship,
        is_basic_registration: false,
        completed_at: new Date().toISOString()
      };
      console.log('[CompletePatientInfoModal] Datos a enviar:', patientUpdateData);

      // 1. Actualizar datos del paciente
      await patientsApi.updatePatient(parseInt(patient.id), {
        company_id: formData.companyId ? parseInt(formData.companyId) : 0, // 0 = desasociar empresa (backend convierte a NULL)
        address: formData.address,
        city: formData.city,
        state: formData.department,
        blood_type_id: formData.bloodTypeId ? parseInt(formData.bloodTypeId) : undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relationship: formData.emergencyContactRelationship,
        // Marcar como registro completo
        is_basic_registration: false,
        completed_at: new Date().toISOString()
      });

      // 2. Crear o actualizar historia médica
      await medicalHistoriesApi.upsertMedicalHistory({
        patient_id: parseInt(patient.id),
        has_allergies: formData.hasAllergies,
        allergies_description: formData.hasAllergies ? formData.allergiesDescription : '',
        has_chronic_diseases: formData.hasChronicDiseases,
        chronic_diseases_description: formData.hasChronicDiseases ? formData.chronicDiseasesDescription : '',
        has_medications: formData.hasMedications,
        current_medications: formData.hasMedications ? formData.currentMedications : ''
      });

      toast.success('Información del paciente completada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al completar información:', error);
      toast.error('Error al guardar la información del paciente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnEscape>
      <Modal.Header>
        <h3 className="text-xl font-bold text-gray-900">
          Completar Información del Paciente
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {patient?.firstName} {patient?.lastName} - DNI: {patient?.dni}
        </p>
      </Modal.Header>

      <Modal.Body>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Información del Paciente (solo lectura) */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Información del Paciente</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={`${patient?.firstName || ''} ${patient?.lastName || ''}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI / Documento
                  </label>
                  <input
                    type="text"
                    value={patient?.dni || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Empresa */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-900">Empresa (Opcional)</h4>
              </div>
              <select
                value={formData.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Paciente particular</option>
                {companies.length === 0 ? (
                  <option value="" disabled>No hay empresas activas disponibles</option>
                ) : (
                  companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nombre}
                    </option>
                  ))
                )}
              </select>
              {formData.companyId ? (
                <p className="text-xs text-indigo-600 mt-1">
                  El paciente accederá a los precios corporativos de esta empresa
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Asocia el paciente a una empresa para aplicar precios preferenciales
                </p>
              )}
            </div>

            {/* Sección: Dirección */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Dirección</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección completa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Av. Principal 123, Dpto 4B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distrito/Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Miraflores"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Lima"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Tipo de Sangre */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-gray-900">Tipo de Sangre</h4>
              </div>
              <select
                value={formData.bloodTypeId}
                onChange={(e) => handleChange('bloodTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Seleccionar tipo de sangre</option>
                {BLOOD_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Sección: Historial Médico */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-gray-900">Historial Médico</h4>
              </div>
              <div className="space-y-4">
                {/* Alergias */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      checked={formData.hasAllergies}
                      onChange={(e) => handleChange('hasAllergies', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ¿Tiene alergias?
                    </label>
                  </div>
                  {formData.hasAllergies && (
                    <textarea
                      value={formData.allergiesDescription}
                      onChange={(e) => handleChange('allergiesDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Describa las alergias (medicamentos, alimentos, etc.)"
                      rows={2}
                    />
                  )}
                </div>

                {/* Condiciones Crónicas */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasChronicDiseases"
                      checked={formData.hasChronicDiseases}
                      onChange={(e) => handleChange('hasChronicDiseases', e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="hasChronicDiseases" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Heart className="w-4 h-4 text-orange-600" />
                      ¿Tiene condiciones crónicas?
                    </label>
                  </div>
                  {formData.hasChronicDiseases && (
                    <textarea
                      value={formData.chronicDiseasesDescription}
                      onChange={(e) => handleChange('chronicDiseasesDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Describa las condiciones (diabetes, hipertensión, etc.)"
                      rows={2}
                    />
                  )}
                </div>

                {/* Medicamentos */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasMedications"
                      checked={formData.hasMedications}
                      onChange={(e) => handleChange('hasMedications', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hasMedications" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Pill className="w-4 h-4 text-blue-600" />
                      ¿Toma medicamentos actualmente?
                    </label>
                  </div>
                  {formData.hasMedications && (
                    <textarea
                      value={formData.currentMedications}
                      onChange={(e) => handleChange('currentMedications', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Liste los medicamentos que toma actualmente"
                      rows={2}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Contacto de Emergencia */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Contacto de Emergencia</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="987654321"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relación
                    </label>
                    <select
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Seleccionar relación</option>
                      {RELATIONSHIPS.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || isLoadingData}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Completar Información
              </>
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
