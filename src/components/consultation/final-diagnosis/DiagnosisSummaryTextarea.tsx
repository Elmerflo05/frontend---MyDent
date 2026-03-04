import { FileText } from 'lucide-react';
import { SectionCard } from '@/components/consultation/shared';
import { useState, useEffect } from 'react';

interface DiagnosisSummaryTextareaProps {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
}

export const DiagnosisSummaryTextarea = ({
  value,
  onChange,
  readOnly
}: DiagnosisSummaryTextareaProps) => {
  // Estado local para escritura fluida
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar con valor externo cuando cambie (ej: al cargar datos)
  useEffect(() => {
    if (value !== localValue && value !== '') {
      setLocalValue(value);
    }
  }, [value]);

  // Debounce para sincronizar con el padre
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue]);

  return (
    <SectionCard
      icon={FileText}
      title="Resumen del Diagnóstico Definitivo"
      subtitle="Descripción narrativa del diagnóstico"
      colorScheme="amber"
      gradientTo="orange"
      animationDelay={0.2}
    >
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        rows={6}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all placeholder-gray-400 resize-none"
        placeholder="Escriba un resumen narrativo del diagnóstico definitivo, considerando:
• Resultados de las imágenes auxiliares
• Condiciones confirmadas
• Cambios respecto al diagnóstico presuntivo
• Recomendaciones especiales
• Pronóstico estimado..."
        disabled={readOnly}
      />
    </SectionCard>
  );
};
