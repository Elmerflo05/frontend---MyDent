import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Calculator, Check, AlertTriangle, Loader2, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { User } from '@/types';
import {
  getPendingIncomes,
  calculateCommission as apiCalculateCommission,
  type PendingIncome
} from '@/services/api/commissionsApi';

interface CommissionCalculatorModalProps {
  doctor: User;
  branchId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const IGV_PERCENTAGE = 18; // IGV fijo al 18%

// Palabras clave que requieren gastos extras
const KEYWORDS_REQUIRING_EXTRA_COSTS = [
  'prótesis',
  'corona',
  'incrustación indirecta',
  'implante',
  'membrana',
  'injerto de hueso',
  'ortodoncia'
];

const CommissionCalculatorModal: React.FC<CommissionCalculatorModalProps> = ({
  doctor,
  branchId,
  onClose,
  onSuccess
}) => {
  // Obtener porcentaje de comisión por defecto del doctor
  const defaultPercentage = doctor.profile?.commissionConfig?.percentage || doctor.profile?.commissionPercentage || 50;

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingIncomes, setPendingIncomes] = useState<PendingIncome[]>([]);
  const [grossIncome, setGrossIncome] = useState<number>(0);

  // Período de fechas
  const [periodStart, setPeriodStart] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  // Costos y deducciones
  const [prosthesisCost, setProsthesisCost] = useState<number>(0);
  const [materialsCost, setMaterialsCost] = useState<number>(0);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(defaultPercentage);
  const [notes, setNotes] = useState<string>('');

  // Detectar palabras clave
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);

  // Cálculos automáticos
  const [calculations, setCalculations] = useState({
    igv: 0,
    netBase: 0,
    commissionAmount: 0
  });

  // Cargar ingresos pendientes al montar o cambiar período
  useEffect(() => {
    loadPendingIncomes();
  }, [doctor.id, branchId, periodStart, periodEnd]);

  // Recalcular cuando cambien los valores
  useEffect(() => {
    calculateCommission();
  }, [grossIncome, prosthesisCost, materialsCost, commissionPercentage]);

  const loadPendingIncomes = async () => {
    try {
      setIsLoading(true);

      // Obtener el dentist_id desde el doctor
      const dentistId = doctor.dentistId || doctor.id;

      const data = await getPendingIncomes(dentistId, {
        branchId,
        startDate: periodStart,
        endDate: periodEnd
      });

      setPendingIncomes(data.incomes);
      setGrossIncome(data.totals.grossIncome);

      // Detectar palabras clave en los nombres de los procedimientos
      const allItemNames = data.incomes.map(i => i.item_name).join(' ');
      const textLower = allItemNames.toLowerCase();
      const foundKeywords = KEYWORDS_REQUIRING_EXTRA_COSTS.filter(keyword =>
        textLower.includes(keyword.toLowerCase())
      );
      setDetectedKeywords(foundKeywords);

    } catch (error) {
      console.error('Error al cargar ingresos pendientes:', error);
      toast.error('Error al cargar los ingresos pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCommission = () => {
    // Calcular IGV (18% fijo)
    const igv = grossIncome * (IGV_PERCENTAGE / 100);

    // Calcular base neta
    const netBase = grossIncome - igv - prosthesisCost - materialsCost;

    // Calcular comisión sobre la base neta
    const commissionAmount = netBase * (commissionPercentage / 100);

    setCalculations({
      igv,
      netBase,
      commissionAmount: Math.max(0, commissionAmount)
    });
  };

  const handleSaveCommission = async () => {
    if (pendingIncomes.length === 0) {
      toast.error('No hay ingresos para calcular comisión');
      return;
    }

    try {
      setIsSaving(true);

      const dentistId = doctor.dentistId || doctor.id;

      await apiCalculateCommission({
        dentistId,
        branchId,
        periodStart,
        periodEnd,
        igvAmount: calculations.igv,
        prosthesisLabCost: prosthesisCost,
        materialsCost: materialsCost,
        commissionPercentage,
        notes
      });

      toast.success('Comisión calculada y guardada exitosamente');
      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.error('Error al guardar comisión:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la comisión');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Cálculo de Comisión</h2>
                <p className="text-green-100 text-sm">
                  Dr. {doctor.profile?.firstName || doctor.firstName} {doctor.profile?.lastName || doctor.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Cargando ingresos...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selector de Período */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Período de Cálculo</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Desde</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen de Ingresos */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Ingresos Pendientes</h3>
                </div>
                <p className="text-sm text-blue-800">
                  Se encontraron <span className="font-bold">{pendingIncomes.length}</span> procedimientos
                  con un total de <span className="font-bold">S/ {grossIncome.toFixed(2)}</span>
                </p>
                {pendingIncomes.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-blue-700 cursor-pointer hover:underline">
                      Ver detalle de procedimientos
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-blue-800">
                            <th className="pb-1">Fecha</th>
                            <th className="pb-1">Procedimiento</th>
                            <th className="pb-1 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="text-blue-900">
                          {pendingIncomes.map((income) => (
                            <tr key={income.income_id} className="border-t border-blue-200">
                              <td className="py-1">{format(new Date(income.performed_date), 'dd/MM/yyyy')}</td>
                              <td className="py-1">{income.item_name}</td>
                              <td className="py-1 text-right">S/ {parseFloat(String(income.final_amount)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>

              {/* Alerta de Palabras Clave Detectadas */}
              {detectedKeywords.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-2">
                        Gastos extras detectados
                      </h4>
                      <p className="text-sm text-amber-800 mb-3">
                        Se detectaron procedimientos que pueden requerir costos adicionales de laboratorio.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detectedKeywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-300"
                          >
                            <Check className="w-3 h-3" />
                            {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de Cálculo */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    {/* Ingreso Bruto */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Ingreso bruto
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        S/ {grossIncome.toFixed(2)}
                      </td>
                    </tr>

                    {/* IGV */}
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        IGV ({IGV_PERCENTAGE}%)
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">
                        - S/ {calculations.igv.toFixed(2)}
                      </td>
                    </tr>

                    {/* Laboratorio de Prótesis */}
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        Laboratorio de prótesis
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-red-600">-</span>
                          <span className="text-gray-500">S/</span>
                          <input
                            type="number"
                            value={prosthesisCost}
                            onChange={(e) => setProsthesisCost(Number(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-28 px-3 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Materiales */}
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        Materiales
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-red-600">-</span>
                          <span className="text-gray-500">S/</span>
                          <input
                            type="number"
                            value={materialsCost}
                            onChange={(e) => setMaterialsCost(Number(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-28 px-3 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Separador */}
                    <tr className="bg-gray-100">
                      <td className="px-4 py-2" colSpan={2}></td>
                    </tr>

                    {/* Base neta */}
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Base neta
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        S/ {calculations.netBase.toFixed(2)}
                      </td>
                    </tr>

                    {/* Porcentaje de Comisión */}
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        Comisión del doctor
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={commissionPercentage}
                            onChange={(e) => setCommissionPercentage(Number(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.5"
                            className="w-20 px-3 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <span className="text-sm text-gray-700">%</span>
                        </div>
                      </td>
                    </tr>

                    {/* Monto de Comisión */}
                    <tr className="bg-green-50 border-t-2 border-green-300">
                      <td className="px-4 py-4 text-base font-bold text-green-900">
                        Monto de comisión
                      </td>
                      <td className="px-4 py-4 text-right text-xl font-bold text-green-700">
                        S/ {calculations.commissionAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Agregar observaciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600">
            {pendingIncomes.length > 0 && (
              <>
                Comisión final: <span className="font-bold text-xl text-green-700">S/ {calculations.commissionAmount.toFixed(2)}</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCommission}
              disabled={isSaving || pendingIncomes.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Guardar Comisión
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default CommissionCalculatorModal;
