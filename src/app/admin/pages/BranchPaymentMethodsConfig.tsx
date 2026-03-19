/**
 * Configuración de Métodos de Pago por Sede
 * Permite a admin/super_admin configurar los métodos de pago disponibles por sucursal
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Building2,
  Phone,
  AtSign,
  DollarSign,
  Check,
  AlertCircle,
  Loader2,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { branchPaymentMethodsApi, BranchPaymentMethod } from '@/services/api/branchPaymentMethodsApi';
import httpClient from '@/services/api/httpClient';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface Branch {
  branch_id: number;
  branch_name: string;
}

type MethodType = 'yape' | 'plin' | 'bank_transfer' | 'cash' | 'credit_card' | 'debit_card' | 'other';

const methodTypeLabels: Record<MethodType, string> = {
  yape: 'Yape',
  plin: 'Plin',
  bank_transfer: 'Transferencia Bancaria',
  cash: 'Efectivo',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  other: 'Otro'
};

const methodTypeIcons: Record<MethodType, React.ReactNode> = {
  yape: <Phone className="w-4 h-4" />,
  plin: <Phone className="w-4 h-4" />,
  bank_transfer: <CreditCard className="w-4 h-4" />,
  cash: <DollarSign className="w-4 h-4" />,
  credit_card: <CreditCard className="w-4 h-4" />,
  debit_card: <CreditCard className="w-4 h-4" />,
  other: <CreditCard className="w-4 h-4" />
};

const initialFormData = {
  method_name: '',
  method_type: 'bank_transfer' as MethodType,
  account_holder: '',
  account_number: '',
  bank_name: '',
  phone_number: '',
  additional_info: '',
  is_active: true
};

export default function BranchPaymentMethodsConfig() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<BranchPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<BranchPaymentMethod | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar sedes
  useEffect(() => {
    loadBranches();
  }, []);

  // Cargar métodos cuando cambia la sede
  useEffect(() => {
    if (selectedBranchId) {
      loadPaymentMethods(selectedBranchId);
    } else {
      setPaymentMethods([]);
    }
  }, [selectedBranchId]);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const response = await httpClient.get<any>('/branches');
      const branchList = response.data || [];
      setBranches(branchList);

      // Si el usuario tiene sede asignada, seleccionarla
      if (user?.branch_id) {
        setSelectedBranchId(user.branch_id);
      } else if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].branch_id);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Error al cargar las sedes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethods = async (branchId: number) => {
    try {
      setIsLoadingMethods(true);
      const methods = await branchPaymentMethodsApi.getPaymentMethodsByBranch(branchId);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Error al cargar los métodos de pago');
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Al cambiar el tipo de método, limpiar campos que no aplican
    if (name === 'method_type') {
      setFormData(prev => ({
        ...prev,
        method_type: value as MethodType,
        bank_name: '',
        account_number: '',
        account_holder: '',
        phone_number: '',
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBranchId) {
      toast.error('Seleccione una sede primero');
      return;
    }

    if (!formData.method_name.trim()) {
      toast.error('El nombre del método es requerido');
      return;
    }

    try {
      setIsSaving(true);

      // Limpiar campos que no aplican al tipo seleccionado
      const cleanedData = { ...formData };

      if (cleanedData.method_type === 'bank_transfer') {
        // Transferencia: usa banco, cuenta, titular. NO usa teléfono
        cleanedData.phone_number = '';
      } else if (cleanedData.method_type === 'yape' || cleanedData.method_type === 'plin') {
        // Yape/Plin: usa teléfono, titular. NO usa banco ni cuenta
        cleanedData.bank_name = '';
        cleanedData.account_number = '';
      } else {
        // Efectivo, tarjetas, otro: no usan campos específicos
        cleanedData.bank_name = '';
        cleanedData.account_number = '';
        cleanedData.account_holder = '';
        cleanedData.phone_number = '';
      }

      const dataToSend = {
        branch_id: selectedBranchId,
        ...cleanedData
      };

      if (editingMethod) {
        await branchPaymentMethodsApi.updatePaymentMethod(editingMethod.payment_method_id, dataToSend);
        toast.success('Método de pago actualizado');
      } else {
        await branchPaymentMethodsApi.createPaymentMethod(dataToSend);
        toast.success('Método de pago creado');
      }

      setShowForm(false);
      setEditingMethod(null);
      setFormData(initialFormData);
      loadPaymentMethods(selectedBranchId);
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      toast.error(error.response?.data?.error || 'Error al guardar el método de pago');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (method: BranchPaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      method_name: method.method_name,
      method_type: method.method_type as MethodType,
      account_holder: method.account_holder || '',
      account_number: method.account_number || '',
      bank_name: method.bank_name || '',
      phone_number: method.phone_number || '',
      additional_info: method.additional_info || '',
      is_active: method.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (method: BranchPaymentMethod) => {
    const result = await Swal.fire({
      title: 'Eliminar Método de Pago',
      text: `¿Está seguro de eliminar "${method.method_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await branchPaymentMethodsApi.deletePaymentMethod(method.payment_method_id);
        toast.success('Método de pago eliminado');
        if (selectedBranchId) {
          loadPaymentMethods(selectedBranchId);
        }
      } catch (error) {
        console.error('Error deleting payment method:', error);
        toast.error('Error al eliminar el método de pago');
      }
    }
  };

  const handleToggleActive = async (method: BranchPaymentMethod) => {
    try {
      await branchPaymentMethodsApi.updatePaymentMethod(method.payment_method_id, {
        is_active: !method.is_active
      });
      toast.success(method.is_active ? 'Método desactivado' : 'Método activado');
      if (selectedBranchId) {
        loadPaymentMethods(selectedBranchId);
      }
    } catch (error) {
      console.error('Error toggling payment method:', error);
      toast.error('Error al actualizar el método de pago');
    }
  };

  const openNewForm = () => {
    setEditingMethod(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMethod(null);
    setFormData(initialFormData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-cyan-600" />
          Métodos de Pago por Sede
        </h1>
        <p className="text-gray-600 mt-1">
          Configure los métodos de pago disponibles para que los pacientes compren promociones
        </p>
      </div>

      {/* Selector de Sede */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            <label className="font-medium text-gray-700">Sede:</label>
          </div>
          <select
            value={selectedBranchId || ''}
            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={user?.role !== 'super_admin' && branches.length <= 1}
          >
            <option value="">Seleccione una sede</option>
            {branches.map(branch => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.branch_name}
              </option>
            ))}
          </select>

          {selectedBranchId && (
            <button
              onClick={openNewForm}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Método
            </button>
          )}
        </div>
      </div>

      {/* Lista de Métodos */}
      {selectedBranchId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoadingMethods ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay métodos de pago configurados</p>
              <p className="text-sm mt-1">Agregue un método de pago para esta sede</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={method.payment_method_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!method.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${method.is_active ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'}`}>
                        {methodTypeIcons[method.method_type as MethodType] || <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{method.method_name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {methodTypeLabels[method.method_type as MethodType] || method.method_type}
                          </span>
                          {!method.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                          {method.account_holder && (
                            <p><strong>Titular:</strong> {method.account_holder}</p>
                          )}
                          {method.bank_name && (
                            <p><strong>Banco:</strong> {method.bank_name}</p>
                          )}
                          {method.account_number && (
                            <p><strong>Cuenta:</strong> {method.account_number}</p>
                          )}
                          {method.phone_number && (
                            <p><strong>Teléfono:</strong> {method.phone_number}</p>
                          )}
                          {method.additional_info && (
                            <p className="text-gray-400 italic mt-1">{method.additional_info}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`p-2 rounded-lg transition-colors ${
                          method.is_active
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={method.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {method.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(method)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Seleccione una sede</p>
          <p className="text-sm mt-1">Para ver y configurar sus métodos de pago</p>
        </div>
      )}

      {/* Modal de Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Tipo de método */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Método *
                  </label>
                  <select
                    name="method_type"
                    value={formData.method_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {Object.entries(methodTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Nombre del método */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Método *
                  </label>
                  <input
                    type="text"
                    name="method_name"
                    value={formData.method_name}
                    onChange={handleInputChange}
                    placeholder="Ej: Yape MyDent, BCP Cuenta Corriente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Campos condicionales según tipo */}
                {(formData.method_type === 'bank_transfer') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banco
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        placeholder="Ej: BCP, Interbank, BBVA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        placeholder="Ej: 123-456789-0-12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titular de la Cuenta
                      </label>
                      <input
                        type="text"
                        name="account_holder"
                        value={formData.account_holder}
                        onChange={handleInputChange}
                        placeholder="Ej: MyDent SAC"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {(formData.method_type === 'yape' || formData.method_type === 'plin') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        placeholder="Ej: 999 888 777"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Titular
                      </label>
                      <input
                        type="text"
                        name="account_holder"
                        value={formData.account_holder}
                        onChange={handleInputChange}
                        placeholder="Nombre que aparece en la app"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Información adicional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones adicionales
                  </label>
                  <textarea
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    placeholder="Instrucciones para el paciente..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Estado activo */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Método de pago activo (visible para pacientes)
                  </label>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingMethod ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
