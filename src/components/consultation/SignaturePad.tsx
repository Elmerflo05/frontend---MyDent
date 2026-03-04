/**
 * Componente de Firma Digital con Canvas
 * Permite al doctor firmar digitalmente recetas médicas
 * Usa react-signature-canvas para trazos suaves de calidad profesional
 */

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Check } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  signatureData?: string | null;
  disabled?: boolean;
}

const SignaturePadComponent = ({ onSignatureChange, signatureData, disabled = false }: SignaturePadProps) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastLoadedSignature = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const canvasId = useRef(`signature-canvas-${Date.now()}-${Math.random()}`).current;


  // Configuración inicial del canvas
  useEffect(() => {
    if (sigPadRef.current && !isInitialized.current) {
      // Limpiar completamente al montar
      sigPadRef.current.clear();
      // Activar el canvas si no está deshabilitado
      if (!disabled) {
        sigPadRef.current.on();
      }
      isInitialized.current = true;
    }
  }, [disabled]);

  // Cargar firma existente si hay
  useEffect(() => {
    if (!sigPadRef.current) {
      return;
    }

    // Solo cargar si es una firma nueva y diferente
    if (signatureData && signatureData !== lastLoadedSignature.current) {

      // Validar que la firma no esté vacía o corrupta
      // Las firmas válidas tienen al menos 22 caracteres (data:image/png;base64,)
      if (signatureData.length < 22 || signatureData === 'data:,' || signatureData.startsWith('data:,')) {
        // Limpiar el canvas y reiniciar completamente
        sigPadRef.current.clear();
        sigPadRef.current.off();
        sigPadRef.current.on();
        setIsEmpty(true);
        lastLoadedSignature.current = null;
        // Notificar que se limpió la firma corrupta
        onSignatureChange(null);
        return;
      }

      // IMPORTANTE: Limpiar completamente antes de cargar
      sigPadRef.current.clear();

      // Cargar la firma
      try {
        sigPadRef.current.fromDataURL(signatureData);
        setIsEmpty(false);
        lastLoadedSignature.current = signatureData;
      } catch (error) {
        // Si falla, limpiar todo y reiniciar
        sigPadRef.current.clear();
        sigPadRef.current.off();
        sigPadRef.current.on();
        setIsEmpty(true);
        lastLoadedSignature.current = null;
        onSignatureChange(null);
      }
    } else if (!signatureData && lastLoadedSignature.current) {
      // Si se borra externamente, limpiar
      sigPadRef.current.clear();
      setIsEmpty(true);
      lastLoadedSignature.current = null;
    }
  }, [signatureData, onSignatureChange]);

  // Controlar eventos según estado disabled
  // Este efecto se ejecuta siempre que cambie disabled para asegurar que el canvas esté activo
  useEffect(() => {
    if (!sigPadRef.current) return;

    // Pequeño delay para asegurar que el canvas esté renderizado
    const timer = setTimeout(() => {
      if (sigPadRef.current) {
        if (disabled) {
          sigPadRef.current.off();
        } else {
          sigPadRef.current.on();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [disabled]);

  const handleEnd = useCallback(() => {

    if (disabled) {
      return;
    }

    if (!sigPadRef.current) {
      return;
    }

    if (sigPadRef.current.isEmpty()) {
      return;
    }

    try {
      const signatureDataURL = sigPadRef.current.toDataURL('image/png');

      // Validar que la firma no esté corrupta antes de guardar
      if (signatureDataURL.length < 22 || signatureDataURL === 'data:,' || signatureDataURL.startsWith('data:,')) {
        return;
      }

      onSignatureChange(signatureDataURL);
      setIsEmpty(false);
    } catch (error) {
    }
  }, [disabled, onSignatureChange]);

  const clearSignature = useCallback(() => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsEmpty(true);
      lastLoadedSignature.current = null;
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <SignatureCanvas
          ref={sigPadRef}
          onEnd={handleEnd}
          canvasProps={{
            id: canvasId,
            className: `w-full h-40 border-2 border-dashed rounded-lg bg-gray-50 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'
            } ${isEmpty ? 'border-gray-300' : 'border-blue-400'}`,
            style: {
              touchAction: 'none',
              width: '100%',
              height: '160px'
            }
          }}
          backgroundColor="transparent"
          penColor="#1e40af"
          minWidth={1}
          maxWidth={2.5}
          throttle={16}
          velocityFilterWeight={0.7}
          dotSize={1}
          clearOnResize={false}
        />
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <Edit3 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Firme aquí</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          disabled={isEmpty || disabled}
          className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Firma
        </button>
        {!isEmpty && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Firmado</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const SignaturePad = memo(SignaturePadComponent, (prevProps, nextProps) => {
  return (
    prevProps.signatureData === nextProps.signatureData &&
    prevProps.disabled === nextProps.disabled
  );
});
