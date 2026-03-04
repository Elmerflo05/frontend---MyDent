import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Package,
  AlertTriangle,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Settings as SettingsIcon,
  Tag
} from 'lucide-react';
import { InventoryItem, Sede, InventoryCategory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';
import { InventoryApiService } from '../services/inventoryApiService';
import { Modal } from '@/components/common/Modal';
import CategoryManagement from './CategoryManagement';

type InventoryFormData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  id?: string;
};

const InventoryManagement = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loadSettings } = useAppSettingsStore();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sedeFilter, setSedeFilter] = useState<string>('all');
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [alertDays, setAlertDays] = useState(settings?.inventoryAlertSettings?.diasAntes || 30);

  const [formData, setFormData] = useState<InventoryFormData>({
    nombre: '',
    descripcion: '',
    categoryId: '',
    cantidad: 0,
    fechaVencimiento: new Date(),
    sedeId: user?.sedeId || '',
    createdBy: user?.id,
    updatedBy: user?.id
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronizar alertDays cuando se carguen los settings
  useEffect(() => {
    if (settings?.inventoryAlertSettings?.diasAntes) {
      setAlertDays(settings.inventoryAlertSettings.diasAntes);
    }
  }, [settings]);

  useEffect(() => {
    loadData();

    // Listen for category changes
    const handleCategoryChange = () => {
      loadCategories();
    };

    window.addEventListener('categoriesUpdated', handleCategoryChange);

    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoryChange);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadSettings();
      await loadInventoryItems();
      await loadCategories();
      await loadSedes();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryItems = async () => {
    try {

      // Filter by branch if user is not super_admin
      const filters = (user?.role !== 'super_admin' && user?.sedeId)
        ? { branchId: parseInt(user.sedeId) }
        : undefined;

      const data = await InventoryApiService.loadInventoryItems(filters);
      setInventoryItems(data);

    } catch (error) {
    }
  };

  const loadSedes = async () => {
    try {
      const allSedes = await InventoryApiService.loadSedes();

      // Filter only active sedes
      const activeSedes = allSedes.filter(sede => sede.estado === 'activa');
      setSedes(activeSedes);

    } catch (error) {
    }
  };

  const loadCategories = async () => {
    try {

      const allCategories = await InventoryApiService.loadCategories();

      // Filter active categories and sort by name
      const activeCategories = allCategories
        .filter(cat => cat.activo === true)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      setCategories(activeCategories);


      // Set default category if available
      if (activeCategories.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: activeCategories[0].id }));
      }
    } catch (error) {
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Debe seleccionar una categoría';
    }

    if (formData.cantidad < 0) {
      newErrors.cantidad = 'La cantidad no puede ser negativa';
    }

    if (!formData.sedeId) {
      newErrors.sedeId = 'Debe seleccionar una sede';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const itemData: Partial<InventoryItem> = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoryId: formData.categoryId,
        cantidad: formData.cantidad,
        fechaVencimiento: formData.fechaVencimiento,
        sedeId: formData.sedeId
      };

      const branchId = parseInt(formData.sedeId) || 1;

      if (editingItem) {
        // Update existing item
        await InventoryApiService.updateInventoryItem(editingItem.id, itemData);
      } else {
        // Create new item
        await InventoryApiService.createInventoryItem(itemData, branchId);
      }

      await loadInventoryItems();
      closeModal();
    } catch (error) {
      setErrors({ general: 'Ocurrió un error al guardar el ítem' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (item: InventoryItem) => {
    await loadCategories(); // Reload categories before opening modal
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion,
      categoryId: item.categoryId,
      cantidad: item.cantidad,
      fechaVencimiento: item.fechaVencimiento,
      sedeId: item.sedeId,
      createdBy: item.createdBy,
      updatedBy: user?.id
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`¿Está seguro de eliminar el ítem "${item.nombre}"?`)) {
      try {
        await InventoryApiService.deleteInventoryItem(item.id);
        await loadInventoryItems();
      } catch (error) {
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({
      nombre: '',
      descripcion: '',
      cantidad: 0,
      fechaVencimiento: new Date(),
      sedeId: user?.sedeId || '',
      createdBy: user?.id,
      updatedBy: user?.id
    });
    setErrors({});
  };

  // Calculate status automatically based on quantity and expiration date
  const calculateStatus = (item: InventoryItem): InventoryItem['status'] => {
    const today = new Date();
    const expirationDate = new Date(item.fechaVencimiento);
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (expirationDate < today) {
      return 'vencido';
    } else if (daysUntilExpiration <= alertDays) {
      return 'por_vencer';
    } else if (item.cantidad === 0) {
      return 'agotado';
    } else {
      return 'disponible';
    }
  };

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const actualStatus = calculateStatus(item);
    const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
    const matchesSede = sedeFilter === 'all' || item.sedeId === sedeFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesSede;
  });

  // Statistics - agotado y vencido se cuentan de forma independiente
  // Un ítem puede estar vencido Y agotado al mismo tiempo
  const stats = {
    total: inventoryItems.length,
    disponible: inventoryItems.filter(i => calculateStatus(i) === 'disponible').length,
    porVencer: inventoryItems.filter(i => calculateStatus(i) === 'por_vencer').length,
    agotado: inventoryItems.filter(i => i.cantidad === 0).length,
    vencido: inventoryItems.filter(i => new Date(i.fechaVencimiento) < new Date()).length
  };

  const getStatusBadge = (item: InventoryItem) => {
    const status = calculateStatus(item);

    const badges = {
      disponible: { text: 'Disponible', className: 'bg-green-100 text-green-800' },
      agotado: { text: 'Agotado', className: 'bg-red-100 text-red-800' },
      por_vencer: { text: 'Por Vencer', className: 'bg-yellow-100 text-yellow-800' },
      vencido: { text: 'Vencido', className: 'bg-gray-100 text-gray-800' }
    };

    const badge = badges[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const handleSaveAlertSettings = async () => {
    try {
      await updateSettings({
        inventoryAlertSettings: {
          diasAntes: alertDays
        }
      });
      setShowAlertConfig(false);
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">Administra el inventario general por sede</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Tag className="w-5 h-5" />
              Categorías
            </button>
          )}
          <button
            onClick={() => setShowAlertConfig(!showAlertConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
            Configurar Alertas
          </button>
          <button
            onClick={async () => {
              await loadCategories(); // Reload categories before opening modal
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Ítem
          </button>
        </div>
      </div>

      {/* Alert Configuration */}
      {showAlertConfig && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuración de Alertas</h3>
            <button
              onClick={() => setShowAlertConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alertar cuando falten (días):
              </label>
              <input
                type="number"
                min="1"
                value={alertDays}
                onChange={(e) => setAlertDays(parseInt(e.target.value) || 30)}
                disabled={user?.role === 'receptionist'}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  user?.role === 'receptionist' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Los ítems que venzan en {alertDays} días o menos mostrarán alerta
              </p>
              {user?.role === 'receptionist' && (
                <p className="mt-1 text-sm text-amber-600">
                  Solo los administradores pueden modificar esta configuración
                </p>
              )}
            </div>
            {user?.role !== 'receptionist' && (
              <button
                onClick={handleSaveAlertSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.disponible}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.porVencer}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agotados</p>
              <p className="text-2xl font-bold text-red-600">{stats.agotado}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.vencido}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="disponible">Disponibles</option>
              <option value="agotado">Agotados</option>
              <option value="por_vencer">Por Vencer</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>

          {/* Sede Filter */}
          {user?.role === 'super_admin' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las sedes</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cantidad</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vencimiento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                {user?.role === 'super_admin' && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Sede</th>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={user?.role === 'super_admin' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    Cargando ítems...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'super_admin' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron ítems
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.nombre}</div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const category = categories.find(c => c.id === item.categoryId);
                        return (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: category?.color ? `${category.color}20` : '#dbeafe',
                              color: category?.color || '#1e40af'
                            }}
                          >
                            {category?.nombre || 'Sin categoría'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.cantidad === 0 && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-900">{item.cantidad}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {new Date(item.fechaVencimiento).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item)}
                    </td>
                    {user?.role === 'super_admin' && (
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {sedes.find(s => s.id === item.sedeId)?.nombre || 'Sin sede'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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

      {/* Modal de Categorías */}
      <Modal
        isOpen={showCategoriesModal}
        onClose={() => {
          setShowCategoriesModal(false);
          loadCategories();
        }}
        size="xl"
      >
        <Modal.Body>
          <CategoryManagement />
        </Modal.Body>
      </Modal>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        size="lg"
        closeOnBackdropClick={!loading}
        closeOnEscape={!loading}
        showCloseButton={false}
      >
        {/* Header Fijo */}
        <Modal.Header className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}
                </h2>
                <p className="text-sm text-white/80">Complete los datos del ítem de inventario</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Ítem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Guantes de látex"
                />
                {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.descripcion ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Descripción detallada del ítem"
                />
                {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">
                    No hay categorías disponibles. Primero crea al menos una categoría.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cantidad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.cantidad && <p className="mt-1 text-sm text-red-600">{errors.cantidad}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fechaVencimiento instanceof Date ? formatDateToYMD(formData.fechaVencimiento) : ''}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: parseLocalDate(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sede <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sedeId}
                    onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sedeId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={user?.role !== 'super_admin'}
                  >
                    <option value="">Seleccionar sede...</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                    ))}
                  </select>
                  {errors.sedeId && <p className="mt-1 text-sm text-red-600">{errors.sedeId}</p>}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}
          </Modal.Body>
        </form>

        {/* Footer Fijo */}
        <Modal.Footer>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
