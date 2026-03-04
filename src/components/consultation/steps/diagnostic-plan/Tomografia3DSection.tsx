import { Save } from 'lucide-react';

interface Tomografia3DData {
  // Tipo de Entrega
  conInforme: boolean;
  sinInforme: boolean;
  dicom: boolean;
  soloUsb: boolean;
  // CAMPO PEQUEÑO
  endodoncia: boolean;
  fracturaRadicular: boolean;
  anatomiaEndodontica: boolean;
  // CAMPO MEDIANO
  localizacionDiente: boolean;
  implantes: boolean;
  maxilarSuperior: boolean;
  // CAMPO MEDIANO/GRANDE
  viaAerea: boolean;
  ortognatica: boolean;
  // ORTODONCIA
  marpe: boolean;
  miniImplantes: boolean;
  // OTRAS OPCIONES
  atm: boolean;
  macizoFacial: boolean;
  // Otros (especificar)
  otros: string;
}

interface Tomografia3DSectionProps {
  data: Tomografia3DData;
  onChange: (field: keyof Tomografia3DData, value: any) => void;
  onSave: () => void;
  readOnly?: boolean;
}

export const Tomografia3DSection = ({
  data,
  onChange,
  onSave,
  readOnly = false
}: Tomografia3DSectionProps) => {
  const renderCheckbox = (checked: boolean, field: keyof Tomografia3DData, label: string) => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(field, e.target.checked)}
          className="w-4 h-4 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
          disabled={readOnly}
        />
        <span className="font-semibold text-gray-900">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-purple-600 p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Paso 1: Tomografía 3D</h2>
          <p className="text-sm text-purple-100">PanoCef - Centro de Imágenes Dentomaxilofacial</p>
        </div>
        <button
          onClick={onSave}
          disabled={readOnly}
          className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Tipo de Entrega */}
        <div className="bg-cyan-50/50 rounded-lg p-5 border border-cyan-200">
          <h3 className="font-semibold text-cyan-900 mb-4">📦 Tipo de Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.conInforme, 'conInforme', 'Con Informe')}
            {renderCheckbox(data.sinInforme, 'sinInforme', 'Sin Informe')}
            {renderCheckbox(data.dicom, 'dicom', 'DICOM')}
            {renderCheckbox(data.soloUsb, 'soloUsb', 'Solo USB')}
          </div>
        </div>

        {/* CAMPO PEQUEÑO */}
        <div className="bg-green-50/50 rounded-lg p-5 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-4">🟢 CAMPO PEQUEÑO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.endodoncia, 'endodoncia', 'Endodoncia')}
            {renderCheckbox(data.fracturaRadicular, 'fracturaRadicular', 'Fractura Radicular')}
            {renderCheckbox(data.anatomiaEndodontica, 'anatomiaEndodontica', 'Anatomía Endodontica')}
          </div>
        </div>

        {/* CAMPO MEDIANO */}
        <div className="bg-yellow-50/50 rounded-lg p-5 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-4">🟡 CAMPO MEDIANO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.localizacionDiente, 'localizacionDiente', 'Localización de Diente Incluido')}
            {renderCheckbox(data.implantes, 'implantes', 'Implantes')}
            {renderCheckbox(data.maxilarSuperior, 'maxilarSuperior', 'Maxilar Superior o Inferior')}
          </div>
        </div>

        {/* CAMPO MEDIANO/GRANDE */}
        <div className="bg-orange-50/50 rounded-lg p-5 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-4">🟠 CAMPO MEDIANO/GRANDE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.viaAerea, 'viaAerea', 'Vía Aerea')}
            {renderCheckbox(data.ortognatica, 'ortognatica', 'Ortognática')}
          </div>
        </div>

        {/* ORTODONCIA */}
        <div className="bg-purple-50/50 rounded-lg p-5 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-4">🦷 ORTODONCIA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.marpe, 'marpe', 'MARPE')}
            {renderCheckbox(data.miniImplantes, 'miniImplantes', 'Mini Implantes')}
          </div>
        </div>

        {/* OTRAS OPCIONES */}
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">📋 OTRAS OPCIONES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox(data.atm, 'atm', 'ATM')}
            {renderCheckbox(data.macizoFacial, 'macizoFacial', 'Macizo Facial')}
          </div>
        </div>

        {/* Otros */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">📝 Otros (especificar)</h3>
          <textarea
            value={data.otros}
            onChange={(e) => onChange('otros', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
            rows={3}
            placeholder="Especifique otros estudios..."
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
