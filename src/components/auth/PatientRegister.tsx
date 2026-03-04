import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Phone,
  User,
  CreditCard,
  Eye,
  EyeOff,
  ArrowLeft,
  Calendar,
  Building2,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import { ApiAuthService, type RegisterPatientData } from '@/services/api/authService';
import { companiesApi } from '@/services/api/companiesApi';

interface PatientRegisterFormData {
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  ruc: string;
}

interface CompanySearchResult {
  company_id: number;
  company_name: string;
  ruc: string;
  vigencia_status: 'vigente' | 'vencida' | 'no_vigencia' | 'inactive';
}

interface PatientRegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (email: string, password: string, redirectPath?: string) => void;
  redirectPath?: string;
  promoCode?: string;
}

const PatientRegister = ({ onBackToLogin, onRegisterSuccess, redirectPath, promoCode }: PatientRegisterProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyResult, setCompanyResult] = useState<CompanySearchResult | null>(null);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [companySearched, setCompanySearched] = useState(false);
  const [formData, setFormData] = useState<PatientRegisterFormData>({
    dni: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    ruc: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permite números y máximo 8 caracteres
    if (value === '' || /^\d{0,8}$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        dni: value
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permite numeros y maximo 9 caracteres
    if (value === '' || /^\d{0,9}$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        phone: value
      }));
    }
  };

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setFormData(prev => ({ ...prev, ruc: value }));
      if (value.length < 11) {
        setCompanyResult(null);
        setCompanySearched(false);
      }
    }
  };

  const handleSearchCompany = async () => {
    if (formData.ruc.length !== 11) {
      toast.error('El RUC debe tener 11 digitos');
      return;
    }

    try {
      setSearchingCompany(true);
      const response = await companiesApi.getCompanyByRuc(formData.ruc);
      if (response.success && response.data) {
        setCompanyResult(response.data);
      } else {
        setCompanyResult(null);
      }
    } catch {
      setCompanyResult(null);
    } finally {
      setSearchingCompany(false);
      setCompanySearched(true);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.dni.trim()) {
      toast.error('El DNI es obligatorio');
      return false;
    }
    if (!/^\d+$/.test(formData.dni)) {
      toast.error('El DNI debe contener solo números');
      return false;
    }
    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener exactamente 8 dígitos');
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
    if (!formData.phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!/^\d+$/.test(formData.phone)) {
      toast.error('El teléfono debe contener solo números');
      return false;
    }
    if (formData.phone.length !== 9) {
      toast.error('El teléfono debe tener exactamente 9 dígitos');
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
    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
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
      // Preparar datos para el API
      const registerData: RegisterPatientData = {
        branch_id: 1, // ID de sucursal por defecto (debe ajustarse segun configuracion)
        identification_type_id: 1, // DNI por defecto (ajustar segun tipo)
        identification_number: formData.dni.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_date: formData.birthDate,
        email: formData.email.trim(),
        mobile: formData.phone.trim(),
        password: formData.password,
        country: 'Colombia',
        ...(companyResult && companyResult.vigencia_status === 'vigente' ? { company_id: companyResult.company_id } : {})
      };

      // Llamar al API de registro
      const response = await ApiAuthService.registerPatient(registerData);

      if (!response.success) {
        toast.error(response.message || 'Error al registrar la cuenta');
        setIsLoading(false);
        return;
      }

      // Mostrar mensaje de éxito
      toast.success(response.message || '¡Registro exitoso! Bienvenido a MyDent');

      // Construir la ruta de redirección con el código de promoción si existe
      let finalRedirectPath = redirectPath;
      if (redirectPath && promoCode) {
        finalRedirectPath = `${redirectPath}?promo=${promoCode}`;
      }

      // Auto-login después del registro exitoso
      onRegisterSuccess(formData.email, formData.password, finalRedirectPath);

    } catch (error) {
      toast.error('Error al registrar la cuenta. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Paciente</h1>
            <p className="text-gray-600 mt-2">
              Crea tu cuenta para acceder al portal de pacientes
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Información importante:</p>
              <p className="text-xs">
                Este registro te permitirá acceder al portal de pacientes.
                Durante tu primera consulta, el personal completará tu información médica.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="w-4 h-4 inline mr-1" />
                DNI *
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleDniChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678"
                maxLength={8}
                inputMode="numeric"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Carlos"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pérez González"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="987654321"
                maxLength={9}
                inputMode="numeric"
                required
              />
            </div>

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={formatDateToYMD(new Date())}
                required
              />
            </div>

            {/* Empresa (RUC) - Opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                RUC de Empresa <span className="text-xs text-gray-500">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.ruc}
                  onChange={handleRucChange}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20123456789"
                  maxLength={11}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={handleSearchCompany}
                  disabled={formData.ruc.length !== 11 || searchingCompany}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {searchingCompany ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              {companySearched && companyResult && companyResult.vigencia_status === 'vigente' && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800">{companyResult.company_name}</span>
                </div>
              )}
              {companySearched && companyResult && companyResult.vigencia_status === 'vencida' && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800">Convenio vencido: {companyResult.company_name}</span>
                </div>
              )}
              {companySearched && !companyResult && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">No se encontro empresa con ese RUC</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Correo Electronico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ejemplo@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirma tu contraseña"
                  minLength={8}
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

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </button>
          </div>

          {/* Terms */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>
              Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientRegister;