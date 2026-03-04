import { motion } from 'framer-motion';
import { Pill, Calendar, CheckCircle } from 'lucide-react';
import { SectionCard } from '@/components/consultation/shared';

interface PrescriptionDisplayProps {
  medications: any[];
  signature?: string;
}

export const PrescriptionDisplay = ({
  medications,
  signature
}: PrescriptionDisplayProps) => {
  if (!medications || medications.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-6"
    >
      <SectionCard
        icon={Pill}
        title="Receta Médica Prescrita"
        subtitle="Medicamentos recetados durante la consulta"
        colorScheme="pink"
        gradientTo="rose"
        animationDelay={0}
      >
        <div className="space-y-3">
          {medications.map((med: any, index: number) => (
            <motion.div
              key={med.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-pink-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Encabezado con medicamento */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900">{med.name}</h5>
                      <p className="text-xs text-pink-600 font-medium">Concentración: {med.concentracion}</p>
                    </div>
                  </div>

                  {/* Campos simplificados: Cantidad e Indicaciones */}
                  <div className="space-y-2 mt-3">
                    <div className="bg-pink-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-pink-700">Cantidad:</span>
                      <p className="text-gray-900 font-semibold text-sm mt-1">{med.cantidad}</p>
                    </div>

                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-3">
                      <span className="text-xs font-medium text-pink-700">Indicaciones:</span>
                      <p className="text-gray-900 text-sm mt-1 whitespace-pre-line">{med.indicaciones}</p>
                    </div>
                  </div>
                </div>

                {/* Fecha y médico */}
                {med.createdAt && (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(med.createdAt).toLocaleDateString('es-PE')}</span>
                    </div>
                    {med.prescribedByName && (
                      <p className="text-xs text-gray-400">
                        Dr. {med.prescribedByName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Firma Digital del Médico */}
        {signature && (
          <div className="mt-6 pt-6 border-t border-pink-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Firma Digital del Médico</h5>
            <div className="bg-white rounded-lg border-2 border-pink-200 p-4 inline-block">
              <img
                src={signature}
                alt="Firma del médico"
                className="max-w-xs h-32 object-contain"
              />
            </div>
          </div>
        )}

        {/* Resumen de la receta */}
        <div className="mt-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-pink-600" />
            <p className="text-sm font-medium text-pink-900">
              Total de medicamentos prescritos: <strong>{medications.length}</strong>
            </p>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
};
