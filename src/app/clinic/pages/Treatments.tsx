import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { TreatmentPlanApiService } from '../services/treatmentPlanApiService';
import { useAuth } from '@/hooks/useAuth';
import type { Patient, TreatmentPlan } from '@/types';
import {
  StatsCards,
  TreatmentFilters,
  TreatmentTable,
  NewTreatmentModal,
  TreatmentDetailsModal
} from '@/components/treatments';

const Treatments = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentPlan | null>(null);
  const [showNewTreatmentModal, setShowNewTreatmentModal] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Preparar filtros para doctores (filtrar por sede)
      const filters: { branchId?: number } = {};
      if (user?.role === 'doctor' && user.branch_id) {
        filters.branchId = user.branch_id;
      }

      // ✅ Cargar datos desde las APIs reales (sin mock data)
      const [patientsData, treatmentsData] = await Promise.all([
        TreatmentPlanApiService.loadPatients(),
        TreatmentPlanApiService.loadTreatmentPlans(filters)
      ]);

      setPatients(patientsData);
      setTreatments(treatmentsData);

      console.log('✅ Datos cargados desde API:', {
        patients: patientsData.length,
        treatments: treatmentsData.length
      });
    } catch (error) {
      toast.error('Error al cargar los tratamientos');
    } finally {
      setIsLoading(false);
    }
  };

  // Get patient name by ID
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido';
  };

  // Filter treatments
  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = searchTerm === '' ||
      getPatientName(treatment.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || treatment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || treatment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get statistics
  const getStats = () => {
    const total = treatments.length;
    const active = treatments.filter(t => t.status === 'active').length;
    const completed = treatments.filter(t => t.status === 'completed').length;
    const totalRevenue = treatments
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.totalCost, 0);

    return { total, active, completed, totalRevenue };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando planes de tratamiento...</p>
        </div>
      </div>
    );
  }

  const handleDeleteTreatment = (treatment: TreatmentPlan) => {
    if (confirm(`¿Está seguro de eliminar el plan de tratamiento "${treatment.title}"?`)) {
      setTreatments(treatments.filter(t => t.id !== treatment.id));
      toast.success('Plan de tratamiento eliminado');
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planes de Tratamiento</h1>
            <p className="text-gray-600">Gestione los planes de tratamiento de sus pacientes</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <TreatmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onNewTreatment={() => setShowNewTreatmentModal(true)}
      />

      {/* Treatments Table */}
      <TreatmentTable
        treatments={filteredTreatments}
        getPatientName={getPatientName}
        onViewDetails={setSelectedTreatment}
        onDeleteTreatment={handleDeleteTreatment}
      />

      {/* Treatment Details Modal */}
      <TreatmentDetailsModal
        treatment={selectedTreatment}
        getPatientName={getPatientName}
        onClose={() => setSelectedTreatment(null)}
      />

      {/* New Treatment Modal */}
      <NewTreatmentModal
        isOpen={showNewTreatmentModal}
        patients={patients}
        onClose={() => setShowNewTreatmentModal(false)}
        onSave={(newTreatment) => {
          setTreatments([...treatments, newTreatment]);
          setShowNewTreatmentModal(false);
          toast.success('Plan de tratamiento creado exitosamente');
        }}
      />
    </div>
  );
};

export default Treatments;
