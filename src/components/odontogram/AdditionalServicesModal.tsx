import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Filter,
  Plus,
  Check,
  Clock,
  DollarSign,
  Activity,
  AlertCircle,
  User,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { dentalProceduresApi, type DentalProcedureData } from '@/services/api/dentalProceduresApi';
import type { Patient } from '@/types';
import { CLINIC_SERVICE_CATEGORIES, SERVICE_STATUS_CONFIG } from '@/constants/services';
import { UI_TEXTS } from '@/constants/ui';

// Tipo local para servicios mapeados desde la API
interface MappedService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  status: string;
  requiresSpecialist: boolean;
  isEmergency: boolean;
}

interface SelectedService {
  service: MappedService;
  quantity: number;
  notes?: string;
  toothNumbers?: string[];
}

interface AdditionalServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onServicesSelected: (services: SelectedService[]) => void;
}

const AdditionalServicesModal = ({ isOpen, onClose, patient, onServicesSelected }: AdditionalServicesModalProps) => {
  const [services, setServices] = useState<MappedService[]>([]);
  const [filteredServices, setFilteredServices] = useState<MappedService[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await dentalProceduresApi.getDentalProcedures();

      // Mapear procedimientos dentales a formato de servicio
      const mappedServices: MappedService[] = response.data
        .filter(proc => proc.status === 'active')
        .map(proc => ({
          id: proc.dental_procedure_id?.toString() || '',
          name: proc.procedure_name || '',
          description: proc.description || '',
          category: proc.procedure_category || 'General',
          price: proc.default_price || 0,
          duration: proc.estimated_duration || 30,
          status: proc.status || 'active',
          requiresSpecialist: proc.requires_anesthesia || false,
          isEmergency: false
        }));

      setServices(mappedServices);
    } catch (error) {
      console.error('Error al cargar los servicios:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const handleServiceSelect = (service: MappedService) => {
    const existingIndex = selectedServices.findIndex(s => s.service.id === service.id);

    if (existingIndex >= 0) {
      // Si ya está seleccionado, incrementar cantidad
      const updated = [...selectedServices];
      updated[existingIndex].quantity += 1;
      setSelectedServices(updated);
    } else {
      // Agregar nuevo servicio
      setSelectedServices(prev => [...prev, {
        service,
        quantity: 1,
        notes: '',
        toothNumbers: []
      }]);
    }

    toast.success(`${service.name} agregado`);
  };

  const handleServiceRemove = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleServiceRemove(serviceId);
      return;
    }

    setSelectedServices(prev =>
      prev.map(s =>
        s.service.id === serviceId
          ? { ...s, quantity }
          : s
      )
    );
  };

  const handleNotesChange = (serviceId: string, notes: string) => {
    setSelectedServices(prev =>
      prev.map(s =>
        s.service.id === serviceId
          ? { ...s, notes }
          : s
      )
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, item) =>
      total + (item.service.price * item.quantity), 0
    );
  };

  const handleConfirm = () => {
    if (selectedServices.length === 0) {
      toast.error('Debe seleccionar al menos un servicio');
      return;
    }

    onServicesSelected(selectedServices);
    toast.success(`${selectedServices.length} servicios agregados al tratamiento`);
    onClose();
  };

  const handleClose = () => {
    setSelectedServices([]);
    setSearchTerm('');
    setSelectedCategory('all');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        {/* Overlay oscuro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Contenido del modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Servicios Adicionales</h2>
                  <p className="text-sm text-gray-600">
                    Agregar servicios para {patient.firstName} {patient.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar servicios..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {CLINIC_SERVICE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex h-[600px]">
            {/* Lista de servicios */}
            <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Servicios Disponibles ({filteredServices.length})
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando servicios...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron servicios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredServices.map(service => {
                    const isSelected = selectedServices.some(s => s.service.id === service.id);

                    return (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                {service.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration} min
                              </span>
                              {service.requiresSpecialist && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <User className="w-3 h-3" />
                                  Especialista
                                </span>
                              )}
                              {service.isEmergency && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  Emergencia
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
                              <DollarSign className="w-4 h-4" />
                              S/ {service.price.toFixed(2)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceSelect(service);
                              }}
                              className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Agregar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Carrito de servicios seleccionados */}
            <div className="w-96 p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Servicios Seleccionados ({selectedServices.length})
              </h3>

              {selectedServices.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No hay servicios seleccionados</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedServices.map(item => (
                    <div key={item.service.id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.service.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.service.category}</p>
                        </div>
                        <button
                          onClick={() => handleServiceRemove(item.service.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Cantidad:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuantityChange(item.service.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-sm hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.service.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-sm hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Notas */}
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Notas:</label>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.service.id, e.target.value)}
                            placeholder="Notas adicionales..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Precio */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-600">Subtotal:</span>
                          <span className="font-medium text-sm">
                            S/ {(item.service.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total y acciones */}
              {selectedServices.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      S/ {calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleConfirm}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Agregar Servicios ({selectedServices.length})
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {UI_TEXTS.BUTTONS.CANCEL}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdditionalServicesModal;