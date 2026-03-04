import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Percent,
  Gift,
  Edit3,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Target,
  Image,
  AlertCircle,
  Star,
  X,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSede } from '@/hooks/useSede';
import type { ClinicService } from '@/types';
import { PromotionApiService, type Promotion } from '../services/promotionApiService';
import { Modal } from '@/components/common/Modal';
import { dentalProceduresApi, type DentalProcedureData } from '@/services/api/dentalProceduresApi';
import { subProceduresApi, type SubProcedureData } from '@/services/api/subProceduresApi';
import { treatmentPacksApi, type TreatmentPack } from '@/services/api/treatmentPacksApi';
import {
  PROMOTION_DISCOUNT_TYPES,
  PROMOTION_DISCOUNT_TYPE_CONFIG,
  PROMOTION_FORM_FIELDS,
  PROMOTION_VALIDATION_MESSAGES,
  PROMOTION_CURRENCY_CONFIG
} from '@/constants/promotions';
import { branchesApi } from '@/services/api/branchesApi';

const Promotions = () => {
  const { user } = useAuth();
  const { sedeActual, obtenerFiltroSede } = useSede();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Control de permisos basado en roles
  // Solo el superadmin puede crear, editar y eliminar promociones
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const canCreatePromotions = isSuperAdmin;
  const userSedeId = obtenerFiltroSede();

  // Helper para verificar si se puede editar una promoción específica
  // Solo el superadmin puede editar promociones
  const canEditPromotion = (_promotion: any) => {
    return isSuperAdmin;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<ClinicService[]>([]);

  // Estados para procedimientos dentales, sub-procedimientos y tratamientos
  const [dentalProcedures, setDentalProcedures] = useState<DentalProcedureData[]>([]);
  const [subProcedures, setSubProcedures] = useState<SubProcedureData[]>([]);
  const [treatmentPacks, setTreatmentPacks] = useState<TreatmentPack[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceTab, setServiceTab] = useState<'procedures' | 'subprocedures' | 'treatments'>('procedures');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [sedes, setSedes] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '', // Código personalizable
    discountType: PROMOTION_DISCOUNT_TYPES.PERCENTAGE as keyof typeof PROMOTION_DISCOUNT_TYPES,
    discountValue: 0,
    minPurchaseAmount: undefined as number | undefined, // Monto mínimo de compra
    maxDiscountAmount: undefined as number | undefined, // Descuento máximo aplicable
    services: [] as string[],
    startDate: formatDateToYMD(new Date()),
    endDate: formatDateToYMD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    isActive: true,
    isStackable: false, // Puede combinarse con otras promociones
    usageLimit: undefined as number | undefined,
    usageLimitPerPatient: undefined as number | undefined, // Límite por paciente
    conditions: [] as string[],
    createdBy: user?.id || 'admin',
    sedeId: isSuperAdmin ? undefined : userSedeId,
    targetAudience: 'all' as 'all' | 'new_clients' | 'continuing_clients'
  });

  const [newCondition, setNewCondition] = useState('');
  const [newService, setNewService] = useState('');

  // Load promotions and services from API
  useEffect(() => {
    loadPromotions();
  }, [userSedeId]);

  // Cargar sedes para super_admin
  useEffect(() => {
    const loadSedes = async () => {
      if (isSuperAdmin) {
        try {
          const response = await branchesApi.getBranches();
          setSedes(response.data.map(s => ({
            id: s.branch_id?.toString() || '',
            name: s.branch_name || ''
          })));
        } catch (error) {
          console.error('Error al cargar sedes:', error);
        }
      }
    };
    loadSedes();
  }, [isSuperAdmin]);

  // Cargar procedimientos dentales, sub-procedimientos y tratamientos
  useEffect(() => {
    const loadServicesData = async () => {
      setLoadingServices(true);
      try {
        // Cargar procedimientos dentales, sub-procedimientos y tratamientos en paralelo
        const [proceduresResponse, subProceduresResponse, treatmentsResponse] = await Promise.all([
          dentalProceduresApi.getActiveProcedures(),
          subProceduresApi.getSubProcedures({ is_active: true }),
          treatmentPacksApi.getTreatmentPacks({ is_active: true, limit: 1000 })
        ]);

        setDentalProcedures(proceduresResponse);
        setSubProcedures(subProceduresResponse.data || []);
        setTreatmentPacks(treatmentsResponse.data || []);

        // Mapear a formato ClinicService para compatibilidad con el resto del código
        const mappedServices: ClinicService[] = [
          ...proceduresResponse.map(p => ({
            id: `proc_${p.dental_procedure_id}`,
            name: p.procedure_name,
            description: p.description || '',
            category: p.procedure_category || 'Procedimiento Dental',
            serviceType: 'treatment' as const,
            price: Number(p.default_price) || 0,
            advancePayment: 0,
            duration: p.estimated_duration || 30,
            status: 'active' as const,
            requiresSpecialist: false,
            isEmergency: false,
            createdBy: 'system',
            availableForAllSedes: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          ...(subProceduresResponse.data || []).map(sp => ({
            id: `subproc_${sp.sub_procedure_id}`,
            name: sp.sub_procedure_name,
            description: sp.description || '',
            category: sp.specialty || 'Sub-Procedimiento',
            serviceType: 'treatment' as const,
            price: Number(sp.price_without_plan) || 0,
            advancePayment: 0,
            duration: sp.estimated_duration || 30,
            status: 'active' as const,
            requiresSpecialist: false,
            isEmergency: false,
            createdBy: 'system',
            availableForAllSedes: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          ...(treatmentsResponse.data || []).map(t => ({
            id: `treat_${t.treatment_id}`,
            name: t.treatment_name,
            description: t.description || '',
            category: t.treatment_category || 'Tratamiento',
            serviceType: 'treatment' as const,
            price: Number(t.total_price) || Number(t.base_price) || 0,
            advancePayment: 0,
            duration: t.estimated_duration || 60,
            status: 'active' as const,
            requiresSpecialist: false,
            isEmergency: false,
            createdBy: 'system',
            availableForAllSedes: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        ];

        setAvailableServices(mappedServices);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        toast.error('Error al cargar procedimientos y sub-procedimientos');
      } finally {
        setLoadingServices(false);
      }
    };

    loadServicesData();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {

      const filters = isSuperAdmin
        ? {}
        : { branchId: userSedeId ? parseInt(userSedeId) : undefined };

      const data = await PromotionApiService.loadPromotions(filters);
      setPromotions(data);

    } catch (error) {
      toast.error('Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || formData.discountValue <= 0) {
      toast.error(PROMOTION_VALIDATION_MESSAGES.TITLE_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      const branchId = formData.sedeId ? parseInt(formData.sedeId) : (userSedeId ? parseInt(userSedeId) : 1);

      if (editingPromotion) {
        await PromotionApiService.updatePromotion(editingPromotion.id, {
          ...formData,
          startDate: formData.startDate,
          endDate: formData.endDate,
          usageLimit: formData.usageLimit || undefined
        });
        toast.success('Promoción actualizada exitosamente');
      } else {
        const code = generatePromoCode();
        await PromotionApiService.createPromotion({
          ...formData,
          code,
          startDate: formData.startDate,
          endDate: formData.endDate,
          usageLimit: formData.usageLimit || undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }, branchId);
        toast.success('Promoción creada exitosamente');
      }

      await loadPromotions();
      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error('Error al guardar la promoción');
    } finally {
      setLoading(false);
    }
  };

  const generatePromoCode = () => {
    const prefix = formData.title.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${formData.discountValue}${random}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      code: '',
      discountType: PROMOTION_DISCOUNT_TYPES.PERCENTAGE,
      discountValue: 0,
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined,
      services: [],
      startDate: formatDateToYMD(new Date()),
      endDate: formatDateToYMD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      isActive: true,
      isStackable: false,
      usageLimit: undefined,
      usageLimitPerPatient: undefined,
      conditions: [],
      createdBy: user?.id || 'admin',
      sedeId: isSuperAdmin ? undefined : userSedeId,
      targetAudience: 'all'
    });
    setEditingPromotion(null);
    setNewCondition('');
    setNewService('');
  };

  const handleEdit = (promotion: any) => {
    setFormData({
      ...promotion,
      startDate: formatDateToYMD(new Date(promotion.startDate)),
      endDate: formatDateToYMD(new Date(promotion.endDate)),
      targetAudience: promotion.targetAudience || 'all',
      sedeId: promotion.sedeId || (isSuperAdmin ? undefined : userSedeId)
    });
    setEditingPromotion(promotion);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta promoción?')) {
      try {
        await PromotionApiService.deletePromotion(id);
        toast.success('Promoción eliminada exitosamente');
        await loadPromotions();
      } catch (error) {
        toast.error('Error al eliminar la promoción');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const handleCopyPromoLink = (code: string) => {
    const promoLink = `${window.location.origin}/promo/${code}`;
    navigator.clipboard.writeText(promoLink);
    toast.success('Link de promoción copiado al portapapeles');
  };

  // Calcular el total de los servicios seleccionados
  const calculateSelectedServicesTotal = () => {
    return formData.services.reduce((total, serviceId) => {
      const service = availableServices.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  // Calcular el descuento y precio final
  const calculatePriceBreakdown = () => {
    const originalPrice = calculateSelectedServicesTotal();
    let discountAmount = 0;
    let finalPrice = originalPrice;

    if (originalPrice > 0 && formData.discountValue > 0) {
      if (formData.discountType === PROMOTION_DISCOUNT_TYPES.PERCENTAGE) {
        // Descuento porcentual
        discountAmount = (originalPrice * formData.discountValue) / 100;
        finalPrice = originalPrice - discountAmount;
      } else if (formData.discountType === PROMOTION_DISCOUNT_TYPES.FIXED) {
        // Descuento fijo
        discountAmount = Math.min(formData.discountValue, originalPrice);
        finalPrice = originalPrice - discountAmount;
      }
    }

    // Asegurar que el precio final no sea negativo
    finalPrice = Math.max(0, finalPrice);

    return {
      originalPrice,
      discountAmount,
      finalPrice,
      discountPercentage: originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0
    };
  };

  // Formatear precio con separador de miles (ej: 1,150.00)
  const formatPrice = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  // Filtrar promociones según rol y sede (filtrado local, ya que promotions ya está cargado)
  const visiblePromotions = isSuperAdmin
    ? promotions
    : promotions.filter(p => p.sedeId === userSedeId);

  // Filtrar promociones
  const filteredPromotions = visiblePromotions.filter(promotion => {
    const matchesSearch = promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (promotion.code && promotion.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const now = new Date();
    let matchesFilter = true;

    switch (filterStatus) {
      case 'active':
        matchesFilter = promotion.isActive &&
                       new Date(promotion.startDate) <= now &&
                       new Date(promotion.endDate) >= now;
        break;
      case 'inactive':
        matchesFilter = !promotion.isActive;
        break;
      case 'expired':
        matchesFilter = new Date(promotion.endDate) < now;
        break;
    }

    return matchesSearch && matchesFilter;
  });

  // Estadísticas basadas en promociones visibles
  const stats = {
    total: visiblePromotions.length,
    active: visiblePromotions.filter(p => {
      const now = new Date();
      return p.isActive &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now &&
        (!p.usageLimit || (p.usageCount || 0) < p.usageLimit);
    }).length,
    totalUsage: visiblePromotions.reduce((sum, p) => sum + (p.usageCount || 0), 0),
    averageDiscount: visiblePromotions.length > 0
      ? visiblePromotions.reduce((sum, p) => sum + (p.discountValue || 0), 0) / visiblePromotions.length
      : 0
  };

  const getStatusBadge = (promotion: any) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return { icon: XCircle, text: 'Inactiva', color: 'bg-gray-100 text-gray-600' };
    }
    if (endDate < now) {
      return { icon: Clock, text: 'Expirada', color: 'bg-red-100 text-red-600' };
    }
    if (startDate > now) {
      return { icon: Clock, text: 'Programada', color: 'bg-yellow-100 text-yellow-600' };
    }
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return { icon: XCircle, text: 'Agotada', color: 'bg-orange-100 text-orange-600' };
    }
    return { icon: CheckCircle, text: 'Activa', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                <Tag className="w-8 h-8 text-white" />
              </div>
              Promociones
            </h1>
            <div className="mt-2 flex items-center gap-4">
              <p className="text-gray-600">Gestiona las ofertas y descuentos del centro</p>
              {isAdmin && sedeActual && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  <Target className="w-4 h-4" />
                  {sedeActual.nombre}
                </span>
              )}
              {isAdmin && !isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  Modo Lectura
                </span>
              )}
            </div>
          </div>
          {canCreatePromotions && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nueva Promoción
            </motion.button>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 p-5 rounded-xl border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Promociones</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 p-5 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Activas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-5 rounded-xl border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Usos Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsage}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-orange-50 p-5 rounded-xl border border-orange-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Descuento Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{Number(stats.averageDiscount || 0).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Percent className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descripción o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'inactive', 'expired'] as const).map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todas' :
                 status === 'active' ? 'Activas' :
                 status === 'inactive' ? 'Inactivas' : 'Expiradas'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Lista de promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPromotions.map((promotion, index) => {
            const status = getStatusBadge(promotion);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={promotion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Header */}
                <div className={`p-4 ${
                  promotion.discountType === 'percentage' ? 'bg-blue-500' :
                  promotion.discountType === 'fixed' ? 'bg-cyan-500' :
                  'bg-green-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{promotion.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {promotion.discountType === 'percentage' ? `${promotion.discountValue}%` :
                         promotion.discountType === 'fixed' ? `S/ ${promotion.discountValue}` :
                         'Especial'}
                      </div>
                      <div className="text-white/80 text-sm">
                        {promotion.discountType === 'percentage' ? 'Descuento' :
                         promotion.discountType === 'fixed' ? 'Descuento' :
                         'Promoción'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{promotion.description}</p>

                  {/* Código de promoción */}
                  {promotion.code && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <code className="flex-1 font-mono font-bold text-gray-800">{promotion.code}</code>
                        <button
                          onClick={() => handleCopyCode(promotion.code!)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copiar código"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleCopyPromoLink(promotion.code!)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link de Promoción
                      </button>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {promotion.usageLimit && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Usos: {promotion.usageCount} / {promotion.usageLimit}</span>
                      </div>
                    )}


                  </div>

                  {/* Servicios aplicables */}
                  {promotion.services.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Aplica para:</p>
                      <div className="flex flex-wrap gap-1">
                        {promotion.services.slice(0, 3).map((serviceId, idx) => {
                          const service = availableServices.find(s => s.id === serviceId);
                          return (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {service?.name || serviceId}
                            </span>
                          );
                        })}
                        {promotion.services.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{promotion.services.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {canEditPromotion(promotion) ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(promotion)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(promotion.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </motion.button>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-lg font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Solo lectura
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Estado vacío */}
      {filteredPromotions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron promociones con esos criterios' : 'Comienza creando tu primera promoción'}
          </p>
          {canCreatePromotions && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Promoción
            </button>
          )}
        </motion.div>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        size="xl"
        closeOnBackdropClick={!loading}
        closeOnEscape={!loading}
        showCloseButton={false}
      >
        {/* Header Fijo */}
        <Modal.Header className="bg-blue-600 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </h2>
                <p className="text-sm text-white/80">Complete los datos de la promoción</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Modal.Header>

        {/* Content con scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Modal.Body className="overflow-y-auto">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {PROMOTION_FORM_FIELDS.title.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={PROMOTION_FORM_FIELDS.title.placeholder}
                  maxLength={PROMOTION_FORM_FIELDS.title.maxLength}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Promoción
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Ej: VERANO2025 (auto-genera si vacío)"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si lo dejas vacío, se generará automáticamente
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {PROMOTION_FORM_FIELDS.description.label} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={PROMOTION_FORM_FIELDS.description.placeholder}
                maxLength={PROMOTION_FORM_FIELDS.description.maxLength}
                required
              />
            </div>

            {/* Tipo y valor de descuento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {PROMOTION_FORM_FIELDS.discountType.label} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PROMOTION_DISCOUNT_TYPE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {PROMOTION_FORM_FIELDS.discountValue.label} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {PROMOTION_DISCOUNT_TYPE_CONFIG[formData.discountType]?.symbol || PROMOTION_CURRENCY_CONFIG.CURRENCY_SYMBOL}
                  </span>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={PROMOTION_FORM_FIELDS.discountValue.min}
                    step={PROMOTION_DISCOUNT_TYPE_CONFIG[formData.discountType]?.step || "0.01"}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Montos adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Mínimo de Compra
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                  <input
                    type="number"
                    value={formData.minPurchaseAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) || undefined })}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Sin mínimo"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La promoción solo aplica si la compra supera este monto
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento Máximo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || undefined })}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Sin límite"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tope máximo del descuento (útil para % en compras grandes)
                </p>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            {/* Límites */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite Total de Usos
                </label>
                <input
                  type="number"
                  value={formData.usageLimit || ''}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Sin límite"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo de veces que se puede usar en total
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite por Paciente
                </label>
                <input
                  type="number"
                  value={formData.usageLimitPerPatient || ''}
                  onChange={(e) => setFormData({ ...formData, usageLimitPerPatient: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Sin límite"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo de veces por cada paciente
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
                  <input
                    type="checkbox"
                    checked={formData.isStackable}
                    onChange={(e) => setFormData({ ...formData, isStackable: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Acumulable</span>
                    <p className="text-xs text-gray-500">
                      Puede combinarse con otras promociones
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Segmentación de Audiencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Audiencia Objetivo
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as 'all' | 'new_clients' | 'continuing_clients' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los pacientes</option>
                  <option value="new_clients">Solo clientes nuevos (sin citas previas)</option>
                  <option value="continuing_clients">Solo clientes continuadores (con citas previas)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define a qué tipo de pacientes aplica esta promoción
                </p>
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Sede
                  </label>
                  <select
                    value={formData.sedeId || ''}
                    onChange={(e) => setFormData({ ...formData, sedeId: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las sedes</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>{sede.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona una sede específica o déjala vacía para todas
                  </p>
                </div>
              )}
            </div>

            {/* Servicios aplicables - Procedimientos y Sub-procedimientos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Procedimientos Aplicables
              </label>

              {loadingServices ? (
                <div className="p-8 text-center border border-gray-200 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Cargando procedimientos...</p>
                </div>
              ) : (dentalProcedures.length > 0 || subProcedures.length > 0) ? (
                <>
                  {/* Tabs para tipo de servicio */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setServiceTab('procedures')}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        serviceTab === 'procedures'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Procedimientos ({dentalProcedures.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceTab('subprocedures')}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        serviceTab === 'subprocedures'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sub-Procedimientos ({subProcedures.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceTab('treatments')}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        serviceTab === 'treatments'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Tratamientos ({treatmentPacks.length})
                    </button>
                  </div>

                  {/* Búsqueda dentro de servicios */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar procedimiento..."
                      value={serviceSearchTerm}
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Lista de procedimientos/tratamientos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {serviceTab === 'procedures' && (
                      dentalProcedures
                        .filter(p =>
                          p.procedure_name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                          (p.procedure_code && p.procedure_code.toLowerCase().includes(serviceSearchTerm.toLowerCase())) ||
                          (p.procedure_category && p.procedure_category.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                        )
                        .map((procedure) => {
                          const serviceId = `proc_${procedure.dental_procedure_id}`;
                          const isSelected = formData.services.includes(serviceId);
                          return (
                            <label
                              key={serviceId}
                              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(serviceId)}
                                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-gray-700 font-medium truncate">{procedure.procedure_name}</span>
                                  <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                                    S/ {formatPrice(Number(procedure.default_price || 0))}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {procedure.procedure_code && (
                                    <span className="text-xs text-blue-600 font-mono">{procedure.procedure_code}</span>
                                  )}
                                  <span className="text-xs text-gray-500">{procedure.procedure_category || 'Sin categoría'}</span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                    )}
                    {serviceTab === 'subprocedures' && (
                      subProcedures
                        .filter(sp =>
                          sp.sub_procedure_name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                          (sp.sub_procedure_code && sp.sub_procedure_code.toLowerCase().includes(serviceSearchTerm.toLowerCase())) ||
                          (sp.specialty && sp.specialty.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                        )
                        .map((subProc) => {
                          const serviceId = `subproc_${subProc.sub_procedure_id}`;
                          const isSelected = formData.services.includes(serviceId);
                          return (
                            <label
                              key={serviceId}
                              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(serviceId)}
                                className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-gray-700 font-medium truncate">{subProc.sub_procedure_name}</span>
                                  <span className="text-sm font-semibold text-teal-600 whitespace-nowrap">
                                    S/ {formatPrice(Number(subProc.price_without_plan || 0))}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {subProc.sub_procedure_code && (
                                    <span className="text-xs text-blue-600 font-mono">{subProc.sub_procedure_code}</span>
                                  )}
                                  <span className="text-xs text-gray-500">{subProc.specialty || 'Sin especialidad'}</span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                    )}
                    {serviceTab === 'treatments' && (
                      treatmentPacks
                        .filter(t =>
                          t.treatment_name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                          (t.treatment_code && t.treatment_code.toLowerCase().includes(serviceSearchTerm.toLowerCase())) ||
                          (t.treatment_category && t.treatment_category.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                        )
                        .map((treatment) => {
                          const serviceId = `treat_${treatment.treatment_id}`;
                          const isSelected = formData.services.includes(serviceId);
                          const price = Number(treatment.total_price) || Number(treatment.base_price) || 0;
                          return (
                            <label
                              key={serviceId}
                              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(serviceId)}
                                className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-gray-700 font-medium truncate">{treatment.treatment_name}</span>
                                  <span className="text-sm font-semibold text-purple-600 whitespace-nowrap">
                                    S/ {formatPrice(price)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {treatment.treatment_code && (
                                    <span className="text-xs text-purple-600 font-mono">{treatment.treatment_code}</span>
                                  )}
                                  <span className="text-xs text-gray-500">{treatment.treatment_category || 'Sin categoría'}</span>
                                  {treatment.is_pack && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Pack</span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })
                    )}
                  </div>

                  {/* Mostrar resumen de precios si hay servicios seleccionados */}
                  {formData.services.length > 0 && (() => {
                    const priceBreakdown = calculatePriceBreakdown();
                    const hasDiscount = formData.discountValue > 0;

                    return (
                      <div className="mt-3 space-y-3">
                        {/* Resumen de precios */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-800">
                              Resumen de Precios ({formData.services.length} procedimiento{formData.services.length > 1 ? 's' : ''})
                            </span>
                          </div>

                          {/* Precio Original */}
                          <div className="flex items-center justify-between py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Precio Original:</span>
                            <span className={`text-lg font-semibold ${hasDiscount ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              S/ {formatPrice(priceBreakdown.originalPrice)}
                            </span>
                          </div>

                          {/* Descuento (solo si hay valor) */}
                          {hasDiscount && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-200">
                              <span className="text-sm text-red-600 flex items-center gap-1">
                                <Percent className="w-4 h-4" />
                                Descuento ({formData.discountType === 'percentage' ? `${formData.discountValue}%` : `S/ ${formatPrice(formData.discountValue)}`}):
                              </span>
                              <span className="text-lg font-semibold text-red-600">
                                - S/ {formatPrice(priceBreakdown.discountAmount)}
                              </span>
                            </div>
                          )}

                          {/* Precio Final */}
                          <div className="flex items-center justify-between pt-3">
                            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              <Gift className="w-4 h-4 text-green-600" />
                              PRECIO PROMOCIONAL:
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                              S/ {formatPrice(priceBreakdown.finalPrice)}
                            </span>
                          </div>

                          {/* Porcentaje de ahorro */}
                          {hasDiscount && priceBreakdown.discountPercentage > 0 && (
                            <div className="mt-2 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                <TrendingUp className="w-4 h-4" />
                                El cliente ahorra {priceBreakdown.discountPercentage.toFixed(0)}%
                              </span>
                            </div>
                          )}

                          {/* Advertencia si descuento fijo excede precio */}
                          {formData.discountType === 'fixed' && formData.discountValue > priceBreakdown.originalPrice && (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                              <p className="text-xs text-yellow-700 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                El descuento fijo excede el precio original. Se aplicará descuento máximo.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Chips de procedimientos seleccionados */}
                        <div className="flex flex-wrap gap-1">
                          {formData.services.map(serviceId => {
                            const service = availableServices.find(s => s.id === serviceId);
                            const isProcedure = serviceId.startsWith('proc_');
                            const isSubProcedure = serviceId.startsWith('subproc_');
                            const isTreatment = serviceId.startsWith('treat_');

                            let chipClasses = 'bg-gray-100 text-gray-700';
                            if (isProcedure) chipClasses = 'bg-blue-100 text-blue-700';
                            else if (isSubProcedure) chipClasses = 'bg-teal-100 text-teal-700';
                            else if (isTreatment) chipClasses = 'bg-purple-100 text-purple-700';

                            return (
                              <span
                                key={serviceId}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${chipClasses}`}
                              >
                                {service?.name || serviceId}
                                <span className="text-xs opacity-70">
                                  (S/ {formatPrice(service?.price || 0)})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleService(serviceId)}
                                  className="hover:text-red-600 ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    No hay procedimientos activos disponibles. Primero debe crear procedimientos dentales o sub-procedimientos.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {PROMOTION_FORM_FIELDS.services.placeholder}
              </p>
            </div>

            {/* Condiciones */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {PROMOTION_FORM_FIELDS.conditions.label}
              </label>
              <div className="space-y-2">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={condition}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={PROMOTION_FORM_FIELDS.conditions.placeholder}
                  />
                  <button
                    type="button"
                    onClick={addCondition}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                {PROMOTION_FORM_FIELDS.isActive.label}
              </label>
            </div>
          </Modal.Body>
        </form>

        {/* Footer Fijo */}
        <Modal.Footer>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : editingPromotion ? 'Actualizar' : 'Crear'} Promoción
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Promotions;