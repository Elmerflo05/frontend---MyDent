/**
 * HOOK: useSignaturePad
 * Maneja la lógica de los signature pads (canvas de firmas)
 */

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export const useSignaturePad = () => {
  const canvasRef = useRef<SignatureCanvas>(null);

  // Limpiar el canvas
  const clear = () => {
    canvasRef.current?.clear();
  };

  // Obtener la firma como imagen base64
  const getSignature = (): string | null => {
    if (!canvasRef.current) return null;

    // Verificar si el canvas está vacío
    if (canvasRef.current.isEmpty()) {
      return null;
    }

    return canvasRef.current.toDataURL('image/png');
  };

  // Verificar si el canvas está vacío
  const isEmpty = (): boolean => {
    return canvasRef.current?.isEmpty() ?? true;
  };

  // Establecer una firma existente
  const setSignature = (dataURL: string) => {
    if (canvasRef.current) {
      canvasRef.current.fromDataURL(dataURL);
    }
  };

  return {
    canvasRef,
    clear,
    getSignature,
    isEmpty,
    setSignature
  };
};
