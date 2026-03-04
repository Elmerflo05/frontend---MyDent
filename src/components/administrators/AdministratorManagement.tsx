import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  Building,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  Save,
  AlertCircle,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import useAdministratorStore from '@/store/administratorStore';
import useSedeStore from '@/store/sedeStore';
import { useAuthStore } from '@/store/authStore';

interface AdministratorManagementProps {
  showCreateModal?: boolean;
  onModalClose?: () => void;
}

const AdministratorManagement: React.FC<AdministratorManagementProps> = ({
  showCreateModal = false,
  onModalClose
}) => {
  const { user } = useAuthStore();
  const {
    administrators,
    loading: adminLoading,
    error: adminError,
    obtenerAdministradores,
    crearAdministrador,
    actualizarAdministrador,
    eliminarAdministrador,
    buscarAdministradores,
    initializeAdministrators,
    limpiarError
  } = useAdministratorStore();

  const {
    obtenerSedesActivas,
    obtenerSedesSinAdministrador,
    cargarSedesDesdeDB
  } = useSedeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSede, setSelectedSede] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(showCreateModal);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    sedeId: '',
    status: 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Control de permisos
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const canManageAdmins = isSuperAdmin || isAdmin;

  // Inicializar datos (administradores y sedes)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar administradores y sedes en paralelo
        await Promise.all([
          initializeAdministrators(),
          cargarSedesDesdeDB()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setShowModal(showCreateModal);
  }, [showCreateModal]);

  // Obtener datos necesarios
  const sedesActivas = obtenerSedesActivas();
  const sedesSinAdministrador = obtenerSedesSinAdministrador();

  // Filtrar administradores
  const filteredAdministrators = buscarAdministradores({
    searchTerm,
    sedeId: selectedSede,
    status: selectedStatus
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Para teléfono: solo permitir números y máximo 9 dígitos
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (formData.phone.length !== 9) {
      newErrors.phone = 'El teléfono debe tener exactamente 9 dígitos';
    }

    if (!editingAdmin && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (!editingAdmin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      sedeId: '',
      status: 'active'
    });
    setErrors({});
    setEditingAdmin(null);
    setShowPassword(false);
  };

  const handleCreate = () => {
    setEditingAdmin(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.profile.firstName,
      lastName: admin.profile.lastName,
      email: admin.email,
      phone: admin.profile.phone,
      password: '',
      confirmPassword: '',
      sedeId: admin.sedeId || '',
      status: admin.status
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const adminData = {
      email: formData.email,
      password: formData.password,
      status: formData.status,
      sedeId: formData.sedeId || null,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      }
    };

    try {
      let resultado;

      if (editingAdmin) {
        // ✅ Actualizar administrador via API (async)
        resultado = await actualizarAdministrador(editingAdmin.id, adminData);
      } else {
        // ✅ Crear administrador via API (async)
        resultado = await crearAdministrador(adminData);
      }

      if (resultado.success) {
        toast.success(
          editingAdmin
            ? 'Administrador actualizado exitosamente'
            : 'Administrador creado exitosamente'
        );
        // Recargar lista de administradores desde BD
        await initializeAdministrators();
        handleCloseModal();
      } else {
        toast.error(resultado.error || 'Error al procesar administrador');
      }
    } catch (error) {
      toast.error('Error inesperado al procesar administrador');
    }
  };

  const handleDelete = async (adminId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
      // ✅ Eliminar administrador via API (async)
      const resultado = await eliminarAdministrador(adminId);

      if (resultado.success) {
        toast.success('Administrador eliminado exitosamente');
        // Recargar lista de administradores desde BD
        await initializeAdministrators();
      } else {
        toast.error(resultado.error || 'Error al eliminar administrador');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    if (onModalClose) {
      onModalClose();
    }
  };

  const getStatusBadge = (status: string, sedeId: string | null) => {
    // ✅ Si no tiene sede, mostrar "Pendiente asignación"
    if (!sedeId) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          Pendiente asignación
        </span>
      );
    }

    const configs = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
      inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700' },
      suspended: { label: 'Suspendido', className: 'bg-red-100 text-red-700' }
    };

    const config = configs[status as keyof typeof configs] || configs.inactive;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getSedeInfo = (admin: any) => {
    // ✅ Si no tiene sede, mostrar distintivo especial
    if (!admin.sedeId) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 text-sm font-medium">
            Sin sede asignada
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
              Pendiente
            </span>
          </span>
        </div>
      );
    }

    // ✅ Usar sedeName directamente desde el backend si está disponible
    if (admin.sedeName) {
      return (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-900">{admin.sedeName}</span>
        </div>
      );
    }

    // Fallback: Si no hay sedeName, buscar en sedesActivas (compatibilidad)
    const sede = sedesActivas.find(s => s.id === admin.sedeId);
    return sede ? (
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-900">{sede.nombre}</span>
        <span className="text-xs text-gray-500">({sede.ciudad})</span>
      </div>
    ) : (
      <span className="text-red-500 text-sm">Sede no encontrada</span>
    );
  };

  if (!canManageAdmins) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-600">
              Solo los administradores pueden gestionar personal.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            Gestión de Administradores
          </h1>
          <p className="text-gray-600 mt-1">Administra los usuarios administradores del sistema</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Administrador
        </motion.button>
      </div>

      {/* Alertas */}
      {adminError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{adminError}</span>
          <button
            onClick={limpiarError}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las Sedes</option>
              <option value="">Sin Sede Asignada</option>
              {sedesActivas.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Administradores */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sede Asignada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdministrators.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.profile.firstName} {admin.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSedeInfo(admin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {admin.profile.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {admin.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(admin.status, admin.sedeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdministrators.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay administradores</h3>
            <p className="text-gray-600">
              {searchTerm || selectedSede !== 'all' || selectedStatus !== 'all'
                ? 'No se encontraron administradores con los filtros aplicados'
                : 'Comienza creando el primer administrador'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Creación/Edición */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6" />
                  <h2 className="text-xl font-bold">
                    {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: María"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: González"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: admin@clinica.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: 999123456"
                        maxLength={9}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credenciales */}
                {!editingAdmin && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Credenciales de Acceso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contraseña *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Mínimo 8 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmar Contraseña *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Repetir contraseña"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Asignación de Sede */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignación y Estado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sede Asignada
                      </label>
                      <select
                        name="sedeId"
                        value={formData.sedeId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sin sede asignada</option>
                        {(editingAdmin ? sedesActivas : sedesSinAdministrador).map((sede) => (
                          <option key={sede.id} value={sede.id}>
                            {sede.nombre} - {sede.ciudad}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {editingAdmin
                          ? 'Puede cambiar la sede asignada'
                          : 'Solo se muestran sedes sin administrador'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={adminLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={adminLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {adminLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingAdmin ? 'Actualizar' : 'Crear'} Administrador
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default AdministratorManagement;