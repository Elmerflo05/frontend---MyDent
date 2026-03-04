import {
  FDI_ADULT_QUADRANT_1,
  FDI_ADULT_QUADRANT_2,
  FDI_ADULT_QUADRANT_3,
  FDI_ADULT_QUADRANT_4,
  FDI_CHILD_QUADRANT_1,
  FDI_CHILD_QUADRANT_2,
  FDI_CHILD_QUADRANT_3,
  FDI_CHILD_QUADRANT_4
} from './fdiNumbering';
import { TOOTH_SPACING, getAlignedToothX, getAlignedToothY } from './toothDimensions';

export interface QuadrantConfig {
  key: string;
  teeth: string[];
  isUpper: boolean;
  isAdult: boolean;
  positions: {
    xStart?: number;
    useAlignedX?: boolean;
    yTooth: number;
    yAnnotation: number;
    yLabel: number;
  };
  getX: (tooth: string, idx: number, teeth: string[]) => number;
}

export const QUADRANT_CONFIGS: QuadrantConfig[] = [
  // ADULTOS SUPERIORES
  {
    key: 'q1',
    teeth: FDI_ADULT_QUADRANT_1,
    isUpper: true,
    isAdult: true,
    positions: {
      xStart: 120,
      yTooth: 49,
      yAnnotation: -133,
      yLabel: -73
    },
    getX: (tooth, idx) => 120 + idx * TOOTH_SPACING
  },
  {
    key: 'q2',
    teeth: FDI_ADULT_QUADRANT_2,
    isUpper: true,
    isAdult: true,
    positions: {
      xStart: 1040,
      yTooth: 49,
      yAnnotation: -133,
      yLabel: -73
    },
    getX: (tooth, idx) => 1040 + idx * TOOTH_SPACING
  },
  // ADULTOS INFERIORES
  {
    key: 'q3',
    teeth: FDI_ADULT_QUADRANT_3,
    isUpper: false,
    isAdult: true,
    positions: {
      xStart: 1040,
      yTooth: 850,
      yAnnotation: 1053,
      yLabel: 1113
    },
    getX: (tooth, idx) => 1040 + idx * TOOTH_SPACING
  },
  {
    key: 'q4',
    teeth: FDI_ADULT_QUADRANT_4,
    isUpper: false,
    isAdult: true,
    positions: {
      xStart: 120,
      yTooth: 850,
      yAnnotation: 1053,
      yLabel: 1113
    },
    getX: (tooth, idx) => 120 + idx * TOOTH_SPACING
  },
  // NIÑOS SUPERIORES
  {
    key: 'q5',
    teeth: FDI_CHILD_QUADRANT_1,
    isUpper: true,
    isAdult: false,
    positions: {
      useAlignedX: true,
      yTooth: 385,
      yAnnotation: 175,
      yLabel: 235
    },
    getX: (tooth, idx, teeth) => getAlignedToothX(tooth, teeth)
  },
  {
    key: 'q6',
    teeth: FDI_CHILD_QUADRANT_2,
    isUpper: true,
    isAdult: false,
    positions: {
      useAlignedX: true,
      yTooth: 385,
      yAnnotation: 175,
      yLabel: 235
    },
    getX: (tooth, idx, teeth) => getAlignedToothX(tooth, teeth)
  },
  // NIÑOS INFERIORES
  {
    key: 'q7',
    teeth: FDI_CHILD_QUADRANT_3,
    isUpper: false,
    isAdult: false,
    positions: {
      useAlignedX: true,
      yTooth: 525,
      yAnnotation: 735,
      yLabel: 795
    },
    getX: (tooth, idx, teeth) => getAlignedToothX(tooth, teeth)
  },
  {
    key: 'q8',
    teeth: FDI_CHILD_QUADRANT_4,
    isUpper: false,
    isAdult: false,
    positions: {
      useAlignedX: true,
      yTooth: 525,
      yAnnotation: 735,
      yLabel: 795
    },
    getX: (tooth, idx, teeth) => getAlignedToothX(tooth, teeth)
  }
];
