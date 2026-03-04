import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  doctorId: string;
  date: string;
  time: string;
}

export const WhatsAppButton = ({ doctorId, date, time }: WhatsAppButtonProps) => {
  const [doctorInfo, setDoctorInfo] = useState<{ hasWhatsApp: boolean; phone?: string; doctorName?: string }>({ hasWhatsApp: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctorInfo = async () => {
      try {
        const { getWhatsAppContactInfo } = await import('@/services/doctorAvailability');
        const info = await getWhatsAppContactInfo(doctorId);
        setDoctorInfo(info);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      loadDoctorInfo();
    }
  }, [doctorId]);

  const handleWhatsAppClick = () => {
    if (!doctorInfo.phone) return;

    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `Hola ${doctorInfo.doctorName}, quisiera consultar sobre la disponibilidad para una cita el día ${formattedDate} a las ${time}. El horario aparece ocupado en el sistema, ¿sería posible coordinar una cita?`;

    const whatsappUrl = `https://wa.me/51${doctorInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        <MessageCircle className="w-4 h-4" />
        Cargando...
      </button>
    );
  }

  if (!doctorInfo.hasWhatsApp) {
    return (
      <div className="text-sm text-gray-600">
        No hay información de contacto disponible para este médico
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      Contactar por WhatsApp
    </button>
  );
};
