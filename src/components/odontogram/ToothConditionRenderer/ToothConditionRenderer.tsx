/**
 * RENDERIZADOR DE CONDICIONES DENTALES
 * Dibuja símbolos y marcas según las condiciones aplicadas al diente
 */

import { getToothDimensions } from '@/constants/toothDimensions';
import { DentalSymbol } from '../DentalSymbols';
import { renderConnectedTooth } from '../utils/connectedToothRenderer';
import { ToothConditionRendererProps } from './types';
import { determineConditionColor } from './utils/colorHelpers';
import { determineArrowDirection, getToothType } from './utils/toothHelpers';
import { getLabelYPosition } from './utils/positionHelpers';
import {
  renderSurface,
  renderSealantFissurePattern
} from './renderers/surfaceRenderers';
import {
  renderHorizontalLineTop,
  renderHorizontalLineBottom
} from './renderers/basicSymbolRenderers';
import {
  renderFracture,
  renderSupernumerario,
  renderExtrusionIntrusionArrow,
  renderPiezaEnErupcion,
  renderMigracionArrow,
  renderDienteClavijaTriangle
} from './renderers/specialConditionRenderers';
import {
  renderPulpotomySquare,
  renderTratamientoPulparLinea
} from './renderers/pulpRenderers';
import {
  renderFusion,
  renderGeminacion,
  renderEspigoMunon
} from './renderers/apparatusRenderers';

export const ToothConditionRenderer = ({
  toothNumber,
  toothX,
  toothY,
  conditions,
  isUpper
}: ToothConditionRendererProps) => {
  // Filtrar condiciones de este diente
  const toothConditions = conditions.filter(c => c.toothNumber === toothNumber);

  if (toothConditions.length === 0) return null;

  return (
    <g className="tooth-conditions pointer-events-none">
      {toothConditions.map((applied, index) => {
        const condition = applied.condition;

        // Determinar color (puede ser condicional según estado)
        const color = determineConditionColor(applied, condition);

        // Renderizar según tipo de símbolo
        switch (condition.symbolType) {
          case 'fill':
            // CASO ESPECIAL: Desgaste - solo borde, no relleno
            if (condition.id === 'desgaste') {
              return renderSurface(applied, toothX, toothY, color, isUpper, 'outline');
            }
            // Para caries y restauraciones: pintar superficies
            return renderSurface(applied, toothX, toothY, color, isUpper, 'fill');

          case 'outline':
            // Para sellantes: dibujar patrón de fosas y fisuras
            if (condition.id === 'sellantes') {
              return renderSealantFissurePattern(applied, toothNumber, toothX, toothY, color);
            }
            // Para restauración temporal: contorno sin relleno
            return renderSurface(applied, toothX, toothY, color, isUpper, 'outline');

          case 'aspa':
            // Diente ausente: X abarcando corona + raíz (tamaño contenido)
            const aspaDimensions = getToothDimensions(toothNumber);
            // Calcular centro del diente completo (corona + raíz)
            let aspaCenterY: number;
            if (isUpper) {
              // Dientes superiores: raíz va hacia arriba
              aspaCenterY = toothY + (aspaDimensions.crownHeight - aspaDimensions.rootHeight) / 2;
            } else {
              // Dientes inferiores: raíz va hacia abajo
              aspaCenterY = toothY + (aspaDimensions.crownHeight + aspaDimensions.rootHeight) / 2;
            }
            // Tamaño: 65% de la altura total (corona + raíz) para que sea visible pero contenido
            const totalHeight = aspaDimensions.crownHeight + aspaDimensions.rootHeight;
            const aspaSize = totalHeight * 0.65;
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="aspa"
                x={toothX}
                y={aspaCenterY}
                color={color}
                size={aspaSize}
              />
            );

          case 'circle':
            // CASO ESPECIAL: Supernumerario - círculo con "S" entre dientes adyacentes a nivel de ápices
            if (condition.id === 'supernumerario' && applied.supernumeraryPosition) {
              return renderSupernumerario(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // Corona: círculo alrededor del diente (centrado en corona)
            const circleDimensions = getToothDimensions(toothNumber);
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="circle"
                x={toothX}
                y={toothY + (circleDimensions.crownHeight / 2)} // Centro dinámico de la corona
                color={color}
                size={60}
              />
            );

          case 'line':
            // CASO ESPECIAL: Fractura se dibuja de manera diferente
            if (condition.id === 'fractura' && applied.fractureLocation) {
              return renderFracture(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // CASO ESPECIAL: Edéntulo total - NO se renderiza aquí
            // Se renderiza en el componente padre agrupando dientes consecutivos
            if (condition.id === 'edentulo-total') {
              return null; // No renderizar individualmente
            }
            // CASO ESPECIAL: Tratamiento Pulpar (PP) - mancha en la corona
            if (condition.id === 'tratamiento-pulpar' && applied.abbreviation === 'PP') {
              return renderPulpotomySquare(applied, toothX, toothY, color);
            }
            // CASO ESPECIAL: Tratamiento Pulpar (TC, PC) - línea vertical en raíz
            if (condition.id === 'tratamiento-pulpar' && (applied.abbreviation === 'TC' || applied.abbreviation === 'PC')) {
              return renderTratamientoPulparLinea(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // Línea vertical por defecto
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="line"
                x={toothX}
                y={isUpper ? toothY - 20 : toothY + 60}
                color={color}
                size={40}
                direction={isUpper ? 'up' : 'down'}
              />
            );

          case 'arrow':
            // CASO ESPECIAL: Diente Extruido/Intruido - flecha fuera del diente
            if (condition.id === 'diente-extruido' || condition.id === 'diente-intruido') {
              return renderExtrusionIntrusionArrow(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // CASO ESPECIAL: Migración - flecha horizontal según dirección (mesial/distal)
            if (condition.id === 'migracion' && applied.migracionDirection) {
              return renderMigracionArrow(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // Flechas para otros movimientos dentales (centradas en corona)
            const arrowDimensions = getToothDimensions(toothNumber);
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="arrow"
                x={toothX}
                y={toothY + (arrowDimensions.crownHeight / 2)} // Centro dinámico de la corona
                color={color}
                size={35}
                direction={determineArrowDirection(condition.id, isUpper)}
              />
            );

          case 'arrow-zigzag':
            // Pieza en erupción: línea roja con dirección según arcada
            return renderPiezaEnErupcion(applied, toothNumber, toothX, toothY, color, isUpper, index);

          case 'curve-arrow':
            // Flecha curva para giroversión - se dibuja DEBAJO del diente completo (después de las raíces)
            if (applied.giroversionDirection) {
              const type = getToothType(toothNumber);
              const dimensions = getToothDimensions(toothNumber);
              const crownHeight = dimensions.crownHeight;
              const rootHeight = dimensions.rootHeight;
              // Posición: DEBAJO del diente completo (corona + raíces)
              // Para dientes superiores: las raíces van hacia arriba, así que la flecha va después de toothY (hacia abajo visual)
              // Para dientes inferiores: las raíces van hacia abajo, así que la flecha va después de raíces
              const yOffset = isUpper ? crownHeight + 25 : crownHeight + rootHeight + 25;

              return (
                <DentalSymbol
                  key={`${toothNumber}-${condition.id}-${index}`}
                  symbolType="curve-arrow"
                  x={toothX}
                  y={toothY + yOffset}
                  color={color}
                  size={25}
                  direction={applied.giroversionDirection}
                />
              );
            }
            return null;

          case 'triangle':
            // Triángulo para diente en clavija - ENCIERRA EL NÚMERO DEL DIENTE
            // El triángulo va alrededor del label/número, no del diente
            const triangleData = renderDienteClavijaTriangle(applied, toothNumber, toothX, toothY, color, isUpper, index);
            return (
              <DentalSymbol
                key={`${toothNumber}-diente-clavija-${index}`}
                symbolType="triangle"
                x={toothX}
                y={triangleData.labelY}
                color={color}
                size={triangleData.triangleSize}
              />
            );

          case 'parenthesis':
            // Paréntesis para diastema - SE DIBUJA ENTRE DOS DIENTES
            // La posición depende de diastemaPosition (left o right)
            if (applied.diastemaPosition) {
              const offsetX = applied.diastemaPosition === 'right' ? 35 : -35;
              return (
                <DentalSymbol
                  key={`${toothNumber}-${condition.id}-${index}`}
                  symbolType="parenthesis"
                  x={toothX + offsetX} // Desplazar según la posición elegida
                  y={toothY + 20}
                  color={color}
                  size={15} // Tamaño reducido para que quepa en el espacio
                />
              );
            }
            return null;

          case 'square':
            // CASO ESPECIAL: Espigo-Muñón - Cuadrado en corona + línea en raíz
            if (condition.id === 'espigo-munon') {
              return renderEspigoMunon(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // Cuadrado para coronas (definitivas y temporales)
            // El cuadrado encierra la CORONA del diente
            const squareDimensions = getToothDimensions(toothNumber);
            // Usar el ancho del diente menos un pequeño margen para que quede contenido
            const squareSize = squareDimensions.width - 4; // 4px de margen total (2px por lado)
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="square"
                x={toothX}
                y={toothY + (squareDimensions.crownHeight / 2)} // Centro dinámico de la corona
                color={color}
                size={squareSize} // Tamaño dinámico basado en el ancho del diente
              />
            );

          case 'double-circle':
            // CASO ESPECIAL: Fusión - círculos interceptados alrededor de números de dientes
            if (condition.id === 'fusion' && applied.fusionPosition) {
              return renderFusion(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // CASO ESPECIAL: Geminación - círculo simple alrededor del NÚMERO del diente
            if (condition.id === 'geminacion') {
              return renderGeminacion(applied, toothNumber, toothX, toothY, color, isUpper, index);
            }
            // Doble círculo para otras condiciones (sobre el diente, centrado en corona)
            const doubleCircleDimensions = getToothDimensions(toothNumber);
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="double-circle"
                x={toothX}
                y={toothY + (doubleCircleDimensions.crownHeight / 2)} // Centro dinámico de la corona
                color={color}
                size={45}
              />
            );

          case 'cross-square':
            // CASO ESPECIAL: Aparato Ortodóntico Fijo con conexión entre 2 dientes
            if (condition.id === 'aparato-fijo' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Cuadrado con cruz para aparato fijo (sin conexión)
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="cross-square"
                x={toothX}
                y={isUpper ? toothY - 60 : toothY + 100}
                color={color}
                size={14}
              />
            );

          case 'zigzag':
            // CASO ESPECIAL: Aparato Ortodóntico Removible con conexión entre 2 dientes
            if (condition.id === 'aparato-removible' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Zigzag para aparato removible (sin conexión)
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="zigzag"
                x={toothX - 30}
                y={isUpper ? toothY - 60 : toothY + 100}
                color={color}
                size={60}
              />
            );

          case 'horizontal-with-verticals':
            // CASO ESPECIAL: Prótesis Fija con conexión entre 2 dientes pilares
            if (condition.id === 'protesis-fija' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Si no tiene conexión, no renderizar nada (la prótesis fija requiere 2 pilares)
            return null;

          case 'single-horizontal':
            // CASO ESPECIAL: Prótesis Total con conexión entre 2 dientes extremos del arco
            if (condition.id === 'protesis-total' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Si no tiene conexión, no renderizar nada (la prótesis total requiere 2 extremos del arco)
            return null;

          case 'crossed-arrows':
            // CASO ESPECIAL: Transposición con conexión entre 2 dientes que intercambian posición
            if (condition.id === 'transposicion' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Si no tiene conexión, no renderizar nada (la transposición requiere 2 dientes)
            return null;

          case 'double-line':
            // CASO ESPECIAL: Prótesis Removible con conexión entre dientes del rango
            if (condition.id === 'protesis-removible' && applied.connectedToothNumber) {
              return renderConnectedTooth(applied, toothNumber, toothX, toothY, color, isUpper, index, conditions);
            }
            // Si no tiene conexión, renderizar símbolo local (fallback)
            return (
              <DentalSymbol
                key={`${toothNumber}-${condition.id}-${index}`}
                symbolType="double-line"
                x={toothX - 30}
                y={isUpper ? toothY - 35 : toothY + 75}
                color={color}
                size={60}
                direction="right"
              />
            );

          case 'text':
            // Abreviaturas renderizadas en recuadros (manejado externamente)
            return null;

          case 'horizontal-line-top':
            // Línea horizontal arriba del diente, separada (Gingivitis)
            return renderHorizontalLineTop(toothNumber, condition.id, toothX, toothY, color, isUpper, index);

          case 'horizontal-line-bottom':
            // Línea horizontal en la base de la corona (Periodontitis)
            return renderHorizontalLineBottom(toothNumber, condition.id, toothX, toothY, color, isUpper, index);

          default:
            return null;
        }
      })}
    </g>
  );
};

export default ToothConditionRenderer;
