import { Eye, EyeOff } from 'lucide-react';

interface OdontogramControlsProps {
  showLabels: boolean;
  showRoots: boolean;
  onShowLabelsChange: (show: boolean) => void;
  onShowRootsChange: (show: boolean) => void;
  legendConditions: Array<{ id: string; label: string; color: string }>;
}

export const OdontogramControls = ({
  showLabels,
  showRoots,
  onShowLabelsChange,
  onShowRootsChange,
  legendConditions
}: OdontogramControlsProps) => {
  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => onShowLabelsChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Eye className="w-4 h-4" />
            Números de dientes
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showRoots}
              onChange={(e) => onShowRootsChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            {showRoots ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Mostrar raíces
          </label>
        </div>

        {/* Leyenda rápida */}
        <div className="flex items-center gap-4">
          {legendConditions.map(condition => (
            <div key={condition.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: condition.color }}
              />
              <span className="text-xs text-gray-700">{condition.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
