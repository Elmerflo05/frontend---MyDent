import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Calendar, TrendingUp, Stethoscope } from 'lucide-react';
import { patientPortalApi, IntegralConsultation, TreatmentPlanItem, CompletedItem } from '@/services/api/patientPortalApi';
import { useAuthStore } from '@/store/authStore';
import { parseLocalDate, formatDateLong } from '@/utils/dateUtils';

interface Treatment {
  id: string;
  consultationId: number;
  name: string;
  doctorName: string;
  branchName: string;
  startDate: string; // Fecha como string para evitar problemas de timezone
  progress: number;
  status: 'active' | 'completed' | 'pending';
  items: TreatmentItem[];
  totalCost: number;
  paidAmount: number;
  additionalServices: AdditionalService[];
}

interface TreatmentItem {
  id: number;
  name: string;
  amount: number;
  completed: boolean;
  conditions: { label: string; price: number; quantity: number }[];
}

interface AdditionalService {
  id: number;
  type: 'orthodontic' | 'implant' | 'prosthesis';
  name: string;
  total: number;
  initial: number;
  monthly: number;
}

const PatientTreatments = () => {
  const { user } = useAuthStore();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      setIsLoading(true);

      // Obtener historial medico completo del paciente (Atencion Integral)
      const response = await patientPortalApi.getMyMedicalHistory();

      if (!response.success || !response.data) {
        setTreatments([]);
        setError(null);
        return;
      }

      const { consultations } = response.data;

      // Filtrar solo consultas que tienen plan de tratamiento
      const consultationsWithTreatments = consultations.filter(
        (c: IntegralConsultation) => c.treatment_plan && c.treatment_plan.items.length > 0
      );

      // Mapear cada consulta a un Treatment
      const mappedTreatments: Treatment[] = consultationsWithTreatments.map((consultation: IntegralConsultation) => {
        const treatmentPlan = consultation.treatment_plan!;
        const completedItems = consultation.completed_items || [];

        // Si hay treatment_performed con contenido, considerar todo como completado
        const hasTreatmentPerformed = !!(consultation as any).treatment_performed &&
          (consultation as any).treatment_performed.trim().length > 0;

        // Mapear items del plan de tratamiento
        const items: TreatmentItem[] = treatmentPlan.items.map((item: TreatmentPlanItem) => {
          // Verificar si este item esta completado:
          // 1. Si hay treatment_performed, todo está completado
          // 2. Si no, verificar en completed_items por nombre
          const isCompleted = hasTreatmentPerformed || completedItems.some(
            (ci: CompletedItem) => ci.item_name === item.treatment_name
          );

          return {
            id: item.consultation_treatment_item_id,
            name: item.treatment_name,
            amount: Number(item.total_amount || 0),
            completed: isCompleted,
            conditions: item.conditions?.map(c => ({
              label: c.label,
              price: Number(c.price || 0),
              quantity: c.quantity
            })) || []
          };
        });

        // Mapear servicios adicionales
        const additionalServices: AdditionalService[] = (treatmentPlan.additional_services || []).map(service => ({
          id: service.consultation_additional_service_id,
          type: service.service_type,
          name: service.service_name,
          total: Number(service.monto_total || 0),
          initial: Number(service.inicial || 0),
          monthly: Number(service.mensual || 0)
        }));

        // Calcular progreso
        // Si hay treatment_performed, el progreso es 100%
        // Si no, calcular basado solo en items del tratamiento (no servicios adicionales)
        const completedCount = items.filter(i => i.completed).length;
        const progress = hasTreatmentPerformed
          ? 100
          : (items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0);

        // Determinar estado
        let status: 'active' | 'completed' | 'pending' = 'pending';
        if (hasTreatmentPerformed || progress === 100) {
          status = 'completed';
        } else if (completedCount > 0) {
          status = 'active';
        }

        // Calcular monto pagado (de items completados) - convertir a número
        const paidAmount = completedItems.reduce((sum: number, ci: CompletedItem) => sum + Number(ci.item_amount || 0), 0);

        // Formatear fecha para el nombre del plan usando parseLocalDate para evitar desfase timezone
        const shortDate = parseLocalDate(consultation.consultation_date).toLocaleDateString('es-PE');

        // Siempre generar el nombre con la fecha correcta de la consulta
        // (ignoramos plan_name de BD si tiene fecha incorrecta por bug anterior de timezone)
        const planName = treatmentPlan.plan_name && !treatmentPlan.plan_name.includes('Plan de Tratamiento -')
          ? treatmentPlan.plan_name
          : `Plan de Tratamiento - ${shortDate}`;

        return {
          id: consultation.consultation_id.toString(),
          consultationId: consultation.consultation_id,
          name: planName,
          doctorName: consultation.dentist_name,
          branchName: consultation.branch_name,
          startDate: consultation.consultation_date, // Guardar como string
          progress,
          status,
          items,
          totalCost: Number(treatmentPlan.grand_total || 0),
          paidAmount,
          additionalServices
        };
      });

      setTreatments(mappedTreatments);
      setError(null);

    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
      setError('Error al cargar los tratamientos');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { label: 'Completado', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'orthodontic': return 'Ortodoncia';
      case 'implant': return 'Implante';
      case 'prosthesis': return 'Prótesis';
      default: return type;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Cargando tratamientos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">Error al cargar tratamientos</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={loadTreatments}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Intentar de nuevo
            </button>
          </div>
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
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Tratamientos</h1>
              <p className="text-gray-600">Seguimiento de tus tratamientos dentales</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Activos</p>
                  <p className="text-2xl font-bold text-green-900">
                    {treatments.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Completados</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {treatments.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Progreso Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {treatments.length > 0
                      ? Math.round(treatments.reduce((acc, t) => acc + t.progress, 0) / treatments.length)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Treatments List */}
        {treatments && treatments.length > 0 ? treatments.map((treatment) => {
          const statusConfig = getStatusConfig(treatment.status);
          const completedItems = treatment.items.filter(i => i.completed).length;
          const totalItems = treatment.items.length;

          return (
            <div key={treatment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{treatment.name}</h2>
                    <p className="text-sm text-gray-600">{treatment.doctorName} - {treatment.branchName}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso del Tratamiento</span>
                  <span className="text-sm font-medium text-gray-900">{treatment.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      treatment.progress === 100 ? 'bg-green-500' :
                      treatment.progress > 0 ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${treatment.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Treatment Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Fecha</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDateLong(treatment.startDate, false)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Costos</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">S/. {Number(treatment.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="text-green-600 font-medium">S/. {Number(treatment.paidAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-gray-700 font-medium">Pendiente:</span>
                      <span className="text-orange-600 font-bold">S/. {(Number(treatment.totalCost || 0) - Number(treatment.paidAmount || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Procedimientos</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completados:</span>
                      <span className="text-green-600 font-medium">{completedItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendientes:</span>
                      <span className="text-orange-600 font-medium">{totalItems - completedItems}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Detalle de Tratamientos</h3>
                <div className="space-y-3">
                  {treatment.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        item.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                            {item.name}
                          </h4>
                          <span className={`font-semibold ${item.completed ? 'text-green-700' : 'text-gray-700'}`}>
                            S/. {Number(item.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        {item.conditions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.conditions.map((cond, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {cond.label} {cond.quantity > 1 ? `(x${cond.quantity})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        item.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.completed ? 'Completado' : 'Pendiente'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Services */}
              {treatment.additionalServices.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Servicios Adicionales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {treatment.additionalServices.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 rounded-lg border border-purple-200 bg-purple-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-600 uppercase">
                            {getServiceTypeLabel(service.type)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{service.name}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">S/. {Number(service.total || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Inicial:</span>
                            <span>S/. {Number(service.initial || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mensual:</span>
                            <span>S/. {Number(service.monthly || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }) : null}

        {/* Empty State */}
        {!isLoading && treatments.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes tratamientos activos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cuando inicies un tratamiento, aparecerá aquí con todo el seguimiento.
              </p>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default PatientTreatments;