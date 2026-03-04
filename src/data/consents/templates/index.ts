import type { ConsentTemplate } from '../types';
import { apicectomia } from './apicectomia';
import { cirugiaOcular } from './cirugia-ocular';
import { caninosRetenidos } from './caninos-retenidos';
import { cirugiaTerceraMolar } from './cirugia-tercera-molar';
import { cirugiaApical } from './cirugia-apical';
import { cirugiaBucalMenor } from './cirugia-bucal-menor';
import { cirugiaOrtognatica } from './cirugia-ortognatica';
import { endodoncia } from './endodoncia';
import { exodonciaSimple } from './exodoncia-simple';
import { implantes } from './implantes';
import { operatoria } from './operatoria';
import { ortodoncia } from './ortodoncia';
import { protesisFija } from './protesis-fija';
import { tercerMolar } from './tercer-molar';
import { tratamientoGeneral } from './tratamiento-general';

export const consentTemplates: ConsentTemplate[] = [
  apicectomia,
  cirugiaOcular,
  caninosRetenidos,
  cirugiaTerceraMolar,
  cirugiaApical,
  cirugiaBucalMenor,
  cirugiaOrtognatica,
  endodoncia,
  exodonciaSimple,
  implantes,
  operatoria,
  ortodoncia,
  protesisFija,
  tercerMolar,
  tratamientoGeneral
];

export {
  apicectomia,
  cirugiaOcular,
  caninosRetenidos,
  cirugiaTerceraMolar,
  cirugiaApical,
  cirugiaBucalMenor,
  cirugiaOrtognatica,
  endodoncia,
  exodonciaSimple,
  implantes,
  operatoria,
  ortodoncia,
  protesisFija,
  tercerMolar,
  tratamientoGeneral
};
