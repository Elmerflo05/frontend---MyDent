/**
 * SubProceduresManagement - Gestion de Sub-Procedimientos
 * Muestra tabla con precios diferenciados por plan de salud
 * Permite editar los precios por plan desde el superadministrador
 */

import { useState, useEffect, useMemo } from 'react';
import { useSubProceduresStore } from '@/store/subProceduresStore';
import {
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Eye,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react';
import type { SubProcedureData } from '@/services/api/subProceduresApi';

// Definición de planes de salud para edición de precios
const HEALTH_PLANS = [
  { key: 'price_without_plan', label: 'Sin Plan', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', required: true },
  { key: 'price_plan_personal', label: 'Plan Personal', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', required: false },
  { key: 'price_plan_familiar', label: 'Plan Familiar', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', required: false },
  { key: 'price_plan_platinium', label: 'Plan Platinium', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700', required: false },
  { key: 'price_plan_oro', label: 'Plan Oro', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700', required: false }
] as const;

type PriceKey = typeof HEALTH_PLANS[number]['key'];

export default function SubProceduresManagement() {
  const {
    subProcedures,
    specialties,
    loading,
    error,
    loadSubProcedures,
    loadSpecialties,
    updateSubProcedure,
    clearError
  } = useSubProceduresStore();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Ordenamiento
  const [sortField, setSortField] = useState<keyof SubProcedureData>('sub_procedure_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal de detalles
  const [selectedProcedure, setSelectedProcedure] = useState<SubProcedureData | null>(null);

  // Modal de edición de precios
  const [editingProcedure, setEditingProcedure] = useState<SubProcedureData | null>(null);
  const [editingPrices, setEditingPrices] = useState<Record<PriceKey, string>>({
    price_without_plan: '',
    price_plan_personal: '',
    price_plan_familiar: '',
    price_plan_platinium: '',
    price_plan_oro: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Cargar datos al montar
  useEffect(() => {
    loadSubProcedures();
    loadSpecialties();
  }, [loadSubProcedures, loadSpecialties]);

  // Filtrar y ordenar sub-procedimientos
  const filteredAndSortedProcedures = useMemo(() => {
    let result = [...subProcedures];

    // Filtrar por busqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (sp) =>
          sp.sub_procedure_name.toLowerCase().includes(search) ||
          (sp.sub_procedure_code?.toLowerCase().includes(search)) ||
          (sp.specialty?.toLowerCase().includes(search))
      );
    }

    // Filtrar por especialidad
    if (filterSpecialty !== 'all') {
      result = result.filter((sp) => sp.specialty === filterSpecialty);
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      result = result.filter((sp) =>
        filterStatus === 'active' ? sp.is_active : !sp.is_active
      );
    }

    // Ordenar
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return result;
  }, [subProcedures, searchTerm, filterSpecialty, filterStatus, sortField, sortDirection]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSpecialty, filterStatus]);

  // Paginación calculada
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedProcedures.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = filteredAndSortedProcedures.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredAndSortedProcedures, currentPage, itemsPerPage]);

  // Estadisticas
  const stats = useMemo(() => {
    const total = subProcedures.length;
    const active = subProcedures.filter((sp) => sp.is_active).length;
    const inactive = total - active;
    const specialtiesCount = new Set(subProcedures.map((sp) => sp.specialty).filter(Boolean)).size;

    return { total, active, inactive, specialtiesCount };
  }, [subProcedures]);

  // Handler para ordenamiento
  const handleSort = (field: keyof SubProcedureData) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render icono de ordenamiento
  const renderSortIcon = (field: keyof SubProcedureData) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Formatear precio (convierte string/Decimal a número)
  // NULL = N.I. (No Incluido), 0 = Gratis
  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined || price === '') return 'N.I.';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N.I.';
    if (numPrice === 0) return 'Gratis';
    return `S/ ${numPrice.toFixed(2)}`;
  };

  // Formatear precio para el campo de edición (mostrar valor o vacío para N.I.)
  const formatPriceForEdit = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '';
    return numPrice.toString();
  };

  // Renderizar precio con estilos según valor
  const renderPriceCell = (price: number | string | null | undefined, baseColor: string) => {
    if (price === null || price === undefined || price === '') {
      return <span className="text-sm text-gray-400 italic">N.I.</span>;
    }
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return <span className="text-sm text-gray-400 italic">N.I.</span>;
    }
    if (numPrice === 0) {
      return <span className="text-sm text-green-600 font-medium">Gratis</span>;
    }
    return <span className={`text-sm ${baseColor}`}>S/ {numPrice.toFixed(2)}</span>;
  };

  // Abrir modal de edición de precios
  const handleOpenPriceEdit = (procedure: SubProcedureData) => {
    setEditingProcedure(procedure);
    setEditingPrices({
      price_without_plan: formatPriceForEdit(procedure.price_without_plan) || '0',
      price_plan_personal: formatPriceForEdit(procedure.price_plan_personal),
      price_plan_familiar: formatPriceForEdit(procedure.price_plan_familiar),
      price_plan_platinium: formatPriceForEdit(procedure.price_plan_platinium),
      price_plan_oro: formatPriceForEdit(procedure.price_plan_oro)
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Cerrar modal de edición
  const handleClosePriceEdit = () => {
    setEditingProcedure(null);
    setEditingPrices({
      price_without_plan: '',
      price_plan_personal: '',
      price_plan_familiar: '',
      price_plan_platinium: '',
      price_plan_oro: ''
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Manejar cambio de precio
  const handlePriceChange = (key: PriceKey, value: string) => {
    // Permitir vacío, números, punto decimal, o "N.I."
    const upperValue = value.toUpperCase();

    // Si escribe "N.I." o variantes, convertir a vacío (NULL en BD)
    if (upperValue === 'N' || upperValue === 'N.' || upperValue === 'N.I' || upperValue === 'N.I.' || upperValue === 'NI') {
      setEditingPrices(prev => ({ ...prev, [key]: '' }));
      setSaveSuccess(false);
      return;
    }

    // Solo permitir números y punto decimal
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    setEditingPrices(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  // Guardar precios editados
  const handleSavePrices = async () => {
    if (!editingProcedure) return;

    // Validar precio sin plan (requerido)
    const priceWithoutPlan = parseFloat(editingPrices.price_without_plan);
    if (isNaN(priceWithoutPlan) || priceWithoutPlan < 0) {
      setSaveError('El precio "Sin Plan" es requerido y debe ser un número válido.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const priceData: Partial<SubProcedureData> = {
        price_without_plan: priceWithoutPlan,
        price_plan_personal: editingPrices.price_plan_personal === '' ? null : parseFloat(editingPrices.price_plan_personal),
        price_plan_familiar: editingPrices.price_plan_familiar === '' ? null : parseFloat(editingPrices.price_plan_familiar),
        price_plan_platinium: editingPrices.price_plan_platinium === '' ? null : parseFloat(editingPrices.price_plan_platinium),
        price_plan_oro: editingPrices.price_plan_oro === '' ? null : parseFloat(editingPrices.price_plan_oro)
      };

      await updateSubProcedure(editingProcedure.sub_procedure_id, priceData);
      setSaveSuccess(true);

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        handleClosePriceEdit();
      }, 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar los precios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sub-Procedimientos</h1>
            <p className="text-gray-600">
              Catalogo de sub-procedimientos con precios diferenciados por plan de salud
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Activos</p>
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Especialidades</p>
              <p className="text-2xl font-bold text-blue-700">{stats.specialtiesCount}</p>
            </div>
            <Tag className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-emerald-800 font-medium">Edicion de Precios por Plan</p>
          <p className="text-sm text-emerald-700">
            Haga clic en el icono <Edit3 className="w-3.5 h-3.5 inline-block mx-1" /> de cada sub-procedimiento para modificar sus precios.
            Puede configurar precios diferentes para cada plan de salud (Sin Plan, Personal, Familiar, Platinium, Oro).
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, codigo o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Specialty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              loadSubProcedures();
              loadSpecialties();
            }}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {paginationData.startIndex + 1}-{paginationData.endIndex} de {paginationData.totalItems} sub-procedimientos
          {paginationData.totalItems !== subProcedures.length && ` (${subProcedures.length} en total)`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">por página</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando sub-procedimientos...</p>
        </div>
      ) : filteredAndSortedProcedures.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No se encontraron sub-procedimientos</p>
          <p className="text-gray-500 text-sm mt-2">
            Intenta ajustar los filtros de busqueda
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sub_procedure_code')}
                  >
                    <div className="flex items-center gap-1">
                      Codigo
                      {renderSortIcon('sub_procedure_code')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sub_procedure_name')}
                  >
                    <div className="flex items-center gap-1">
                      Nombre
                      {renderSortIcon('sub_procedure_name')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('specialty')}
                  >
                    <div className="flex items-center gap-1">
                      Especialidad
                      {renderSortIcon('specialty')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price_without_plan')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Sin Plan
                      {renderSortIcon('price_without_plan')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider"
                  >
                    Plan Personal
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider"
                  >
                    Plan Familiar
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-purple-600 uppercase tracking-wider"
                  >
                    Plan Platinium
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-amber-600 uppercase tracking-wider"
                  >
                    Plan Oro
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginationData.paginatedItems.map((procedure) => (
                  <tr key={procedure.sub_procedure_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {procedure.sub_procedure_code || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {procedure.sub_procedure_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {procedure.specialty || 'Sin especialidad'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        S/ {(typeof procedure.price_without_plan === 'string' ? parseFloat(procedure.price_without_plan) : procedure.price_without_plan || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {renderPriceCell(procedure.price_plan_personal, 'text-blue-700')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {renderPriceCell(procedure.price_plan_familiar, 'text-green-700')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {renderPriceCell(procedure.price_plan_platinium, 'text-purple-700')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {renderPriceCell(procedure.price_plan_oro, 'text-amber-700')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {procedure.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedProcedure(procedure)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPriceEdit(procedure)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar precios"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {paginationData.totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {paginationData.totalPages}
              </div>
              <div className="flex items-center gap-1">
                {/* Primera página */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!paginationData.hasPrevPage}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Página anterior */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!paginationData.hasPrevPage}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (paginationData.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= paginationData.totalPages - 2) {
                      pageNum = paginationData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Página siguiente */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(paginationData.totalPages, prev + 1))}
                  disabled={!paginationData.hasNextPage}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Última página */}
                <button
                  onClick={() => setCurrentPage(paginationData.totalPages)}
                  disabled={!paginationData.hasNextPage}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProcedure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Sub-Procedimiento</p>
                  <h2 className="text-xl font-bold">{selectedProcedure.sub_procedure_name}</h2>
                </div>
                <button
                  onClick={() => setSelectedProcedure(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Codigo</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">
                    {selectedProcedure.sub_procedure_code || 'Sin codigo'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Especialidad</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedProcedure.specialty || 'Sin especialidad'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Duracion Estimada</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedProcedure.estimated_duration} min
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Requiere Anestesia</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedProcedure.requires_anesthesia ? 'Si' : 'No'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedProcedure.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Descripcion</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                    {selectedProcedure.description}
                  </p>
                </div>
              )}

              {/* Prices Comparison */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Comparativa de Precios
                </h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-100">
                      <span className="font-medium text-gray-900">Sin Plan</span>
                      <span className="text-lg font-bold text-gray-900">
                        S/ {(typeof selectedProcedure.price_without_plan === 'string' ? parseFloat(selectedProcedure.price_without_plan) : selectedProcedure.price_without_plan || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-blue-50">
                      <span className="font-medium text-blue-700">Plan Personal</span>
                      <span className="text-lg font-bold">
                        {renderPriceCell(selectedProcedure.price_plan_personal, 'text-blue-700')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-green-50">
                      <span className="font-medium text-green-700">Plan Familiar</span>
                      <span className="text-lg font-bold">
                        {renderPriceCell(selectedProcedure.price_plan_familiar, 'text-green-700')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-purple-50">
                      <span className="font-medium text-purple-700">Plan Platinium</span>
                      <span className="text-lg font-bold">
                        {renderPriceCell(selectedProcedure.price_plan_platinium, 'text-purple-700')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-amber-50">
                      <span className="font-medium text-amber-700">Plan Oro</span>
                      <span className="text-lg font-bold">
                        {renderPriceCell(selectedProcedure.price_plan_oro, 'text-amber-700')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedProcedure(null);
                  handleOpenPriceEdit(selectedProcedure);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar Precios
              </button>
              <button
                onClick={() => setSelectedProcedure(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edicion de Precios */}
      {editingProcedure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Editar Precios</p>
                  <h2 className="text-lg font-bold truncate max-w-md">
                    {editingProcedure.sub_procedure_name}
                  </h2>
                  {editingProcedure.sub_procedure_code && (
                    <p className="text-sm text-emerald-200 font-mono">
                      Codigo: {editingProcedure.sub_procedure_code}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClosePriceEdit}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Mensaje de exito */}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 text-sm font-medium">
                    Precios actualizados correctamente
                  </span>
                </div>
              )}

              {/* Mensaje de error */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{saveError}</span>
                </div>
              )}

              {/* Info sobre valores especiales */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="text-sm text-blue-800 font-medium">Valores especiales:</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-0.5">
                  <li><strong>0</strong> o <strong>0.00</strong> = <span className="text-green-700 font-medium">Gratis</span> (incluido en el plan)</li>
                  <li><strong>Vacio</strong> o <strong>N.I.</strong> = <span className="text-amber-700 font-medium">No Incluido</span> (se cobra precio Sin Plan)</li>
                </ul>
              </div>

              {/* Campos de precios */}
              <div className="space-y-3">
                {HEALTH_PLANS.map((plan) => {
                  const currentValue = editingPrices[plan.key];
                  const isGratis = currentValue === '0' || currentValue === '0.00' || currentValue === '0.0';
                  const isNI = currentValue === '' && !plan.required;

                  return (
                    <div key={plan.key} className="flex items-center gap-3">
                      <div className={`w-32 px-3 py-2 rounded-lg ${plan.bgColor} ${plan.textColor} text-sm font-medium`}>
                        {plan.label}
                        {plan.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingPrices[plan.key]}
                          onChange={(e) => handlePriceChange(plan.key, e.target.value)}
                          placeholder={plan.required ? '0.00' : 'N.I.'}
                          disabled={isSaving}
                          className={`w-full pl-9 pr-12 py-2 border rounded-lg text-right font-mono
                            focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${plan.required && !editingPrices[plan.key] ? 'border-red-300' : 'border-gray-300'}
                          `}
                        />
                        {/* Indicador visual de Gratis o N.I. */}
                        {!plan.required && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                            ${isGratis ? 'text-green-600' : isNI ? 'text-amber-600' : 'text-transparent'}
                          `}>
                            {isGratis ? 'Gratis' : isNI ? 'N.I.' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button
                onClick={handleClosePriceEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrices}
                disabled={isSaving || saveSuccess}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Precios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
