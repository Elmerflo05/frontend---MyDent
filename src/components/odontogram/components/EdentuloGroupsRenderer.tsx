/**
 * Renderizador de grupos edéntulos
 */

import React from 'react';
import type { EdentuloGroup } from '@/lib/utils/edentuloGroupCalculator';

interface EdentuloGroupsRendererProps {
  groups: EdentuloGroup[];
  quadrantKey: string;
}

export const EdentuloGroupsRenderer: React.FC<EdentuloGroupsRendererProps> = ({
  groups,
  quadrantKey
}) => {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, groupIdx) => (
        <line
          key={`edentulo-group-${quadrantKey}-${groupIdx}`}
          x1={group.startX}
          y1={group.y}
          x2={group.endX}
          y2={group.y}
          stroke={group.strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </>
  );
};
