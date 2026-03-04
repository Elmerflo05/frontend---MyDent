import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Layers,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  Loader2,
  Stethoscope,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Store para obtener condiciones del odontograma desde BD
import useOdontogramConfigStore from '@/store/odontogramConfigStore';

// INTEGRACION API REAL - Nuevas tablas de tratamientos
import treatmentPacksApi, {
  TreatmentPack,
  TreatmentConditionItem,
  TreatmentCustomItem
} from '@/services/api/treatmentPacksApi';

// INTEGRACION - Sub-procedimientos con precios por plan de salud
import { useSubProceduresStore } from '@/store/subProceduresStore';
import { SubProcedureData } from '@/services/api/subProceduresApi';

// Interface para sub-procedimientos seleccionados en el tratamiento
interface TreatmentSubProcedureItem {
  sub_procedure_id: number;
  sub_procedure_code: string | null;
  sub_procedure_name: string;
  specialty: string | null;
  quantity: number;
  unit_price: number; // Precio sin plan (base)
  discount_percentage?: number;
  discount_amount?: number;
}

// Interfaz para item de texto libre en el formulario
interface CustomItemForm {
  item_name: string;
  item_description: string;
  unit_price: number;
  quantity: number;
}

// Form data para crear/editar tratamiento
interface TreatmentFormData {
  treatment_name: string;
  description: string;
  treatment_category: string;
  condition_items: TreatmentConditionItem[];
  custom_items: TreatmentCustomItem[];
  sub_procedure_items: TreatmentSubProcedureItem[]; // Sub-procedimientos con precios por plan
  is_active: boolean;
}

const initialFormData: TreatmentFormData = {
  treatment_name: '',
  description: '',
  treatment_category: 'General',
  condition_items: [],
  custom_items: [],
  sub_procedure_items: [],
  is_active: true
};

const TreatmentManagement = () => {
  const { user } = useAuth();

  // Store de condiciones del odontograma (desde BD)
  const { dentalConditions, customConditions, loadCatalogsFromDB, isLoading: loadingStore } = useOdontogramConfigStore();
  const allConditions = [...dentalConditions, ...customConditions];

  // Estados principales
  const [treatments, setTreatments] = useState<TreatmentPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentPack | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<TreatmentPack | null>(null);

  // Form state
  const [formData, setFormData] = useState<TreatmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para agregar condición
  const [conditionSearchTerm, setConditionSearchTerm] = useState('');
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const conditionContainerRef = useRef<HTMLDivElement>(null);

  // Estado para seleccionar procedimiento de la condición
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const procedureContainerRef = useRef<HTMLDivElement>(null);

  // Estado para agregar item personalizado
  const [customItemForm, setCustomItemForm] = useState<CustomItemForm>({
    item_name: '',
    item_description: '',
    unit_price: 0,
    quantity: 1
  });
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  // Estado para sub-procedimientos
  const {
    subProcedures,
    specialties,
    loading: loadingSubProcedures,
    loadSubProcedures,
    loadSpecialties
  } = useSubProceduresStore();
  const [subProcedureSearchTerm, setSubProcedureSearchTerm] = useState('');
  const [showSubProcedureDropdown, setShowSubProcedureDropdown] = useState(false);
  const [selectedSubProcedure, setSelectedSubProcedure] = useState<SubProcedureData | null>(null);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('');
  const subProcedureContainerRef = useRef<HTMLDivElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadTreatments();
    // Cargar condiciones del odontograma si no estan cargadas
    if (allConditions.length === 0 && !loadingStore) {
      loadCatalogsFromDB();
    }
    // Cargar sub-procedimientos y especialidades
    loadSubProcedures({ is_active: true });
    loadSpecialties();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conditionContainerRef.current && !conditionContainerRef.current.contains(event.target as Node)) {
        setShowConditionDropdown(false);
      }
      if (procedureContainerRef.current && !procedureContainerRef.current.contains(event.target as Node)) {
        setShowProcedureDropdown(false);
      }
      if (subProcedureContainerRef.current && !subProcedureContainerRef.current.contains(event.target as Node)) {
        setShowSubProcedureDropdown(false);
      }
    };

    if (showConditionDropdown || showProcedureDropdown || showSubProcedureDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConditionDropdown, showProcedureDropdown, showSubProcedureDropdown]);

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const response = await treatmentPacksApi.getTreatmentPacks({
        order_by: 'treatment_name',
        order_dir: 'ASC',
        limit: 100
      });
      setTreatments(response.data || []);
    } catch (error) {
      console.error('Error cargando tratamientos:', error);
      toast.error('Error al cargar los tratamientos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.treatment_name.trim()) {
      newErrors.treatment_name = 'El nombre del tratamiento es requerido';
    }

    // Validar que tenga al menos un item (condicion, custom o sub-procedimiento)
    if (formData.condition_items.length === 0 &&
        formData.custom_items.length === 0 &&
        formData.sub_procedure_items.length === 0) {
      newErrors.items = 'Debe agregar al menos una condicion, sub-procedimiento o item adicional';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalPrice = (): number => {
    // Total de condiciones y items personalizados
    const conditionAndCustomTotal = treatmentPacksApi.calculatePackTotal({
      condition_items: formData.condition_items,
      custom_items: formData.custom_items
    });

    // Total de sub-procedimientos
    const subProcedureTotal = formData.sub_procedure_items.reduce((sum, item) => {
      const grossTotal = (item.quantity || 1) * (item.unit_price || 0);
      const discount = item.discount_amount || (grossTotal * (item.discount_percentage || 0) / 100);
      return sum + Math.max(grossTotal - discount, 0);
    }, 0);

    return conditionAndCustomTotal + subProcedureTotal;
  };

  // Filtrar condiciones según búsqueda
  const filteredConditions = allConditions.filter(condition =>
    condition.label.toLowerCase().includes(conditionSearchTerm.toLowerCase()) ||
    condition.code?.toLowerCase().includes(conditionSearchTerm.toLowerCase()) ||
    condition.condition_code?.toLowerCase().includes(conditionSearchTerm.toLowerCase())
  );

  const handleSelectCondition = (condition: any) => {
    console.log('🔍 Condición seleccionada:', condition);
    console.log('📋 Procedimientos:', condition.procedures);
    setSelectedCondition(condition);
    setConditionSearchTerm(condition.label);
    setShowConditionDropdown(false);
    // Limpiar procedimiento seleccionado anteriormente
    setSelectedProcedure(null);
    // Si la condición tiene procedimientos, abrir el dropdown de procedimientos
    if (condition.procedures && condition.procedures.length > 0) {
      setShowProcedureDropdown(true);
    }
  };

  const handleSelectProcedure = (procedure: any) => {
    console.log('🔍 Procedimiento seleccionado:', procedure);
    setSelectedProcedure(procedure);
    setShowProcedureDropdown(false);
  };

  const handleAddCondition = () => {
    if (!selectedCondition) return;

    // Verificar si la condición tiene procedimientos y si se seleccionó uno
    const hasProcedures = selectedCondition.procedures && selectedCondition.procedures.length > 0;
    if (hasProcedures && !selectedProcedure) {
      toast.error('Seleccione un procedimiento para esta condición');
      setShowProcedureDropdown(true);
      return;
    }

    // Verificar si ya existe la misma combinación condición + procedimiento
    const conditionId = selectedCondition.condition_id || parseInt(selectedCondition.id);
    const procedureId = selectedProcedure?.condition_procedure_id;

    const alreadyExists = formData.condition_items.some(c =>
      c.odontogram_condition_id === conditionId &&
      (procedureId ? c.condition_procedure_id === procedureId : !c.condition_procedure_id)
    );

    if (alreadyExists) {
      toast.error('Esta condición con este procedimiento ya ha sido agregada');
      return;
    }

    const newItem: TreatmentConditionItem = {
      odontogram_condition_id: conditionId,
      condition_code: selectedCondition.condition_code || selectedCondition.code || selectedCondition.id,
      condition_name: selectedCondition.label,
      condition_category: selectedCondition.category,
      condition_default_price: selectedCondition.price_base || selectedCondition.default_price || 0,
      // Agregar información del procedimiento seleccionado
      condition_procedure_id: selectedProcedure?.condition_procedure_id || null,
      procedure_name: selectedProcedure?.procedure_name || null,
      procedure_code: selectedProcedure?.procedure_code || null,
      quantity: 1,
      unit_price: selectedProcedure?.price_without_plan || selectedCondition.price_base || selectedCondition.default_price || 0,
      discount_percentage: 0,
      discount_amount: 0
    };

    setFormData(prev => ({
      ...prev,
      condition_items: [...prev.condition_items, newItem]
    }));

    // Limpiar selección
    setSelectedCondition(null);
    setSelectedProcedure(null);
    setConditionSearchTerm('');
    setShowProcedureDropdown(false);
    setErrors(prev => ({ ...prev, items: '' }));
    toast.success('Condición agregada correctamente');
  };

  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      condition_items: prev.condition_items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateCondition = (index: number, updates: Partial<TreatmentConditionItem>) => {
    setFormData(prev => ({
      ...prev,
      condition_items: prev.condition_items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  // Handlers para items personalizados
  const handleAddCustomItem = () => {
    if (!customItemForm.item_name.trim()) {
      toast.error('El nombre del item es requerido');
      return;
    }

    const newItem: TreatmentCustomItem = {
      item_name: customItemForm.item_name.trim(),
      item_description: customItemForm.item_description.trim() || null,
      quantity: customItemForm.quantity || 1,
      unit_price: customItemForm.unit_price || 0,
      discount_percentage: 0,
      discount_amount: 0
    };

    setFormData(prev => ({
      ...prev,
      custom_items: [...prev.custom_items, newItem]
    }));

    setCustomItemForm({
      item_name: '',
      item_description: '',
      unit_price: 0,
      quantity: 1
    });
    setShowCustomItemForm(false);
    setErrors(prev => ({ ...prev, items: '' }));
  };

  const handleRemoveCustomItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_items: prev.custom_items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateCustomItem = (index: number, updates: Partial<TreatmentCustomItem>) => {
    setFormData(prev => ({
      ...prev,
      custom_items: prev.custom_items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  // ============================================================================
  // HANDLERS PARA SUB-PROCEDIMIENTOS
  // ============================================================================

  // Filtrar sub-procedimientos segun busqueda y especialidad
  const filteredSubProcedures = subProcedures.filter(sp => {
    const matchesSearch = subProcedureSearchTerm === '' ||
      sp.sub_procedure_name.toLowerCase().includes(subProcedureSearchTerm.toLowerCase()) ||
      (sp.sub_procedure_code && sp.sub_procedure_code.toLowerCase().includes(subProcedureSearchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialtyFilter === '' ||
      sp.specialty === selectedSpecialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  const handleSelectSubProcedure = (subProcedure: SubProcedureData) => {
    setSelectedSubProcedure(subProcedure);
    setSubProcedureSearchTerm(subProcedure.sub_procedure_name);
    setShowSubProcedureDropdown(false);
  };

  const handleAddSubProcedure = () => {
    if (!selectedSubProcedure) return;

    // Verificar si ya existe
    if (formData.sub_procedure_items.some(sp => sp.sub_procedure_id === selectedSubProcedure.sub_procedure_id)) {
      toast.error('Este sub-procedimiento ya ha sido agregado');
      return;
    }

    const newItem: TreatmentSubProcedureItem = {
      sub_procedure_id: selectedSubProcedure.sub_procedure_id,
      sub_procedure_code: selectedSubProcedure.sub_procedure_code,
      sub_procedure_name: selectedSubProcedure.sub_procedure_name,
      specialty: selectedSubProcedure.specialty,
      quantity: 1,
      unit_price: selectedSubProcedure.price_without_plan || 0,
      discount_percentage: 0,
      discount_amount: 0
    };

    setFormData(prev => ({
      ...prev,
      sub_procedure_items: [...prev.sub_procedure_items, newItem]
    }));

    setSelectedSubProcedure(null);
    setSubProcedureSearchTerm('');
    setErrors(prev => ({ ...prev, items: '' }));
    toast.success('Sub-procedimiento agregado');
  };

  const handleRemoveSubProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sub_procedure_items: prev.sub_procedure_items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSubProcedure = (index: number, updates: Partial<TreatmentSubProcedureItem>) => {
    setFormData(prev => ({
      ...prev,
      sub_procedure_items: prev.sub_procedure_items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  // Formatear precio con informacion de planes disponibles
  const formatSubProcedurePrice = (sp: SubProcedureData): string => {
    const prices: string[] = [];
    prices.push(`Sin plan: S/ ${Number(sp.price_without_plan || 0).toFixed(2)}`);
    if (sp.price_plan_personal !== null) prices.push(`Personal: S/ ${Number(sp.price_plan_personal).toFixed(2)}`);
    if (sp.price_plan_familiar !== null) prices.push(`Familiar: S/ ${Number(sp.price_plan_familiar).toFixed(2)}`);
    return prices.join(' | ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const packData: Partial<TreatmentPack> = {
        treatment_name: formData.treatment_name.trim(),
        treatment_category: formData.treatment_category.trim() || 'General',
        description: formData.description.trim() || null,
        is_pack: true,
        is_active: formData.is_active,
        total_price: calculateTotalPrice(),
        condition_items: formData.condition_items,
        custom_items: formData.custom_items,
        sub_procedure_items: formData.sub_procedure_items
      };

      if (editingTreatment) {
        await treatmentPacksApi.updateTreatmentPack(editingTreatment.treatment_id!, packData);
        toast.success('Tratamiento actualizado exitosamente');
      } else {
        await treatmentPacksApi.createTreatmentPack(packData);
        toast.success('Tratamiento creado exitosamente');
      }

      await loadTreatments();
      closeModal();
    } catch (error: any) {
      console.error('Error guardando tratamiento:', error);
      const errorMessage = error.message || 'Error al guardar el tratamiento';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (treatment: TreatmentPack) => {
    try {
      setLoading(true);
      // Cargar tratamiento completo con items
      const response = await treatmentPacksApi.getTreatmentPackById(treatment.treatment_id!);
      const fullTreatment = response.data;

      setEditingTreatment(fullTreatment);
      setFormData({
        treatment_name: fullTreatment.treatment_name || '',
        description: fullTreatment.description || '',
        treatment_category: fullTreatment.treatment_category || 'General',
        condition_items: fullTreatment.condition_items || [],
        custom_items: fullTreatment.custom_items || [],
        sub_procedure_items: fullTreatment.sub_procedure_items || [],
        is_active: fullTreatment.is_active ?? true
      });
      setModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar el tratamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (treatment: TreatmentPack) => {
    try {
      await treatmentPacksApi.deleteTreatmentPack(treatment.treatment_id!);
      await loadTreatments();
      setDeleteConfirmModal(null);
      toast.success('Tratamiento eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el tratamiento');
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTreatment(null);
    setFormData(initialFormData);
    setErrors({});
    setSelectedCondition(null);
    setSelectedProcedure(null);
    setConditionSearchTerm('');
    setShowConditionDropdown(false);
    setShowProcedureDropdown(false);
    setShowCustomItemForm(false);
    setCustomItemForm({ item_name: '', item_description: '', unit_price: 0, quantity: 1 });
  };

  // Filtrar tratamientos por búsqueda
  const filteredTreatments = treatments.filter(treatment =>
    treatment.treatment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.treatment_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estadísticas
  const parsePrice = (price: any) => typeof price === 'string' ? parseFloat(price) : (price || 0);

  const stats = {
    total: treatments.length,
    activos: treatments.filter(t => t.is_active).length,
    inactivos: treatments.filter(t => !t.is_active).length,
    precioPromedio: treatments.length > 0
      ? treatments.reduce((sum, t) => sum + parsePrice(t.total_price), 0) / treatments.length
      : 0
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
    return `S/ ${(numPrice || 0).toFixed(2)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Tratamientos</h1>
              <p className="text-gray-600">Catálogo de tratamientos odontológicos</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nuevo Tratamiento
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inactivos</p>
                <p className="text-2xl font-bold text-gray-400">{stats.inactivos}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Precio Promedio</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.precioPromedio)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tratamiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {loading && !modalOpen ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando tratamientos...</p>
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron tratamientos' : 'No hay tratamientos registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primer tratamiento'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Tratamiento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tratamiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Componentes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Precio Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTreatments.map((treatment, index) => (
                  <motion.tr
                    key={treatment.treatment_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{treatment.treatment_name}</p>
                        {treatment.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{treatment.description}</p>
                        )}
                        {treatment.treatment_category && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {treatment.treatment_category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {treatment.condition_items_count && treatment.condition_items_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            <Layers className="w-3 h-3 mr-1" />
                            {treatment.condition_items_count} condición(es)
                          </span>
                        )}
                        {treatment.sub_procedure_items_count && treatment.sub_procedure_items_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            {treatment.sub_procedure_items_count} sub-proc.
                          </span>
                        )}
                        {treatment.custom_items_count && treatment.custom_items_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            <Package className="w-3 h-3 mr-1" />
                            {treatment.custom_items_count} item(s)
                          </span>
                        )}
                        {(!treatment.condition_items_count && !treatment.custom_items_count && !treatment.sub_procedure_items_count) && (
                          <span className="text-gray-400 text-xs">Sin componentes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {formatPrice(treatment.total_price || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          treatment.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {treatment.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmModal(treatment)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Form */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {editingTreatment ? 'Modifica la información del tratamiento' : 'Crea un nuevo tratamiento odontológico'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Error General */}
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Error</p>
                      <p className="text-sm text-red-700">{errors.general}</p>
                    </div>
                  </div>
                )}

                {/* Información Básica */}
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Información del Tratamiento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Tratamiento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.treatment_name}
                        onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                        placeholder="Ej: Levantamiento de mordida, Ortodoncia completa..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          errors.treatment_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.treatment_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.treatment_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <input
                        type="text"
                        value={formData.treatment_category}
                        onChange={(e) => setFormData({ ...formData, treatment_category: e.target.value })}
                        placeholder="Ej: Ortodoncia, Implantes, General..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.is_active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción breve del tratamiento..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Condiciones del Odontograma */}
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Condiciones del Odontograma
                  </h3>

                  {/* Agregar Condición */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agregar Condición
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      {/* Selector de Condición */}
                      <div className="md:col-span-5 relative" ref={conditionContainerRef}>
                        <div className="relative">
                          <input
                            type="text"
                            value={conditionSearchTerm}
                            onChange={(e) => {
                              setConditionSearchTerm(e.target.value);
                              setShowConditionDropdown(true);
                              setSelectedCondition(null);
                              setSelectedProcedure(null);
                            }}
                            onFocus={() => setShowConditionDropdown(true)}
                            placeholder="1. Buscar condición..."
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              selectedCondition ? 'border-green-400 bg-green-50' : 'border-gray-300'
                            }`}
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          {loadingStore && (
                            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                          )}
                        </div>

                        {/* Dropdown de condiciones */}
                        {showConditionDropdown && !loadingStore && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {filteredConditions.length > 0 ? (
                              filteredConditions.slice(0, 20).map((condition: any) => {
                                const procedureCount = condition.procedures?.length || 0;
                                return (
                                  <button
                                    key={condition.condition_id || condition.id}
                                    type="button"
                                    onClick={() => handleSelectCondition(condition)}
                                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                                      selectedCondition?.id === condition.id ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-900">{condition.label}</span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {(condition.condition_code || condition.code) && (
                                          <span className="text-xs text-gray-500">
                                            {condition.condition_code || condition.code}
                                          </span>
                                        )}
                                        {condition.category && (
                                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                            {condition.category}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        procedureCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {procedureCount} proc.
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-4 py-6 text-center">
                                <p className="text-gray-500 text-sm">
                                  {conditionSearchTerm
                                    ? 'No se encontraron condiciones'
                                    : allConditions.length === 0
                                      ? 'Cargando condiciones...'
                                      : 'Escribe para buscar condiciones'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selector de Procedimiento */}
                      <div className="md:col-span-5 relative" ref={procedureContainerRef}>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => selectedCondition && setShowProcedureDropdown(!showProcedureDropdown)}
                            disabled={!selectedCondition || !(selectedCondition.procedures?.length > 0)}
                            className={`w-full px-4 py-2 text-left border rounded-lg flex items-center justify-between transition-colors ${
                              !selectedCondition
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : selectedProcedure
                                  ? 'bg-green-50 border-green-400 text-gray-900'
                                  : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400'
                            }`}
                          >
                            <span className="truncate">
                              {!selectedCondition
                                ? '2. Primero seleccione condición'
                                : selectedCondition.procedures?.length === 0
                                  ? 'Sin procedimientos'
                                  : selectedProcedure
                                    ? selectedProcedure.procedure_name
                                    : '2. Seleccionar procedimiento...'}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${showProcedureDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Dropdown de procedimientos */}
                        {showProcedureDropdown && selectedCondition && selectedCondition.procedures?.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {selectedCondition.procedures.map((proc: any) => (
                              <button
                                key={proc.condition_procedure_id}
                                type="button"
                                onClick={() => handleSelectProcedure(proc)}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                  selectedProcedure?.condition_procedure_id === proc.condition_procedure_id ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-900 block truncate">{proc.procedure_name}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {proc.procedure_code && (
                                        <span className="text-xs text-gray-500">{proc.procedure_code}</span>
                                      )}
                                      {proc.specialty && (
                                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                                          {proc.specialty}
                                        </span>
                                      )}
                                      {proc.applies_to_state && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          proc.applies_to_state === 'good' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                          {proc.applies_to_state === 'good' ? 'Buen estado' : 'Mal estado'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-green-600 ml-2">
                                    S/ {Number(proc.price_without_plan || 0).toFixed(2)}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Botón Agregar */}
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddCondition}
                          disabled={!selectedCondition || (selectedCondition.procedures?.length > 0 && !selectedProcedure)}
                          className="w-full h-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </div>

                    {/* Indicador de selección actual */}
                    {selectedCondition && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-medium">Seleccionado:</span>
                            <span className="text-gray-900">{selectedCondition.label}</span>
                            {selectedProcedure && (
                              <>
                                <span className="text-gray-400">→</span>
                                <span className="text-blue-600 font-medium">{selectedProcedure.procedure_name}</span>
                              </>
                            )}
                          </div>
                          <span className="font-bold text-green-600">
                            S/ {Number(selectedProcedure?.price_without_plan || selectedCondition.price_base || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista de Condiciones */}
                  {formData.condition_items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Condiciones agregadas ({formData.condition_items.length})
                        </h4>
                      </div>

                      {formData.condition_items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            {/* Condición */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.condition_name}
                              </p>
                              {item.condition_code && (
                                <p className="text-xs text-gray-500">{item.condition_code}</p>
                              )}
                            </div>

                            {/* Procedimiento */}
                            <div className="flex-1 min-w-0">
                              {item.procedure_name ? (
                                <>
                                  <p className="text-sm font-medium text-blue-700 truncate">
                                    {item.procedure_name}
                                  </p>
                                  {item.procedure_code && (
                                    <p className="text-xs text-blue-500">{item.procedure_code}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Sin procedimiento</p>
                              )}
                            </div>

                            {/* Cantidad */}
                            <div className="w-16">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Cant.
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateCondition(index, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {/* Precio */}
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Precio
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateCondition(index, { unit_price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="w-20 text-right">
                              <p className="text-xs text-gray-500">Subtotal</p>
                              <p className="font-bold text-green-600 text-sm">
                                {formatPrice((item.quantity || 1) * (item.unit_price || 0))}
                              </p>
                            </div>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleRemoveCondition(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay condiciones agregadas</p>
                      <p className="text-xs mt-1">Busca y agrega condiciones del odontograma</p>
                    </div>
                  )}
                </div>

                {/* Sub-Procedimientos (con precios por plan de salud) */}
                <div className="bg-teal-50 rounded-lg p-5 border border-teal-200">
                  <h3 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Sub-Procedimientos
                    <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Con precios por plan
                    </span>
                  </h3>

                  {/* Filtro por especialidad y busqueda */}
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <div className="w-48">
                        <select
                          value={selectedSpecialtyFilter}
                          onChange={(e) => setSelectedSpecialtyFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Todas las especialidades</option>
                          {specialties.map((specialty) => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 relative" ref={subProcedureContainerRef}>
                        <div className="relative">
                          <input
                            type="text"
                            value={subProcedureSearchTerm}
                            onChange={(e) => {
                              setSubProcedureSearchTerm(e.target.value);
                              setShowSubProcedureDropdown(true);
                              setSelectedSubProcedure(null);
                            }}
                            onFocus={() => setShowSubProcedureDropdown(true)}
                            placeholder="Buscar sub-procedimiento..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          {loadingSubProcedures && (
                            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                          )}
                        </div>

                        {/* Dropdown de resultados */}
                        {showSubProcedureDropdown && !loadingSubProcedures && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {filteredSubProcedures.length > 0 ? (
                              filteredSubProcedures.slice(0, 20).map((sp) => (
                                <button
                                  key={sp.sub_procedure_id}
                                  type="button"
                                  onClick={() => handleSelectSubProcedure(sp)}
                                  className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors flex flex-col border-b border-gray-100 last:border-b-0 ${
                                    selectedSubProcedure?.sub_procedure_id === sp.sub_procedure_id ? 'bg-teal-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{sp.sub_procedure_name}</span>
                                    <span className="text-sm font-bold text-green-600">
                                      S/ {Number(sp.price_without_plan || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {sp.sub_procedure_code && (
                                      <span className="text-xs text-gray-500">{sp.sub_procedure_code}</span>
                                    )}
                                    {sp.specialty && (
                                      <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                                        {sp.specialty}
                                      </span>
                                    )}
                                    {(sp.price_plan_personal !== null || sp.price_plan_familiar !== null) && (
                                      <span className="text-xs text-teal-600 flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Precios especiales
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-6 text-center">
                                <p className="text-gray-500 text-sm">
                                  {subProcedureSearchTerm
                                    ? 'No se encontraron sub-procedimientos'
                                    : subProcedures.length === 0
                                      ? 'Cargando sub-procedimientos...'
                                      : 'Escribe para buscar'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSubProcedure}
                        disabled={!selectedSubProcedure}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de Sub-Procedimientos agregados */}
                  {formData.sub_procedure_items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Sub-Procedimientos agregados ({formData.sub_procedure_items.length})
                        </h4>
                      </div>

                      {formData.sub_procedure_items.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-3">
                            {/* Nombre y codigo */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.sub_procedure_name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.sub_procedure_code && (
                                  <span className="text-xs text-gray-500">{item.sub_procedure_code}</span>
                                )}
                                {item.specialty && (
                                  <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                                    {item.specialty}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cantidad */}
                            <div className="w-16">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Cant.
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateSubProcedure(index, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              />
                            </div>

                            {/* Precio */}
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Precio Base
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateSubProcedure(index, { unit_price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="w-20 text-right">
                              <p className="text-xs text-gray-500">Subtotal</p>
                              <p className="font-bold text-green-600 text-sm">
                                {formatPrice((item.quantity || 1) * (item.unit_price || 0))}
                              </p>
                            </div>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubProcedure(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Los precios mostrados son sin plan. Los descuentos por plan se aplican automaticamente al paciente en consulta.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Stethoscope className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay sub-procedimientos agregados</p>
                      <p className="text-xs mt-1">Busca y agrega sub-procedimientos con precios especiales por plan de salud</p>
                    </div>
                  )}
                </div>

                {/* Items Adicionales (Texto Libre) */}
                <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Items Adicionales (Texto Libre)
                  </h3>

                  {/* Boton para mostrar formulario */}
                  {!showCustomItemForm && (
                    <button
                      type="button"
                      onClick={() => setShowCustomItemForm(true)}
                      className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Item Personalizado
                    </button>
                  )}

                  {/* Formulario para agregar item */}
                  {showCustomItemForm && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nombre del item <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customItemForm.item_name}
                            onChange={(e) => setCustomItemForm({ ...customItemForm, item_name: e.target.value })}
                            placeholder="Ej: Material especial, Servicio adicional..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={customItemForm.quantity}
                            onChange={(e) => setCustomItemForm({ ...customItemForm, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Precio Unitario (S/)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customItemForm.unit_price}
                            onChange={(e) => setCustomItemForm({ ...customItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomItemForm(false)}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomItem}
                          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de items personalizados */}
                  {formData.custom_items.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Items agregados ({formData.custom_items.length})
                      </h4>

                      {formData.custom_items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Nombre
                                </label>
                                <input
                                  type="text"
                                  value={item.item_name}
                                  onChange={(e) => handleUpdateCustomItem(index, { item_name: e.target.value })}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Cantidad
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateCustomItem(index, { quantity: parseInt(e.target.value) || 1 })}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Precio (S/)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => handleUpdateCustomItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Subtotal</p>
                              <p className="font-bold text-green-600">
                                {formatPrice((item.quantity || 1) * (item.unit_price || 0))}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error de items */}
                {errors.items && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">{errors.items}</p>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(calculateTotalPrice())}
                      </p>
                    </div>
                  </div>

                  {/* Desglose de items */}
                  <div className="text-xs text-gray-500 border-l border-gray-200 pl-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3" />
                      <span>{formData.condition_items.length} condiciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-3 h-3" />
                      <span>{formData.sub_procedure_items.length} sub-procedimientos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3" />
                      <span>{formData.custom_items.length} items adicionales</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingTreatment ? 'Guardar Cambios' : 'Crear Tratamiento'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-gray-600">
                    ¿Está seguro de eliminar el tratamiento <strong>"{deleteConfirmModal.treatment_name}"</strong>?
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmModal)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreatmentManagement;
