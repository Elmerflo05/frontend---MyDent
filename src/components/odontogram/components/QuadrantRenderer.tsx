import React from 'react';
import { QuadrantConfig } from '@/constants/quadrantConfigs';
import { AnnotationBox } from '../AnnotationBox';
import { ToothSVG } from '../ToothSVG';
import { ToothConditionRenderer, AppliedCondition } from '../ToothConditionRenderer';
import { EdentuloGroupsRenderer } from './EdentuloGroupsRenderer';
import { calculateEdentuloGroups } from '@/lib/utils/edentuloGroupCalculator';
import { getAlignedToothY } from '@/constants/toothDimensions';
import { OFFICIAL_COLORS } from '@/constants/dentalConditions';

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

interface QuadrantRendererProps {
  config: QuadrantConfig;
  annotationsTop: Map<string, { text: string; color: 'red' | 'blue' }>;
  appliedConditions: AppliedCondition[];
  hoveredTooth: string | null;
  setHoveredTooth: (tooth: string | null) => void;
  treatmentMode: boolean;
  toothConditions: ToothCondition[];
  setHoveredToothInTreatment: (tooth: string | null) => void;
  edentuloTotalSelection: MultiToothSelection | null;
  protesisRemovibleSelection: MultiToothSelection | null;
  handleToothClick: (e: React.MouseEvent, toothNumber: string, section?: string) => void;
  handleAnnotationClick: (e: MouseEvent, toothNumber: string) => void;
}

export const QuadrantRenderer: React.FC<QuadrantRendererProps> = ({
  config,
  annotationsTop,
  appliedConditions,
  hoveredTooth,
  setHoveredTooth,
  treatmentMode,
  toothConditions,
  setHoveredToothInTreatment,
  edentuloTotalSelection,
  protesisRemovibleSelection,
  handleToothClick,
  handleAnnotationClick
}) => {
  const { key, teeth, isUpper, positions, getX } = config;

  return (
    <>
      {/* Recuadros de anotación */}
      {teeth.map((tooth, idx) => {
        const annotation = annotationsTop.get(tooth);
        const x = getX(tooth, idx, teeth);
        return (
          <g key={`${key}-anno-${tooth}`} onClick={(e) => handleAnnotationClick(e.nativeEvent as any, tooth)}>
            <AnnotationBox
              x={x - 35}
              y={positions.yAnnotation}
              width={70}
              height={42}
              text={annotation?.text}
              color={annotation?.color}
            />
          </g>
        );
      })}

      {/* Labels de dientes */}
      {teeth.map((tooth, idx) => {
        const x = getX(tooth, idx, teeth);
        return (
          <text
            key={`${key}-label-${tooth}`}
            x={x}
            y={positions.yLabel}
            textAnchor="middle"
            className={config.isAdult ? "fill-gray-600 text-sm font-semibold" : "fill-gray-500 text-xs font-semibold"}
          >
            {tooth}
          </text>
        );
      })}

      {/* Dientes (ToothSVG) */}
      {teeth.map((tooth, idx) => {
        const x = getX(tooth, idx, teeth);
        const y = getAlignedToothY(positions.yTooth, tooth);
        return (
          <ToothSVG
            key={`${key}-tooth-${tooth}`}
            toothNumber={tooth}
            x={x}
            y={y}
            isUpper={isUpper}
            hoveredTooth={hoveredTooth}
            setHoveredTooth={setHoveredTooth}
            treatmentMode={treatmentMode}
            toothConditions={toothConditions}
            setHoveredToothInTreatment={setHoveredToothInTreatment}
            edentuloTotalSelection={edentuloTotalSelection}
            protesisRemovibleSelection={protesisRemovibleSelection}
            handleToothClick={handleToothClick}
          />
        );
      })}

      {/* Condiciones dentales */}
      {teeth.map((tooth, idx) => {
        const x = getX(tooth, idx, teeth);
        const y = getAlignedToothY(positions.yTooth, tooth);
        return (
          <ToothConditionRenderer
            key={`${key}-cond-${tooth}`}
            toothNumber={tooth}
            toothX={x}
            toothY={y}
            conditions={appliedConditions}
            isUpper={isUpper}
          />
        );
      })}

      {/* Edéntulo Total - Líneas continuas */}
      <EdentuloGroupsRenderer
        groups={calculateEdentuloGroups(
          teeth,
          appliedConditions,
          (tooth, idx) => getX(tooth, idx, teeth),
          getAlignedToothY(positions.yTooth, teeth[0]),
          OFFICIAL_COLORS
        )}
        quadrantKey={key}
      />
    </>
  );
};
