import { useState, useEffect, useCallback } from 'react';
import {
  additionalServicesApi,
  OrthodonticPlan,
  ImplantPlan,
  ProsthesisItem
} from '@/services/api/additionalServicesApi';

/**
 * Campos editables de un servicio adicional
 */
export interface ServiceEditableFields {
  montoTotal: number;
  inicial: number;
  mensual: number;
}

/**
 * Servicio adicional seleccionado con campos editables
 */
export interface SelectedAdditionalService {
  id: string;
  type: 'orthodontic' | 'implant' | 'prosthesis';
  name: string;
  description?: string;
  modality?: string; // Para ortodoncia (presupuesto_total, sin_presupuesto, sin_inicial)
  // Valores originales de la API
  originalFields: ServiceEditableFields;
  // Valores editados por el usuario
  editedFields: ServiceEditableFields;
}

interface UseAdditionalServicesProps {
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
}

export const useAdditionalServices = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges
}: UseAdditionalServicesProps) => {
  // Estados para los datos de la API
  const [orthodonticPlans, setOrthodonticPlans] = useState<OrthodonticPlan[]>([]);
  const [implantPlans, setImplantPlans] = useState<ImplantPlan[]>([]);
  const [prosthesisItems, setProsthesisItems] = useState<ProsthesisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Servicios seleccionados
  const [selectedServices, setSelectedServices] = useState<SelectedAdditionalService[]>(
    currentRecord?.selectedAdditionalServices || []
  );

  // Cargar datos desde la API
  const loadAdditionalServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await additionalServicesApi.getAllServices();

      if (response.success && response.data) {
        setOrthodonticPlans(response.data.orthodontic_plans || []);
        setImplantPlans(response.data.implant_plans || []);
        setProsthesisItems(response.data.prosthesis_items || []);
      }
    } catch (err) {
      console.error('Error al cargar servicios adicionales:', err);
      setError('Error al cargar servicios adicionales');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadAdditionalServices();
  }, [loadAdditionalServices]);

  // Sincronizar con currentRecord cuando cambian los servicios seleccionados
  useEffect(() => {
    if (currentRecord?.selectedAdditionalServices) {
      setSelectedServices(currentRecord.selectedAdditionalServices);
    }
  }, [currentRecord?.selectedAdditionalServices]);

  // Obtener nombre legible para plan de ortodoncia
  const getOrthodonticPlanName = (plan: OrthodonticPlan): string => {
    const typeNames: Record<string, string> = {
      'brackets_convencionales': 'Brackets Convencionales',
      'autoligantes': 'Brackets Autoligantes',
      'zafiro': 'Brackets de Zafiro',
      'alineadores': 'Alineadores'
    };
    const modalityNames: Record<string, string> = {
      'presupuesto_total': 'Presupuesto Total',
      'sin_presupuesto': 'Sin Presupuesto',
      'sin_inicial': 'Sin Inicial'
    };
    return `${typeNames[plan.plan_type] || plan.plan_type} - ${modalityNames[plan.plan_modality] || plan.plan_modality}`;
  };

  // Obtener nombre legible para plan de implantes
  const getImplantPlanName = (plan: ImplantPlan): string => {
    const typeNames: Record<string, string> = {
      'inmediato': 'Implante Inmediato',
      'convencional': 'Implante Convencional',
      'hibrido_superior': 'Híbrido Superior',
      'hibrido_inferior': 'Híbrido Inferior'
    };
    return typeNames[plan.plan_type] || plan.plan_type;
  };

  // Verificar si un servicio está seleccionado
  const isServiceSelected = (id: string): boolean => {
    return selectedServices.some(s => s.id === id);
  };

  // Alternar selección de un plan de ortodoncia
  const toggleOrthodonticPlan = (plan: OrthodonticPlan) => {
    const serviceId = `ortho-${plan.orthodontic_plan_id}`;
    const isSelected = isServiceSelected(serviceId);

    let newServices: SelectedAdditionalService[];

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== serviceId);
    } else {
      const fields: ServiceEditableFields = {
        montoTotal: Number(plan.monto_total) || 0,
        inicial: Number(plan.inicial) || 0,
        mensual: Number(plan.pago_mensual) || 0
      };
      const newService: SelectedAdditionalService = {
        id: serviceId,
        type: 'orthodontic',
        name: getOrthodonticPlanName(plan),
        modality: plan.plan_modality,
        originalFields: { ...fields },
        editedFields: { ...fields }
      };
      newServices = [...selectedServices, newService];
    }

    updateSelectedServices(newServices);
  };

  // Alternar selección de un plan de implantes
  const toggleImplantPlan = (plan: ImplantPlan) => {
    const serviceId = `implant-${plan.implant_plan_id}`;
    const isSelected = isServiceSelected(serviceId);

    let newServices: SelectedAdditionalService[];

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== serviceId);
    } else {
      const fields: ServiceEditableFields = {
        montoTotal: Number(plan.monto_total) || 0,
        inicial: Number(plan.inicial) || 0,
        mensual: Number(plan.mensual) || 0
      };
      const newService: SelectedAdditionalService = {
        id: serviceId,
        type: 'implant',
        name: getImplantPlanName(plan),
        originalFields: { ...fields },
        editedFields: { ...fields }
      };
      newServices = [...selectedServices, newService];
    }

    updateSelectedServices(newServices);
  };

  // Alternar selección de un item de prótesis
  const toggleProsthesisItem = (item: ProsthesisItem) => {
    const serviceId = `prosthesis-${item.prosthesis_item_id}`;
    const isSelected = isServiceSelected(serviceId);

    let newServices: SelectedAdditionalService[];

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== serviceId);
    } else {
      const cost = Number(item.cost) || 0;
      const fields: ServiceEditableFields = {
        montoTotal: cost,
        inicial: 0,
        mensual: 0
      };
      const newService: SelectedAdditionalService = {
        id: serviceId,
        type: 'prosthesis',
        name: item.treatment_projection,
        description: `Item ${item.item_number}`,
        originalFields: { ...fields },
        editedFields: { ...fields }
      };
      newServices = [...selectedServices, newService];
    }

    updateSelectedServices(newServices);
  };

  // Actualizar un campo específico de un servicio
  const updateServiceField = (
    serviceId: string,
    field: keyof ServiceEditableFields,
    value: number
  ) => {
    const newServices = selectedServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          editedFields: {
            ...service.editedFields,
            [field]: value
          }
        };
      }
      return service;
    });

    updateSelectedServices(newServices);
  };

  // Eliminar servicio seleccionado
  const removeService = (serviceId: string) => {
    const newServices = selectedServices.filter(s => s.id !== serviceId);
    updateSelectedServices(newServices);
  };

  // Actualizar servicios y sincronizar con currentRecord
  const updateSelectedServices = (newServices: SelectedAdditionalService[]) => {
    setSelectedServices(newServices);
    setCurrentRecord({
      ...currentRecord,
      selectedAdditionalServices: newServices
    });
    setUnsavedChanges(true);
  };

  // Calcular total de servicios adicionales (suma de montoTotal editado)
  const additionalServicesTotal = selectedServices.reduce(
    (sum, service) => sum + service.editedFields.montoTotal,
    0
  );

  // Agrupar servicios por tipo
  const groupedServices = {
    orthodontic: selectedServices.filter(s => s.type === 'orthodontic'),
    implant: selectedServices.filter(s => s.type === 'implant'),
    prosthesis: selectedServices.filter(s => s.type === 'prosthesis')
  };

  return {
    // Datos de la API
    orthodonticPlans,
    implantPlans,
    prosthesisItems,
    isLoading,
    error,

    // Servicios seleccionados
    selectedServices,
    groupedServices,

    // Helpers
    isServiceSelected,
    getOrthodonticPlanName,
    getImplantPlanName,

    // Acciones
    toggleOrthodonticPlan,
    toggleImplantPlan,
    toggleProsthesisItem,
    updateServiceField,
    removeService,
    reloadServices: loadAdditionalServices,

    // Total
    additionalServicesTotal
  };
};
