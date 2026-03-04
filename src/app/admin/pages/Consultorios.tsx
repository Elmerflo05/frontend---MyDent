import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import { useConsultorioStore } from '@/store/consultorioStore';
import { useAuthStore } from '@/store/authStore';
import { branchesApi } from '@/services/api/branchesApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import type { Consultorio, Appointment, Sede } from '@/types';
import {
  calcularEstadisticasGenerales,
  calcularEstadisticasConsultorio,
  filtrarConsultorios,
  getInitialFormData,
  consultorioToFormData,
  ConsultoriosHeader,
  ConsultoriosStatsCards,
  ConsultoriosFilters,
  ConsultorioCard,
  ConsultorioFormModal,
  ConsultorioHistorialModal
} from '@/components/admin/consultorios';

export default function Consultorios() {
  const { user } = useAuthStore();
  const {
    consultorios,
    loading,
    loadConsultorios,
    addConsultorio,
    updateConsultorio,
    deleteConsultorio
  } = useConsultorioStore();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedConsultorio, setSelectedConsultorio] = useState<Consultorio | null>(null);

  // Historial data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState(getInitialFormData(user?.sedeId));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadConsultorios();

    try {
      const response = await branchesApi.getBranches();
      const mappedSedes: Sede[] = response.data.map(branch => ({
        id: branch.branch_id?.toString() || '',
        nombre: branch.branch_name || '',
        direccion: branch.address || '',
        telefono: branch.phone || '',
        email: branch.email || '',
        horario: branch.opening_hours || '',
        isActive: branch.is_active !== false
      }));
      setSedes(mappedSedes);
    } catch (error) {
    }

    // Set default sede if user has one
    if (user?.sedeId && selectedSede === 'all') {
      setSelectedSede(user.sedeId);
    }
  };

  // Filtrar consultorios
  const filteredConsultorios = filtrarConsultorios(
    consultorios,
    selectedSede,
    searchTerm,
    filterEstado
  );

  // Calcular estadísticas generales
  const stats = calcularEstadisticasGenerales(filteredConsultorios);

  // Abrir modal de historial y cargar datos
  const handleVerHistorial = async (consultorio: Consultorio) => {
    setSelectedConsultorio(consultorio);
    setShowHistorialModal(true);


    try {
      // Cargar citas del consultorio
      const response = await appointmentsApi.getAppointments({
        room: consultorio.nombre,
        limit: 1000
      });

      // Map backend format to frontend format
      const mappedAppointments: Appointment[] = response.data.map(apt => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const timeParts = (apt.appointment_time || '00:00').split(':').map(Number);
        const hours = timeParts[0] || 0;
        const minutes = timeParts[1] || 0;
        const appointmentDate = new Date(year, month - 1, day, hours, minutes);

        return {
          id: apt.appointment_id?.toString() || '',
          patientId: apt.patient_id?.toString() || '',
          patientName: `${apt.patient_name || 'Paciente'}`,
          dentistId: apt.dentist_id?.toString() || '',
          dentistName: apt.dentist_name || 'Doctor',
          date: appointmentDate,
          time: apt.appointment_time || '00:00',
          room: apt.room || consultorio.nombre,
          status: apt.appointment_status_id === 1 ? 'confirmed' : apt.appointment_status_id === 3 ? 'completed' : 'pending',
          reason: apt.reason || '',
          notes: apt.notes || '',
          isActive: true
        };
      });

      setAppointments(mappedAppointments);

      // Calcular estadísticas
      const stats = calcularEstadisticasConsultorio(mappedAppointments);
      setEstadisticas(stats);

    } catch (error) {
    }
  };

  const handleAddConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addConsultorio({
        ...formData,
        estado: 'disponible',
        isActive: true
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
    }
  };

  const handleEditConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultorio) return;

    try {
      await updateConsultorio(selectedConsultorio.id, formData);
      setShowEditModal(false);
      setSelectedConsultorio(null);
      resetForm();
    } catch (error) {
    }
  };

  const handleDeleteConsultorio = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este consultorio?')) return;

    try {
      await deleteConsultorio(id);
    } catch (error) {
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: Consultorio['estado']) => {
    try {
      await updateConsultorio(id, { estado: nuevoEstado });
    } catch (error) {
    }
  };

  const openEditModal = (consultorio: Consultorio) => {
    setSelectedConsultorio(consultorio);
    setFormData(consultorioToFormData(consultorio));
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData(getInitialFormData(user?.sedeId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ConsultoriosHeader
        onAddClick={() => {
          resetForm();
          setShowAddModal(true);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Generales */}
        <ConsultoriosStatsCards stats={stats} />

        {/* Filtros */}
        <ConsultoriosFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedSede={selectedSede}
          onSedeChange={setSelectedSede}
          filterEstado={filterEstado}
          onEstadoChange={setFilterEstado}
          sedes={sedes}
          showSedeFilter={user?.role === 'super_admin'}
        />

        {/* Grid de Consultorios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredConsultorios.map((consultorio, index) => (
              <ConsultorioCard
                key={consultorio.id}
                consultorio={consultorio}
                index={index}
                onVerHistorial={handleVerHistorial}
                onEdit={openEditModal}
                onDelete={handleDeleteConsultorio}
                onCambiarEstado={handleCambiarEstado}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredConsultorios.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <DoorOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron consultorios
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros o crea un nuevo consultorio
            </p>
          </div>
        )}
      </div>

      {/* Modal: Agregar Consultorio */}
      <ConsultorioFormModal
        isOpen={showAddModal}
        isEditMode={false}
        formData={formData}
        sedes={sedes}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddConsultorio}
        onFormDataChange={setFormData}
      />

      {/* Modal: Editar Consultorio */}
      <ConsultorioFormModal
        isOpen={showEditModal}
        isEditMode={true}
        formData={formData}
        sedes={sedes}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditConsultorio}
        onFormDataChange={setFormData}
      />

      {/* Modal: Historial y Estadísticas */}
      <ConsultorioHistorialModal
        isOpen={showHistorialModal}
        consultorio={selectedConsultorio}
        appointments={appointments}
        estadisticas={estadisticas}
        onClose={() => setShowHistorialModal(false)}
      />
    </div>
  );
}
