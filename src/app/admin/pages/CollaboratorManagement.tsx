import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSede } from '@/hooks/useSede';
import type { User, Sede } from '@/types';
import { usersApi, type CreateUserPayload } from '@/services/api/usersApi';

// Función simple de hash para desarrollo (debe coincidir con la del seeder)
function simpleHash(password: string): string {
  return `dev_hash_${password}`;
}

type CollaboratorRole = 'receptionist' | 'imaging_technician';

interface CollaboratorFormData {
  role: CollaboratorRole | '';
  sedeId: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
}

const CollaboratorManagement = () => {
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<CollaboratorRole | 'all'>('all');
  const [sedeFilter, setSedeFilter] = useState('all');

  const { sedesDisponibles, cargandoSedes } = useSede();

  const [formData, setFormData] = useState<CollaboratorFormData>({
    role: '',
    sedeId: '',
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CollaboratorFormData, string>>>({});

  useEffect(() => {
    loadCollaborators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [collaborators, searchTerm, roleFilter, sedeFilter]);

  const loadCollaborators = async () => {
    try {
      setIsLoading(true);

      const response = await usersApi.getUsers({ limit: 1000 });

      // 🔍 LOG: Ver todos los role_name que llegan de la API
      const rolesUnicos = [...new Set(response.data.map(u => u.role_name))];

      // Filtrar colaboradores (Recepcionistas y Técnicos de Imágenes)
      // ✅ Usar role_id (más confiable) además de role_name
      const colaboradoresFiltrados = response.data.filter(u => {
        const esRecepcionista = u.role_id === 4 || u.role_name === 'Recepcionista';
        const esTecnicoImagenes = u.role_id === 5 || u.role_name === 'Técnico de Imágenes';

        const esColaborador = esRecepcionista || esTecnicoImagenes;
        return esColaborador;
      });


      const collaboratorUsers: User[] = colaboradoresFiltrados
        .map(userData => {
          // ✅ Determinar rol usando role_id (más confiable)
          let role: 'receptionist' | 'imaging_technician';
          if (userData.role_id === 4 || userData.role_name === 'Recepcionista') {
            role = 'receptionist';
          } else {
            role = 'imaging_technician';
          }

          return {
          id: userData.user_id?.toString() || '',
          email: userData.email || '',
          role: role,
          status: userData.status || 'inactive',
          isActive: userData.status === 'active', // Mapear isActive desde status
          profile: {
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            dni: userData.profile?.dni || userData.dni || '', // Leer DNI desde profile.dni
            phone: userData.phone || '',
            address: userData.address,
            dateOfBirth: userData.date_of_birth ? new Date(userData.date_of_birth) : undefined,
            licenseNumber: userData.license_number,
            specialties: [],
            education: []
          },
          sedeId: userData.branch_id?.toString(),
          createdAt: new Date(userData.created_at || Date.now()),
          updatedAt: new Date(userData.updated_at || Date.now()),
          password: '' // No exponer contraseña
          } as User;
        });

      setCollaborators(collaboratorUsers);
    } catch (error) {
      toast.error('Error al cargar colaboradores');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...collaborators];

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.profile.firstName.toLowerCase().includes(term) ||
        c.profile.lastName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.profile.dni?.includes(term)
      );
    }

    // Filtro por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(c => c.role === roleFilter);
    }

    // Filtro por sede (técnicos de imágenes sin sede aparecen en todas)
    if (sedeFilter !== 'all') {
      filtered = filtered.filter(c => c.sedeId === sedeFilter || (c.role === 'imaging_technician' && !c.sedeId));
    }

    setFilteredCollaborators(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CollaboratorFormData, string>> = {};

    if (!formData.role) errors.role = 'Debe seleccionar un rol';
    // Sede obligatoria solo para recepcionista; opcional para técnico de imágenes
    if (!formData.sedeId && formData.role !== 'imaging_technician') errors.sedeId = 'Debe seleccionar una sede';
    if (!formData.firstName.trim()) errors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) errors.lastName = 'El apellido es requerido';

    if (!formData.dni.trim()) {
      errors.dni = 'El DNI es requerido';
    } else if (!/^\d{8}$/.test(formData.dni)) {
      errors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else if (!/^\d{9}$/.test(formData.phone)) {
      errors.phone = 'El teléfono debe tener 9 dígitos';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El correo no es válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {

      // Mapear rol a role_id
      // 🔧 CRÍTICO: IDs correctos según authService.ts
      const roleMap: Record<string, number> = {
        'receptionist': 4, // ID del rol Recepcionista (CORREGIDO de 3 a 4)
        'imaging_technician': 5 // ID del rol Técnico de Imágenes (CORREGIDO de 7 a 5)
      };

      if (editingCollaborator) {
        // Editar colaborador existente
        await usersApi.updateUser(parseInt(editingCollaborator.id), {
          role_id: roleMap[formData.role as string],
          branch_id: formData.sedeId ? parseInt(formData.sedeId) : null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          dni: formData.dni,
          phone: formData.phone,
          email: formData.email,
          updated_at: new Date().toISOString()
        });
        toast.success('Colaborador actualizado exitosamente');
      } else {
        // Crear nuevo colaborador
        // 🔧 Generar username a partir del email
        const username = formData.email.split('@')[0];

        const createPayload: CreateUserPayload = {
          email: formData.email,
          username: username, // ✅ Campo requerido agregado
          password: formData.dni, // ✅ Contraseña sin hash (backend la hasheará)
          role_id: roleMap[formData.role as string],
          branch_id: formData.sedeId ? parseInt(formData.sedeId) : null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          dni: formData.dni, // ✅ DNI como campo independiente
          status: 'active' // ✅ Usar 'status' en lugar de 'is_active'
        };

        await usersApi.createUser(createPayload);
        toast.success('Colaborador creado exitosamente. Contraseña inicial: DNI');
      }

      handleCloseModal();
      loadCollaborators();
    } catch (error) {
      toast.error('Error al guardar colaborador');
    }
  };

  const handleEdit = (collaborator: User) => {
    setEditingCollaborator(collaborator);
    setFormData({
      role: collaborator.role as CollaboratorRole,
      sedeId: collaborator.sedeId || '',
      firstName: collaborator.profile.firstName,
      lastName: collaborator.profile.lastName,
      dni: collaborator.profile.dni || '',
      phone: collaborator.profile.phone || '',
      email: collaborator.email
    });
    setShowModal(true);
  };

  const handleDelete = async (collaborator: User) => {
    if (!confirm(`¿Está seguro de eliminar a ${collaborator.profile.firstName} ${collaborator.profile.lastName}?`)) {
      return;
    }

    try {
      await usersApi.deleteUser(parseInt(collaborator.id));
      toast.success('Colaborador eliminado exitosamente');
      loadCollaborators();
    } catch (error) {
      toast.error('Error al eliminar colaborador');
    }
  };

  const handleToggleStatus = async (collaborator: User) => {
    try {
      // Usar 'status' en lugar de 'is_active' (campo correcto en el backend)
      const newStatus = collaborator.isActive ? 'inactive' : 'active';

      await usersApi.updateUser(parseInt(collaborator.id), {
        status: newStatus
      });

      toast.success(`Colaborador ${newStatus === 'active' ? 'activado' : 'desactivado'}`);
      loadCollaborators();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCollaborator(null);
    setFormData({
      role: '',
      sedeId: '',
      firstName: '',
      lastName: '',
      dni: '',
      phone: '',
      email: ''
    });
    setFormErrors({});
  };

  const getRoleName = (role: string): string => {
    switch (role) {
      case 'receptionist': return 'Recepcionista';
      case 'imaging_technician': return 'Técnico de Imágenes';
      default: return role;
    }
  };

  const getSedeName = (sedeId: string, role?: string): string => {
    if (!sedeId && role === 'imaging_technician') return 'Todas las sedes';
    const sede = sedesDisponibles.find(s => s.id === sedeId);
    return sede?.nombre || 'Sin sede';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Gestión de Colaboradores
            </h1>
            <p className="text-gray-600 mt-2">
              Administra recepcionistas y técnicos de imágenes
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Colaborador
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as CollaboratorRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los roles</option>
            <option value="receptionist">Recepcionista</option>
            <option value="imaging_technician">Técnico de Imágenes</option>
          </select>

          {/* Sede Filter */}
          <select
            value={sedeFilter}
            onChange={(e) => setSedeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={cargandoSedes}
          >
            <option value="all">Todas las sedes</option>
            {sedesDisponibles.map(sede => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setSedeFilter('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Colaboradores</p>
              <p className="text-2xl font-bold text-gray-900">{collaborators.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recepcionistas</p>
              <p className="text-2xl font-bold text-gray-900">
                {collaborators.filter(c => c.role === 'receptionist').length}
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Técnicos de Imágenes</p>
              <p className="text-2xl font-bold text-gray-900">
                {collaborators.filter(c => c.role === 'imaging_technician').length}
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sede
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron colaboradores</p>
                  </td>
                </tr>
              ) : (
                filteredCollaborators.map((collaborator) => (
                  <tr key={collaborator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {collaborator.profile.firstName} {collaborator.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">DNI: {collaborator.profile.dni}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        collaborator.role === 'receptionist'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {getRoleName(collaborator.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getSedeName(collaborator.sedeId || '', collaborator.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {collaborator.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {collaborator.profile.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(collaborator)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          collaborator.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {collaborator.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(collaborator)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(collaborator)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">

            {/* Overlay oscuro */}

            <motion.div

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              transition={{ duration: 0.2 }}

              className="absolute inset-0 bg-black/50"

            />


            {/* Contenido del modal */}

            <motion.div initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-bold">
                        {editingCollaborator ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {editingCollaborator ? 'Modifica los datos del colaborador' : 'La contraseña inicial será el DNI'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as CollaboratorRole })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar rol...</option>
                      <option value="receptionist">Recepcionista</option>
                      <option value="imaging_technician">Técnico de Imágenes</option>
                    </select>
                    {formErrors.role && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                    )}
                  </div>

                  {/* Sede */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sede {formData.role === 'imaging_technician' ? '(opcional)' : '*'}
                    </label>
                    <select
                      value={formData.sedeId}
                      onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                      disabled={cargandoSedes}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.sedeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar sede...</option>
                      {sedesDisponibles.map(sede => (
                        <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                      ))}
                    </select>
                    {formErrors.sedeId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.sedeId}</p>
                    )}
                  </div>

                  {/* Nombres y Apellidos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* DNI y Teléfono */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DNI *
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.dni ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12345678"
                      />
                      {formErrors.dni && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.dni}</p>
                      )}
                      {!editingCollaborator && (
                        <p className="mt-1 text-xs text-gray-500">La contraseña inicial será este DNI</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="999999999"
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="ejemplo@clinica.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Info Box */}
                  {!editingCollaborator && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900 mb-1">
                            Información Importante
                          </h4>
                          <p className="text-sm text-blue-800">
                            La contraseña inicial del colaborador será su DNI. El colaborador podrá cambiarla
                            desde su perfil después del primer inicio de sesión.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingCollaborator ? 'Guardar Cambios' : 'Crear Colaborador'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaboratorManagement;
