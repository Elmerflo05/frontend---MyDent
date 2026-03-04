import { motion } from 'framer-motion';
import { Info, Save, Loader2, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import additionalServicesApi, {
  OrthodonticPlan,
  ImplantPlan,
  ProsthesisItem
} from '@/services/api/additionalServicesApi';

interface PaymentPlansTabProps {
  canEditConfiguration: boolean;
}

// Tipos para la UI
interface OrtodonciaUI {
  bracketsConvencionales: {
    presupuestoTotal: { montoTotal: number; inicial: number; pagoMensual: number };
    sinPresupuesto: { inicial: number; pagoMensual: number };
    sinInicial: { pagoMensual: number };
  };
  autoligantes: { montoTotal: number; inicial: number; pagoMensual: number };
  zafiro: { montoTotal: number; inicial: number; pagoMensual: number };
  alineadores: { montoTotal: number; inicial: number; pagoMensual: number };
}

interface ImplantesUI {
  inmediato: { montoTotal: number; inicial: number; mensual: number };
  convencional: { montoTotal: number; inicial: number; mensual: number };
  hibridoSuperior: { montoTotal: number; inicial: number; mensual: number };
  hibridoInferior: { montoTotal: number; inicial: number; mensual: number };
}

interface ProtesisUI {
  prosthesis_item_id?: number;
  item_number: number;
  treatment_projection: string;
  cost: number;
}

// Estado inicial vacio para UI
const initialOrtodonciaUI: OrtodonciaUI = {
  bracketsConvencionales: {
    presupuestoTotal: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
    sinPresupuesto: { inicial: 0, pagoMensual: 0 },
    sinInicial: { pagoMensual: 0 }
  },
  autoligantes: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
  zafiro: { montoTotal: 0, inicial: 0, pagoMensual: 0 },
  alineadores: { montoTotal: 0, inicial: 0, pagoMensual: 0 }
};

const initialImplantesUI: ImplantesUI = {
  inmediato: { montoTotal: 0, inicial: 0, mensual: 0 },
  convencional: { montoTotal: 0, inicial: 0, mensual: 0 },
  hibridoSuperior: { montoTotal: 0, inicial: 0, mensual: 0 },
  hibridoInferior: { montoTotal: 0, inicial: 0, mensual: 0 }
};

export const PaymentPlansTab = ({ canEditConfiguration }: PaymentPlansTabProps) => {
  // Estados de datos
  const [ortodoncia, setOrtodoncia] = useState<OrtodonciaUI>(initialOrtodonciaUI);
  const [implantes, setImplantes] = useState<ImplantesUI>(initialImplantesUI);
  const [protesis, setProtesis] = useState<ProtesisUI[]>([]);

  // Estados de control
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar datos desde API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await additionalServicesApi.getAllServices();

      if (response.success && response.data) {
        // Formatear ortodoncia
        const ortodonciaFormatted = additionalServicesApi.formatOrthodonticPlansForUI(
          response.data.orthodontic_plans
        );
        setOrtodoncia(ortodonciaFormatted);

        // Formatear implantes
        const implantesFormatted = additionalServicesApi.formatImplantPlansForUI(
          response.data.implant_plans
        );
        setImplantes(implantesFormatted);

        // Formatear protesis
        const protesisFormatted: ProtesisUI[] = response.data.prosthesis_items.map(
          (item: ProsthesisItem) => ({
            prosthesis_item_id: item.prosthesis_item_id,
            item_number: item.item_number,
            treatment_projection: item.treatment_projection,
            cost: Number(item.cost)
          })
        );
        setProtesis(protesisFormatted);

        setHasChanges(false);
      } else {
        throw new Error('No se pudieron cargar los datos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      console.error('Error cargando servicios adicionales:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guardar cambios
  const handleSave = async () => {
    if (!canEditConfiguration) {
      toast.error('No tienes permisos para modificar la configuracion');
      return;
    }

    setIsSaving(true);

    try {
      // Convertir datos de UI a formato API
      const ortodonciaPlans = additionalServicesApi.convertOrthodonticUIToAPI(ortodoncia);
      const implantesPlans = additionalServicesApi.convertImplantUIToAPI(implantes);
      const protesisItems = protesis.map((item, index) => ({
        item_number: item.item_number || index + 1,
        treatment_projection: item.treatment_projection,
        cost: item.cost,
        display_order: index + 1
      }));

      // Guardar todo en paralelo
      await Promise.all([
        additionalServicesApi.updateAllOrthodonticPlans(ortodonciaPlans),
        additionalServicesApi.updateAllImplantPlans(implantesPlans),
        additionalServicesApi.replaceAllProsthesisItems(protesisItems)
      ]);

      toast.success('Servicios adicionales guardados exitosamente');
      setHasChanges(false);

      // Recargar para tener IDs actualizados de protesis
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(`Error al guardar: ${errorMessage}`);
      console.error('Error guardando servicios adicionales:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar item de protesis
  const addProtesisItem = () => {
    const nextNumber = protesis.length + 1;
    setProtesis([
      ...protesis,
      {
        item_number: nextNumber,
        treatment_projection: '',
        cost: 0
      }
    ]);
    setHasChanges(true);
  };

  // Eliminar item de protesis
  const removeProtesisItem = (index: number) => {
    const updated = protesis.filter((_, i) => i !== index);
    // Renumerar
    const renumbered = updated.map((item, i) => ({
      ...item,
      item_number: i + 1
    }));
    setProtesis(renumbered);
    setHasChanges(true);
  };

  // Calcular total de protesis
  const protesisTotal = protesis.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // Render de loading
  if (isLoading) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center p-12"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Cargando servicios adicionales...</p>
        </div>
      </motion.div>
    );
  }

  // Render de error
  if (error) {
    return (
      <motion.div
        key="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Error al cargar datos</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="prices"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Servicios Adicionales</h2>
              <p className="text-sm text-gray-600">
                Configure los planes de ortodoncia, implantes dentales y protesis
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">Hay cambios sin guardar</span>
              )}
              <button
                onClick={handleSave}
                disabled={!canEditConfiguration || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* TABLA 1: Planes de ortodoncia */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded"></div>
              Planes de ortodoncia
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs text-gray-600 w-28"></th>
                    <th
                      className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700"
                      colSpan={3}
                    >
                      Brackets Convencionales
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                      Autoligantes
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                      Zafiro
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                      Alineadores
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600"></th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      presupuesto total
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      sin presupuesto
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      sin inicial
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      presupuesto total
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      presupuesto total
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-xs text-gray-600 text-center">
                      presupuesto total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila: monto total */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      monto total
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.presupuestoTotal.montoTotal}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              presupuestoTotal: {
                                ...ortodoncia.bracketsConvencionales.presupuestoTotal,
                                montoTotal: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 bg-gray-100 text-center text-sm text-gray-400">
                      -
                    </td>
                    <td className="border border-gray-300 px-2 py-1 bg-gray-100 text-center text-sm text-gray-400">
                      -
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.autoligantes.montoTotal}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            autoligantes: { ...ortodoncia.autoligantes, montoTotal: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.zafiro.montoTotal}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            zafiro: { ...ortodoncia.zafiro, montoTotal: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.alineadores.montoTotal}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            alineadores: { ...ortodoncia.alineadores, montoTotal: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                  </tr>
                  {/* Fila: inicial */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      inicial
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.presupuestoTotal.inicial}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              presupuestoTotal: {
                                ...ortodoncia.bracketsConvencionales.presupuestoTotal,
                                inicial: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.sinPresupuesto.inicial}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              sinPresupuesto: {
                                ...ortodoncia.bracketsConvencionales.sinPresupuesto,
                                inicial: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 bg-gray-100 text-center text-sm text-gray-400">
                      -
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.autoligantes.inicial}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            autoligantes: { ...ortodoncia.autoligantes, inicial: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.zafiro.inicial}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            zafiro: { ...ortodoncia.zafiro, inicial: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.alineadores.inicial}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            alineadores: { ...ortodoncia.alineadores, inicial: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                  </tr>
                  {/* Fila: pago mensual */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      pago mensual
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.presupuestoTotal.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              presupuestoTotal: {
                                ...ortodoncia.bracketsConvencionales.presupuestoTotal,
                                pagoMensual: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.sinPresupuesto.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              sinPresupuesto: {
                                ...ortodoncia.bracketsConvencionales.sinPresupuesto,
                                pagoMensual: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.bracketsConvencionales.sinInicial.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            bracketsConvencionales: {
                              ...ortodoncia.bracketsConvencionales,
                              sinInicial: {
                                ...ortodoncia.bracketsConvencionales.sinInicial,
                                pagoMensual: Number(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.autoligantes.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            autoligantes: {
                              ...ortodoncia.autoligantes,
                              pagoMensual: Number(e.target.value)
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.zafiro.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            zafiro: { ...ortodoncia.zafiro, pagoMensual: Number(e.target.value) }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        value={ortodoncia.alineadores.pagoMensual}
                        onChange={(e) => {
                          setOrtodoncia({
                            ...ortodoncia,
                            alineadores: {
                              ...ortodoncia.alineadores,
                              pagoMensual: Number(e.target.value)
                            }
                          });
                          setHasChanges(true);
                        }}
                        disabled={!canEditConfiguration}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: Planes de implantes dentales */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-500 rounded"></div>
              Planes de implantes dentales
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs text-gray-600 w-28"></th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600">
                      Inmediato
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600">
                      Convencional
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600">
                      Hibrido Sup
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600">
                      Hibrido Inf
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila: monto total */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      monto total
                    </td>
                    {(['inmediato', 'convencional', 'hibridoSuperior', 'hibridoInferior'] as const).map(
                      (tipo) => (
                        <td key={tipo} className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={implantes[tipo].montoTotal}
                            onChange={(e) => {
                              setImplantes({
                                ...implantes,
                                [tipo]: { ...implantes[tipo], montoTotal: Number(e.target.value) }
                              });
                              setHasChanges(true);
                            }}
                            disabled={!canEditConfiguration}
                            className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                          />
                        </td>
                      )
                    )}
                  </tr>
                  {/* Fila: inicial */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      inicial
                    </td>
                    {(['inmediato', 'convencional', 'hibridoSuperior', 'hibridoInferior'] as const).map(
                      (tipo) => (
                        <td key={tipo} className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={implantes[tipo].inicial}
                            onChange={(e) => {
                              setImplantes({
                                ...implantes,
                                [tipo]: { ...implantes[tipo], inicial: Number(e.target.value) }
                              });
                              setHasChanges(true);
                            }}
                            disabled={!canEditConfiguration}
                            className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                          />
                        </td>
                      )
                    )}
                  </tr>
                  {/* Fila: mensual */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium bg-gray-50">
                      mensual
                    </td>
                    {(['inmediato', 'convencional', 'hibridoSuperior', 'hibridoInferior'] as const).map(
                      (tipo) => (
                        <td key={tipo} className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={implantes[tipo].mensual}
                            onChange={(e) => {
                              setImplantes({
                                ...implantes,
                                [tipo]: { ...implantes[tipo], mensual: Number(e.target.value) }
                              });
                              setHasChanges(true);
                            }}
                            disabled={!canEditConfiguration}
                            className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                          />
                        </td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 3: Protesis (Rehabilitacion integral) */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-500 rounded"></div>
              Protesis (Rehabilitacion integral)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600 w-16">
                      N
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs text-gray-600">
                      Proyeccion de tratamiento
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600 w-28">
                      Costo
                    </th>
                    {canEditConfiguration && (
                      <th className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600 w-16">
                        Accion
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {protesis.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm font-medium bg-gray-50">
                        {item.item_number}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.treatment_projection}
                          onChange={(e) => {
                            const updated = [...protesis];
                            updated[index].treatment_projection = e.target.value;
                            setProtesis(updated);
                            setHasChanges(true);
                          }}
                          disabled={!canEditConfiguration}
                          placeholder="Descripcion del tratamiento"
                          className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => {
                            const updated = [...protesis];
                            updated[index].cost = Number(e.target.value);
                            setProtesis(updated);
                            setHasChanges(true);
                          }}
                          disabled={!canEditConfiguration}
                          className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded disabled:bg-gray-100 text-center"
                        />
                      </td>
                      {canEditConfiguration && (
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <button
                            onClick={() => removeProtesisItem(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Fila de total */}
                  <tr className="bg-green-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2 text-center"></td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm">Total</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-sm text-green-700">
                      S/ {protesisTotal.toFixed(2)}
                    </td>
                    {canEditConfiguration && <td className="border border-gray-300 px-4 py-2"></td>}
                  </tr>
                </tbody>
              </table>

              {/* Boton agregar item */}
              {canEditConfiguration && (
                <div className="mt-3">
                  <button
                    onClick={addProtesisItem}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Informacion importante</h4>
                <p className="text-sm text-blue-800">
                  Estas tablas configuran los precios y planes disponibles para servicios adicionales.
                  Los valores ingresados aqui seran utilizados como referencia en las consultas y
                  tratamientos. Para ortodoncia e implantes la estructura es fija; para protesis puede
                  agregar o eliminar filas segun necesite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
