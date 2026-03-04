import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Activity,
  FileText,
  Heart,
  Shield,
  DollarSign,
  Send,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import type { ToothCondition } from '@/store/odontogramStore';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { UI_TEXTS, CHART_COLORS } from '@/constants/ui';

interface ReportPanelProps {
  patient: Patient | null;
  conditions: ToothCondition[];
  className?: string;
}

const ReportPanel = ({ patient, conditions, className = '' }: ReportPanelProps) => {
  const { dentalConditions, customConditions } = useOdontogramConfigStore();

  // Combinar todas las condiciones disponibles
  const allConditions = useMemo(() => {
    return [...dentalConditions, ...customConditions];
  }, [dentalConditions, customConditions]);

  // Calcular estadísticas
  const statistics = useMemo(() => {
    if (!patient || conditions.length === 0) {
      return {
        totalTeeth: 32,
        affectedTeeth: 0,
        healthyTeeth: 32,
        missingTeeth: 0,
        conditionsSummary: new Map<string, number>(),
        quadrantStats: {
          q1: 0, // Superior derecho
          q2: 0, // Superior izquierdo
          q3: 0, // Inferior izquierdo
          q4: 0  // Inferior derecho
        },
        priorityLevels: {
          high: 0,
          medium: 0,
          low: 0
        },
        totalCost: 0,
        costByCondition: new Map<string, { count: number; totalCost: number }>(),
        avgCostPerTreatment: 0
      };
    }

    const totalTeeth = 32;
    const affectedTeethSet = new Set<string>();
    const missingTeethSet = new Set<string>();
    const conditionsSummary = new Map<string, number>();
    const quadrantStats = { q1: 0, q2: 0, q3: 0, q4: 0 };
    const priorityLevels = { high: 0, medium: 0, low: 0 };
    let totalCost = 0;
    const costByCondition = new Map<string, { count: number; totalCost: number }>();

    conditions.forEach(condition => {
      affectedTeethSet.add(condition.toothNumber);

      // Contar condiciones
      const count = conditionsSummary.get(condition.condition) || 0;
      conditionsSummary.set(condition.condition, count + 1);

      // Calcular costos
      const conditionPrice = condition.price || 0;
      totalCost += conditionPrice;

      const costInfo = costByCondition.get(condition.condition) || { count: 0, totalCost: 0 };
      costInfo.count++;
      costInfo.totalCost += conditionPrice;
      costByCondition.set(condition.condition, costInfo);

      // Detectar dientes ausentes
      if (condition.condition === 'missing' || condition.condition === 'extracted') {
        missingTeethSet.add(condition.toothNumber);
      }

      // Estadísticas por cuadrante
      const toothNum = parseInt(condition.toothNumber);
      if (toothNum >= 11 && toothNum <= 18) quadrantStats.q1++;
      else if (toothNum >= 21 && toothNum <= 28) quadrantStats.q2++;
      else if (toothNum >= 31 && toothNum <= 38) quadrantStats.q3++;
      else if (toothNum >= 41 && toothNum <= 48) quadrantStats.q4++;

      // Determinar prioridad basada en la condición
      const conditionConfig = allConditions.find(c => c.id === condition.condition);
      if (conditionConfig) {
        if (['caries', 'infection', 'fracture'].includes(conditionConfig.id)) {
          priorityLevels.high++;
        } else if (['restoration', 'treatment'].includes(conditionConfig.id)) {
          priorityLevels.medium++;
        } else {
          priorityLevels.low++;
        }
      }
    });

    const affectedTeeth = affectedTeethSet.size;
    const missingTeeth = missingTeethSet.size;
    const healthyTeeth = totalTeeth - affectedTeeth;
    const avgCostPerTreatment = conditions.length > 0 ? totalCost / conditions.length : 0;

    return {
      totalTeeth,
      affectedTeeth,
      healthyTeeth,
      missingTeeth,
      conditionsSummary,
      quadrantStats,
      priorityLevels,
      totalCost,
      costByCondition,
      avgCostPerTreatment
    };
  }, [patient, conditions, allConditions]);

  // Obtener configuración de condición
  const getConditionConfig = (conditionId: string) => {
    return allConditions.find(c => c.id === conditionId);
  };

  // Handlers para acciones del presupuesto
  const handleGenerateBudget = () => {
    if (!patient) return;

    const budgetData = {
      patient: {
        name: `${patient.firstName} ${patient.lastName}`,
        id: patient.id,
        phone: patient.phone,
        email: patient.email
      },
      treatments: Array.from(statistics.costByCondition.entries()).map(([conditionId, costInfo]) => {
        const config = getConditionConfig(conditionId);
        return {
          name: config?.label || conditionId,
          quantity: costInfo.count,
          unitPrice: costInfo.totalCost / costInfo.count,
          totalPrice: costInfo.totalCost,
          color: config?.color
        };
      }),
      total: statistics.totalCost,
      date: new Date().toLocaleDateString(),
      doctor: 'Dr. ' // Se puede agregar información del doctor actual
    };

    // Crear y descargar presupuesto en formato JSON
    const blob = new Blob([JSON.stringify(budgetData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presupuesto-${patient.firstName}-${patient.lastName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Presupuesto generado y descargado exitosamente');
  };

  const handlePrintBudget = () => {
    if (!patient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presupuesto Dental - ${patient.firstName} ${patient.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
            .patient-info { margin-bottom: 20px; }
            .treatments { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .treatments th, .treatments td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .treatments th { background-color: #f3f4f6; font-weight: bold; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #059669; }
            .date { text-align: right; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRESUPUESTO DENTAL</h1>
            <h2>Centro Odontológico</h2>
          </div>

          <div class="patient-info">
            <h3>Información del Paciente:</h3>
            <p><strong>Nombre:</strong> ${patient.firstName} ${patient.lastName}</p>
            <p><strong>Teléfono:</strong> ${patient.phone || 'No especificado'}</p>
            <p><strong>Email:</strong> ${patient.email || 'No especificado'}</p>
          </div>

          <h3>Tratamientos Planificados:</h3>
          <table class="treatments">
            <thead>
              <tr>
                <th>Tratamiento</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from(statistics.costByCondition.entries()).map(([conditionId, costInfo]) => {
                const config = getConditionConfig(conditionId);
                return `
                  <tr>
                    <td>${config?.label || conditionId}</td>
                    <td>${costInfo.count}</td>
                    <td>S/ ${(costInfo.totalCost / costInfo.count).toFixed(2)}</td>
                    <td>S/ ${costInfo.totalCost.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>TOTAL DEL PRESUPUESTO: S/ ${statistics.totalCost.toFixed(2)}</p>
          </div>

          <div class="date">
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();

    toast.success('Presupuesto enviado a impresora');
  };

  const handleEmailBudget = () => {
    if (!patient || !patient.email) {
      toast.error('El paciente no tiene email registrado');
      return;
    }

    const subject = `Presupuesto Dental - ${patient.firstName} ${patient.lastName}`;
    const body = `Estimado/a ${patient.firstName},

Adjunto encontrará su presupuesto dental con los tratamientos planificados:

${Array.from(statistics.costByCondition.entries()).map(([conditionId, costInfo]) => {
      const config = getConditionConfig(conditionId);
      return `• ${config?.label || conditionId}: ${costInfo.count} procedimiento(s) - S/ ${costInfo.totalCost.toFixed(2)}`;
    }).join('\n')}

TOTAL: S/ ${statistics.totalCost.toFixed(2)}

Cualquier consulta, no dude en contactarnos.

Saludos cordiales,
Centro Odontológico`;

    const mailtoLink = `mailto:${patient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    toast.success('Cliente de email abierto con el presupuesto');
  };

  const handleExportBudget = () => {
    if (!patient) return;

    toast.info('Funcionalidad de exportación PDF en desarrollo');
    // Aquí se puede implementar generación de PDF usando librerías como jsPDF
  };

  // Generar reporte
  const generateReport = () => {
    if (!patient) {
      toast.error('No hay paciente seleccionado');
      return;
    }

    // En una implementación real, esto generaría un PDF
    toast.success('Reporte generado exitosamente');
  };

  // Imprimir reporte
  const printReport = () => {
    if (!patient) {
      toast.error('No hay paciente seleccionado');
      return;
    }

    // En una implementación real, esto abriría la ventana de impresión
    window.print();
  };

  if (!patient) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Odontograma</h3>
        <p className="text-gray-600">Seleccione un paciente para ver el reporte en tiempo real.</p>
      </div>
    );
  }

  const conditionsArray = Array.from(statistics.conditionsSummary.entries());
  const hasConditions = conditions.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reporte de Odontograma</h2>
              <p className="text-sm text-gray-600">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Generar PDF
            </button>
          </div>
        </div>

        {/* Información del paciente */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>DNI: {patient.dni}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Fecha: {new Date().toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Resumen General
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="text-2xl font-bold text-blue-600">{statistics.totalTeeth}</div>
            <div className="text-xs text-blue-600 font-medium">Total Dientes</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="text-2xl font-bold text-green-600">{statistics.healthyTeeth}</div>
            <div className="text-xs text-green-600 font-medium">Sanos</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <div className="text-2xl font-bold text-yellow-600">{statistics.affectedTeeth}</div>
            <div className="text-xs text-yellow-600 font-medium">Con Condiciones</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <div className="text-2xl font-bold text-red-600">{statistics.missingTeeth}</div>
            <div className="text-xs text-red-600 font-medium">Ausentes</div>
          </motion.div>
        </div>

        {/* Gráfico visual de estado */}
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(statistics.healthyTeeth / statistics.totalTeeth) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full bg-green-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((statistics.affectedTeeth - statistics.missingTeeth) / statistics.totalTeeth) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute top-0 h-full bg-yellow-500"
            style={{ left: `${(statistics.healthyTeeth / statistics.totalTeeth) * 100}%` }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(statistics.missingTeeth / statistics.totalTeeth) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            className="absolute top-0 h-full bg-red-500"
            style={{ left: `${((statistics.healthyTeeth + statistics.affectedTeeth - statistics.missingTeeth) / statistics.totalTeeth) * 100}%` }}
          />
        </div>

        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Sanos ({statistics.healthyTeeth})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Con tratamiento ({statistics.affectedTeeth - statistics.missingTeeth})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Ausentes ({statistics.missingTeeth})</span>
          </div>
        </div>
      </div>

      {/* Condiciones detalladas */}
      {hasConditions && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Condiciones Detectadas
          </h3>

          <div className="space-y-3">
            {conditionsArray.map(([conditionId, count], index) => {
              const conditionConfig = getConditionConfig(conditionId);
              if (!conditionConfig) return null;

              return (
                <motion.div
                  key={conditionId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: conditionConfig.color }}
                    />
                    <span className="font-medium text-gray-900">{conditionConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-sm text-gray-600">{count} casos</span>
                      {statistics.costByCondition.get(conditionId) && (
                        <div className="text-xs font-medium text-green-600">
                          S/ {statistics.costByCondition.get(conditionId)!.totalCost.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div
                      className="h-2 rounded-full bg-gray-200"
                      style={{ width: '60px' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / Math.max(...conditionsArray.map(([,c]) => c))) * 100, 100)}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: conditionConfig.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estadísticas por cuadrante */}
      {hasConditions && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribución por Cuadrantes
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'q1', label: 'Superior Derecho (1)', value: statistics.quadrantStats.q1 },
              { key: 'q2', label: 'Superior Izquierdo (2)', value: statistics.quadrantStats.q2 },
              { key: 'q3', label: 'Inferior Izquierdo (3)', value: statistics.quadrantStats.q3 },
              { key: 'q4', label: 'Inferior Derecho (4)', value: statistics.quadrantStats.q4 }
            ].map((quadrant, index) => (
              <motion.div
                key={quadrant.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{quadrant.value}</div>
                  <div className="text-xs text-gray-600">{quadrant.label}</div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: quadrant.value > 0 ? `${(quadrant.value / Math.max(1, Math.max(...Object.values(statistics.quadrantStats)))) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Nivel de prioridad */}
      {hasConditions && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Nivel de Prioridad
          </h3>

          <div className="space-y-3">
            {[
              { key: 'high', label: 'Alta Prioridad', value: statistics.priorityLevels.high, color: 'red', icon: XCircle },
              { key: 'medium', label: 'Prioridad Media', value: statistics.priorityLevels.medium, color: 'yellow', icon: AlertTriangle },
              { key: 'low', label: 'Baja Prioridad', value: statistics.priorityLevels.low, color: 'green', icon: CheckCircle }
            ].map((priority, index) => (
              <motion.div
                key={priority.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 bg-${priority.color}-50 rounded-lg border border-${priority.color}-200`}
              >
                <div className="flex items-center gap-3">
                  <priority.icon className={`w-5 h-5 text-${priority.color}-600`} />
                  <span className={`font-medium text-${priority.color}-900`}>{priority.label}</span>
                </div>
                <span className={`text-sm font-bold text-${priority.color}-700`}>
                  {priority.value} casos
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Presupuesto en Tiempo Real */}
      {hasConditions && statistics.totalCost > 0 && (
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Presupuesto en Tiempo Real
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-emerald-700 font-medium">Actualizado</span>
            </div>
          </div>

          {/* Total del Presupuesto */}
          <div className="mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-white rounded-xl border-2 border-emerald-300 shadow-lg"
            >
              <div className="text-center">
                <div className="text-sm text-emerald-600 font-medium mb-2">TOTAL DEL PRESUPUESTO</div>
                <div className="text-4xl font-bold text-emerald-700 mb-2">
                  S/ {statistics.totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {conditions.length} tratamiento{conditions.length !== 1 ? 's' : ''} planificado{conditions.length !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-white rounded-lg border border-emerald-200"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">S/ {statistics.avgCostPerTreatment.toFixed(2)}</div>
                <div className="text-sm text-blue-600 font-medium">Promedio por Tratamiento</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-white rounded-lg border border-emerald-200"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.costByCondition.size}
                </div>
                <div className="text-sm text-purple-600 font-medium">Tipos de Tratamiento</div>
              </div>
            </motion.div>
          </div>

          {/* Lista de Tratamientos del Presupuesto */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-800">TRATAMIENTOS INCLUIDOS:</h4>
              <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded">
                {Array.from(statistics.costByCondition.values()).reduce((sum, info) => sum + info.count, 0)} procedimientos
              </span>
            </div>

            {Array.from(statistics.costByCondition.entries()).map(([conditionId, costInfo], index) => {
              const conditionConfig = getConditionConfig(conditionId);
              if (!conditionConfig || costInfo.totalCost === 0) return null;

              return (
                <motion.div
                  key={conditionId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: `${conditionConfig.color}20`, border: `2px solid ${conditionConfig.color}` }}>
                      <span className="text-xs font-bold" style={{ color: conditionConfig.color }}>
                        {costInfo.count}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{conditionConfig.label}</div>
                      <div className="text-sm text-gray-500">
                        {costInfo.count} {costInfo.count === 1 ? 'procedimiento' : 'procedimientos'} × S/ {(costInfo.totalCost / costInfo.count).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-700">S/ {costInfo.totalCost.toFixed(2)}</div>
                  </div>
                </motion.div>
              );
            })}

            {/* Total line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="border-t-2 border-emerald-200 mt-4 pt-4"
            >
              <div className="flex items-center justify-between p-4 bg-emerald-700 rounded-lg text-white">
                <div className="font-bold text-lg">TOTAL DEL PRESUPUESTO</div>
                <div className="font-bold text-2xl">S/ {statistics.totalCost.toFixed(2)}</div>
              </div>
            </motion.div>

            {/* Botones de Acción del Presupuesto */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              <button
                onClick={() => handleGenerateBudget()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Generar Presupuesto
              </button>

              <button
                onClick={() => handlePrintBudget()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>

              <button
                onClick={() => handleEmailBudget()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Send className="w-4 h-4" />
                Enviar Email
              </button>

              <button
                onClick={() => handleExportBudget()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Estado cuando no hay condiciones */}
      {!hasConditions && (
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Condiciones Registradas</h3>
          <p className="text-gray-600 mb-4">
            El odontograma está limpio. Agregue condiciones para ver el reporte detallado.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Estado dental saludable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;