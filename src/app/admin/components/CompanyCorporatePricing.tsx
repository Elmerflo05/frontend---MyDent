import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Download, Upload, Save, Trash2, DollarSign, Filter } from 'lucide-react';
import { companiesApi } from '@/services/api/companiesApi';
import { toast } from 'sonner';

interface ProcedurePrice {
  company_procedure_price_id: number;
  procedure_type: string;
  procedure_id: number;
  procedure_code: string;
  procedure_name: string;
  specialty: string;
  regular_price: number;
  corporate_price: number | null;
  condition_name?: string;
}

interface Props {
  companyId: number;
  companyName: string;
  onBack: () => void;
}

export default function CompanyCorporatePricing({ companyId, companyName, onBack }: Props) {
  const [prices, setPrices] = useState<ProcedurePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [totalPrices, setTotalPrices] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadPrices();
  }, [companyId, filterType, searchTerm]);

  const loadPrices = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.getCompanyProcedurePrices(companyId, {
        procedure_type: filterType || undefined,
        search: searchTerm || undefined
      });
      setPrices(response.data || []);
      setTotalPrices(response.total_prices || 0);
    } catch (error) {
      toast.error('Error al cargar precios corporativos');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (key: string, value: string) => {
    setEditingPrices(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrice = async (price: ProcedurePrice) => {
    const key = `${price.procedure_type}_${price.procedure_id}`;
    const newPrice = editingPrices[key];

    if (newPrice === undefined || newPrice === '') return;

    const numericPrice = parseFloat(newPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error('El precio debe ser un numero positivo');
      return;
    }

    try {
      await companiesApi.upsertCompanyProcedurePrice(companyId, {
        procedure_type: price.procedure_type,
        procedure_id: price.procedure_id,
        corporate_price: numericPrice
      });
      toast.success('Precio guardado');
      setEditingPrices(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      loadPrices();
    } catch (error) {
      toast.error('Error al guardar precio');
    }
  };

  const handleDeletePrice = async (price: ProcedurePrice) => {
    if (!price.company_procedure_price_id) return;
    if (!confirm('Eliminar este precio corporativo?')) return;

    try {
      await companiesApi.deleteCompanyProcedurePrice(companyId, price.company_procedure_price_id);
      toast.success('Precio eliminado');
      loadPrices();
    } catch (error) {
      toast.error('Error al eliminar precio');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await companiesApi.downloadPriceTemplate(companyId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `precios_corporativos_${companyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Plantilla descargada');
    } catch (error) {
      toast.error('Error al descargar plantilla');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      const result = await companiesApi.importPricesFromExcel(companyId, importFile);
      toast.success(result.message || 'Importacion completada');
      setShowImportModal(false);
      setImportFile(null);
      loadPrices();
    } catch (error: any) {
      toast.error(error.message || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Empresas
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Precios Corporativos</h1>
            <p className="text-gray-600 mt-1">{companyName} - {totalPrices} precios configurados</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o codigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="sub_procedure">Sub-Procedimientos</option>
              <option value="condition_procedure">Procedimientos de Condicion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de precios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codigo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedimiento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Regular</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Corporativo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Cargando precios...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sin precios corporativos</h3>
                    <p className="mt-1 text-sm text-gray-500">Descarga la plantilla e importa los precios</p>
                  </td>
                </tr>
              ) : (
                prices.map((price) => {
                  const key = `${price.procedure_type}_${price.procedure_id}`;
                  const editValue = editingPrices[key];
                  const currentCorporatePrice = editValue !== undefined
                    ? parseFloat(editValue) || 0
                    : price.corporate_price || 0;
                  const discount = price.regular_price - currentCorporatePrice;
                  const discountPct = price.regular_price > 0
                    ? Math.round((discount / price.regular_price) * 100)
                    : 0;

                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{price.procedure_code}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{price.procedure_name}</p>
                          {price.condition_name && (
                            <p className="text-xs text-gray-500">{price.condition_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          price.procedure_type === 'sub_procedure'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {price.procedure_type === 'sub_procedure' ? 'Sub-Proc' : 'Condicion'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{price.specialty}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        S/ {Number(price.regular_price)?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValue !== undefined ? editValue : (price.corporate_price?.toString() || '')}
                          onChange={(e) => handlePriceChange(key, e.target.value)}
                          placeholder="Sin precio"
                          className="w-28 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {currentCorporatePrice > 0 && discount > 0 ? (
                          <span className="text-sm text-green-600 font-medium">
                            -{discountPct}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {editValue !== undefined && (
                            <button
                              onClick={() => handleSavePrice(price)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          )}
                          {price.company_procedure_price_id && (
                            <button
                              onClick={() => handleDeletePrice(price)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de importacion */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Importar Precios desde Excel</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sube el archivo Excel con los precios corporativos completados.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {importFile ? importFile.name : 'Click para seleccionar archivo .xlsx'}
                </p>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
