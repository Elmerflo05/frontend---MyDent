import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, Users, Calendar, Eye, Edit, Trash2, X, Save, DollarSign, Clock } from 'lucide-react';
import { CompanyApiService } from '../services/companyApiService';
import { useAuthStore } from '@/store/authStore';
import type { Company } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CompanyCorporatePricing from '../components/CompanyCorporatePricing';
import CompanyValidityHistory from '../components/CompanyValidityHistory';

export default function Companies() {
  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [pricingCompany, setPricingCompany] = useState<{ id: number; name: string } | null>(null);
  const [validityCompany, setValidityCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    contactoPrincipal: {
      nombre: '',
      cargo: '',
      telefono: '',
      email: ''
    },
    direccion: '',
    telefono: '',
    planId: '',
    contratoId: '',
    vigenciaInicio: '',
    vigenciaFin: '',
    estado: 'activa' as const,
    observaciones: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies]);

  const loadCompanies = async () => {
    try {
      // ✅ Cargar datos desde la API real (sin IndexedDB)
      const allCompanies = await CompanyApiService.loadCompanies();
      // Filtrar empresas eliminadas (el backend ya las excluye, doble protección)
      const activeCompanies = allCompanies.filter(c => c.estado !== 'eliminada');
      setCompanies(activeCompanies);

      // Usar el conteo de empleados que viene directamente de la API
      const counts: Record<string, number> = {};
      for (const company of activeCompanies) {
        counts[company.id] = company.employeeCount || 0;
      }
      setEmployeeCounts(counts);

    } catch (error) {
      toast.error('Error al cargar empresas');
    }
  };

  const filterCompanies = () => {
    if (!searchTerm.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = companies.filter(company =>
      company.nombre.toLowerCase().includes(term) ||
      company.ruc.includes(term)
    );
    setFilteredCompanies(filtered);
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setIsEditing(true);
      setSelectedCompany(company);
      setFormData({
        nombre: company.nombre,
        ruc: company.ruc,
        contactoPrincipal: company.contactoPrincipal,
        direccion: company.direccion,
        telefono: company.telefono,
        planId: company.planId || '',
        contratoId: company.contratoId || '',
        vigenciaInicio: format(new Date(company.vigenciaInicio), 'yyyy-MM-dd'),
        vigenciaFin: format(new Date(company.vigenciaFin), 'yyyy-MM-dd'),
        estado: company.estado,
        observaciones: company.observaciones || ''
      });
    } else {
      setIsEditing(false);
      setSelectedCompany(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleViewCompany = async (company: Company) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      contactoPrincipal: {
        nombre: '',
        cargo: '',
        telefono: '',
        email: ''
      },
      direccion: '',
      telefono: '',
      planId: '',
      contratoId: '',
      vigenciaInicio: '',
      vigenciaFin: '',
      estado: 'activa',
      observaciones: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validar RUC (11 dígitos)
    if (!formData.ruc || formData.ruc.length !== 11 || !/^\d{11}$/.test(formData.ruc)) {
      toast.error('El RUC debe tener exactamente 11 dígitos numéricos');
      return;
    }

    // Validar teléfonos (9 dígitos)
    if (!formData.telefono || formData.telefono.length !== 9 || !/^\d{9}$/.test(formData.telefono)) {
      toast.error('El teléfono de la empresa debe tener exactamente 9 dígitos numéricos');
      return;
    }

    if (!formData.contactoPrincipal.telefono || formData.contactoPrincipal.telefono.length !== 9 || !/^\d{9}$/.test(formData.contactoPrincipal.telefono)) {
      toast.error('El teléfono del contacto principal debe tener exactamente 9 dígitos numéricos');
      return;
    }

    try {
      if (isEditing && selectedCompany) {
        // ✅ Actualizar empresa existente via API
        const updateData = {
          nombre: formData.nombre,
          ruc: formData.ruc,
          contactoPrincipal: formData.contactoPrincipal,
          direccion: formData.direccion,
          telefono: formData.telefono,
          planId: formData.planId || undefined,
          contratoId: formData.contratoId || undefined,
          vigenciaInicio: new Date(formData.vigenciaInicio),
          vigenciaFin: new Date(formData.vigenciaFin),
          estado: formData.estado,
          observaciones: formData.observaciones,
          updatedAt: new Date()
        };

        await CompanyApiService.updateCompany(selectedCompany.id, updateData);
        toast.success('Empresa actualizada exitosamente');
      } else {
        // ✅ Crear nueva empresa via API
        const newCompany = {
          nombre: formData.nombre,
          ruc: formData.ruc,
          contactoPrincipal: formData.contactoPrincipal,
          direccion: formData.direccion,
          telefono: formData.telefono,
          planId: formData.planId || undefined,
          contratoId: formData.contratoId || undefined,
          vigenciaInicio: new Date(formData.vigenciaInicio),
          vigenciaFin: new Date(formData.vigenciaFin),
          estado: formData.estado,
          observaciones: formData.observaciones,
          createdBy: user.id
        };

        await CompanyApiService.createCompany(newCompany);
        toast.success('Empresa creada exitosamente');
      }

      await loadCompanies();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar empresa');
    }
  };

  const handleDelete = async (company: Company) => {
    if (!confirm(`¿Está seguro de eliminar la empresa ${company.nombre}?`)) return;

    try {
      // ✅ Eliminar empresa via API
      await CompanyApiService.deleteCompany(company.id);
      toast.success('Empresa eliminada exitosamente');
      await loadCompanies();
    } catch (error) {
      toast.error('Error al eliminar empresa');
    }
  };

  const getEstadoBadge = (estado: Company['estado']) => {
    const badges = {
      activa: 'bg-green-100 text-green-800',
      suspendida: 'bg-yellow-100 text-yellow-800',
      vencida: 'bg-red-100 text-red-800',
      inactiva: 'bg-gray-100 text-gray-800',
      eliminada: 'bg-red-200 text-red-900'
    };
    return badges[estado];
  };

  // Si estamos en la vista de precios corporativos
  if (pricingCompany) {
    return (
      <CompanyCorporatePricing
        companyId={pricingCompany.id}
        companyName={pricingCompany.name}
        onBack={() => { setPricingCompany(null); loadCompanies(); }}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Modal de historial de vigencia */}
      {validityCompany && (
        <CompanyValidityHistory
          companyId={parseInt(validityCompany.id)}
          companyName={validityCompany.nombre}
          vigenciaInicio={validityCompany.vigenciaInicio ? validityCompany.vigenciaInicio.toString() : null}
          vigenciaFin={validityCompany.vigenciaFin ? validityCompany.vigenciaFin.toString() : null}
          onClose={() => setValidityCompany(null)}
          onExtended={() => loadCompanies()}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion de Empresas</h1>
        <p className="text-gray-600 mt-1">Administra empresas corporativas y sus convenios</p>
      </div>

      {/* Filtros y acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Empresa
          </button>
        </div>
      </div>

      {/* Tabla de empresas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.nombre}</p>
                        <p className="text-sm text-gray-500">{company.contactoPrincipal.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.ruc}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {employeeCounts[company.id] || 0} empleados
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {format(new Date(company.vigenciaFin), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(company.estado)}`}>
                      {company.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPricingCompany({ id: parseInt(company.id), name: company.nombre })}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Gestionar Precios"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setValidityCompany(company)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Historial Vigencia"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewCompany(company)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(company)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
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

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva empresa</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
                </h2>
                <p className="text-blue-100">
                  {isEditing ? 'Actualiza la información de la empresa' : 'Registra una nueva empresa corporativa'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Información de la Empresa */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RUC * <span className="text-xs text-gray-500">(11 dígitos)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.ruc}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Solo números
                          if (value.length <= 11) {
                            setFormData({ ...formData, ruc: value });
                          }
                        }}
                        maxLength={11}
                        pattern="\d{11}"
                        placeholder="20123456789"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {formData.ruc && formData.ruc.length !== 11 && (
                        <p className="text-xs text-red-600 mt-1">
                          El RUC debe tener exactamente 11 dígitos ({formData.ruc.length}/11)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono * <span className="text-xs text-gray-500">(9 dígitos)</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Solo números
                          if (value.length <= 9) {
                            setFormData({ ...formData, telefono: value });
                          }
                        }}
                        maxLength={9}
                        pattern="\d{9}"
                        placeholder="987654321"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {formData.telefono && formData.telefono.length !== 9 && (
                        <p className="text-xs text-red-600 mt-1">
                          El teléfono debe tener exactamente 9 dígitos ({formData.telefono.length}/9)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacto Principal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto Principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactoPrincipal.nombre}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactoPrincipal: { ...formData.contactoPrincipal, nombre: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactoPrincipal.cargo}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactoPrincipal: { ...formData.contactoPrincipal, cargo: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono * <span className="text-xs text-gray-500">(9 dígitos)</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactoPrincipal.telefono}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Solo números
                          if (value.length <= 9) {
                            setFormData({
                              ...formData,
                              contactoPrincipal: { ...formData.contactoPrincipal, telefono: value }
                            });
                          }
                        }}
                        maxLength={9}
                        pattern="\d{9}"
                        placeholder="987654321"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {formData.contactoPrincipal.telefono && formData.contactoPrincipal.telefono.length !== 9 && (
                        <p className="text-xs text-red-600 mt-1">
                          El teléfono debe tener exactamente 9 dígitos ({formData.contactoPrincipal.telefono.length}/9)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactoPrincipal.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactoPrincipal: { ...formData.contactoPrincipal, email: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuración del Convenio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Convenio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="activa">Activa</option>
                        <option value="suspendida">Suspendida</option>
                        <option value="vencida">Vencida</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.vigenciaInicio}
                        onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.vigenciaFin}
                        onChange={(e) => setFormData({ ...formData, vigenciaFin: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        rows={3}
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Actualizar' : 'Crear Empresa'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de visualización */}
      {showViewModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedCompany.nombre}</h2>
                <p className="text-blue-100">Detalles de la empresa</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Información General</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">RUC:</span> {selectedCompany.ruc}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedCompany.telefono}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedCompany.direccion}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contacto Principal</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedCompany.contactoPrincipal.nombre}</p>
                    <p><span className="font-medium">Cargo:</span> {selectedCompany.contactoPrincipal.cargo}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedCompany.contactoPrincipal.telefono}</p>
                    <p><span className="font-medium">Email:</span> {selectedCompany.contactoPrincipal.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Convenio</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Empleados registrados:</span> {employeeCounts[selectedCompany.id] || 0}</p>
                    <p><span className="font-medium">Vigencia:</span> {format(new Date(selectedCompany.vigenciaInicio), 'dd/MM/yyyy')} - {format(new Date(selectedCompany.vigenciaFin), 'dd/MM/yyyy')}</p>
                    <p><span className="font-medium">Estado:</span> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(selectedCompany.estado)}`}>{selectedCompany.estado}</span></p>
                    {selectedCompany.observaciones && (
                      <p><span className="font-medium">Observaciones:</span> {selectedCompany.observaciones}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
