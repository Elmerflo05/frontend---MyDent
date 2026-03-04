import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Phone, Mail, Clock, User } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import type { BranchData } from '@/services/api/branchesApi';
import { usersApi, type UserData } from '@/services/api/usersApi';

interface SedeFormModalProps {
  branch: BranchData | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: () => void;
}

const DEPARTAMENTOS = [
  'Amazonas', 'Ancash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca',
  'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín',
  'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua',
  'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
];

// Formatear teléfono móvil: 9XX XXX XXX (9 dígitos, empieza con 9)
const formatMobilePhone = (value: string): string => {
  // Eliminar todo excepto números
  let digits = value.replace(/\D/g, '');

  // Si el primer dígito no es 9 y hay dígitos, forzar que empiece con 9
  if (digits.length > 0 && digits[0] !== '9') {
    digits = '9' + digits.slice(1);
  }

  // Limitar a 9 dígitos
  digits = digits.slice(0, 9);

  // Aplicar formato: 9XX XXX XXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
};

// Formatear teléfono fijo: (01) XXX XXXX (prefijo 01 + 7 dígitos)
const formatLandlinePhone = (value: string): string => {
  // Eliminar todo excepto números
  let digits = value.replace(/\D/g, '');

  // Si empieza con 01, quitarlo para procesamiento
  if (digits.startsWith('01')) {
    digits = digits.slice(2);
  }

  // Limitar a 7 dígitos (después del 01)
  digits = digits.slice(0, 7);

  // Aplicar formato: (01) XXX XXXX
  if (digits.length === 0) {
    return '(01) ';
  } else if (digits.length <= 3) {
    return `(01) ${digits}`;
  } else {
    return `(01) ${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
};

export default function SedeFormModal({ branch, mode, onClose, onSave }: SedeFormModalProps) {
  const { createBranch, updateBranch } = useBranches();

  const [formData, setFormData] = useState<BranchData>({
    branch_name: '',
    branch_code: '',
    address: '',
    city: '',
    state: '',
    department: '',
    country: 'Peru',
    postal_code: '',
    phone: '(01) ',
    mobile: '',
    email: '',
    manager_name: '',
    manager_phone: '',
    opening_hours: '',
    is_main_office: false,
    status: 'active',
    notes: '',
    latitude: undefined,
    longitude: undefined,
    administrator_id: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availableAdministrators, setAvailableAdministrators] = useState<UserData[]>([]);

  useEffect(() => {
    if (branch && mode === 'edit') {
      setFormData({
        ...branch,
        // Formatear los teléfonos al cargar datos existentes
        phone: branch.phone ? formatLandlinePhone(branch.phone) : '(01) ',
        mobile: branch.mobile ? formatMobilePhone(branch.mobile) : ''
      });
    }
  }, [branch, mode]);

  useEffect(() => {
    const loadAvailableAdministrators = async () => {
      try {
        const excludeBranchId = mode === 'edit' && branch?.branch_id ? branch.branch_id : undefined;
        const administrators = await usersApi.getAvailableAdministrators(excludeBranchId);
        setAvailableAdministrators(administrators);
      } catch (error) {
        console.error('Error al cargar administradores:', error);
      }
    };

    loadAvailableAdministrators();
  }, [mode, branch?.branch_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      let processedValue = value;

      // Aplicar formateo específico para teléfonos
      if (name === 'mobile') {
        processedValue = formatMobilePhone(value);
      } else if (name === 'phone') {
        processedValue = formatLandlinePhone(value);
      }

      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.branch_name?.trim()) {
      newErrors.branch_name = 'El nombre es requerido';
    }

    if (mode === 'create' && !formData.branch_code?.trim()) {
      newErrors.branch_code = 'El código es requerido';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'El departamento es requerido';
    }

    // Validar teléfono fijo: (01) XXX XXXX - debe tener 7 dígitos después del 01
    const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
    const phoneLandlineDigits = phoneDigits.startsWith('01') ? phoneDigits.slice(2) : phoneDigits;
    if (!formData.phone?.trim() || formData.phone === '(01) ') {
      newErrors.phone = 'El teléfono fijo es requerido';
    } else if (phoneLandlineDigits.length !== 7) {
      newErrors.phone = 'El teléfono fijo debe tener 7 dígitos después del (01)';
    }

    // Validar teléfono móvil: 9XX XXX XXX - debe tener 9 dígitos y empezar con 9
    if (formData.mobile) {
      const mobileDigits = formData.mobile.replace(/\D/g, '');
      if (mobileDigits.length !== 9) {
        newErrors.mobile = 'El teléfono móvil debe tener 9 dígitos';
      } else if (mobileDigits[0] !== '9') {
        newErrors.mobile = 'El teléfono móvil debe empezar con 9';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let success = false;

      if (mode === 'create') {
        success = await createBranch(formData);
      } else if (branch?.branch_id) {
        success = await updateBranch(branch.branch_id, formData);
      }

      if (success) {
        onSave();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenido del modal */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                {mode === 'create' ? 'Nueva Sede' : 'Editar Sede'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Sede *
                  </label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData.branch_name || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.branch_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Sede Principal"
                  />
                  {errors.branch_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Sede *
                  </label>
                  <input
                    type="text"
                    name="branch_code"
                    value={formData.branch_code || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.branch_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: SEDE-001"
                    disabled={mode === 'edit'}
                  />
                  {errors.branch_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch_code}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_main_office"
                      checked={formData.is_main_office || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Marcar como Sede Principal</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Av. Principal 123"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Lima"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento *
                    </label>
                    <select
                      name="department"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar...</option>
                      {DEPARTAMENTOS.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: 15001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Teléfono Fijo *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(01) 234 5678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="987 654 321"
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: sede@clinica.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Administrador de Sede */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Administrador de la Sede
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Administrador
                </label>
                <select
                  name="administrator_id"
                  value={formData.administrator_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin administrador asignado</option>
                  {availableAdministrators.map(admin => (
                    <option key={admin.user_id} value={admin.user_id}>
                      {admin.full_name || `${admin.first_name} ${admin.last_name}`}
                      {admin.email && ` (${admin.email})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Solo se muestran administradores sin sede asignada. Los campos de nombre y teléfono del encargado se actualizarán automáticamente.
                </p>
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horarios
                </label>
                <input
                  type="text"
                  name="opening_hours"
                  value={formData.opening_hours || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Lun-Vie: 8:00-18:00, Sáb: 9:00-13:00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese los horarios de atención de la sede
                </p>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas / Observaciones
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre la sede..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Crear Sede' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
