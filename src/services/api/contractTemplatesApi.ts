/**
 * CONTRACT TEMPLATES API SERVICE
 * Servicio para comunicación con API de plantillas de contratos
 */

import httpClient from './httpClient';

// =====================
// TIPOS PARA PLANTILLAS
// =====================

// Tipo de respuesta de API (snake_case)
export interface ContractTemplateApi {
  contract_template_id: number;
  template_name: string;
  template_code: string | null;
  template_type: string;
  template_category: string;
  description: string | null;
  price: string | null; // Decimal viene como string
  duration: string | null;
  template_content: string;
  is_active: boolean;
  branch_id: number | null;
  status: string;
  user_id_registration: number | null;
  date_time_registration: string;
  user_id_modification: number | null;
  date_time_modification: string | null;
}

// Tipo para uso en frontend (camelCase, compatible con componentes existentes)
export interface ContractTemplate {
  id: number;
  nombre: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  precio: number;
  duracion: string;
  contenido: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

// Payload para crear/actualizar plantilla
export interface ContractTemplatePayload {
  template_name: string;
  template_code?: string;
  template_type: string;
  template_category?: string;
  description?: string;
  price?: number;
  duration?: string;
  template_content: string;
  is_active?: boolean;
  branch_id?: number;
}

// =====================
// TIPOS PARA CONTRATOS DE PACIENTES
// =====================

export interface PatientContractApi {
  patient_contract_id: number;
  patient_id: number;
  branch_id: number;
  contract_number: string | null;
  contract_type: string;
  contract_date: string;
  start_date: string;
  end_date: string | null;
  contract_amount: string | null;
  payment_terms: string | null;
  contract_content: string | null;
  contract_file_url: string | null;
  is_signed: boolean;
  signed_date: string | null;
  signature_data: string | null;
  notes: string | null;
  status: string;
  // Campos joined
  patient_name?: string;
  identification_number?: string;
  branch_name?: string;
  assigned_by_name?: string;
}

// Tipo para frontend
export interface PatientContract {
  id: number;
  patientId: number;
  patientName: string;
  patientDni: string;
  branchId: number;
  branchName: string;
  contractNumber: string | null;
  contractType: string;
  contractDate: Date;
  startDate: Date;
  endDate: Date | null;
  amount: number | null;
  paymentTerms: string | null;
  content: string | null;
  fileUrl: string | null;
  isSigned: boolean;
  signedDate: Date | null;
  signatureData: string | null;
  notes: string | null;
  assignedBy: string | null;
}

// Payload para asignar contrato
export interface AssignContractPayload {
  patient_id: number;
  template_id: number;
  branch_id: number;
  notes?: string;
  // Datos de firma (requeridos para firmar al momento de asignar)
  patient_address: string;
  representative_name?: string;
  representative_dni?: string;
  representative_address?: string;
  signature_data: string; // Base64 de la firma digital
}

// =====================
// TIPOS DE RESPUESTA API
// =====================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =====================
// MAPEADORES
// =====================

// Mapear de API a frontend
const mapTemplateFromApi = (api: ContractTemplateApi): ContractTemplate => ({
  id: api.contract_template_id,
  nombre: api.template_name,
  tipo: api.template_type,
  categoria: api.template_category || 'servicios',
  descripcion: api.description || '',
  precio: api.price ? parseFloat(api.price) : 0,
  duracion: api.duration || '',
  contenido: api.template_content,
  activo: api.is_active ?? true,
  createdAt: new Date(api.date_time_registration),
  updatedAt: api.date_time_modification ? new Date(api.date_time_modification) : null
});

// Mapear contrato de paciente de API a frontend
const mapPatientContractFromApi = (api: PatientContractApi): PatientContract => ({
  id: api.patient_contract_id,
  patientId: api.patient_id,
  patientName: api.patient_name || '',
  patientDni: api.identification_number || '',
  branchId: api.branch_id,
  branchName: api.branch_name || '',
  contractNumber: api.contract_number,
  contractType: api.contract_type,
  contractDate: new Date(api.contract_date),
  startDate: new Date(api.start_date),
  endDate: api.end_date ? new Date(api.end_date) : null,
  amount: api.contract_amount ? parseFloat(api.contract_amount) : null,
  paymentTerms: api.payment_terms,
  content: api.contract_content,
  fileUrl: api.contract_file_url,
  isSigned: api.is_signed ?? false,
  signedDate: api.signed_date ? new Date(api.signed_date) : null,
  signatureData: api.signature_data,
  notes: api.notes,
  assignedBy: api.assigned_by_name || null
});

// =====================
// SERVICIO API
// =====================

class ContractTemplatesApiService {
  private baseUrl = '/contract-templates';
  private patientContractsUrl = '/patient-contracts';

  // =====================
  // PLANTILLAS DE CONTRATOS
  // =====================

  // Obtener todas las plantillas con filtros
  async getTemplates(filters?: {
    template_category?: string;
    template_type?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ templates: ContractTemplate[]; pagination: ApiResponse<unknown>['pagination'] }> {
    const params = new URLSearchParams();

    if (filters?.template_category) params.append('template_category', filters.template_category);
    if (filters?.template_type) params.append('template_type', filters.template_type);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await httpClient.get<ApiResponse<ContractTemplateApi[]>>(url);

    return {
      templates: (response.data || []).map(mapTemplateFromApi),
      pagination: response.pagination
    };
  }

  // Obtener plantilla por ID
  async getTemplateById(id: number): Promise<ContractTemplate | null> {
    try {
      const response = await httpClient.get<ApiResponse<ContractTemplateApi>>(`${this.baseUrl}/${id}`);
      return response.data ? mapTemplateFromApi(response.data) : null;
    } catch {
      return null;
    }
  }

  // Crear nueva plantilla
  async createTemplate(data: ContractTemplatePayload): Promise<ContractTemplate> {
    const response = await httpClient.post<ApiResponse<ContractTemplateApi>>(this.baseUrl, data);
    return mapTemplateFromApi(response.data);
  }

  // Actualizar plantilla
  async updateTemplate(id: number, data: Partial<ContractTemplatePayload>): Promise<ContractTemplate> {
    const response = await httpClient.put<ApiResponse<ContractTemplateApi>>(`${this.baseUrl}/${id}`, data);
    return mapTemplateFromApi(response.data);
  }

  // Eliminar plantilla (soft delete)
  async deleteTemplate(id: number): Promise<boolean> {
    const response = await httpClient.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`);
    return response.success || false;
  }

  // =====================
  // CONTRATOS DE PACIENTES
  // =====================

  // Asignar contrato a paciente desde plantilla
  async assignContractToPatient(data: AssignContractPayload): Promise<PatientContract> {
    const response = await httpClient.post<ApiResponse<PatientContractApi>>(
      `${this.patientContractsUrl}/assign`,
      data
    );
    return mapPatientContractFromApi(response.data);
  }

  // Asignar contrato a paciente con archivo adjunto (usando FormData)
  async assignContractToPatientWithFile(formData: FormData): Promise<PatientContract> {
    // No establecer Content-Type - el navegador lo hace automáticamente con el boundary correcto
    const response = await httpClient.post<ApiResponse<PatientContractApi>>(
      `${this.patientContractsUrl}/assign`,
      formData
    );
    return mapPatientContractFromApi(response.data);
  }

  // Obtener contratos de un paciente (para admins)
  async getPatientContracts(filters?: {
    patient_id?: number;
    branch_id?: number;
    contract_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ contracts: PatientContract[]; pagination: ApiResponse<unknown>['pagination'] }> {
    const params = new URLSearchParams();

    if (filters?.patient_id) params.append('patient_id', String(filters.patient_id));
    if (filters?.branch_id) params.append('branch_id', String(filters.branch_id));
    if (filters?.contract_type) params.append('contract_type', filters.contract_type);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const url = params.toString() ? `${this.patientContractsUrl}?${params}` : this.patientContractsUrl;
    const response = await httpClient.get<ApiResponse<PatientContractApi[]>>(url);

    return {
      contracts: (response.data || []).map(mapPatientContractFromApi),
      pagination: response.pagination
    };
  }

  // Obtener mis contratos (para pacientes)
  async getMyContracts(filters?: {
    contract_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ contracts: PatientContract[]; pagination: ApiResponse<unknown>['pagination'] }> {
    const params = new URLSearchParams();

    if (filters?.contract_type) params.append('contract_type', filters.contract_type);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const url = params.toString()
      ? `${this.patientContractsUrl}/my-contracts?${params}`
      : `${this.patientContractsUrl}/my-contracts`;

    const response = await httpClient.get<ApiResponse<PatientContractApi[]>>(url);

    return {
      contracts: (response.data || []).map(mapPatientContractFromApi),
      pagination: response.pagination
    };
  }

  // Obtener contrato por ID
  async getContractById(id: number): Promise<PatientContract | null> {
    try {
      const response = await httpClient.get<ApiResponse<PatientContractApi>>(`${this.patientContractsUrl}/${id}`);
      return response.data ? mapPatientContractFromApi(response.data) : null;
    } catch {
      return null;
    }
  }

  // Firmar un contrato (para pacientes)
  async signContract(contractId: number, signatureData: {
    patient_address: string;
    representative_name?: string;
    representative_dni?: string;
    representative_address?: string;
    observations?: string;
  }): Promise<PatientContract> {
    const response = await httpClient.post<ApiResponse<PatientContractApi>>(
      `${this.patientContractsUrl}/sign/${contractId}`,
      signatureData
    );
    return mapPatientContractFromApi(response.data);
  }
}

// Exportar instancia singleton
export const contractTemplatesApi = new ContractTemplatesApiService();
export default contractTemplatesApi;
