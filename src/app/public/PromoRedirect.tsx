import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Tag, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePromotionStore } from '@/store/promotionStore';

/**
 * Componente de redirección de promociones
 * Maneja el flujo de links públicos de promociones:
 * - Si usuario NO está logueado → redirige a registro
 * - Si usuario está logueado → redirige al portal paciente con la promoción
 */
const PromoRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { promotions } = usePromotionStore();

  useEffect(() => {
    if (!code) {
      // Si no hay código, redirigir al home
      navigate('/');
      return;
    }

    // Buscar la promoción por código
    const promotion = promotions.find(p => p.code === code);

    if (!promotion) {
      // Si la promoción no existe, redirigir al home con mensaje
      navigate('/', { state: { error: 'Promoción no encontrada' } });
      return;
    }

    // Verificar si el usuario está logueado
    if (!user) {
      // No está logueado → redirigir a registro con parámetros
      navigate(`/register?redirect=/patient/promotions&promo=${code}`);
    } else {
      // Está logueado → redirigir al portal paciente con la promoción
      if (user.role === 'patient') {
        navigate(`/patient/promotions?promo=${code}`);
      } else {
        // Si no es paciente, redirigir a registro como paciente
        navigate(`/register?redirect=/patient/promotions&promo=${code}`);
      }
    }
  }, [code, user, navigate, promotions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Gift className="w-16 h-16 text-purple-600 animate-bounce" />
            <Tag className="w-8 h-8 text-teal-600 absolute -bottom-2 -right-2" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Cargando Promoción
        </h1>

        <p className="text-gray-600 mb-6">
          Estamos preparando una oferta especial para ti...
        </p>

        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <span className="text-sm text-gray-500">Redirigiendo...</span>
        </div>

        {code && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Código de promoción</p>
            <code className="text-sm font-mono font-bold text-gray-800">{code}</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoRedirect;
