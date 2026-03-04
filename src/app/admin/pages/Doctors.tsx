import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  UserCheck,
  AlertTriangle,
  Building2,
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DoctorApiService } from '../services/doctorApiService';
import { specialtiesApi } from '@/services/api/specialtiesApi';
import {
  DOCTOR_STATUS_CONFIG,
  DOCTOR_FILTERS
} from '@/constants/doctors';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import CommissionCalculatorModal from '@/components/doctors/CommissionCalculatorModal';
import DoctorDetailsModal from '@/components/doctors/DoctorDetailsModal';
import type { User } from '@/types';
import type { SpecialtyApiResponse } from '@/types/api/specialty';

const DoctorsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branches } = useBranches();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sedeFilter, setSedeFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsDoctor, setDetailsDoctor] = useState<User | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionDoctor, setCommissionDoctor] = useState<User | null>(null);
  const [commissionData, setCommissionData] = useState<{ grossIncome: number; treatmentText: string }>({
    grossIncome: 0,
    treatmentText: ''
  });
  const [specialties, setSpecialties] = useState<SpecialtyApiResponse[]>([]);

  // Convertir branches a formato compatible
  const sedes = branches
    .filter(b => b.status === 'active' && b.branch_id) // Filtrar solo los que tienen branch_id válido
    .map(b => ({
      id: b.branch_id!.toString(),
      nombre: b.branch_name || ''
    }));

  // Función para obtener sede por ID
  const obtenerSedePorId = (sedeId: string) => {
    const branch = branches.find(b => b.branch_id?.toString() === sedeId);
    return branch ? { nombre: branch.branch_name } : null;
  };

  const isSuperAdmin = user?.role === 'super_admin';

  // Load doctors and specialties data
  useEffect(() => {
    loadDoctors();
    loadSpecialties();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);

      // ✅ Cargar SOLO médicos desde la API real (sin admins)
      const doctorsData = await DoctorApiService.loadDoctors();

      setDoctors(doctorsData);

    } catch (error) {
      console.error('❌ [Doctors] Error al cargar médicos:', error);
      toast.error('Error al cargar los médicos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await specialtiesApi.getSpecialties();
      setSpecialties(response.data || []);
    } catch (error) {
      console.error('❌ [Doctors] Error al cargar especialidades:', error);
    }
  };

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchTerm === '' ||
      doctor.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.profile.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;

    const matchesSpecialty = specialtyFilter === 'all' ||
      (doctor.profile.specialties && doctor.profile.specialties.includes(specialtyFilter));

    // Verificar si el médico tiene acceso a la sede seleccionada (sedesAcceso es un array)
    const matchesSede = sedeFilter === 'all' ||
      (doctor.sedesAcceso && doctor.sedesAcceso.includes(sedeFilter));

    return matchesSearch && matchesStatus && matchesSpecialty && matchesSede;
  });

  // Get statistics
  const getStats = () => {
    const total = doctors.length;
    const active = doctors.filter(d => d.status === 'active').length;
    const suspended = doctors.filter(d => d.status === 'suspended').length;

    return { total, active, suspended };
  };

  // Handle doctor actions
  const handleStatusChange = async (doctorId: string, newStatus: string) => {
    try {
      // Llamar al servicio API real para actualizar el estado
      await DoctorApiService.updateDoctor(doctorId, {
        status: newStatus as 'active' | 'suspended'
      });

      await loadDoctors();
      const statusLabels: Record<string, string> = {
        active: 'activo',
        suspended: 'suspendido'
      };
      toast.success(`Estado del médico actualizado a ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado del médico');
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      // Llamar al servicio API real para eliminar el médico
      await DoctorApiService.deleteDoctor(selectedDoctor.id);
      await loadDoctors();
      toast.success('Médico eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error al eliminar médico:', error);
      toast.error('Error al eliminar el médico');
    }
  };

  // Cancelar eliminación de médico
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedDoctor(null);
  };

  // Calcular ingreso bruto total de tratamientos completados del doctor
  // TODO: Esta funcionalidad requiere integracion con API de registros medicos
  const calculateDoctorCommissionData = async (doctorId: string) => {
    try {
      // Por ahora mostramos un mensaje indicando que la funcionalidad esta en desarrollo
      // Esta funcionalidad requiere un endpoint de backend para obtener los registros medicos del doctor
      toast.info('La calculadora de comisiones se integrara proximamente con la API de registros medicos');
      return { grossIncome: 0, treatmentText: 'Funcionalidad en desarrollo' };
    } catch (error) {
      toast.error('Error al calcular datos de comision');
      return { grossIncome: 0, treatmentText: '' };
    }
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
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gestión de Médicos
            </h1>
            <p className="text-gray-600">Administra el personal médico de la clínica</p>
          </div>
          
          <button 
            onClick={() => navigate('/admin/doctors/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Médico
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-700">{stats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspendidos</p>
                <p className="text-2xl font-bold text-red-700">{stats.suspended}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar médicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {DOCTOR_FILTERS.status.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map(specialty => (
                <option key={specialty.specialty_id} value={specialty.specialty_name}>
                  {specialty.specialty_name}
                </option>
              ))}
            </select>

            {isSuperAdmin && (
              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todas las sedes</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            )}

            <div className="ml-auto text-sm text-gray-600">
              {filteredDoctors.length} de {doctors.length} médicos
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidades
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sede
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => {
                  const statusConfig = DOCTOR_STATUS_CONFIG[doctor.status as keyof typeof DOCTOR_STATUS_CONFIG];
                  
                  return (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={doctor.profile.avatar || '/default-avatar.png'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {doctor.profile.firstName} {doctor.profile.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Lic: {doctor.profile.licenseNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.email}</div>
                        <div className="text-sm text-gray-500">{doctor.profile.phone}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {doctor.profile.specialties && doctor.profile.specialties.length > 0 ? (
                            doctor.profile.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {specialty}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">Sin especialidades</span>
                          )}
                        </div>
                      </td>

                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                              {doctor.sedesAcceso && Array.isArray(doctor.sedesAcceso) && doctor.sedesAcceso.length > 0 ? (
                                doctor.sedesAcceso.map((sedeId, index) => {
                                  const sede = obtenerSedePorId(sedeId);
                                  return (
                                    <span
                                      key={`${doctor.id}-sede-${index}`}
                                      className="text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block"
                                    >
                                      {sede?.nombre || `Sede #${sedeId}`}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-gray-500 italic">Sin asignar</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.textColor}`}>
                          {statusConfig?.icon} {statusConfig?.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doctor.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={async () => {
                              const data = await calculateDoctorCommissionData(doctor.id);
                              setCommissionData(data);
                              setCommissionDoctor(doctor);
                              setShowCommissionModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                            title="Calcular comisión"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDetailsDoctor(doctor);
                              setShowDetailsModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-900 p-1 hover:bg-teal-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/admin/doctors/${doctor.id}/edit`)}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {doctor.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(doctor.id, 'suspended')}
                              className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded"
                              title="Suspender"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(doctor.id, 'active')}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Activar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron médicos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Intenta ajustar los filtros o agregar un nuevo médico.
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDoctor && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
            onClick={handleCancelDelete}
          >
            {/* Contenido del modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar al Dr. {selectedDoctor.profile.firstName} {selectedDoctor.profile.lastName}?
                Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteDoctor}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Commission Calculator Modal */}
        {showCommissionModal && commissionDoctor && (
          <CommissionCalculatorModal
            doctor={commissionDoctor}
            branchId={commissionDoctor.branchId || user?.branchId || 1}
            onClose={() => {
              setShowCommissionModal(false);
              setCommissionDoctor(null);
              setCommissionData({ grossIncome: 0, treatmentText: '' });
            }}
            onSuccess={() => {
              // Recargar datos si es necesario
              loadDoctors();
            }}
          />
        )}

        {/* Doctor Details Modal */}
        <DoctorDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsDoctor(null);
          }}
          doctor={detailsDoctor}
          branches={sedes}
        />
      </motion.div>
    </div>
  );
};

export default DoctorsPage;
