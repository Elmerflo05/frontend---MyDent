import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  User,
  Users as UsersIcon,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { patientsApi } from '@/services/api/patientsApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Patient, Company } from '@/types';
import { PatientApiService } from '../services/patientApiService';

interface CompletePatientFormData {
  // Información básica (ya registrada)
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Información adicional a completar
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  address: string;
  bloodType: string;

  // Empresa
  companyId: string;

  // Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const CreatePatientPage = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [formData, setFormData] = useState<CompletePatientFormData>({
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'M',
    address: '',
    bloodType: '',
    companyId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  // Cargar paciente si estamos editando
  useEffect(() => {
    if (patientId) {
      loadPatient(patientId);
      setIsEditing(true);
    }
  }, [patientId]);

  const loadPatient = async (id: string) => {
    try {
      // Cargar paciente y empresas en paralelo
      const [response, loadedCompanies] = await Promise.all([
        patientsApi.getPatientById(parseInt(id)),
        PatientApiService.loadCompanies().catch(() => [] as Company[])
      ]);
      setCompanies(loadedCompanies);
      const patientData = response.data;

      if (patientData) {
        // Mapear gender_id a código de género
        const getGenderFromId = (genderId?: number): 'M' | 'F' | 'O' => {
          switch (genderId) {
            case 1: return 'M';  // Masculino
            case 2: return 'F';  // Femenino
            case 3: return 'O';  // Otro
            default: return 'M';
          }
        };

        // Map backend format to frontend format
        const mappedPatient: Patient = {
          id: patientData.patient_id?.toString() || '',
          dni: patientData.identification_number || '',  // Corregido: era 'identification'
          firstName: patientData.first_name || '',
          lastName: patientData.last_name || '',
          email: patientData.email || '',
          phone: patientData.mobile || patientData.phone || '',  // Usar 'mobile' primero
          birthDate: patientData.birth_date ? new Date(patientData.birth_date) : new Date(),
          gender: getGenderFromId(patientData.gender_id),  // Corregido: usar gender_id
          address: patientData.address || '',
          medicalHistory: {
            bloodType: patientData.blood_type_name || '',  // Corregido: era 'blood_type'
            allergies: [],
            conditions: [],
            medications: []
          },
          emergencyContact: {
            name: patientData.emergency_contact_name || '',
            phone: patientData.emergency_contact_phone || '',
            relationship: patientData.emergency_contact_relationship || ''
          },
          registrationDate: patientData.registration_date ? new Date(patientData.registration_date) : new Date(),
          isActive: patientData.is_active !== false
        };

        setPatient(mappedPatient);
        setFormData({
          dni: mappedPatient.dni,
          firstName: mappedPatient.firstName,
          lastName: mappedPatient.lastName,
          email: mappedPatient.email,
          phone: mappedPatient.phone,
          birthDate: mappedPatient.birthDate ? formatDateToYMD(new Date(mappedPatient.birthDate)) : '',
          gender: mappedPatient.gender,
          address: mappedPatient.address || '',
          bloodType: mappedPatient.medicalHistory?.bloodType || '',
          companyId: patientData.company_id?.toString() || '',
          emergencyContactName: mappedPatient.emergencyContact?.name || '',
          emergencyContactPhone: mappedPatient.emergencyContact?.phone || '',
          emergencyContactRelationship: mappedPatient.emergencyContact?.relationship || ''
        });

      } else {
        toast.error('Paciente no encontrado');
        const currentPath = window.location.pathname;
        if (currentPath.includes('/clinic/')) {
          navigate('/clinic/patients');
        } else {
          navigate('/admin/patients');
        }
      }
    } catch (error) {
      toast.error('Error al cargar la información del paciente');
      const currentPath = window.location.pathname;
      if (currentPath.includes('/clinic/')) {
        navigate('/clinic/patients');
      } else {
        navigate('/admin/patients');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getBloodTypeId = (bloodType: string): number | null => {
    const bloodTypeMap: Record<string, number> = {
      'A+': 1, 'A-': 2,
      'B+': 3, 'B-': 4,
      'AB+': 5, 'AB-': 6,
      'O+': 7, 'O-': 8
    };
    return bloodTypeMap[bloodType] || null;
  };

  const validateForm = (): boolean => {
    if (!formData.dni.trim()) {
      toast.error('El DNI es obligatorio');
      return false;
    }
    if (!formData.firstName.trim()) {
      toast.error('Los nombres son obligatorios');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!formData.birthDate) {
      toast.error('La fecha de nacimiento es obligatoria');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('La dirección es obligatoria');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const updatedPatientData = {
        // Información básica editable
        identification_number: formData.dni.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        // Empresa (0 = desasociar empresa, backend convierte a NULL via NULLIF)
        company_id: formData.companyId ? parseInt(formData.companyId) : 0,
        // Información personal
        birth_date: formData.birthDate,
        gender_id: formData.gender === 'M' ? 1 : formData.gender === 'F' ? 2 : 3,
        address: formData.address.trim(),
        blood_type_id: getBloodTypeId(formData.bloodType),
        // Contacto de emergencia
        emergency_contact_name: formData.emergencyContactName.trim() || null,
        emergency_contact_phone: formData.emergencyContactPhone.trim() || null,
        emergency_contact_relationship: formData.emergencyContactRelationship.trim() || null
      };

      if (patientId) {
        // Actualizar paciente usando la API
        await patientsApi.updatePatient(parseInt(patientId), updatedPatientData);
        toast.success('Información del paciente actualizada exitosamente');
      }

      // Navegar de vuelta según el portal desde donde se accedió
      const currentPath = window.location.pathname;
      if (currentPath.includes('/clinic/')) {
        navigate('/clinic/patients');
      } else {
        navigate('/admin/patients');
      }

    } catch (error: any) {
      console.error('Error al actualizar paciente:', error);
      toast.error(error.message || 'Error al actualizar la información del paciente');
    } finally {
      setIsLoading(false);
    }
  };

  if (!patientId) {
    // Si no hay ID, redirigir a la lista correspondiente
    const currentPath = window.location.pathname;
    if (currentPath.includes('/clinic/')) {
      navigate('/clinic/patients');
    } else {
      navigate('/admin/patients');
    }
    return null;
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const age = calculateAge(formData.birthDate);

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              const currentPath = window.location.pathname;
              if (currentPath.includes('/clinic/')) {
                navigate('/clinic/patients');
              } else {
                navigate('/admin/patients');
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Completar Información del Paciente
            </h1>
            <p className="text-gray-600">
              Complete toda la información médica necesaria durante la consulta
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Basic Info Card - Editable */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Empresa (Opcional) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Empresa (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa asociada
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin empresa (particular)</option>
                  {companies.length === 0 ? (
                    <option value="" disabled>No hay empresas activas disponibles</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.nombre} {company.ruc ? `(RUC: ${company.ruc})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex items-end">
                {formData.companyId ? (
                  <p className="text-sm text-indigo-600">
                    El paciente accederá a los precios corporativos de esta empresa
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Asocia el paciente a una empresa para aplicar precios preferenciales
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información Personal Adicional */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal Completa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <input
                  type="text"
                  value={age > 0 ? `${age} años` : ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Sangre
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Av. Principal 123, Lima, Perú"
                rows={2}
                required
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Contacto de Emergencia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="María González"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="987654321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relación
                </label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Madre, Esposa, Hermano..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/clinic/')) {
                  navigate('/clinic/patients');
                } else {
                  navigate('/admin/patients');
                }
              }}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Completar Información
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePatientPage;