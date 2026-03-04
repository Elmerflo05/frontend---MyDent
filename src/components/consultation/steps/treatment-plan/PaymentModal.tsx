import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface PaymentModalProps {
  show: boolean;
  paymentType: 'prosthesis' | 'implants';
  paymentForm: {
    monto: string;
    fecha: string;
    metodoPago: string;
    nota: string;
  };
  setPaymentForm: (form: any) => void;
  handleSubmit: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  paymentType,
  paymentForm,
  setPaymentForm,
  handleSubmit,
  onClose
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${paymentType === 'prosthesis' ? 'bg-green-500' : 'bg-purple-500'} rounded-lg flex items-center justify-center`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Registrar Pago</h3>
              <p className="text-sm text-gray-600">
                {paymentType === 'prosthesis' ? 'Prótesis' : 'Implantes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monto del Pago <span className="text-red-500">*</span>
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-gray-700">S/</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.monto}
                onChange={(e) => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                className="flex-1 text-xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-green-500 outline-none bg-transparent py-1"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha del Pago
            </label>
            <input
              type="date"
              value={paymentForm.fecha}
              onChange={(e) => setPaymentForm({ ...paymentForm, fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={paymentForm.metodoPago}
              onChange={(e) => setPaymentForm({ ...paymentForm, metodoPago: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Nota (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nota <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <textarea
              value={paymentForm.nota}
              onChange={(e) => setPaymentForm({ ...paymentForm, nota: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 ${paymentType === 'prosthesis' ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded-lg transition-colors font-medium`}
          >
            Registrar Pago
          </button>
        </div>
      </motion.div>
    </div>
  );
};
