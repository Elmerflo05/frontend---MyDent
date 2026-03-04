import { motion } from 'framer-motion';
import { Tooth as ToothClass, ToothGeometry } from '../classes';

interface ToothSVGProps {
  tooth: ToothClass;
  showLabels: boolean;
  showRoots: boolean;
  hoveredTooth: string | null;
  highlightHover: boolean;
  enableAnimations: boolean;
  onToothSectionClick: (event: React.MouseEvent, toothNumber: string, sectionId: string) => void;
  onToothHover: (event: React.MouseEvent, toothNumber: string) => void;
  onToothHoverLeave: () => void;
  getSectionColor: (toothNumber: string, sectionId: string) => string;
  position: { x: number; y: number };
}

export const ToothSVG = ({
  tooth,
  showLabels,
  showRoots,
  hoveredTooth,
  highlightHover,
  enableAnimations,
  onToothSectionClick,
  onToothHover,
  onToothHoverLeave,
  getSectionColor,
  position
}: ToothSVGProps) => {
  const geometry = new ToothGeometry(tooth);
  const allSections = geometry.getAllSections();
  const crownSections = geometry.getCrownSections();
  const rootSections = geometry.getRootSections();

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onMouseEnter={(e) => {
        onToothHover(e, tooth.number);
      }}
      onMouseLeave={onToothHoverLeave}
    >
      {/* Raíces (si están habilitadas) */}
      {showRoots && rootSections.map((section) => {
        const sectionColor = getSectionColor(tooth.number, section.id);
        const isColored = sectionColor !== '#ffffff';

        return (
          <motion.path
            key={section.id}
            d={section.path}
            fill={isColored ? sectionColor : section.fillColor}
            stroke="#666"
            strokeWidth="1.5"
            whileHover={highlightHover ? {
              scale: 1.02,
              fill: isColored ? sectionColor : '#d0d0d0'
            } : {}}
            whileTap={enableAnimations ? { scale: 0.98 } : {}}
            className="cursor-pointer transition-all duration-200"
            onClick={(e) => onToothSectionClick(e, tooth.number, section.id)}
            style={{
              opacity: isColored ? 0.9 : 1
            }}
          >
            <title>{section.name} del diente {tooth.number}</title>
          </motion.path>
        );
      })}

      {/* Círculo de fondo para la corona */}
      <circle
        cx="0"
        cy="0"
        r="50"
        fill="url(#toothGradient)"
        stroke="#d1d5db"
        strokeWidth="2"
        className={`transition-all duration-200 ${
          hoveredTooth === tooth.number ? 'stroke-blue-400' : ''
        }`}
      />

      {/* Secciones de la corona */}
      {crownSections.map((section) => {
        const sectionColor = getSectionColor(tooth.number, section.id);
        const isColored = sectionColor !== '#ffffff';

        return (
          <motion.path
            key={section.id}
            d={section.path}
            fill={sectionColor}
            stroke={isColored ? sectionColor : '#94a3b8'}
            strokeWidth={isColored ? "2" : "1"}
            whileHover={highlightHover ? { scale: 1.05 } : {}}
            whileTap={enableAnimations ? { scale: 0.95 } : {}}
            className="cursor-pointer transition-all duration-200 hover:brightness-110"
            onClick={(e) => onToothSectionClick(e, tooth.number, section.id)}
            style={{
              filter: hoveredTooth === tooth.number ? 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.5))' : '',
              opacity: isColored ? 0.9 : 1
            }}
          >
            <title>{`Diente ${tooth.number} - ${section.name}`}</title>
          </motion.path>
        );
      })}

      {/* Número del diente */}
      {showLabels && (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-700 text-sm font-bold pointer-events-none select-none"
        >
          {tooth.number}
        </text>
      )}

      {/* Tooltip hover */}
      {hoveredTooth === tooth.number && (
        <g className="pointer-events-none">
          <rect
            x="-40"
            y="-80"
            width="80"
            height="25"
            fill="black"
            fillOpacity="0.8"
            rx="4"
          />
          <text
            x="0"
            y="-62"
            textAnchor="middle"
            className="fill-white text-sm"
          >
            Diente {tooth.number}
          </text>
        </g>
      )}
    </g>
  );
};
