import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Filter, Download, RotateCcw, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { radiographyApi } from '@/services/api/radiographyApi';
import {
  RADIOGRAPHY_REQUEST_STATUS,
  RADIOGRAPHY_REQUEST_STATUS_LABELS,
  RADIOGRAPHY_REQUEST_STATUS_COLORS,
  isRejectedByTechnician,
  type RadiographyRequestStatus
} from '@/constants/radiographyStatus';
import { buildBreakdownFromFormData } from '@/utils/pricing/breakdownBuilder';

interface AdminOrderRow {
  radiography_request_id: number;
  request_date: string;
  date_time_registration?: string;
  date_time_modification?: string;
  patient_name?: string;
  identification_number?: string;
  dentist_name?: string;
  dentist_id?: number | null;
  branch_id?: number | null;
  branch_name?: string;
  radiography_type?: string;
  request_status?: string;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  performed_by_name?: string | null;
  performed_date?: string | null;
  pricing_data?: any;
  request_data?: any;
}

const STATUS_OPTIONS: Array<{ value: 'all' | RadiographyRequestStatus; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: RADIOGRAPHY_REQUEST_STATUS.PENDING, label: RADIOGRAPHY_REQUEST_STATUS_LABELS[RADIOGRAPHY_REQUEST_STATUS.PENDING] },
  { value: RADIOGRAPHY_REQUEST_STATUS.IN_PROGRESS, label: RADIOGRAPHY_REQUEST_STATUS_LABELS[RADIOGRAPHY_REQUEST_STATUS.IN_PROGRESS] },
  { value: RADIOGRAPHY_REQUEST_STATUS.COMPLETED, label: RADIOGRAPHY_REQUEST_STATUS_LABELS[RADIOGRAPHY_REQUEST_STATUS.COMPLETED] },
  { value: RADIOGRAPHY_REQUEST_STATUS.DELIVERED, label: RADIOGRAPHY_REQUEST_STATUS_LABELS[RADIOGRAPHY_REQUEST_STATUS.DELIVERED] },
  { value: RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN, label: RADIOGRAPHY_REQUEST_STATUS_LABELS[RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN] }
];

const formatLima = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  } catch {
    return iso;
  }
};

const ImagingOrdersAdmin = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | RadiographyRequestStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filters: any = { limit: 500 };
      if (statusFilter !== 'all') filters.request_status = statusFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      const res = await radiographyApi.getAllOrdersForAdmin(filters);
      setOrders((res.data as AdminOrderRow[]) || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const s = search.toLowerCase();
    return orders.filter(o =>
      (o.patient_name || '').toLowerCase().includes(s) ||
      (o.dentist_name || '').toLowerCase().includes(s) ||
      (o.branch_name || '').toLowerCase().includes(s) ||
      (o.identification_number || '').toLowerCase().includes(s) ||
      String(o.radiography_request_id).includes(s)
    );
  }, [orders, search]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const k = o.request_status || 'unknown';
      counts[k] = (counts[k] || 0) + 1;
    }
    return {
      total: orders.length,
      pending: counts[RADIOGRAPHY_REQUEST_STATUS.PENDING] || 0,
      inProgress: counts[RADIOGRAPHY_REQUEST_STATUS.IN_PROGRESS] || 0,
      completed: (counts[RADIOGRAPHY_REQUEST_STATUS.COMPLETED] || 0) + (counts[RADIOGRAPHY_REQUEST_STATUS.DELIVERED] || 0),
      rejected: counts[RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN] || 0
    };
  }, [orders]);

  const handleReactivate = async (orderId: number) => {
    if (!confirm('¿Reactivar esta orden? Volverá a estado pendiente para el técnico.')) return;
    try {
      setReactivatingId(orderId);
      await radiographyApi.reactivateRadiographyRequest(orderId);
      toast.success('Orden reactivada — vuelve a estado pendiente');
      await loadOrders();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo reactivar');
    } finally {
      setReactivatingId(null);
    }
  };

  /**
   * Devuelve los items seleccionados (tomografía + radiografías) a partir del request_data
   * usando la misma fuente que el step del doctor: el breakdown construido por
   * `buildBreakdownFromFormData`. Si la solicitud ya tiene `pricing_data.breakdown`, lo usamos
   * tal cual (es lo que el doctor envió al guardar).
   */
  const getSelectedItems = (o: AdminOrderRow): Array<{ category: string; itemName: string; quantity: number; basePrice?: number; subtotal?: number }> => {
    const pricingBreakdown = o.pricing_data?.breakdown;
    if (Array.isArray(pricingBreakdown) && pricingBreakdown.length > 0) {
      return pricingBreakdown.map((it: any) => ({
        category: it.category || '',
        itemName: it.itemName || it.service || it.itemKey || '',
        quantity: it.quantity ?? 1,
        basePrice: it.basePrice ?? it.price,
        subtotal: it.subtotal
      }));
    }
    // Fallback: reconstruir desde request_data si no hay breakdown.
    // Pasamos pricings vacíos (Record<string, number>) — los nombres se mantienen aunque
    // los precios queden en 0; el SA puede ver al menos qué seleccionó el doctor.
    const tomografia3D = o.request_data?.tomografia3D;
    const radiografias = o.request_data?.radiografias;
    if (tomografia3D || radiografias) {
      try {
        const items = buildBreakdownFromFormData(
          { tomografia3D, radiografias },
          {} as Record<string, number>,
          {} as Record<string, number>
        );
        return items.map((it) => ({
          category: it.category || '',
          itemName: it.itemName || '',
          quantity: it.quantity ?? 1,
          basePrice: it.price,
          subtotal: it.price * (it.quantity || 1)
        }));
      } catch {
        return [];
      }
    }
    return [];
  };

  /**
   * Exportación a Excel — usa el patrón estándar del proyecto (HTML + MIME ms-excel)
   * y genera archivo .xls compatible con Microsoft Excel y LibreOffice Calc.
   */
  const exportToExcel = () => {
    try {
      const themeColor = '#7c3aed';
      const escape = (v: any) =>
        String(v ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11px; }
            th { background-color: ${themeColor}; color: white; padding: 8px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; }
            tr:nth-child(even) { background-color: #f9fafb; }
            h2 { font-family: Calibri, Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h2>Órdenes de Imágenes</h2>
          <p>Generado el: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha solicitud</th>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Doctor</th>
                <th>Sede</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Selecciones</th>
                <th>Subtotal (S/)</th>
                <th>Precio final (S/)</th>
                <th>Rechazada por</th>
                <th>Fecha rechazo</th>
                <th>Motivo rechazo</th>
              </tr>
            </thead>
            <tbody>
      `;

      filtered.forEach(o => {
        const items = getSelectedItems(o);
        const selecciones = items.length > 0
          ? items.map(it => `${it.itemName}${it.quantity > 1 ? ` (x${it.quantity})` : ''}`).join(' · ')
          : '—';
        const subtotal = o.pricing_data?.subtotal ?? o.pricing_data?.suggestedPrice;
        const finalPrice = o.pricing_data?.finalPrice;
        const statusLabel = RADIOGRAPHY_REQUEST_STATUS_LABELS[(o.request_status || '') as RadiographyRequestStatus] || o.request_status || '';

        html += `
          <tr>
            <td>${o.radiography_request_id}</td>
            <td>${escape(formatLima(o.date_time_registration || o.request_date))}</td>
            <td>${escape(o.patient_name || '')}</td>
            <td>${escape(o.identification_number || '')}</td>
            <td>${escape(o.dentist_name || '')}</td>
            <td>${escape(o.branch_name || '')}</td>
            <td>${escape(o.radiography_type || '')}</td>
            <td>${escape(statusLabel)}</td>
            <td>${escape(selecciones)}</td>
            <td>${subtotal != null ? Number(subtotal).toFixed(2) : ''}</td>
            <td>${finalPrice != null ? Number(finalPrice).toFixed(2) : ''}</td>
            <td>${escape(o.rejected_by_name || '')}</td>
            <td>${escape(formatLima(o.rejected_at))}</td>
            <td>${escape((o.rejection_reason || '').replace(/[\r\n]+/g, ' '))}</td>
          </tr>
        `;
      });

      html += `</tbody></table></body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ordenes_imagenes_${new Date().toISOString().slice(0, 10)}.xls`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Exportado a Excel correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar a Excel');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 shadow-lg text-white flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Imágenes</h1>
            <p className="text-purple-100">
              {user?.role === 'super_admin'
                ? 'Vista completa de todas las órdenes de todas las sedes'
                : 'Vista de órdenes de tu sede'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
          { label: 'Pendientes', value: stats.pending, color: 'bg-amber-100 text-amber-800' },
          { label: 'En proceso', value: stats.inProgress, color: 'bg-blue-100 text-blue-800' },
          { label: 'Atendidas', value: stats.completed, color: 'bg-green-100 text-green-800' },
          { label: 'Rechazadas', value: stats.rejected, color: 'bg-red-100 text-red-800' }
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-sm opacity-80">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Paciente, doctor, sede, DNI o ID..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Solicitada</th>
                <th className="px-4 py-3 font-semibold">Paciente</th>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Sede</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No hay órdenes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(o => {
                  const status = (o.request_status || 'pending') as RadiographyRequestStatus;
                  const color = RADIOGRAPHY_REQUEST_STATUS_COLORS[status] || '#6B7280';
                  const label = RADIOGRAPHY_REQUEST_STATUS_LABELS[status] || status;
                  const rejected = isRejectedByTechnician(status);
                  return (
                    <tr key={o.radiography_request_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">#{o.radiography_request_id}</td>
                      <td className="px-4 py-3 text-gray-700">{formatLima(o.date_time_registration || o.request_date)}</td>
                      <td className="px-4 py-3 text-gray-900">
                        <div className="font-medium">{o.patient_name || '—'}</div>
                        {o.identification_number && (
                          <div className="text-xs text-gray-500">DNI: {o.identification_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{o.dentist_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{o.branch_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{o.radiography_type || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {label}
                        </span>
                        {rejected && o.rejection_reason && (
                          <div className="text-xs text-red-700 mt-1 line-clamp-1" title={o.rejection_reason}>
                            "{o.rejection_reason}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(o)}
                            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rejected && (
                            <button
                              onClick={() => handleReactivate(o.radiography_request_id)}
                              disabled={reactivatingId === o.radiography_request_id}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                              title="Reactivar — devuelve a pendiente"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-600 bg-gray-50">
          Mostrando {filtered.length} de {orders.length} órdenes
        </div>
      </div>

      {/* Modal de detalle — muestra TODO el contenido de la solicitud */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onReactivate={async (id) => {
            await handleReactivate(id);
            setSelected(null);
          }}
          isReactivating={reactivatingId === selected.radiography_request_id}
          getSelectedItems={getSelectedItems}
        />
      )}
    </motion.div>
  );
};

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
    <div className="text-xs text-gray-500 sm:w-40 flex-shrink-0">{label}</div>
    <div className="text-gray-900 break-words">{children}</div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
    <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>
    {children}
  </div>
);

interface OrderDetailModalProps {
  order: AdminOrderRow;
  onClose: () => void;
  onReactivate: (id: number) => Promise<void>;
  isReactivating: boolean;
  getSelectedItems: (o: AdminOrderRow) => Array<{ category: string; itemName: string; quantity: number; basePrice?: number; subtotal?: number }>;
}

const OrderDetailModal = ({ order, onClose, onReactivate, isReactivating, getSelectedItems }: OrderDetailModalProps) => {
  const status = (order.request_status || 'pending') as RadiographyRequestStatus;
  const color = RADIOGRAPHY_REQUEST_STATUS_COLORS[status] || '#6B7280';
  const statusLabel = RADIOGRAPHY_REQUEST_STATUS_LABELS[status] || status;

  // Datos del paciente y doctor desde request_data (ambos formatos: PanoCef y DiagnosticPlanStep)
  const requestData = order.request_data || {};
  const pricingData = order.pricing_data || {};
  const patientFromRD = requestData.patientData || requestData.patient || {};
  const doctorFromRD = requestData.doctorData || requestData.doctor || {};

  const items = getSelectedItems(order);
  const itemsByCategory = items.reduce<Record<string, typeof items>>((acc, it) => {
    const key = it.category || 'otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});
  const categoryLabels: Record<string, string> = {
    tomografia3D: 'Tomografía 3D',
    intraoral: 'Radiografías intraorales',
    extraoral: 'Radiografías extraorales',
    ortodoncias: 'Ortodoncia',
    analisis: 'Análisis cefalométricos',
    fotografias: 'Fotografías',
    otros: 'Otros'
  };

  const subtotal = pricingData.subtotal ?? pricingData.suggestedPrice;
  const finalPrice = pricingData.finalPrice;
  const pricingStatus = pricingData.status;
  const counterOffer = pricingData.counterOffer;

  const patientName = order.patient_name
    || (patientFromRD.nombre || `${patientFromRD.nombres || ''} ${patientFromRD.apellidos || ''}`.trim())
    || '—';
  const patientDni = order.identification_number || patientFromRD.dni || '';

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Orden #{order.radiography_request_id}</h3>
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {statusLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm">
          {/* Banner de rechazo */}
          {isRejectedByTechnician(order.request_status) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">Detalles del rechazo</p>
              <DetailRow label="Rechazada por">{order.rejected_by_name || '—'}</DetailRow>
              <DetailRow label="Fecha y hora">{formatLima(order.rejected_at)}</DetailRow>
              <DetailRow label="Motivo">{order.rejection_reason || '(sin motivo)'}</DetailRow>
            </div>
          )}

          {/* Información general */}
          <Section title="Información general">
            <DetailRow label="Solicitada">{formatLima(order.date_time_registration || order.request_date)}</DetailRow>
            <DetailRow label="Fecha solicitud">{formatDate(order.request_date)}</DetailRow>
            <DetailRow label="Última modificación">{formatLima(order.date_time_modification)}</DetailRow>
            <DetailRow label="Tipo de estudio">{order.radiography_type || '—'}</DetailRow>
            <DetailRow label="Sede">{order.branch_name || '—'}</DetailRow>
            {order.performed_by_name && (
              <DetailRow label="Atendida por">{order.performed_by_name} el {formatDate(order.performed_date)}</DetailRow>
            )}
          </Section>

          {/* Paciente */}
          <Section title="Paciente">
            <DetailRow label="Nombre">{patientName}</DetailRow>
            {patientDni && <DetailRow label="DNI">{patientDni}</DetailRow>}
            {patientFromRD.edad && <DetailRow label="Edad">{patientFromRD.edad} años</DetailRow>}
            {patientFromRD.telefono && <DetailRow label="Teléfono">{patientFromRD.telefono}</DetailRow>}
            {patientFromRD.email && <DetailRow label="Email">{patientFromRD.email}</DetailRow>}
            {patientFromRD.motivoConsulta && <DetailRow label="Motivo de consulta">{patientFromRD.motivoConsulta}</DetailRow>}
            {patientFromRD.fechaNacimiento && <DetailRow label="Fecha nacimiento">{patientFromRD.fechaNacimiento}</DetailRow>}
          </Section>

          {/* Doctor solicitante */}
          <Section title="Doctor solicitante">
            <DetailRow label="Nombre">
              {order.dentist_name
                || doctorFromRD.doctor
                || doctorFromRD.nombre
                || `${doctorFromRD.nombres || ''} ${doctorFromRD.apellidos || ''}`.trim()
                || '—'}
            </DetailRow>
            {doctorFromRD.cop && <DetailRow label="COP">{doctorFromRD.cop}</DetailRow>}
            {doctorFromRD.colegiatura && <DetailRow label="Colegiatura">{doctorFromRD.colegiatura}</DetailRow>}
            {doctorFromRD.especialidad && <DetailRow label="Especialidad">{doctorFromRD.especialidad}</DetailRow>}
            {doctorFromRD.email && <DetailRow label="Email">{doctorFromRD.email}</DetailRow>}
            {doctorFromRD.telefono && <DetailRow label="Teléfono">{doctorFromRD.telefono}</DetailRow>}
            {doctorFromRD.direccion && <DetailRow label="Dirección">{doctorFromRD.direccion}</DetailRow>}
          </Section>

          {/* Indicación clínica */}
          {(order as any).clinical_indication && (
            <Section title="Indicación clínica">
              <p className="text-gray-800 whitespace-pre-wrap">{(order as any).clinical_indication}</p>
            </Section>
          )}
          {(order as any).area_of_interest && (
            <Section title="Área de interés">
              <p className="text-gray-800 whitespace-pre-wrap">{(order as any).area_of_interest}</p>
            </Section>
          )}
          {(order as any).notes && (
            <Section title="Notas">
              <p className="text-gray-800 whitespace-pre-wrap">{(order as any).notes}</p>
            </Section>
          )}

          {/* Selecciones por categoría */}
          {items.length > 0 ? (
            <Section title={`Estudios solicitados (${items.length})`}>
              {Object.entries(itemsByCategory).map(([cat, list]) => (
                <div key={cat} className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-1">
                    {categoryLabels[cat] || cat}
                  </p>
                  <ul className="space-y-1">
                    {list.map((it, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 text-gray-800 text-sm pl-2 border-l-2 border-purple-300">
                        <span>
                          {it.itemName}
                          {it.quantity > 1 && <span className="text-gray-500 ml-1">× {it.quantity}</span>}
                        </span>
                        {it.basePrice != null && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            S/ {Number(it.basePrice).toFixed(2)}
                            {it.quantity > 1 && it.subtotal != null && (
                              <> = <span className="font-medium text-gray-700">S/ {Number(it.subtotal).toFixed(2)}</span></>
                            )}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Section>
          ) : (
            <Section title="Estudios solicitados">
              <p className="text-gray-500 italic">No se registraron selecciones de estudios.</p>
            </Section>
          )}

          {/* Pricing */}
          {(subtotal != null || finalPrice != null || counterOffer || pricingStatus) && (
            <Section title="Información de precios">
              {subtotal != null && <DetailRow label="Subtotal">S/ {Number(subtotal).toFixed(2)}</DetailRow>}
              {pricingData.suggestedPrice != null && pricingData.suggestedPrice !== subtotal && (
                <DetailRow label="Precio sugerido">S/ {Number(pricingData.suggestedPrice).toFixed(2)}</DetailRow>
              )}
              {counterOffer && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 my-2">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Contraoferta del técnico</p>
                  <DetailRow label="Precio">S/ {Number(counterOffer.price).toFixed(2)}</DetailRow>
                  {counterOffer.userName && <DetailRow label="Por">{counterOffer.userName}</DetailRow>}
                  {counterOffer.createdAt && <DetailRow label="Fecha">{formatLima(counterOffer.createdAt)}</DetailRow>}
                </div>
              )}
              {finalPrice != null && (
                <DetailRow label="Precio final">
                  <span className="font-semibold text-gray-900">S/ {Number(finalPrice).toFixed(2)}</span>
                </DetailRow>
              )}
              {pricingStatus && <DetailRow label="Estado de pricing">{pricingStatus}</DetailRow>}
              {pricingData.discountPercentage != null && pricingData.discountPercentage > 0 && (
                <DetailRow label="Descuento">{pricingData.discountPercentage}%</DetailRow>
              )}
              {pricingData.discountReason && (
                <DetailRow label="Razón del descuento">{pricingData.discountReason}</DetailRow>
              )}
              {pricingData.paidAt && (
                <DetailRow label="Pagado el">{formatLima(pricingData.paidAt)}</DetailRow>
              )}
            </Section>
          )}

          {/* Hallazgos */}
          {(order as any).findings && (
            <Section title="Hallazgos del técnico">
              <p className="text-gray-800 whitespace-pre-wrap">{(order as any).findings}</p>
            </Section>
          )}
        </div>

        {/* Footer sticky */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
          {isRejectedByTechnician(order.request_status) && (
            <button
              onClick={() => onReactivate(order.radiography_request_id)}
              disabled={isReactivating}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reactivar a pendiente
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagingOrdersAdmin;
