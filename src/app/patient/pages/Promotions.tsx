import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Percent, Clock, Calendar, Gift, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { type Promotion } from '@/store/promotionStore';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import promotionsApi from '@/services/api/promotionsApi';
import { mapPromotionsFromBackend } from '@/services/api/promotionsMapper';
import { Modal } from '@/components/common/Modal/Modal';

const PatientPromotions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    if (activePromotions.length > 0) {
      const promoCode = searchParams.get('promo');
      if (promoCode) {
        const promotion = activePromotions.find(p => p.code === promoCode);
        if (promotion) {
          setSelectedPromotion(promotion);
        } else {
          toast.error('Promoción no encontrada o ya no está disponible');
        }
        searchParams.delete('promo');
        setSearchParams(searchParams);
      }
    }
  }, [activePromotions, searchParams, setSearchParams]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const backendPromotions = await promotionsApi.getActiveClinicPromotions();
      const mappedPromotions = mapPromotionsFromBackend(backendPromotions);
      setActivePromotions(mappedPromotions);
    } catch (error) {
      toast.error('Error al cargar promociones. Por favor, intenta de nuevo.');
      setActivePromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.discountType === 'percentage') return `${promo.discountValue}%`;
    if (promo.discountType === 'fixed') return `S/ ${promo.discountValue}`;
    return 'Gratis';
  };

  const getDiscountLabel = (promo: Promotion) => {
    if (promo.discountType === 'percentage') return 'de descuento';
    if (promo.discountType === 'fixed') return 'de descuento';
    return 'Servicio especial';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Promociones Disponibles</h1>
                <p className="text-teal-100 text-sm">
                  Copia el código y úsalo al agendar tu cita
                </p>
              </div>
            </div>
            <Link
              to="/patient/appointments"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar Cita
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando promociones...</p>
            </div>
          </div>
        )}

        {/* Stats Card */}
        {!loading && activePromotions.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Promociones activas</p>
                <p className="text-xl font-bold text-gray-900">{activePromotions.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Promotions Grid */}
        {!loading && activePromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePromotions.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">Activa</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{promo.title}</h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{getDiscountDisplay(promo)}</span>
                      <span className="text-teal-100 text-sm">{getDiscountLabel(promo)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{promo.description}</p>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span>
                        Válido hasta el {new Date(promo.endDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {promo.usageLimit && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>
                          {promo.usageLimit - promo.usageCount} usos disponibles
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Display */}
                  {promo.code ? (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Código de promoción:</p>
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-bold text-purple-900">{promo.code}</code>
                        <button
                          onClick={() => handleCopyCode(promo.code!)}
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Copiar código"
                        >
                          {copiedCode === promo.code ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-purple-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-purple-600 mt-2">
                        Usa este código al agendar tu cita
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">
                        Esta promoción se aplica automáticamente al seleccionarla en tu cita
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/patient/appointments"
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Agendar Cita
                  </Link>
                  <button
                    onClick={() => setSelectedPromotion(promo)}
                    className="w-full text-teal-600 hover:text-teal-700 py-2 text-sm font-medium"
                  >
                    Ver detalles
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : !loading && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay promociones disponibles
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Por el momento no tenemos promociones activas, pero mantente atento porque pronto tendremos ofertas especiales para ti.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">¿Cómo usar una promoción?</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>1. Copia el código de la promoción que deseas usar</li>
                <li>2. Ve a "Agendar Cita" y completa los datos de tu cita</li>
                <li>3. En el paso de confirmación, ingresa tu código de promoción</li>
                <li>4. El descuento se aplicará automáticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de Detalles */}
      <Modal
        isOpen={!!selectedPromotion}
        onClose={() => setSelectedPromotion(null)}
        size="lg"
      >
        <Modal.Header className="bg-gradient-to-r from-teal-600 to-blue-600 text-white border-b-0">
          <h2 className="text-xl font-bold">{selectedPromotion?.title}</h2>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold">{selectedPromotion && getDiscountDisplay(selectedPromotion)}</span>
            <span className="text-teal-100">{selectedPromotion && getDiscountLabel(selectedPromotion)}</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-gray-700">{selectedPromotion?.description}</p>

            {/* Código de promoción */}
            {selectedPromotion?.code && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Código de promoción:</p>
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-bold text-purple-900">{selectedPromotion.code}</code>
                  <button
                    onClick={() => handleCopyCode(selectedPromotion.code!)}
                    className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copiedCode === selectedPromotion.code ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-purple-600">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {selectedPromotion?.conditions && selectedPromotion.conditions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Términos y Condiciones:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedPromotion.conditions.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Link
            to="/patient/appointments"
            onClick={() => setSelectedPromotion(null)}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Agendar Cita con esta Promoción
          </Link>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientPromotions;
