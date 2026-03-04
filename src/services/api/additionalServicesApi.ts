/**
 * Additional Services API Service
 * Maneja todas las operaciones para Servicios Adicionales:
 * - Planes de Ortodoncia
 * - Planes de Implantes Dentales
 * - Items de Protesis (Rehabilitacion Integral)
 */

import httpClient from './httpClient';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Plan de Ortodoncia
 */
export interface OrthodonticPlan {
  orthodontic_plan_id: number;
  plan_type: 'brackets_convencionales' | 'autoligantes' | 'zafiro' | 'alineadores';
  plan_modality: 'presupuesto_total' | 'sin_presupuesto' | 'sin_inicial';
  monto_total: number | null;
  inicial: number | null;
  pago_mensual: number;
  status: string;
  date_time_registration?: string;
  date_time_modification?: string;
}

/**
 * Plan de Implantes Dentales
 */
export interface ImplantPlan {
  implant_plan_id: number;
  plan_type: 'inmediato' | 'convencional' | 'hibrido_superior' | 'hibrido_inferior';
  monto_total: number;
  inicial: number;
  mensual: number;
  status: string;
  date_time_registration?: string;
  date_time_modification?: string;
}

/**
 * Item de Protesis
 */
export interface ProsthesisItem {
  prosthesis_item_id?: number;
  item_number: number;
  treatment_projection: string;
  cost: number;
  display_order?: number;
  status?: string;
  date_time_registration?: string;
  date_time_modification?: string;
}

/**
 * Resumen de Protesis
 */
export interface ProsthesisSummary {
  total_cost: number;
  items_count: number;
}

/**
 * Datos para actualizar plan de ortodoncia
 */
export interface OrthodonticPlanUpdateData {
  plan_type: OrthodonticPlan['plan_type'];
  plan_modality: OrthodonticPlan['plan_modality'];
  monto_total?: number | null;
  inicial?: number | null;
  pago_mensual?: number;
}

/**
 * Datos para actualizar plan de implantes
 */
export interface ImplantPlanUpdateData {
  plan_type: ImplantPlan['plan_type'];
  monto_total?: number;
  inicial?: number;
  mensual?: number;
}

/**
 * Datos para crear/actualizar item de protesis
 */
export interface ProsthesisItemData {
  item_number?: number;
  treatment_projection: string;
  cost: number;
  display_order?: number;
}

/**
 * Formato UI para ortodoncia
 */
export interface OrthodonticUIData {
  bracketsConvencionales: {
    presupuestoTotal: { montoTotal: number; inicial: number; pagoMensual: number };
    sinPresupuesto: { inicial: number; pagoMensual: number };
    sinInicial: { pagoMensual: number };
  };
  autoligantes: { montoTotal: number; inicial: number; pagoMensual: number };
  zafiro: { montoTotal: number; inicial: number; pagoMensual: number };
  alineadores: { montoTotal: number; inicial: number; pagoMensual: number };
}

/**
 * Formato UI para implantes
 */
export interface ImplantUIData {
  inmediato: { montoTotal: number; inicial: number; mensual: number };
  convencional: { montoTotal: number; inicial: number; mensual: number };
  hibridoSuperior: { montoTotal: number; inicial: number; mensual: number };
  hibridoInferior: { montoTotal: number; inicial: number; mensual: number };
}

// =============================================================================
// API SERVICE
// =============================================================================

/** Respuesta genérica de la API */
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  summary?: ProsthesisSummary;
}

/** Respuesta de todos los servicios */
interface AllServicesData {
  orthodontic_plans: OrthodonticPlan[];
  implant_plans: ImplantPlan[];
  prosthesis_items: ProsthesisItem[];
  prosthesis_total: ProsthesisSummary;
}

class AdditionalServicesApiService {
  private readonly basePath = '/additional-services';

  // ===========================================================================
  // OBTENER TODOS LOS SERVICIOS
  // ===========================================================================

  /**
   * Obtiene todos los servicios adicionales en una sola llamada
   */
  async getAllServices(): Promise<{ success: boolean; data: AllServicesData }> {
    try {
      const response = await httpClient.get<AllServicesData>(`${this.basePath}/all`);

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener servicios adicionales');
      }

      return {
        success: true,
        data: response.data || {
          orthodontic_plans: [],
          implant_plans: [],
          prosthesis_items: [],
          prosthesis_total: { total_cost: 0, items_count: 0 }
        }
      };
    } catch (error) {
      console.error('Error en getAllServices:', error);
      throw error;
    }
  }

  // ===========================================================================
  // PLANES DE ORTODONCIA
  // ===========================================================================

  /**
   * Obtiene todos los planes de ortodoncia
   */
  async getOrthodonticPlans(): Promise<{ success: boolean; data: OrthodonticPlan[]; total: number }> {
    try {
      const response = await httpClient.get<OrthodonticPlan[]>(`${this.basePath}/orthodontic-plans`);

      return {
        success: response.success || true,
        data: response.data || [],
        total: response.data?.length || 0
      };
    } catch (error) {
      console.error('Error en getOrthodonticPlans:', error);
      throw error;
    }
  }

  /**
   * Actualiza todos los planes de ortodoncia de una vez
   */
  async updateAllOrthodonticPlans(
    plans: OrthodonticPlanUpdateData[]
  ): Promise<{ success: boolean; data: OrthodonticPlan[] }> {
    try {
      const response = await httpClient.put<OrthodonticPlan[]>(
        `${this.basePath}/orthodontic-plans`,
        { plans }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar planes de ortodoncia');
      }

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error en updateAllOrthodonticPlans:', error);
      throw error;
    }
  }

  /**
   * Actualiza un plan de ortodoncia especifico
   */
  async updateOrthodonticPlan(
    planType: OrthodonticPlan['plan_type'],
    modality: OrthodonticPlan['plan_modality'],
    data: Partial<OrthodonticPlanUpdateData>
  ): Promise<{ success: boolean; data?: OrthodonticPlan }> {
    try {
      const response = await httpClient.put<OrthodonticPlan>(
        `${this.basePath}/orthodontic-plans/${planType}/${modality}`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar plan de ortodoncia');
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateOrthodonticPlan:', error);
      throw error;
    }
  }

  // ===========================================================================
  // PLANES DE IMPLANTES DENTALES
  // ===========================================================================

  /**
   * Obtiene todos los planes de implantes
   */
  async getImplantPlans(): Promise<{ success: boolean; data: ImplantPlan[]; total: number }> {
    try {
      const response = await httpClient.get<ImplantPlan[]>(`${this.basePath}/implant-plans`);

      return {
        success: response.success || true,
        data: response.data || [],
        total: response.data?.length || 0
      };
    } catch (error) {
      console.error('Error en getImplantPlans:', error);
      throw error;
    }
  }

  /**
   * Actualiza todos los planes de implantes de una vez
   */
  async updateAllImplantPlans(
    plans: ImplantPlanUpdateData[]
  ): Promise<{ success: boolean; data: ImplantPlan[] }> {
    try {
      const response = await httpClient.put<ImplantPlan[]>(
        `${this.basePath}/implant-plans`,
        { plans }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar planes de implantes');
      }

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error en updateAllImplantPlans:', error);
      throw error;
    }
  }

  /**
   * Actualiza un plan de implantes especifico
   */
  async updateImplantPlan(
    planType: ImplantPlan['plan_type'],
    data: Partial<ImplantPlanUpdateData>
  ): Promise<{ success: boolean; data?: ImplantPlan }> {
    try {
      const response = await httpClient.put<ImplantPlan>(
        `${this.basePath}/implant-plans/${planType}`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar plan de implantes');
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateImplantPlan:', error);
      throw error;
    }
  }

  // ===========================================================================
  // ITEMS DE PROTESIS
  // ===========================================================================

  /**
   * Obtiene todos los items de protesis
   */
  async getProsthesisItems(): Promise<{
    success: boolean;
    data: ProsthesisItem[];
    total: number;
    summary: ProsthesisSummary;
  }> {
    try {
      const response = await httpClient.get<ProsthesisItem[]>(`${this.basePath}/prosthesis-items`);

      // El backend puede enviar summary a nivel de respuesta
      const apiResponse = response as ApiResponse<ProsthesisItem[]>;

      return {
        success: response.success || true,
        data: response.data || [],
        total: response.data?.length || 0,
        summary: apiResponse.summary || { total_cost: 0, items_count: 0 }
      };
    } catch (error) {
      console.error('Error en getProsthesisItems:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo item de protesis
   */
  async createProsthesisItem(
    data: ProsthesisItemData
  ): Promise<{ success: boolean; data?: ProsthesisItem }> {
    try {
      const response = await httpClient.post<ProsthesisItem>(
        `${this.basePath}/prosthesis-items`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al crear item de protesis');
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en createProsthesisItem:', error);
      throw error;
    }
  }

  /**
   * Actualiza un item de protesis existente
   */
  async updateProsthesisItem(
    itemId: number,
    data: Partial<ProsthesisItemData>
  ): Promise<{ success: boolean; data?: ProsthesisItem }> {
    try {
      const response = await httpClient.put<ProsthesisItem>(
        `${this.basePath}/prosthesis-items/${itemId}`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar item de protesis');
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateProsthesisItem:', error);
      throw error;
    }
  }

  /**
   * Elimina un item de protesis
   */
  async deleteProsthesisItem(itemId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await httpClient.delete(`${this.basePath}/prosthesis-items/${itemId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar item de protesis');
      }

      return { success: true, message: response.message };
    } catch (error) {
      console.error('Error en deleteProsthesisItem:', error);
      throw error;
    }
  }

  /**
   * Reemplaza todos los items de protesis de una vez
   */
  async replaceAllProsthesisItems(
    items: ProsthesisItemData[]
  ): Promise<{ success: boolean; data: ProsthesisItem[] }> {
    try {
      const response = await httpClient.put<ProsthesisItem[]>(
        `${this.basePath}/prosthesis-items/replace-all`,
        { items }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al reemplazar items de protesis');
      }

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error en replaceAllProsthesisItems:', error);
      throw error;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Convierte planes de ortodoncia del formato API al formato de tabla UI
   * Estructura fija para la UI del PaymentPlansTab
   */
  formatOrthodonticPlansForUI(plans: OrthodonticPlan[]): OrthodonticUIData {
    const result = {
      bracketsConvencionales: {
        presupuestoTotal: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
        sinPresupuesto: { inicial: 0, pagoMensual: 0 },
        sinInicial: { pagoMensual: 0 }
      },
      autoligantes: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
      zafiro: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
      alineadores: { montoTotal: 0, inicial: 0, pagoMensual: 0 }
    };

    for (const plan of plans) {
      const montoTotal = plan.monto_total ? Number(plan.monto_total) : 0;
      const inicial = plan.inicial ? Number(plan.inicial) : 0;
      const pagoMensual = plan.pago_mensual ? Number(plan.pago_mensual) : 0;

      if (plan.plan_type === 'brackets_convencionales') {
        if (plan.plan_modality === 'presupuesto_total') {
          result.bracketsConvencionales.presupuestoTotal = { montoTotal, inicial, pagoMensual };
        } else if (plan.plan_modality === 'sin_presupuesto') {
          result.bracketsConvencionales.sinPresupuesto = { inicial, pagoMensual };
        } else if (plan.plan_modality === 'sin_inicial') {
          result.bracketsConvencionales.sinInicial = { pagoMensual };
        }
      } else if (plan.plan_type === 'autoligantes') {
        result.autoligantes = { montoTotal, inicial, pagoMensual };
      } else if (plan.plan_type === 'zafiro') {
        result.zafiro = { montoTotal, inicial, pagoMensual };
      } else if (plan.plan_type === 'alineadores') {
        result.alineadores = { montoTotal, inicial, pagoMensual };
      }
    }

    return result;
  }

  /**
   * Convierte planes de implantes del formato API al formato de tabla UI
   */
  formatImplantPlansForUI(plans: ImplantPlan[]): ImplantUIData {
    const result = {
      inmediato: { montoTotal: 0, inicial: 0, mensual: 0 },
      convencional: { montoTotal: 0, inicial: 0, mensual: 0 },
      hibridoSuperior: { montoTotal: 0, inicial: 0, mensual: 0 },
      hibridoInferior: { montoTotal: 0, inicial: 0, mensual: 0 }
    };

    for (const plan of plans) {
      const montoTotal = plan.monto_total ? Number(plan.monto_total) : 0;
      const inicial = plan.inicial ? Number(plan.inicial) : 0;
      const mensual = plan.mensual ? Number(plan.mensual) : 0;

      if (plan.plan_type === 'inmediato') {
        result.inmediato = { montoTotal, inicial, mensual };
      } else if (plan.plan_type === 'convencional') {
        result.convencional = { montoTotal, inicial, mensual };
      } else if (plan.plan_type === 'hibrido_superior') {
        result.hibridoSuperior = { montoTotal, inicial, mensual };
      } else if (plan.plan_type === 'hibrido_inferior') {
        result.hibridoInferior = { montoTotal, inicial, mensual };
      }
    }

    return result;
  }

  /**
   * Convierte formato UI de ortodoncia a formato API para guardar
   */
  convertOrthodonticUIToAPI(uiData: OrthodonticUIData): OrthodonticPlanUpdateData[] {
    return [
      {
        plan_type: 'brackets_convencionales',
        plan_modality: 'presupuesto_total',
        monto_total: uiData.bracketsConvencionales.presupuestoTotal.montoTotal,
        inicial: uiData.bracketsConvencionales.presupuestoTotal.inicial,
        pago_mensual: uiData.bracketsConvencionales.presupuestoTotal.pagoMensual
      },
      {
        plan_type: 'brackets_convencionales',
        plan_modality: 'sin_presupuesto',
        monto_total: null,
        inicial: uiData.bracketsConvencionales.sinPresupuesto.inicial,
        pago_mensual: uiData.bracketsConvencionales.sinPresupuesto.pagoMensual
      },
      {
        plan_type: 'brackets_convencionales',
        plan_modality: 'sin_inicial',
        monto_total: null,
        inicial: null,
        pago_mensual: uiData.bracketsConvencionales.sinInicial.pagoMensual
      },
      {
        plan_type: 'autoligantes',
        plan_modality: 'presupuesto_total',
        monto_total: uiData.autoligantes.montoTotal,
        inicial: uiData.autoligantes.inicial,
        pago_mensual: uiData.autoligantes.pagoMensual
      },
      {
        plan_type: 'zafiro',
        plan_modality: 'presupuesto_total',
        monto_total: uiData.zafiro.montoTotal,
        inicial: uiData.zafiro.inicial,
        pago_mensual: uiData.zafiro.pagoMensual
      },
      {
        plan_type: 'alineadores',
        plan_modality: 'presupuesto_total',
        monto_total: uiData.alineadores.montoTotal,
        inicial: uiData.alineadores.inicial,
        pago_mensual: uiData.alineadores.pagoMensual
      }
    ];
  }

  /**
   * Convierte formato UI de implantes a formato API para guardar
   */
  convertImplantUIToAPI(uiData: ImplantUIData): ImplantPlanUpdateData[] {
    return [
      {
        plan_type: 'inmediato',
        monto_total: uiData.inmediato.montoTotal,
        inicial: uiData.inmediato.inicial,
        mensual: uiData.inmediato.mensual
      },
      {
        plan_type: 'convencional',
        monto_total: uiData.convencional.montoTotal,
        inicial: uiData.convencional.inicial,
        mensual: uiData.convencional.mensual
      },
      {
        plan_type: 'hibrido_superior',
        monto_total: uiData.hibridoSuperior.montoTotal,
        inicial: uiData.hibridoSuperior.inicial,
        mensual: uiData.hibridoSuperior.mensual
      },
      {
        plan_type: 'hibrido_inferior',
        monto_total: uiData.hibridoInferior.montoTotal,
        inicial: uiData.hibridoInferior.inicial,
        mensual: uiData.hibridoInferior.mensual
      }
    ];
  }

  /**
   * Calcula el total de protesis desde los items
   */
  calculateProsthesisTotal(items: ProsthesisItem[]): number {
    return items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }
}

// Exportar instancia singleton
export const additionalServicesApi = new AdditionalServicesApiService();
export default additionalServicesApi;
