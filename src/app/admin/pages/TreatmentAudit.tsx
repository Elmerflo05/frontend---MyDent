import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTimestampToLima, formatDateLong } from '@/utils/dateUtils';
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Eye,
  X,
  DollarSign,
  MapPin
} from 'lucide-react';
import { procedureIncomeApi } from '@/services/api/procedureIncomeApi';
import { serviceMonthlyPaymentsApi } from '@/services/api/serviceMonthlyPaymentsApi';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';

interface AuditTreatmentItem {
  income_id: number;
  patient_id: number;
  patient_name: string;
  patient_dni: string;
  dentist_name: string;
  dentist_cop: string;
  performed_date: string;
  performed_time: string;
  item_name: string;
  item_description: string;
  tooth_number: string;
  final_amount: number;
  income_status: string;
  income_type: string;
  branch_name: string;
  clinical_notes: string;
  amount: number;
  discount_amount: number;
  payment_number?: number;
  payment_type?: string;
  service_name?: string;
  service_type?: string;
  quota_type?: string;
  type: 'procedure' | 'quota';
}

const TreatmentAudit = () => {
  const { user } = useAuth();
  const { branches } = useBranches();

  const [treatments, setTreatments] = useState<AuditTreatmentItem[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<AuditTreatmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchAutoSelected, setBranchAutoSelected] = useState(false);

  const [searchPatient, setSearchPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedIncomeType, setSelectedIncomeType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedTreatment, setSelectedTreatment] = useState<AuditTreatmentItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTreatments();
  }, []);

  // Autoseleccionar la sede del admin logueado
  useEffect(() => {
    if (user?.role === 'admin' && user.branch_id && branches.length > 0 && !branchAutoSelected) {
      const userBranch = branches.find(b => b.branch_id === user.branch_id);
      if (userBranch) {
        setSelectedBranch(userBranch.branch_name);
        setBranchAutoSelected(true);
      }
    }
  }, [user, branches, branchAutoSelected]);

  const loadTreatments = async () => {
    try {
      setLoading(true);

      const [proceduresRes, quotasRes] = await Promise.all([
        procedureIncomeApi.getProcedureIncome({ income_status: 'confirmed', limit: 1000 }),
        serviceMonthlyPaymentsApi.getAllPayments({ limit: 1000 })
      ]);

      const procedureRecords: AuditTreatmentItem[] = (proceduresRes.data || []).map(proc => ({
        type: 'procedure' as const,
        income_id: proc.income_id || 0,
        patient_id: proc.patient_id,
        patient_name: proc.patient_name || 'Desconocido',
        patient_dni: proc.patient_dni || 'N/A',
        dentist_name: proc.dentist_name || 'Desconocido',
        dentist_cop: proc.dentist_cop || 'N/A',
        performed_date: proc.performed_date || '',
        performed_time: proc.performed_time || '',
        item_name: proc.item_name,
        item_description: proc.item_description || '',
        tooth_number: proc.tooth_number || '',
        amount: proc.amount,
        discount_amount: proc.discount_amount || 0,
        final_amount: proc.final_amount || proc.amount,
        income_status: proc.income_status || 'pending',
        income_type: proc.income_type,
        branch_name: proc.branch_name || 'N/A',
        clinical_notes: proc.clinical_notes || '',
        quota_type: proc.quota_type || undefined
      }));

      const quotaRecords: AuditTreatmentItem[] = (quotasRes.data || []).map(quota => ({
        type: 'quota' as const,
        income_id: quota.payment_id,
        patient_id: quota.patient_id,
        patient_name: quota.patient_name || 'Desconocido',
        patient_dni: quota.patient_dni || 'N/A',
        dentist_name: quota.dentist_name || 'Desconocido',
        dentist_cop: quota.dentist_cop || 'N/A',
        performed_date: quota.payment_date,
        performed_time: '',
        item_name: quota.service_name || 'Cuota mensual',
        item_description: '',
        tooth_number: '',
        amount: Number(quota.payment_amount),
        discount_amount: 0,
        final_amount: Number(quota.payment_amount),
        income_status: quota.status || 'confirmed',
        income_type: 'monthly_quota',
        branch_name: quota.branch_name || 'N/A',
        clinical_notes: quota.clinical_notes || '',
        payment_number: quota.payment_number,
        payment_type: quota.payment_type,
        service_name: quota.service_name || '',
        service_type: quota.service_type || ''
      }));

      const allRecords = [...procedureRecords, ...quotaRecords];
      allRecords.sort((a, b) => {
        const dateA = new Date(a.performed_date).getTime();
        const dateB = new Date(b.performed_date).getTime();
        return dateB - dateA;
      });

      setTreatments(allRecords);
      setFilteredTreatments(allRecords);
    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...treatments];

    if (searchPatient) {
      filtered = filtered.filter(t =>
        t.patient_name?.toLowerCase().includes(searchPatient.toLowerCase()) ||
        t.patient_dni?.toLowerCase().includes(searchPatient.toLowerCase())
      );
    }

    if (selectedDoctor) {
      filtered = filtered.filter(t => t.dentist_name === selectedDoctor);
    }

    if (selectedBranch) {
      filtered = filtered.filter(t => t.branch_name === selectedBranch);
    }

    if (selectedIncomeType) {
      if (selectedIncomeType === 'quota') {
        filtered = filtered.filter(t => t.type === 'quota');
      } else {
        filtered = filtered.filter(t => t.income_type === selectedIncomeType);
      }
    }

    if (dateFrom) {
      filtered = filtered.filter(t =>
        new Date(t.performed_date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(t =>
        new Date(t.performed_date) <= new Date(dateTo + 'T23:59:59')
      );
    }

    setFilteredTreatments(filtered);
  }, [searchPatient, selectedDoctor, selectedBranch, selectedIncomeType, dateFrom, dateTo, treatments]);

  const clearFilters = () => {
    setSearchPatient('');
    setSelectedDoctor('');
    setSelectedIncomeType('');
    setDateFrom('');
    setDateTo('');

    // Si es admin, restaurar su sede; si es super_admin, limpiar todo
    if (user?.role === 'admin' && user.branch_id) {
      const userBranch = branches.find(b => b.branch_id === user.branch_id);
      if (userBranch) {
        setSelectedBranch(userBranch.branch_name);
      } else {
        setSelectedBranch('');
      }
    } else {
      setSelectedBranch('');
    }
  };

  const uniqueDoctors = Array.from(
    new Set(treatments.map(t => t.dentist_name))
  ).filter(name => name !== 'Desconocido');

  const uniqueBranches = Array.from(
    new Set(treatments.map(t => t.branch_name))
  ).filter(name => name !== 'N/A');

  const openDetailModal = (treatment: AuditTreatmentItem) => {
    setSelectedTreatment(treatment);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      paid: { label: 'Pagado', className: 'bg-green-100 text-green-700' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-700' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' }
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Auditoría de Tratamientos
          </h1>
          <p className="text-gray-600 mt-2">
            Supervise todos los tratamientos realizados y cuotas pagadas en el sistema
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los doctores</option>
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>
                    {doctor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sede
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las sedes</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ingreso
              </label>
              <select
                value={selectedIncomeType}
                onChange={(e) => setSelectedIncomeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="odontogram_procedure">Procedimiento de Odontograma</option>
                <option value="treatment">Tratamiento</option>
                <option value="additional_service">Servicio Adicional</option>
                <option value="diagnostic_exam">Examen Diagnóstico</option>
                <option value="quota">Cuota Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {(searchPatient || selectedDoctor || selectedBranch || selectedIncomeType || dateFrom || dateTo) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{filteredTreatments.length}</span> tratamiento(s) encontrado(s)
            {filteredTreatments.length !== treatments.length && (
              <span className="text-blue-700"> de {treatments.length} totales</span>
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando tratamientos...</p>
            </div>
          ) : filteredTreatments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron tratamientos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Paciente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">DNI</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">COP</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Tratamiento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Diente</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Monto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Sede</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTreatments.map((treatment, index) => (
                    <motion.tr
                      key={`${treatment.type}-${treatment.income_id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatTimestampToLima(treatment.performed_date, 'date')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {treatment.patient_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {treatment.patient_dni}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {treatment.dentist_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {treatment.dentist_cop}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {treatment.item_name}
                        {treatment.type === 'quota' && treatment.payment_number && (
                          <span className="ml-2 text-xs text-purple-600 font-medium">
                            (Cuota #{treatment.payment_number})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {treatment.tooth_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        S/ {Number(treatment.final_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {treatment.branch_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(treatment.income_status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetailModal(treatment)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalle
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {showModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedTreatment.type === 'procedure' ? 'Detalle del Procedimiento' : 'Detalle de Cuota'}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {formatDateLong(selectedTreatment.performed_date, false)}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Información del Paciente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <p className="text-gray-700">
                    <span className="font-medium">Nombre:</span> {selectedTreatment.patient_name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">DNI:</span> {selectedTreatment.patient_dni}
                  </p>
                </div>
              </div>

              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Profesional
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <p className="text-gray-700">
                    <span className="font-medium">Doctor:</span> {selectedTreatment.dentist_name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">COP:</span> {selectedTreatment.dentist_cop}
                  </p>
                </div>
              </div>

              <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {selectedTreatment.type === 'procedure' ? 'Detalle del Procedimiento' : 'Detalle de la Cuota'}
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Tratamiento/Servicio:</span> {selectedTreatment.item_name}
                  </p>
                  {selectedTreatment.item_description && (
                    <p className="text-gray-700">
                      <span className="font-medium">Descripción:</span> {selectedTreatment.item_description}
                    </p>
                  )}
                  {selectedTreatment.tooth_number && (
                    <p className="text-gray-700">
                      <span className="font-medium">Diente:</span> {selectedTreatment.tooth_number}
                    </p>
                  )}
                  {selectedTreatment.type === 'quota' && (
                    <>
                      <p className="text-gray-700">
                        <span className="font-medium">Número de cuota:</span> #{selectedTreatment.payment_number}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Tipo de pago:</span>{' '}
                        {selectedTreatment.payment_type === 'initial' ? 'Pago Inicial' : 'Cuota Mensual'}
                      </p>
                      {selectedTreatment.service_type && (
                        <p className="text-gray-700">
                          <span className="font-medium">Tipo de servicio:</span> {selectedTreatment.service_type}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Información Financiera
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Monto original:</span>
                    <span className="font-medium">S/ {Number(selectedTreatment.amount || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedTreatment.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-medium">- S/ {Number(selectedTreatment.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-green-700 pt-2 border-t border-green-200">
                    <span>Monto final:</span>
                    <span>S/ {Number(selectedTreatment.final_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  {getStatusBadge(selectedTreatment.income_status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Sucursal</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {selectedTreatment.branch_name}
                  </p>
                </div>
              </div>

              {selectedTreatment.clinical_notes && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Notas Clínicas
                  </h3>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {selectedTreatment.clinical_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TreatmentAudit;
