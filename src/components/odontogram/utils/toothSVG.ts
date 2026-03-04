interface ToothSection {
  id: string;
  name: string;
  path: string;
  fillColor: string;
}

interface Tooth {
  number: string;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  sections: ToothSection[];
  position: { x: number; y: number };
}

export const createToothSVG = (tooth: Tooth): Tooth => {
  const baseSize = tooth.type === 'molar' ? 80 : tooth.type === 'premolar' ? 70 : 60;
  const sections: ToothSection[] = [
    {
      id: 'mesial',
      name: 'Mesial',
      path: `M ${-baseSize/2} 0 L 0 ${-baseSize/3} L 0 ${baseSize/3} Z`,
      fillColor: '#ffffff'
    },
    {
      id: 'distal',
      name: 'Distal',
      path: `M ${baseSize/2} 0 L 0 ${-baseSize/3} L 0 ${baseSize/3} Z`,
      fillColor: '#ffffff'
    },
    {
      id: 'oclusal',
      name: 'Oclusal/Incisal',
      path: `M ${-baseSize/3} ${-baseSize/3} L ${baseSize/3} ${-baseSize/3} L ${baseSize/3} ${baseSize/3} L ${-baseSize/3} ${baseSize/3} Z`,
      fillColor: '#ffffff'
    },
    {
      id: 'vestibular',
      name: 'Vestibular',
      path: `M ${-baseSize/2} ${-baseSize/2} L ${baseSize/2} ${-baseSize/2} L ${baseSize/3} ${-baseSize/3} L ${-baseSize/3} ${-baseSize/3} Z`,
      fillColor: '#ffffff'
    },
    {
      id: 'lingual',
      name: 'Lingual/Palatino',
      path: `M ${-baseSize/2} ${baseSize/2} L ${baseSize/2} ${baseSize/2} L ${baseSize/3} ${baseSize/3} L ${-baseSize/3} ${baseSize/3} Z`,
      fillColor: '#ffffff'
    }
  ];

  const isUpper = parseInt(tooth.number) < 30;
  const toothNum = parseInt(tooth.number);
  const circleRadius = 50;
  const rootStartOffset = circleRadius + 5;

  // Add roots based on tooth type
  if (tooth.type === 'molar') {
    if (isUpper) {
      // Upper molars: 3 roots
      sections.push(
        {
          id: 'raiz',
          name: 'Raíz Palatina',
          path: `M ${-8} ${-rootStartOffset} L ${-10} ${-rootStartOffset - 10} L ${-8} ${-rootStartOffset - 25} L ${-5} ${-rootStartOffset - 40} L 0 ${-rootStartOffset - 50} L 5 ${-rootStartOffset - 40} L 8 ${-rootStartOffset - 25} L 10 ${-rootStartOffset - 10} L 8 ${-rootStartOffset} Z`,
          fillColor: '#ffffff'
        },
        {
          id: 'raiz-mv',
          name: 'Raíz Mesio-Vestibular',
          path: `M ${-35} ${-rootStartOffset} L ${-38} ${-rootStartOffset - 10} L ${-40} ${-rootStartOffset - 20} L ${-38} ${-rootStartOffset - 35} L ${-35} ${-rootStartOffset - 45} L ${-30} ${-rootStartOffset - 48} L ${-25} ${-rootStartOffset - 45} L ${-22} ${-rootStartOffset - 35} L ${-20} ${-rootStartOffset - 20} L ${-22} ${-rootStartOffset - 10} L ${-25} ${-rootStartOffset} Z`,
          fillColor: '#ffffff'
        },
        {
          id: 'raiz-dv',
          name: 'Raíz Disto-Vestibular',
          path: `M ${25} ${-rootStartOffset} L ${22} ${-rootStartOffset - 10} L ${20} ${-rootStartOffset - 20} L ${22} ${-rootStartOffset - 35} L ${25} ${-rootStartOffset - 45} L ${30} ${-rootStartOffset - 48} L ${35} ${-rootStartOffset - 45} L ${38} ${-rootStartOffset - 35} L ${40} ${-rootStartOffset - 20} L ${38} ${-rootStartOffset - 10} L ${35} ${-rootStartOffset} Z`,
          fillColor: '#ffffff'
        }
      );
    } else {
      // Lower molars: 2 roots
      sections.push(
        {
          id: 'raiz',
          name: 'Raíz Mesial',
          path: `M ${-30} ${rootStartOffset} L ${-28} ${rootStartOffset + 10} L ${-30} ${rootStartOffset + 25} L ${-28} ${rootStartOffset + 40} L ${-25} ${rootStartOffset + 50} L ${-20} ${rootStartOffset + 52} L ${-15} ${rootStartOffset + 50} L ${-12} ${rootStartOffset + 40} L ${-10} ${rootStartOffset + 25} L ${-12} ${rootStartOffset + 10} L ${-15} ${rootStartOffset} Z`,
          fillColor: '#ffffff'
        },
        {
          id: 'raiz-distal',
          name: 'Raíz Distal',
          path: `M ${15} ${rootStartOffset} L ${12} ${rootStartOffset + 10} L ${10} ${rootStartOffset + 25} L ${12} ${rootStartOffset + 40} L ${15} ${rootStartOffset + 50} L ${20} ${rootStartOffset + 52} L ${25} ${rootStartOffset + 50} L ${28} ${rootStartOffset + 40} L ${30} ${rootStartOffset + 25} L ${28} ${rootStartOffset + 10} L ${30} ${rootStartOffset} Z`,
          fillColor: '#ffffff'
        }
      );
    }
  } else if (tooth.type === 'premolar') {
    if (isUpper && (toothNum === 14 || toothNum === 24)) {
      // First upper premolar: 2 roots
      sections.push(
        {
          id: 'raiz',
          name: 'Raíz Vestibular',
          path: `M ${-20} ${-rootStartOffset} L ${-22} ${-rootStartOffset - 10} L ${-20} ${-rootStartOffset - 25} L ${-18} ${-rootStartOffset - 38} L ${-15} ${-rootStartOffset - 45} L ${-10} ${-rootStartOffset - 47} L ${-5} ${-rootStartOffset - 45} L ${-3} ${-rootStartOffset - 35} L ${-5} ${-rootStartOffset - 20} L ${-8} ${-rootStartOffset - 10} L ${-10} ${-rootStartOffset} Z`,
          fillColor: '#ffffff'
        },
        {
          id: 'raiz-palatina',
          name: 'Raíz Palatina',
          path: `M ${10} ${-rootStartOffset} L ${8} ${-rootStartOffset - 10} L ${5} ${-rootStartOffset - 20} L ${3} ${-rootStartOffset - 35} L ${5} ${-rootStartOffset - 45} L ${10} ${-rootStartOffset - 47} L ${15} ${-rootStartOffset - 45} L ${18} ${-rootStartOffset - 38} L ${20} ${-rootStartOffset - 25} L ${22} ${-rootStartOffset - 10} L ${20} ${-rootStartOffset} Z`,
          fillColor: '#ffffff'
        }
      );
    } else {
      // Single root for other premolars
      sections.push({
        id: 'raiz',
        name: 'Raíz',
        path: isUpper
          ? `M ${-18} ${-rootStartOffset} L ${-20} ${-rootStartOffset - 10} L ${-18} ${-rootStartOffset - 25} L ${-15} ${-rootStartOffset - 35} L ${-10} ${-rootStartOffset - 42} L ${-5} ${-rootStartOffset - 45} L 0 ${-rootStartOffset - 46} L 5 ${-rootStartOffset - 45} L 10 ${-rootStartOffset - 42} L 15 ${-rootStartOffset - 35} L 18 ${-rootStartOffset - 25} L 20 ${-rootStartOffset - 10} L 18 ${-rootStartOffset} Z`
          : `M ${-18} ${rootStartOffset} L ${-20} ${rootStartOffset + 10} L ${-18} ${rootStartOffset + 25} L ${-15} ${rootStartOffset + 35} L ${-10} ${rootStartOffset + 42} L ${-5} ${rootStartOffset + 45} L 0 ${rootStartOffset + 46} L 5 ${rootStartOffset + 45} L 10 ${rootStartOffset + 42} L 15 ${rootStartOffset + 35} L 18 ${rootStartOffset + 25} L 20 ${rootStartOffset + 10} L 18 ${rootStartOffset} Z`,
        fillColor: '#ffffff'
      });
    }
  } else if (tooth.type === 'canine') {
    // Canines: 1 long root
    sections.push({
      id: 'raiz',
      name: 'Raíz',
      path: isUpper
        ? `M ${-20} ${-rootStartOffset} L ${-22} ${-rootStartOffset - 12} L ${-20} ${-rootStartOffset - 28} L ${-15} ${-rootStartOffset - 42} L ${-8} ${-rootStartOffset - 52} L 0 ${-rootStartOffset - 55} L 8 ${-rootStartOffset - 52} L 15 ${-rootStartOffset - 42} L 20 ${-rootStartOffset - 28} L 22 ${-rootStartOffset - 12} L 20 ${-rootStartOffset} Z`
        : `M ${-20} ${rootStartOffset} L ${-22} ${rootStartOffset + 12} L ${-20} ${rootStartOffset + 28} L ${-15} ${rootStartOffset + 42} L ${-8} ${rootStartOffset + 52} L 0 ${rootStartOffset + 55} L 8 ${rootStartOffset + 52} L 15 ${rootStartOffset + 42} L 20 ${rootStartOffset + 28} L 22 ${rootStartOffset + 12} L 20 ${rootStartOffset} Z`,
      fillColor: '#ffffff'
    });
  } else {
    // Incisors: 1 conical root
    const rootWidth = tooth.number.includes('1') ? 15 : 13;
    sections.push({
      id: 'raiz',
      name: 'Raíz',
      path: isUpper
        ? `M ${-rootWidth} ${-rootStartOffset} L ${-rootWidth - 2} ${-rootStartOffset - 10} L ${-rootWidth/2} ${-rootStartOffset - 25} L ${-5} ${-rootStartOffset - 38} L 0 ${-rootStartOffset - 42} L 5 ${-rootStartOffset - 38} L ${rootWidth/2} ${-rootStartOffset - 25} L ${rootWidth + 2} ${-rootStartOffset - 10} L ${rootWidth} ${-rootStartOffset} Z`
        : `M ${-rootWidth} ${rootStartOffset} L ${-rootWidth - 2} ${rootStartOffset + 10} L ${-rootWidth/2} ${rootStartOffset + 25} L ${-5} ${rootStartOffset + 38} L 0 ${rootStartOffset + 42} L 5 ${rootStartOffset + 38} L ${rootWidth/2} ${rootStartOffset + 25} L ${rootWidth + 2} ${rootStartOffset + 10} L ${rootWidth} ${rootStartOffset} Z`,
      fillColor: '#ffffff'
    });
  }

  return { ...tooth, sections };
};

export const getAdultTeeth = (): Tooth[] => [
  // Upper Right Quadrant (1)
  { number: '18', type: 'molar', sections: [], position: { x: 150, y: 270 } },
  { number: '17', type: 'molar', sections: [], position: { x: 250, y: 245 } },
  { number: '16', type: 'molar', sections: [], position: { x: 350, y: 225 } },
  { number: '15', type: 'premolar', sections: [], position: { x: 450, y: 210 } },
  { number: '14', type: 'premolar', sections: [], position: { x: 550, y: 200 } },
  { number: '13', type: 'canine', sections: [], position: { x: 650, y: 195 } },
  { number: '12', type: 'incisor', sections: [], position: { x: 750, y: 193 } },
  { number: '11', type: 'incisor', sections: [], position: { x: 850, y: 192 } },
  // Upper Left Quadrant (2)
  { number: '21', type: 'incisor', sections: [], position: { x: 950, y: 192 } },
  { number: '22', type: 'incisor', sections: [], position: { x: 1050, y: 193 } },
  { number: '23', type: 'canine', sections: [], position: { x: 1150, y: 195 } },
  { number: '24', type: 'premolar', sections: [], position: { x: 1250, y: 200 } },
  { number: '25', type: 'premolar', sections: [], position: { x: 1350, y: 210 } },
  { number: '26', type: 'molar', sections: [], position: { x: 1450, y: 225 } },
  { number: '27', type: 'molar', sections: [], position: { x: 1550, y: 245 } },
  { number: '28', type: 'molar', sections: [], position: { x: 1650, y: 270 } },
  // Lower Left Quadrant (3)
  { number: '38', type: 'molar', sections: [], position: { x: 1650, y: 430 } },
  { number: '37', type: 'molar', sections: [], position: { x: 1550, y: 455 } },
  { number: '36', type: 'molar', sections: [], position: { x: 1450, y: 475 } },
  { number: '35', type: 'premolar', sections: [], position: { x: 1350, y: 490 } },
  { number: '34', type: 'premolar', sections: [], position: { x: 1250, y: 500 } },
  { number: '33', type: 'canine', sections: [], position: { x: 1150, y: 505 } },
  { number: '32', type: 'incisor', sections: [], position: { x: 1050, y: 507 } },
  { number: '31', type: 'incisor', sections: [], position: { x: 950, y: 508 } },
  // Lower Right Quadrant (4)
  { number: '41', type: 'incisor', sections: [], position: { x: 850, y: 508 } },
  { number: '42', type: 'incisor', sections: [], position: { x: 750, y: 507 } },
  { number: '43', type: 'canine', sections: [], position: { x: 650, y: 505 } },
  { number: '44', type: 'premolar', sections: [], position: { x: 550, y: 500 } },
  { number: '45', type: 'premolar', sections: [], position: { x: 450, y: 490 } },
  { number: '46', type: 'molar', sections: [], position: { x: 350, y: 475 } },
  { number: '47', type: 'molar', sections: [], position: { x: 250, y: 455 } },
  { number: '48', type: 'molar', sections: [], position: { x: 150, y: 430 } }
];

export type { Tooth, ToothSection };
