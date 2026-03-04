/**
 * Componente de firma digital con canvas
 * Permite capturar firmas mediante mouse/touch
 */

import { useRef, useState, useEffect } from 'react';
import { Trash2, Check, Pen } from 'lucide-react';

interface SignaturePadProps {
  value?: string; // Base64 de la firma
  onChange: (signature: string) => void;
  label: string;
  required?: boolean;
}

export const SignaturePad = ({ value, onChange, label, required = false }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas con alta resolución
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Configurar estilos de dibujo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setContext(ctx);

    // Cargar firma existente si hay
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  // Obtener coordenadas del evento
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Iniciar dibujo
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;

    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  // Dibujar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;

    e.preventDefault();
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  // Terminar dibujo
  const stopDrawing = () => {
    if (!context || !isDrawing) return;

    context.closePath();
    setIsDrawing(false);

    // Guardar firma como base64
    const canvas = canvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      onChange(signature);
    }
  };

  // Limpiar firma
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hasSignature && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <Check className="w-4 h-4" />
            Firmado
          </div>
        )}
      </div>

      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors group">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Placeholder cuando no hay firma */}
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
            <Pen className="w-8 h-8 mb-2" />
            <p className="text-sm">Firme aquí con el mouse o touch</p>
          </div>
        )}
      </div>

      {/* Botón para limpiar */}
      {hasSignature && (
        <button
          type="button"
          onClick={clearSignature}
          className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Firma
        </button>
      )}
    </div>
  );
};
