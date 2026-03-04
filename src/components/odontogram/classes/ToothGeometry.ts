import type { Tooth, ToothType } from './Tooth';

export interface ToothSection {
  id: string;
  name: string;
  path: string;
  fillColor: string;
}

export class ToothGeometry {
  private tooth: Tooth;
  private baseSize: number;
  private circleRadius: number = 50;
  private rootStartOffset: number;

  constructor(tooth: Tooth) {
    this.tooth = tooth;
    this.baseSize = this.getBaseSize();
    this.rootStartOffset = this.circleRadius + 5;
  }

  private getBaseSize(): number {
    switch (this.tooth.type) {
      case 'molar': return 80;
      case 'premolar': return 70;
      default: return 60; // canine, incisor
    }
  }

  // Generar secciones de la corona
  getCrownSections(): ToothSection[] {
    const b = this.baseSize;
    return [
      {
        id: 'mesial',
        name: 'Mesial',
        path: `M ${-b/2} 0 L 0 ${-b/3} L 0 ${b/3} Z`,
        fillColor: '#ffffff'
      },
      {
        id: 'distal',
        name: 'Distal',
        path: `M ${b/2} 0 L 0 ${-b/3} L 0 ${b/3} Z`,
        fillColor: '#ffffff'
      },
      {
        id: 'corona',
        name: 'Corona',
        path: `M ${-b/3} ${-b/3} L ${b/3} ${-b/3} L ${b/3} ${b/3} L ${-b/3} ${b/3} Z`,
        fillColor: '#ffffff'
      },
      {
        id: 'vestibular',
        name: 'Vestibular',
        path: `M ${-b/2} ${-b/2} L ${b/2} ${-b/2} L ${b/3} ${-b/3} L ${-b/3} ${-b/3} Z`,
        fillColor: '#ffffff'
      },
      {
        id: 'lingual',
        name: 'Lingual/Palatino',
        path: `M ${-b/2} ${b/2} L ${b/2} ${b/2} L ${b/3} ${b/3} L ${-b/3} ${b/3} Z`,
        fillColor: '#ffffff'
      }
    ];
  }

  // Generar raíces según tipo de diente
  getRootSections(): ToothSection[] {
    const isUpper = this.tooth.isUpper();
    const toothNum = parseInt(this.tooth.number);

    switch (this.tooth.type) {
      case 'molar':
        return this.getMolarRoots(isUpper);
      case 'premolar':
        return this.getPremolarRoots(isUpper, toothNum);
      case 'canine':
        return this.getCanineRoots(isUpper);
      default:
        return this.getIncisorRoots(isUpper);
    }
  }

  private getMolarRoots(isUpper: boolean): ToothSection[] {
    const r = this.rootStartOffset;
    const rootHeight = 50;

    if (isUpper) {
      // Upper molars: 3 TRIÁNGULOS SÓLIDOS separados
      return [
        {
          id: 'raiz',
          name: 'Raíz Palatina',
          path: `M ${-8} ${-r} L 0 ${-r - rootHeight} L ${8} ${-r} Z`,
          fillColor: '#e0e0e0'
        },
        {
          id: 'raiz-mv',
          name: 'Raíz Mesio-Vestibular',
          path: `M ${-28} ${-r} L ${-35} ${-r - rootHeight * 0.9} L ${-21} ${-r} Z`,
          fillColor: '#e0e0e0'
        },
        {
          id: 'raiz-dv',
          name: 'Raíz Disto-Vestibular',
          path: `M ${21} ${-r} L ${35} ${-r - rootHeight * 0.9} L ${28} ${-r} Z`,
          fillColor: '#e0e0e0'
        }
      ];
    } else {
      // Lower molars: 2 TRIÁNGULOS SÓLIDOS en V
      return [
        {
          id: 'raiz',
          name: 'Raíz Mesial',
          path: `M ${-20} ${r} L ${-30} ${r + rootHeight} L ${-10} ${r} Z`,
          fillColor: '#e0e0e0'
        },
        {
          id: 'raiz-distal',
          name: 'Raíz Distal',
          path: `M ${10} ${r} L ${30} ${r + rootHeight} L ${20} ${r} Z`,
          fillColor: '#e0e0e0'
        }
      ];
    }
  }

  private getPremolarRoots(isUpper: boolean, toothNum: number): ToothSection[] {
    const r = this.rootStartOffset;
    const rootHeight = 48;

    // First upper premolar has 2 roots divergentes
    if (isUpper && (toothNum === 14 || toothNum === 24)) {
      return [
        {
          id: 'raiz',
          name: 'Raíz Vestibular',
          path: `M ${-15} ${-r} L ${-25} ${-r - rootHeight} L ${-8} ${-r} Z`,
          fillColor: '#e0e0e0'
        },
        {
          id: 'raiz-palatina',
          name: 'Raíz Palatina',
          path: `M ${8} ${-r} L ${25} ${-r - rootHeight} L ${15} ${-r} Z`,
          fillColor: '#e0e0e0'
        }
      ];
    }

    // Single TRIÁNGULO for other premolars
    return [{
      id: 'raiz',
      name: 'Raíz',
      path: isUpper
        ? `M ${-12} ${-r} L 0 ${-r - rootHeight} L ${12} ${-r} Z`
        : `M ${-12} ${r} L 0 ${r + rootHeight} L ${12} ${r} Z`,
      fillColor: '#e0e0e0'
    }];
  }

  private getCanineRoots(isUpper: boolean): ToothSection[] {
    const r = this.rootStartOffset;
    const rootHeight = 55; // Caninos tienen raíces más largas

    return [{
      id: 'raiz',
      name: 'Raíz',
      path: isUpper
        ? `M ${-14} ${-r} L 0 ${-r - rootHeight} L ${14} ${-r} Z`
        : `M ${-14} ${r} L 0 ${r + rootHeight} L ${14} ${r} Z`,
      fillColor: '#e0e0e0'
    }];
  }

  private getIncisorRoots(isUpper: boolean): ToothSection[] {
    const r = this.rootStartOffset;
    const rootHeight = 46;
    // Incisivos centrales (1.1, 2.1, 3.1, 4.1) tienen raices un poco mas anchas
    const isCentral = this.tooth.number.endsWith('1');
    const width = isCentral ? 14 : 12;

    return [{
      id: 'raiz',
      name: 'Raíz',
      path: isUpper
        ? `M ${-width} ${-r} L 0 ${-r - rootHeight} L ${width} ${-r} Z`
        : `M ${-width} ${r} L 0 ${r + rootHeight} L ${width} ${r} Z`,
      fillColor: '#e0e0e0'
    }];
  }

  // Obtener todas las secciones (corona + raíces)
  getAllSections(): ToothSection[] {
    return [...this.getCrownSections(), ...this.getRootSections()];
  }

  // Obtener solo secciones de corona
  getCrownOnly(): ToothSection[] {
    return this.getCrownSections();
  }

  // Obtener mapa de paths por sección
  getSectionPaths(): Map<string, string> {
    const sections = this.getAllSections();
    const pathMap = new Map<string, string>();

    sections.forEach(section => {
      pathMap.set(section.id, section.path);
    });

    return pathMap;
  }
}
