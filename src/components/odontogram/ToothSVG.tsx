/**
 * ToothSVG Component - Renderizado individual de un diente
 * Extraído de Odontogram.tsx para mejor modularidad
 */

import React from 'react';
import { getToothDimensions, getToothType } from '@/constants/toothDimensions';
import { isRightSide } from '@/lib/utils/odontogramUtils';

interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  state?: 'good' | 'bad';
  color?: string;
  [key: string]: any;
}

interface MultiToothSelection {
  firstTooth: string;
  waitingForSecond: boolean;
  [key: string]: any;
}

export interface ToothSVGProps {
  toothNumber: string;
  x: number;
  y: number;
  isUpper: boolean;
  hoveredTooth: string | null;
  setHoveredTooth: (tooth: string | null) => void;
  treatmentMode: boolean;
  toothConditions: ToothCondition[];
  setHoveredToothInTreatment: (tooth: string | null) => void;
  edentuloTotalSelection: MultiToothSelection | null;
  protesisRemovibleSelection: MultiToothSelection | null;
  handleToothClick: (e: React.MouseEvent, toothNumber: string, section?: string) => void;
}

export const ToothSVG: React.FC<ToothSVGProps> = ({
  toothNumber,
  x,
  y,
  isUpper,
  hoveredTooth,
  setHoveredTooth,
  treatmentMode,
  toothConditions,
  setHoveredToothInTreatment,
  edentuloTotalSelection,
  protesisRemovibleSelection,
  handleToothClick
}) => {
  const type = getToothType(toothNumber);
  const dimensions = getToothDimensions(toothNumber);
  const isHovered = hoveredTooth === toothNumber;
  const width = dimensions.width;
  const crownHeight = dimensions.crownHeight;
  const rootHeight = dimensions.rootHeight;
  const isRight = isRightSide(toothNumber);

  // Detectar si es diente temporal (cuadrantes 5, 6, 7, 8)
  const quadrant = parseInt(toothNumber.split('.')[0]);
  const position = parseInt(toothNumber.split('.')[1]);
  const isTemporaryTooth = quadrant >= 5 && quadrant <= 8;
  const isTemporaryMolar = isTemporaryTooth && (position === 4 || position === 5);

  // Verificar si el diente tiene condiciones rojas en modo tratamiento
  const hasRedConditions = treatmentMode && toothConditions.some(c =>
    c.toothNumber === toothNumber && (c.state === 'bad' || c.color === 'red')
  );

  // Verificar si este diente es el primer diente seleccionado para Edéntulo Total
  const isFirstToothInEdentuloRange = edentuloTotalSelection?.firstTooth === toothNumber && edentuloTotalSelection?.waitingForSecond;

  // Verificar si este diente es el primer diente seleccionado para Prótesis Removible
  const isFirstToothInProtesisRemovibleRange = protesisRemovibleSelection?.firstTooth === toothNumber && protesisRemovibleSelection?.waitingForSecond;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => {
        setHoveredTooth(toothNumber);
        if (treatmentMode) {
          setHoveredToothInTreatment(toothNumber);
        }
      }}
      onMouseLeave={() => {
        setHoveredTooth(null);
        if (treatmentMode) {
          setHoveredToothInTreatment(null);
        }
      }}
      className={treatmentMode && hasRedConditions ? "tooth-group cursor-pointer" : "tooth-group"}
      style={treatmentMode && hasRedConditions ? { cursor: 'pointer' } : undefined}
    >
      {/* Highlight visual cuando es el primer diente seleccionado para rango de Edéntulo Total */}
      {isFirstToothInEdentuloRange && (
        <>
          {/* Fondo de highlight amarillo/dorado para indicar selección */}
          <rect
            x={-width / 2 - 5}
            y={isUpper ? -rootHeight - 5 : -5}
            width={width + 10}
            height={crownHeight + rootHeight + 10}
            fill="#fbbf24"
            fillOpacity="0.3"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4,4"
            rx="4"
          />
          {/* Texto indicador */}
          <text
            x="0"
            y={isUpper ? -rootHeight - 15 : crownHeight + rootHeight + 20}
            textAnchor="middle"
            className="fill-orange-600 text-[10px] font-bold"
            style={{ pointerEvents: 'none' }}
          >
            INICIO
          </text>
        </>
      )}

      {/* Highlight visual cuando es el primer diente seleccionado para rango de Prótesis Removible */}
      {isFirstToothInProtesisRemovibleRange && (
        <>
          {/* Fondo de highlight púrpura para indicar selección */}
          <rect
            x={-width / 2 - 5}
            y={isUpper ? -rootHeight - 5 : -5}
            width={width + 10}
            height={crownHeight + rootHeight + 10}
            fill="#a855f7"
            fillOpacity="0.3"
            stroke="#9333ea"
            strokeWidth="2"
            strokeDasharray="4,4"
            rx="4"
          />
          {/* Texto indicador */}
          <text
            x="0"
            y={isUpper ? -rootHeight - 15 : crownHeight + rootHeight + 20}
            textAnchor="middle"
            className="fill-purple-700 text-[10px] font-bold"
            style={{ pointerEvents: 'none' }}
          >
            INICIO
          </text>
        </>
      )}

      {/* Raíces Triangulares (Pinchos Puntiagudos) */}
      {isUpper ? (
        <g>
          {/* MOLARES SUPERIORES: 3 TRIÁNGULOS SÓLIDOS SIMPLES */}
          {type === 'molar' && (
            <>
              {/* Raíz Palatina (central) - Triángulo sólido */}
              <path
                d={`M ${-8} 0 L 0 ${-rootHeight} L ${8} 0 Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />

              {/* Raíz Mesio-Vestibular (lado mesial - hacia el centro) */}
              <path
                d={`M ${isRight ? (-width/3 - 7) : (width/3 - 7)} 0 L ${isRight ? (-width/3) : (width/3)} ${-rootHeight * 0.9} L ${isRight ? (-width/3 + 7) : (width/3 + 7)} 0 Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />

              {/* Raíz Disto-Vestibular (lado distal - hacia afuera) */}
              <path
                d={`M ${isRight ? (width/3 - 7) : (-width/3 - 7)} 0 L ${isRight ? (width/3) : (-width/3)} ${-rootHeight * 0.9} L ${isRight ? (width/3 + 7) : (-width/3 + 7)} 0 Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* PREMOLARES SUPERIORES O MOLARES TEMPORALES SUPERIORES */}
          {type === 'premolar' && (() => {
            const isFirstPremolar = position === 4;

            // Los molares temporales (5.4, 5.5, 6.4, 6.5) tienen 3 pinchos como molares
            if (isTemporaryMolar) {
              return (
                <>
                  {/* Raíz Palatina (central) - Triángulo sólido */}
                  <path
                    d={`M ${-8} 0 L 0 ${-rootHeight} L ${8} 0 Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                  {/* Raíz Mesio-Vestibular (lado mesial - hacia el centro) */}
                  <path
                    d={`M ${isRight ? (-width/3 - 7) : (width/3 - 7)} 0 L ${isRight ? (-width/3) : (width/3)} ${-rootHeight * 0.9} L ${isRight ? (-width/3 + 7) : (width/3 + 7)} 0 Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                  {/* Raíz Disto-Vestibular (lado distal - hacia afuera) */}
                  <path
                    d={`M ${isRight ? (width/3 - 7) : (-width/3 - 7)} 0 L ${isRight ? (width/3) : (-width/3)} ${-rootHeight * 0.9} L ${isRight ? (width/3 + 7) : (-width/3 + 7)} 0 Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                </>
              );
            } else if (isFirstPremolar) {
              // Primeros premolares superiores (1.4, 2.4): 2 PINCHOS
              return (
                <>
                  {/* Raíz mesial (hacia el centro) */}
                  <path
                    d={`M ${isRight ? (-width/3 - 5) : (width/3 - 5)} 0 L ${isRight ? (-width/3) : (width/3)} ${-rootHeight * 0.9} L ${isRight ? (-width/3 + 5) : (width/3 + 5)} 0 Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                  {/* Raíz distal (hacia afuera) */}
                  <path
                    d={`M ${isRight ? (width/3 - 5) : (-width/3 - 5)} 0 L ${isRight ? (width/3) : (-width/3)} ${-rootHeight * 0.9} L ${isRight ? (width/3 + 5) : (-width/3 + 5)} 0 Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                </>
              );
            } else {
              // Segundos premolares superiores (1.5, 2.5): 1 PINCHO
              const baseWidth = width/4;
              return (
                <path
                  d={`M ${-baseWidth} 0 L 0 ${-rootHeight} L ${baseWidth} 0 Z`}
                  fill="#e0e0e0"
                  stroke="#666"
                  strokeWidth="1.5"
                />
              );
            }
          })()}

          {/* CANINOS E INCISIVOS SUPERIORES: 1 TRIÁNGULO SÓLIDO SIMPLE */}
          {(type === 'canine' || type === 'incisor') && (() => {
            const rootLength = type === 'canine' ? -rootHeight * 1.1 : -rootHeight;
            const baseWidth = type === 'canine' ? width/3 : width/4;
            return (
              <path
                d={`M ${-baseWidth} 0 L 0 ${rootLength} L ${baseWidth} 0 Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />
            );
          })()}
        </g>
      ) : (
        <g>
          {/* MOLARES INFERIORES: 2 TRIÁNGULOS VERTICALES RECTOS (NO EN V) */}
          {type === 'molar' && (
            <>
              {/* Raíz Mesial (lado mesial - hacia el centro) - Triángulo vertical recto */}
              <path
                d={`M ${isRight ? (-width/3 - 5) : (width/3 - 5)} ${crownHeight} L ${isRight ? (-width/3) : (width/3)} ${crownHeight + rootHeight} L ${isRight ? (-width/3 + 5) : (width/3 + 5)} ${crownHeight} Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />

              {/* Raíz Distal (lado distal - hacia afuera) - Triángulo vertical recto */}
              <path
                d={`M ${isRight ? (width/3 - 5) : (-width/3 - 5)} ${crownHeight} L ${isRight ? (width/3) : (-width/3)} ${crownHeight + rootHeight} L ${isRight ? (width/3 + 5) : (-width/3 + 5)} ${crownHeight} Z`}
                fill="#e0e0e0"
                stroke="#666"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* PREMOLARES INFERIORES O MOLARES TEMPORALES INFERIORES */}
          {type === 'premolar' && (() => {
            // Los molares temporales (7.4, 7.5, 8.4, 8.5) siempre tienen 2 pinchos
            if (isTemporaryMolar) {
              return (
                <>
                  {/* Raíz Mesial (lado mesial - hacia el centro) - Triángulo vertical recto */}
                  <path
                    d={`M ${isRight ? (-width/3 - 5) : (width/3 - 5)} ${crownHeight} L ${isRight ? (-width/3) : (width/3)} ${crownHeight + rootHeight} L ${isRight ? (-width/3 + 5) : (width/3 + 5)} ${crownHeight} Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                  {/* Raíz Distal (lado distal - hacia afuera) - Triángulo vertical recto */}
                  <path
                    d={`M ${isRight ? (width/3 - 5) : (-width/3 - 5)} ${crownHeight} L ${isRight ? (width/3) : (-width/3)} ${crownHeight + rootHeight} L ${isRight ? (width/3 + 5) : (-width/3 + 5)} ${crownHeight} Z`}
                    fill="#e0e0e0"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                </>
              );
            } else {
              // Premolares inferiores permanentes: 1 PINCHO
              return (
                <path
                  d={`M ${-width/4} ${crownHeight} L 0 ${crownHeight + rootHeight} L ${width/4} ${crownHeight} Z`}
                  fill="#e0e0e0"
                  stroke="#666"
                  strokeWidth="1.5"
                />
              );
            }
          })()}

          {/* CANINOS E INCISIVOS INFERIORES: 1 TRIÁNGULO SÓLIDO SIMPLE */}
          {(type === 'canine' || type === 'incisor') && (
            <path
              d={`M ${-width/5} ${crownHeight} L 0 ${crownHeight + rootHeight} L ${width/5} ${crownHeight} Z`}
              fill="#e0e0e0"
              stroke="#666"
              strokeWidth="1.5"
            />
          )}
        </g>
      )}

      {/* Corona */}
      <rect
        x={-width/2}
        y={0}
        width={width}
        height={crownHeight}
        fill="#fff"
        stroke={
          treatmentMode && hasRedConditions && isHovered
            ? '#3b82f6'
            : isHovered
            ? '#3b82f6'
            : '#666'
        }
        strokeWidth={
          treatmentMode && hasRedConditions && isHovered
            ? '3'
            : isHovered
            ? '2'
            : '1.5'
        }
        rx="2"
        className={treatmentMode && hasRedConditions ? 'transition-all duration-200' : ''}
      />

      {/* Indicador visual en modo tratamiento para dientes rojos */}
      {treatmentMode && hasRedConditions && isHovered && (
        <g>
          {/* Borde pulsante azul */}
          <rect
            x={-width/2 - 2}
            y={-2}
            width={width + 4}
            height={crownHeight + 4}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            rx="4"
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      )}

      {/* ========== SECCIONES CLICKEABLES - CORONA ========== */}
      {/* En modo tratamiento, simplificar el click - no distinguir por sección */}
      {treatmentMode ? (
        // Modo tratamiento: toda la corona es un solo botón
        <rect
          x={-width/2}
          y={0}
          width={width}
          height={crownHeight}
          fill="transparent"
          stroke="none"
          className="cursor-pointer"
          onClick={(e) => handleToothClick(e, toothNumber)}
        />
      ) : (
        // Modo normal: dividir en secciones
        <>
          <rect x={-width/4} y={crownHeight/4} width={width/2} height={crownHeight/2} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'corona')} />
          {/* VESTIBULAR y LINGUAL según orientación del diente respecto a la línea horizontal */}
          {isUpper ? (
            // Dientes superiores: Vestibular arriba (hacia línea horizontal), Lingual abajo (alejado)
            <>
              <rect x={-width/2} y={0} width={width} height={crownHeight/4} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'vestibular')} />
              <rect x={-width/2} y={crownHeight * 3/4} width={width} height={crownHeight/4} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'lingual')} />
            </>
          ) : (
            // Dientes inferiores: Lingual arriba (alejado), Vestibular abajo (hacia línea horizontal)
            <>
              <rect x={-width/2} y={0} width={width} height={crownHeight/4} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'lingual')} />
              <rect x={-width/2} y={crownHeight * 3/4} width={width} height={crownHeight/4} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'vestibular')} />
            </>
          )}
          {/* MESIAL: lado hacia el centro de la boca */}
          {isRight ? (
            // Cuadrantes derechos (1,4,5,8): mesial está a la DERECHA (hacia el centro)
            <rect x={width/4} y={crownHeight/4} width={width/4} height={crownHeight/2} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'mesial')} />
          ) : (
            // Cuadrantes izquierdos (2,3,6,7): mesial está a la IZQUIERDA (hacia el centro)
            <rect x={-width/2} y={crownHeight/4} width={width/4} height={crownHeight/2} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'mesial')} />
          )}
          {/* DISTAL: lado alejado del centro de la boca */}
          {isRight ? (
            // Cuadrantes derechos (1,4,5,8): distal está a la IZQUIERDA (alejado del centro)
            <rect x={-width/2} y={crownHeight/4} width={width/4} height={crownHeight/2} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'distal')} />
          ) : (
            // Cuadrantes izquierdos (2,3,6,7): distal está a la DERECHA (alejado del centro)
            <rect x={width/4} y={crownHeight/4} width={width/4} height={crownHeight/2} fill="transparent" stroke="#999" strokeWidth="0.5" className="cursor-pointer" onClick={(e) => handleToothClick(e, toothNumber, 'distal')} />
          )}
        </>
      )}

      {/* ========== SECCIONES CLICKEABLES - RAÍZ ========== */}
      {/* En modo tratamiento, también simplificar la raíz */}
      {!treatmentMode && (
        <>
          {isUpper ? (
            // Dientes superiores: raíz arriba
            <rect
              x={-width/4}
              y={-rootHeight}
              width={width/2}
              height={rootHeight}
              fill="transparent"
              stroke="none"
              className="cursor-pointer hover:fill-blue-100 hover:fill-opacity-20"
              onClick={(e) => handleToothClick(e, toothNumber, 'raiz')}
            />
          ) : (
            // Dientes inferiores: raíz abajo
            <rect
              x={-width/4}
              y={crownHeight}
              width={width/2}
              height={rootHeight}
              fill="transparent"
              stroke="none"
              className="cursor-pointer hover:fill-blue-100 hover:fill-opacity-20"
              onClick={(e) => handleToothClick(e, toothNumber, 'raiz')}
            />
          )}
        </>
      )}

      {/* Número del diente */}
      <text x="0" y={crownHeight/2} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-[14px] font-bold pointer-events-none select-none">
        {toothNumber}
      </text>
    </g>
  );
};
