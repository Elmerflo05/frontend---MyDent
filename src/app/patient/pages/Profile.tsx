import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  AlertTriangle,
  CreditCard,
  Loader2,
  Lock,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { patientPortalApi, PatientProfile as PatientProfileType, MedicalBackground } from '@/services/api/patientPortalApi';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';

interface ProfileData {
  dni: string;
  firstName: string;
  lastName: string;
  mobile: string;
  birthDate: string;
  email: string;
  medicalInfo: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

const PatientProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    dni: '',
    firstName: '',
    lastName: '',
    mobile: '',
    birthDate: '',
    email: '',
    medicalInfo: {
      allergies: [],
      medications: [],
      conditions: []
    }
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const mapApiToProfileData = (profile: PatientProfileType, medicalBackground: MedicalBackground | null): ProfileData => {
    const allergies: string[] = [];
    const medications: string[] = [];
    const conditions: string[] = [];

    if (medicalBackground) {
      // Alergias
      if (medicalBackground.has_allergies && medicalBackground.allergies_description) {
        allergies.push(...medicalBackground.allergies_description.split(',').map(s => s.trim()).filter(Boolean));
      }

      // Medicamentos actuales
      if (medicalBackground.has_medications && medicalBackground.current_medications) {
        medications.push(...medicalBackground.current_medications.split(',').map(s => s.trim()).filter(Boolean));
      }

      // Enfermedades crónicas
      if (medicalBackground.has_chronic_diseases && medicalBackground.chronic_diseases_description) {
        conditions.push(...medicalBackground.chronic_diseases_description.split(',').map(s => s.trim()).filter(Boolean));
      }

      // Condiciones específicas
      if (medicalBackground.has_hypertension) conditions.push('Hipertensión');
      if (medicalBackground.has_diabetes) conditions.push('Diabetes');
      if (medicalBackground.has_heart_disease) conditions.push('Enfermedad cardíaca');

      // Antecedentes patológicos
      if (medicalBackground.pathological_background && Array.isArray(medicalBackground.pathological_background)) {
        medicalBackground.pathological_background.forEach((item: string) => {
          if (item && typeof item === 'string' && item.trim()) {
            conditions.push(item.trim());
          }
        });
      }
    }

    return {
      dni: profile.identification_number || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      mobile: profile.mobile || '',
      birthDate: profile.birth_date ? profile.birth_date.split('T')[0] : '',
      email: profile.email || '',
      medicalInfo: {
        allergies: [...new Set(allergies)],
        medications: [...new Set(medications)],
        conditions: [...new Set(conditions)]
      }
    };
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalApi.getMyProfile();
      if (response.success && response.data) {
        const mappedData = mapApiToProfileData(response.data.profile, response.data.medical_background);
        setProfileData(mappedData);
      }
    } catch (error: any) {
      console.error('Error cargando perfil:', error);
      toast.error(error.message || 'Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
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
        {/* Datos Personales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Información personal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DNI</label>
              <div className="text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                {profileData.dni}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
              <div className="text-gray-900">{profileData.firstName}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
              <div className="text-gray-900">{profileData.lastName}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <div className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                {profileData.mobile}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
              <div className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                {profileData.birthDate ? new Date(profileData.birthDate).toLocaleDateString('es-ES') : ''}
                {profileData.birthDate && (
                  <span className="text-sm text-gray-500">({calculateAge(profileData.birthDate)} años)</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {profileData.email}
              </div>
            </div>
          </div>
        </div>

        {/* Información Médica */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Información Médica
          </h2>

          {profileData.medicalInfo.allergies.length === 0 &&
           profileData.medicalInfo.medications.length === 0 &&
           profileData.medicalInfo.conditions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                No tienes antecedentes médicos registrados. Esta información se actualizará
                cuando el doctor complete tu atención integral.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alergias */}
              <div>
                <label className="text-sm font-medium text-gray-700">Alergias</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.medicalInfo.allergies.length > 0 ? (
                    profileData.medicalInfo.allergies.map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Sin alergias registradas</span>
                  )}
                </div>
              </div>

              {/* Medicamentos */}
              <div>
                <label className="text-sm font-medium text-gray-700">Medicamentos Actuales</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.medicalInfo.medications.length > 0 ? (
                    profileData.medicalInfo.medications.map((medication, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {medication}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Sin medicamentos registrados</span>
                  )}
                </div>
              </div>

              {/* Condiciones */}
              <div>
                <label className="text-sm font-medium text-gray-700">Condiciones Médicas</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.medicalInfo.conditions.length > 0 ? (
                    profileData.medicalInfo.conditions.map((condition, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {condition}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Sin condiciones médicas registradas</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
              <p className="text-sm text-gray-600">Gestiona el acceso a tu cuenta</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                <KeyRound className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Contraseña</p>
                <p className="text-xs text-gray-500">Cámbiala periódicamente para mantener tu cuenta protegida</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex-shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </motion.div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default PatientProfile;
