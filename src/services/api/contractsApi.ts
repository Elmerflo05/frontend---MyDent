/**
 * API Service para Contratos de Pacientes
 * Maneja todas las operaciones CRUD de contratos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface ContractFilters {
  patient_id?: number;
  status?: string;
  contract_type?: string;
  page?: number;
  limit?: number;
}

export interface ContractData {
  patient_contract_id?: number;
  patient_id: number;
  contract_name: string;
  contract_type?: string;
  contract_file: string;
  status: 'pending' | 'signed' | 'rejected';
  uploaded_at?: string;
  signed_at?: string;
  notes?: string;
  signature_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractUpdateData {
  contract_name?: string;
  contract_type?: string;
  contract_file?: string;
  status?: 'pending' | 'signed' | 'rejected';
  signed_at?: string;
  notes?: string;
  signature_data?: string;
  updated_at?: string;
}

class ContractsApi {
  private baseUrl = '/patient-contracts';

  /**
   * Obtener todos los contratos con filtros opcionales
   */
  async getContracts(filters?: ContractFilters): Promise<ApiResponse<ContractData[]>> {

    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.contract_type) params.append('contract_type', filters.contract_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await httpClient.get<ContractData[]>(url);
    return response;
  }

  /**
   * Obtener un contrato por ID
   */
  async getContractById(id: number): Promise<ApiResponse<ContractData>> {
    const response = await httpClient.get<ContractData>(`${this.baseUrl}/${id}`);
    return response;
  }

  /**
   * Crear un nuevo contrato
   */
  async createContract(data: ContractData): Promise<ApiResponse<ContractData>> {
    const response = await httpClient.post<ContractData>(this.baseUrl, data);
    return response;
  }

  /**
   * Actualizar un contrato existente
   */
  async updateContract(id: number, data: ContractUpdateData): Promise<ApiResponse<ContractData>> {
    const response = await httpClient.put<ContractData>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  /**
   * Eliminar un contrato
   */
  async deleteContract(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await httpClient.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response;
  }

  /**
   * Firmar un contrato
   */
  async signContract(id: number, signatureData: string): Promise<ApiResponse<ContractData>> {
    const response = await this.updateContract(id, {
      status: 'signed',
      signed_at: new Date().toISOString(),
      signature_data: signatureData,
      updated_at: new Date().toISOString()
    });
    return response;
  }

  /**
   * Rechazar un contrato
   */
  async rejectContract(id: number, notes?: string): Promise<ApiResponse<ContractData>> {
    const response = await this.updateContract(id, {
      status: 'rejected',
      notes: notes,
      updated_at: new Date().toISOString()
    });
    return response;
  }
}

// Exportar instancia única
export const contractsApi = new ContractsApi();
