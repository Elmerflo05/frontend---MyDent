// ============================================================================
// VOUCHER SERVICE - Single Responsibility: Gestión de Vouchers de Pago
// ============================================================================
// TODO: Implementar API real para vouchers de pago
// Por ahora usa almacenamiento en memoria como stub

import {
  VoucherStatus
} from '@/types/healthPlans';
import type {
  PaymentVoucher
} from '@/types/healthPlans';

// Almacenamiento temporal en memoria (stub)
let vouchersStore: PaymentVoucher[] = [];

/**
 * Servicio para gestión de Vouchers de Pago
 * SRP: Solo maneja operaciones CRUD de vouchers y su validación
 *
 * NOTA: Este servicio actualmente usa almacenamiento en memoria como stub.
 * Requiere implementación de API real en el backend.
 */
export class VoucherService {

  /**
   * Subir un nuevo voucher de pago (Paciente)
   */
  async uploadVoucher(
    subscriptionId: string,
    patientId: string,
    planId: string,
    voucherImage: string,
    amount: number,
    paymentDate: Date,
    paymentPeriod: string
  ): Promise<PaymentVoucher> {
    console.warn('⚠️ VoucherService.uploadVoucher: Usando almacenamiento en memoria (stub)');

    const voucher: PaymentVoucher = {
      id: `VOUCHER-${Date.now()}`,
      subscriptionId,
      patientId,
      planId,
      voucherImage,
      amount,
      paymentDate,
      uploadDate: new Date(),
      paymentPeriod,
      status: VoucherStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vouchersStore.push(voucher);
    return voucher;
  }

  /**
   * Obtener vouchers pendientes de aprobación (SuperAdmin)
   */
  async getPendingVouchers(): Promise<PaymentVoucher[]> {
    return vouchersStore
      .filter(v => v.status === VoucherStatus.PENDING)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtener todos los vouchers con filtros (SuperAdmin)
   */
  async getAllVouchers(filters?: {
    status?: VoucherStatus;
    patientId?: string;
    planId?: string;
    subscriptionId?: string;
  }): Promise<PaymentVoucher[]> {
    let vouchers = [...vouchersStore];

    if (filters?.status) {
      vouchers = vouchers.filter(v => v.status === filters.status);
    }
    if (filters?.patientId) {
      vouchers = vouchers.filter(v => v.patientId === filters.patientId);
    }
    if (filters?.planId) {
      vouchers = vouchers.filter(v => v.planId === filters.planId);
    }
    if (filters?.subscriptionId) {
      vouchers = vouchers.filter(v => v.subscriptionId === filters.subscriptionId);
    }

    return vouchers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Aprobar un voucher (SuperAdmin)
   */
  async approveVoucher(voucherId: string, superAdminId: string): Promise<void> {
    const index = vouchersStore.findIndex(v => v.id === voucherId);
    if (index === -1) {
      throw new Error(`Voucher con ID ${voucherId} no encontrado`);
    }

    const voucher = vouchersStore[index];
    if (voucher.status !== VoucherStatus.PENDING) {
      throw new Error('Solo se pueden aprobar vouchers pendientes');
    }

    vouchersStore[index] = {
      ...voucher,
      status: VoucherStatus.APPROVED,
      reviewedBy: superAdminId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Rechazar un voucher (SuperAdmin)
   */
  async rejectVoucher(
    voucherId: string,
    superAdminId: string,
    rejectionReason: string
  ): Promise<void> {
    const index = vouchersStore.findIndex(v => v.id === voucherId);
    if (index === -1) {
      throw new Error(`Voucher con ID ${voucherId} no encontrado`);
    }

    const voucher = vouchersStore[index];
    if (voucher.status !== VoucherStatus.PENDING) {
      throw new Error('Solo se pueden rechazar vouchers pendientes');
    }

    vouchersStore[index] = {
      ...voucher,
      status: VoucherStatus.REJECTED,
      reviewedBy: superAdminId,
      reviewedAt: new Date(),
      rejectionReason,
      updatedAt: new Date()
    };
  }

  /**
   * Obtener historial de vouchers de una suscripción
   */
  async getSubscriptionVouchers(subscriptionId: string): Promise<PaymentVoucher[]> {
    return vouchersStore
      .filter(v => v.subscriptionId === subscriptionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtener el último voucher de una suscripción
   */
  async getLatestVoucher(subscriptionId: string): Promise<PaymentVoucher | null> {
    const vouchers = await this.getSubscriptionVouchers(subscriptionId);
    return vouchers[0] || null;
  }

  /**
   * Verificar si hay un voucher pendiente para una suscripción
   */
  async hasPendingVoucher(subscriptionId: string): Promise<boolean> {
    return vouchersStore.some(
      v => v.subscriptionId === subscriptionId && v.status === VoucherStatus.PENDING
    );
  }

  /**
   * Obtener voucher por ID
   */
  async getVoucherById(voucherId: string): Promise<PaymentVoucher | null> {
    return vouchersStore.find(v => v.id === voucherId) || null;
  }

  /**
   * Obtener estadísticas de vouchers (SuperAdmin)
   */
  async getVoucherStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    return {
      total: vouchersStore.length,
      pending: vouchersStore.filter(v => v.status === VoucherStatus.PENDING).length,
      approved: vouchersStore.filter(v => v.status === VoucherStatus.APPROVED).length,
      rejected: vouchersStore.filter(v => v.status === VoucherStatus.REJECTED).length
    };
  }

  /**
   * Eliminar un voucher (solo si está rechazado, para que el paciente suba uno nuevo)
   */
  async deleteVoucher(voucherId: string): Promise<void> {
    const index = vouchersStore.findIndex(v => v.id === voucherId);
    if (index === -1) {
      throw new Error(`Voucher con ID ${voucherId} no encontrado`);
    }

    const voucher = vouchersStore[index];
    if (voucher.status === VoucherStatus.APPROVED) {
      throw new Error('No se pueden eliminar vouchers aprobados');
    }

    vouchersStore.splice(index, 1);
  }
}

// Exportar instancia singleton
export const voucherService = new VoucherService();
