import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Activity } from 'lucide-react';
import { SectionCard } from '@/components/consultation/shared';

interface TreatmentObservationsSectionProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

/**
 * Componente optimizado para escritura fluida.
 * Usa estado local para evitar re-renders del padre en cada keystroke.
 * Solo notifica al padre de manera debounced (300ms después de dejar de escribir).
 */
export const TreatmentObservationsSection = memo(({
  value,
  onChange,
  readOnly = false
}: TreatmentObservationsSectionProps) => {
  // Estado local para escritura fluida
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Sincronizar estado local cuando el valor externo cambia (ej: carga inicial)
  useEffect(() => {
    // Solo sincronizar si el valor externo es diferente y no es el mount inicial
    if (value !== localValue && !isInitialMount.current) {
      setLocalValue(value);
    }
    isInitialMount.current = false;
  }, [value]);

  // Inicializar con el valor externo
  useEffect(() => {
    setLocalValue(value);
  }, []);

  // Handler optimizado con debounce interno
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Actualizar estado local inmediatamente (escritura fluida)
    setLocalValue(newValue);

    // Cancelar debounce anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Notificar al padre después de 300ms sin escribir
    debounceTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SectionCard
      icon={Activity}
      title="Procedimientos Realizados"
      subtitle="Detalle los tratamientos ejecutados durante esta consulta"
      colorScheme="blue"
      gradientTo="indigo"
      animationDelay={0}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones <span className="text-red-500">*</span>
          </label>
          <textarea
            value={localValue}
            onChange={handleChange}
            rows={8}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400 resize-none"
            placeholder="Describa detalladamente los procedimientos realizados:
• Procedimientos odontológicos ejecutados
• Técnicas utilizadas
• Materiales empleados
• Observaciones durante el tratamiento
• Respuesta del paciente
• Complicaciones si las hubo
• Resultados obtenidos"
            required
            disabled={readOnly}
          />
          <p className="text-sm text-gray-500 mt-2">
            Registre de manera completa y precisa todos los procedimientos ejecutados para mantener un historial clínico detallado.
          </p>
        </div>
      </div>
    </SectionCard>
  );
});
