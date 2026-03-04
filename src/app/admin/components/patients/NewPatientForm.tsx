import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Patient, Company } from '@/types';
import { CreditCard, User, Phone, Mail, Eye, EyeOff, UserPlus, Building2 } from 'lucide-react';
import { formatDateToYMD } from '@/utils/dateUtils';
// INTEGRACIÓN API REAL
import { PatientApiService } from '../../services/patientApiService';
import { patientsApi } from '@/services/api/patientsApi';

interface NewPatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const NewPatientForm = ({ onSuccess, onCancel }: NewPatientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    dni: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyId: '',
    gender: 'M' as 'M' | 'F' | 'O',
    birthDate: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // INTEGRACIÓN API REAL: Cargar empresas desde el backend
      const allCompanies = await PatientApiService.loadCompanies();
      const activeCompanies = allCompanies.filter((c: any) => c.is_active !== false);
      setCompanies(activeCompanies as Company[]);
    } catch (error) {
      toast.error('Error al cargar empresas');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si se cambia el DNI, autocompletar contraseña y confirmación
    if (name === 'dni') {
      setFormData(prev => ({
        ...prev,
        dni: value,
        password: value,
        confirmPassword: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.dni.trim()) {
      toast.error('El DNI es obligatorio');
      return false;
    }
    if (formData.dni.length !== 8 || !/^\d+$/.test(formData.dni)) {
      toast.error('El DNI debe tener 8 dígitos');
      return false;
    }
    if (!formData.firstName.trim()) {
      toast.error('El nombre es obligatorio');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('El apellido es obligatorio');
      return false;
    }
    if (!formData.birthDate.trim()) {
      toast.error('La fecha de nacimiento es obligatoria');
      return false;
    }

    // Validar que la fecha de nacimiento no sea futura
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    if (birthDate > today) {
      toast.error('La fecha de nacimiento no puede ser futura');
      return false;
    }

    // Validar edad mínima (por ejemplo, al menos 1 año)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 150) {
      toast.error('La fecha de nacimiento no es válida');
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (formData.phone.length !== 9 || !/^\d+$/.test(formData.phone)) {
      toast.error('El teléfono debe tener 9 dígitos');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('El email no tiene un formato válido');
      return false;
    }

    if (!formData.password.trim()) {
      toast.error('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // VALIDACIÓN PREVENTIVA: Verificar duplicados antes de crear
      const duplicateCheck = await patientsApi.checkDuplicates(
        formData.dni.trim(),
        formData.email.trim()
      );

      if (duplicateCheck.dniExists || duplicateCheck.emailExists) {
        const errors = [];
        if (duplicateCheck.dniExists) {
          const patient = duplicateCheck.existingPatients.find(
            p => p.identification_number === formData.dni.trim()
          );
          errors.push(`DNI ${formData.dni} ya está registrado (${patient?.first_name} ${patient?.last_name})`);
        }
        if (duplicateCheck.emailExists) {
          const patient = duplicateCheck.existingPatients.find(
            p => p.email?.toLowerCase() === formData.email.trim().toLowerCase()
          );
          errors.push(`Email ${formData.email} ya está registrado (${patient?.first_name} ${patient?.last_name})`);
        }

        toast.error(
          <div>
            <p className="font-semibold">No se puede crear el paciente</p>
            {errors.map((error, index) => (
              <p key={index} className="text-sm mt-1">• {error}</p>
            ))}
          </div>
        );
        setIsLoading(false);
        return;
      }

      // INTEGRACIÓN API REAL: Crear paciente en el backend
      const newPatient: any = {
        id: '', // Se generará en el backend
        dni: formData.dni.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        birthDate: new Date(formData.birthDate), // Fecha real del formulario
        gender: formData.gender, // Género seleccionado en el formulario
        password: formData.password.trim(), // Contraseña personalizada para el usuario
        address: '',
        district: '',
        province: '',
        department: '',
        occupation: '',
        emergencyContact: '',
        emergencyPhone: '',
        allergies: '',
        chronicDiseases: '',
        currentMedications: '',
        insuranceCompany: '',
        insurancePolicyNumber: '',
        companyId: formData.companyId || undefined,
        ruc: '',
        businessName: '',
        referralSource: '',
        notes: '',
        photoUrl: '',
        esClienteNuevo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // NOTA: NO se asigna branch_id. Los pacientes pueden ser atendidos en cualquier sede.
      const createdPatient = await PatientApiService.createPatient(newPatient);

      toast.success('Paciente creado exitosamente. Puede ser atendido en cualquier sede.');

      // Mostrar warnings si el backend reporto suspension de plan
      if (createdPatient && (createdPatient as any).warnings) {
        const warnings = (createdPatient as any).warnings;
        if (Array.isArray(warnings) && warnings.length > 0) {
          warnings.forEach((w: string) => toast.warning(w));
        }
      }

      onSuccess();

    } catch (error: any) {
      console.error('[NewPatientForm] Error al crear paciente:', error);

      // Manejar errores específicos del backend
      if (error.response?.status === 409) {
        // Error 409: Conflicto (duplicado)
        const errorData = error.response?.data;
        const errorMessage = errorData?.error || 'Ya existe un paciente con este DNI o email';

        toast.error(
          <div>
            <p className="font-semibold">No se puede crear el paciente</p>
            <p className="text-sm mt-1">{errorMessage}</p>
            {errorData?.details?.existingPatient && (
              <p className="text-xs mt-1 text-gray-600">
                Paciente existente: {errorData.details.existingPatient.name} ({errorData.details.existingPatient.status})
              </p>
            )}
          </div>
        );
      } else if (error.response?.status === 400) {
        // Error 400: Validación
        toast.error(error.response?.data?.error || 'Faltan campos obligatorios');
      } else if (error.message?.includes('duplicate') || error.message?.includes('existe')) {
        toast.error('Ya existe un paciente con este DNI o email');
      } else if (error.message?.includes('required') || error.message?.includes('requerido')) {
        toast.error('Faltan campos obligatorios');
      } else {
        toast.error('Error al crear el paciente: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Información importante:</p>
          <p className="text-xs">
            Este registro creará una cuenta de paciente que podrá ser atendido en cualquier sede.
            Durante la primera consulta, el personal completará la información médica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DNI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <CreditCard className="w-4 h-4 inline mr-1" />
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleInputChange}
            maxLength={8}
            pattern="[0-9]{8}"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="12345678"
            required
          />
        </div>

        {/* Company Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building2 className="w-4 h-4 inline mr-1" />
            Empresa (Opcional)
          </label>
          <select
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
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
          {companies.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No hay empresas activas. Crea una empresa primero en el módulo de Empresas.
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombres <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Juan Carlos"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Pérez González"
            required
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            Fecha de Nacimiento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            max={formatDateToYMD(new Date())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            Género <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
            required
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="w-4 h-4 inline mr-1" />
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            maxLength={9}
            pattern="[0-9]{9}"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="987654321"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            Correo Electrónico <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="ejemplo@email.com"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              minLength={6}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Se autocompleta con el DNI"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Por defecto se usa el DNI como contraseña</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              minLength={6}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Se autocompleta con el DNI"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Creando...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Crear Paciente
            </>
          )}
        </button>
      </div>
    </form>
  );
};
