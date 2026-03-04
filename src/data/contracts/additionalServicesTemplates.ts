/**
 * Plantillas base para contratos de servicios adicionales
 */

export interface AdditionalServiceContract {
  id: string;
  nombre: string;
  tipo: 'ortodoncia' | 'implantes' | 'rehabilitacion_oral';
  descripcion: string;
  precio: number;
  duracion: string;
  contenido: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const additionalServicesTemplates: AdditionalServiceContract[] = [
  {
    id: 'contrato_ortodoncia',
    nombre: 'Contrato de Tratamiento de Ortodoncia',
    tipo: 'ortodoncia',
    descripcion: 'Contrato para tratamiento de ortodoncia con brackets o alineadores invisibles',
    precio: 5000,
    duracion: '18-24 meses',
    contenido: `
<h2>CONTRATO DE TRATAMIENTO DE ORTODONCIA</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el paciente:</p>

<p><strong>Nombre del Paciente:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha:</strong> _______________________________</p>

<h3>I. OBJETO DEL CONTRATO</h3>
<p>LA CLÍNICA se compromete a brindar al paciente el servicio de tratamiento de ortodoncia, el cual incluye:</p>
<ul>
  <li>Evaluación inicial y diagnóstico ortodóntico completo</li>
  <li>Estudio cefalométrico y modelos de estudio</li>
  <li>Instalación de aparatología ortodóntica (brackets/alineadores)</li>
  <li>Controles mensuales durante el período de tratamiento activo</li>
  <li>Retiro de aparatología al finalizar el tratamiento</li>
  <li>Entrega de retenedores</li>
</ul>

<h3>II. DURACIÓN ESTIMADA</h3>
<p>El tratamiento tiene una duración estimada de 18 a 24 meses, pudiendo extenderse según la complejidad del caso y la colaboración del paciente.</p>

<h3>III. INVERSIÓN ECONÓMICA</h3>
<p>El costo total del tratamiento es de S/ 5,000.00 (Cinco mil soles), el cual puede ser fraccionado en cuotas mensuales previo acuerdo con LA CLÍNICA.</p>

<h3>IV. OBLIGACIONES DEL PACIENTE</h3>
<ul>
  <li>Asistir puntualmente a todas las citas programadas</li>
  <li>Mantener una higiene bucal adecuada</li>
  <li>Seguir las indicaciones del ortodoncista</li>
  <li>Informar cualquier desprendimiento o rotura de la aparatología</li>
  <li>Usar los elásticos y dispositivos auxiliares según indicación</li>
  <li>Cumplir con los pagos acordados en las fechas establecidas</li>
</ul>

<h3>V. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Proporcionar atención profesional de calidad</li>
  <li>Realizar controles periódicos mensuales</li>
  <li>Atender emergencias relacionadas con el tratamiento</li>
  <li>Informar al paciente sobre el progreso del tratamiento</li>
  <li>Reparar sin costo adicional los desprendimientos de brackets por causas no atribuibles al paciente</li>
</ul>

<h3>VI. CASOS NO INCLUIDOS</h3>
<p>No están incluidos en el costo del tratamiento:</p>
<ul>
  <li>Extracciones dentales necesarias previas al tratamiento</li>
  <li>Tratamientos de conducto (endodoncia)</li>
  <li>Tratamientos periodontales</li>
  <li>Cirugías maxilofaciales</li>
  <li>Reposición de retenedores por pérdida o rotura</li>
  <li>Blanqueamiento dental posterior al tratamiento</li>
</ul>

<h3>VII. CANCELACIÓN Y REEMBOLSO</h3>
<p>En caso de cancelación del tratamiento por parte del paciente:</p>
<ul>
  <li>No se realizarán reembolsos de pagos efectuados</li>
  <li>Los servicios prestados hasta la fecha de cancelación se considerarán finiquitados</li>
  <li>El paciente deberá abonar cualquier deuda pendiente antes del retiro de la aparatología</li>
</ul>

<h3>VIII. GARANTÍA</h3>
<p>LA CLÍNICA garantiza:</p>
<ul>
  <li>La corrección de las malposiciones dentales según el plan de tratamiento establecido</li>
  <li>El uso de materiales de primera calidad</li>
  <li>Atención profesional especializada</li>
</ul>

<p>No se garantizan resultados si el paciente no cumple con las indicaciones y asistencias regulares.</p>

<h3>IX. CONSENTIMIENTO INFORMADO</h3>
<p>El paciente declara haber sido informado sobre:</p>
<ul>
  <li>La naturaleza del tratamiento ortodóntico</li>
  <li>Los riesgos y beneficios del procedimiento</li>
  <li>Las alternativas de tratamiento disponibles</li>
  <li>Las consecuencias de no realizar el tratamiento</li>
  <li>El cuidado y mantenimiento de la aparatología</li>
</ul>

<h3>X. RESOLUCIÓN DE CONFLICTOS</h3>
<p>Cualquier controversia derivada del presente contrato será resuelta mediante conciliación o arbitraje, según las partes acuerden.</p>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Paciente&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma del Ortodoncista</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COP: _______________</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contrato_implantes',
    nombre: 'Contrato de Colocación de Implantes Dentales',
    tipo: 'implantes',
    descripcion: 'Contrato para procedimiento de implantología dental y rehabilitación con coronas sobre implantes',
    precio: 8000,
    duracion: '4-6 meses',
    contenido: `
<h2>CONTRATO DE COLOCACIÓN DE IMPLANTES DENTALES</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el paciente:</p>

<p><strong>Nombre del Paciente:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha:</strong> _______________________________</p>

<h3>I. OBJETO DEL CONTRATO</h3>
<p>LA CLÍNICA se compromete a realizar al paciente el procedimiento de colocación de implante(s) dental(es), que incluye:</p>
<ul>
  <li>Evaluación clínica y radiográfica completa (Tomografía computarizada)</li>
  <li>Planificación digital del tratamiento implantológico</li>
  <li>Cirugía de colocación de implante(s) de titanio grado médico</li>
  <li>Seguimiento del período de osteointegración (3-6 meses)</li>
  <li>Colocación de pilar de cicatrización</li>
  <li>Toma de impresiones para corona definitiva</li>
  <li>Colocación de corona sobre implante</li>
</ul>

<h3>II. NÚMERO DE IMPLANTES</h3>
<p>Número de implantes a colocar: _______ implante(s)</p>
<p>Ubicación: _______________________________</p>

<h3>III. DURACIÓN DEL TRATAMIENTO</h3>
<p>El tratamiento completo tiene una duración aproximada de 4 a 6 meses, distribuidos en:</p>
<ul>
  <li>Fase quirúrgica: 1 día (cirugía de colocación)</li>
  <li>Período de osteointegración: 3-6 meses</li>
  <li>Fase protésica: 2-3 semanas (confección y colocación de corona)</li>
</ul>

<h3>IV. INVERSIÓN ECONÓMICA</h3>
<p>El costo total del tratamiento es de S/ 8,000.00 (Ocho mil soles) por implante completo (incluye implante + pilar + corona), el cual puede ser fraccionado según el siguiente esquema:</p>
<ul>
  <li>50% al momento de la cirugía de colocación del implante</li>
  <li>50% al momento de la colocación de la corona definitiva</li>
</ul>

<h3>V. OBLIGACIONES DEL PACIENTE</h3>
<ul>
  <li>Proporcionar su historia clínica médica completa y veraz</li>
  <li>Informar sobre alergias, medicamentos actuales y condiciones sistémicas</li>
  <li>Asistir a todas las citas de control postoperatorio</li>
  <li>Seguir estrictamente las indicaciones postoperatorias</li>
  <li>Mantener una higiene oral rigurosa</li>
  <li>No fumar durante el período de osteointegración (mínimo 3 meses)</li>
  <li>Evitar cargar el implante durante el período de cicatrización</li>
  <li>Acudir a controles periódicos semestrales después de terminado el tratamiento</li>
</ul>

<h3>VI. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Realizar una evaluación diagnóstica completa</li>
  <li>Utilizar implantes de marcas reconocidas internacionalmente</li>
  <li>Proporcionar atención con profesionales especializados en implantología</li>
  <li>Realizar el procedimiento bajo estándares de bioseguridad</li>
  <li>Atender emergencias postoperatorias sin costo adicional</li>
  <li>Realizar controles radiográficos de evolución</li>
  <li>Entregar certificado de garantía del implante</li>
</ul>

<h3>VII. PROCEDIMIENTOS NO INCLUIDOS</h3>
<p>No están incluidos en el costo del tratamiento:</p>
<ul>
  <li>Tratamientos periodontales previos necesarios</li>
  <li>Extracciones dentales</li>
  <li>Injertos óseos (si fueran necesarios)</li>
  <li>Elevación de seno maxilar</li>
  <li>Sedación consciente o anestesia general (si el paciente la requiere)</li>
  <li>Medicamentos postoperatorios</li>
  <li>Prótesis provisionales durante el período de osteointegración</li>
</ul>

<h3>VIII. RIESGOS Y COMPLICACIONES POSIBLES</h3>
<p>El paciente ha sido informado sobre los siguientes riesgos:</p>
<ul>
  <li>Fracaso en la osteointegración del implante (2-5% de casos)</li>
  <li>Infección postoperatoria</li>
  <li>Sangrado o hematoma</li>
  <li>Lesión de estructuras anatómicas adyacentes (nervios, senos maxilares)</li>
  <li>Dolor o molestias postoperatorias</li>
  <li>Fractura del implante o corona (por sobrecarga)</li>
  <li>Pérdida ósea periimplantaria (periimplantitis)</li>
</ul>

<h3>IX. GARANTÍA</h3>
<p>LA CLÍNICA garantiza:</p>
<ul>
  <li>Implantes de titanio de grado médico con certificación internacional</li>
  <li>2 años de garantía sobre el implante por defectos de fabricación</li>
  <li>1 año de garantía sobre la corona protésica por fracturas (excepto por trauma directo)</li>
</ul>

<p><strong>IMPORTANTE:</strong> La garantía NO cubre:</p>
<ul>
  <li>Fracaso por no seguir las indicaciones postoperatorias</li>
  <li>Daños causados por trauma directo</li>
  <li>Pérdida del implante por enfermedad periodontal o mala higiene</li>
  <li>Complicaciones derivadas de enfermedades sistémicas no controladas (diabetes, osteoporosis)</li>
  <li>Fracaso en pacientes fumadores</li>
</ul>

<h3>X. CANCELACIÓN</h3>
<p>Si el paciente decide cancelar el tratamiento:</p>
<ul>
  <li>Antes de la cirugía: se reembolsará el 80% del pago realizado (descontando gastos administrativos)</li>
  <li>Después de la cirugía: no habrá reembolso, solo se podrá utilizar para otro tratamiento en LA CLÍNICA</li>
</ul>

<h3>XI. CONTRAINDICACIONES</h3>
<p>El paciente declara NO padecer ninguna de las siguientes condiciones que contraindican la colocación de implantes:</p>
<ul>
  <li>Diabetes no controlada</li>
  <li>Tratamiento con bifosfonatos o medicamentos que afecten el metabolismo óseo</li>
  <li>Radioterapia en cabeza y cuello reciente</li>
  <li>Embarazo</li>
  <li>Trastornos de coagulación no controlados</li>
  <li>Inmunosupresión severa</li>
</ul>

<h3>XII. CONSENTIMIENTO</h3>
<p>El paciente declara:</p>
<ul>
  <li>Haber sido informado sobre la naturaleza del procedimiento</li>
  <li>Conocer los riesgos y beneficios del tratamiento</li>
  <li>Haber tenido oportunidad de hacer preguntas y aclarar dudas</li>
  <li>Aceptar someterse al procedimiento de forma voluntaria</li>
  <li>Comprometerse a seguir todas las indicaciones pre y postoperatorias</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Paciente&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma del Implantólogo</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COP: _______________</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contrato_rehabilitacion_oral',
    nombre: 'Contrato de Rehabilitación Oral Integral',
    tipo: 'rehabilitacion_oral',
    descripcion: 'Contrato para tratamiento de rehabilitación oral completa con prótesis fijas y/o removibles',
    precio: 12000,
    duracion: '3-6 meses',
    contenido: `
<h2>CONTRATO DE REHABILITACIÓN ORAL INTEGRAL</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el paciente:</p>

<p><strong>Nombre del Paciente:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha:</strong> _______________________________</p>

<h3>I. OBJETO DEL CONTRATO</h3>
<p>LA CLÍNICA se compromete a realizar al paciente un tratamiento integral de rehabilitación oral, que incluye:</p>
<ul>
  <li>Evaluación clínica completa y diagnóstico integral</li>
  <li>Estudio radiográfico (panorámica y periapicales necesarias)</li>
  <li>Modelos de estudio y encerado diagnóstico</li>
  <li>Fotografías intraorales y extraorales</li>
  <li>Plan de tratamiento personalizado</li>
  <li>Fase higiénica (profilaxis y tartrectomía)</li>
  <li>Tratamientos restauradores necesarios</li>
  <li>Confección e instalación de prótesis dentales</li>
  <li>Ajustes y controles posteriores</li>
</ul>

<h3>II. ALCANCE DEL TRATAMIENTO</h3>
<p>Tipo de rehabilitación a realizar:</p>
<ul>
  <li>☐ Prótesis fija (coronas, puentes)</li>
  <li>☐ Prótesis removible (parcial o total)</li>
  <li>☐ Prótesis híbrida (combinación de fija y removible)</li>
  <li>☐ Rehabilitación sobre implantes</li>
</ul>

<p>Número estimado de unidades: _______</p>
<p>Arcadas a rehabilitar: ☐ Superior  ☐ Inferior  ☐ Ambas</p>

<h3>III. FASES DEL TRATAMIENTO</h3>

<p><strong>Fase 1: Diagnóstico (1-2 semanas)</strong></p>
<ul>
  <li>Evaluación clínica completa</li>
  <li>Estudios radiográficos y fotográficos</li>
  <li>Modelos de estudio</li>
  <li>Presentación del plan de tratamiento</li>
</ul>

<p><strong>Fase 2: Preparatoria (2-4 semanas)</strong></p>
<ul>
  <li>Tratamientos de tejidos blandos (si necesarios)</li>
  <li>Tratamientos de conducto (si necesarios)</li>
  <li>Extracciones (si necesarias)</li>
  <li>Preparación de pilares</li>
</ul>

<p><strong>Fase 3: Rehabilitadora (4-8 semanas)</strong></p>
<ul>
  <li>Toma de impresiones definitivas</li>
  <li>Pruebas de estructura metálica o estructura de prótesis</li>
  <li>Prueba de bizcocho (selección de color y forma)</li>
  <li>Instalación de prótesis definitivas</li>
</ul>

<p><strong>Fase 4: Mantenimiento</strong></p>
<ul>
  <li>Controles periódicos cada 6 meses</li>
  <li>Ajustes menores sin costo durante el primer año</li>
</ul>

<h3>IV. INVERSIÓN ECONÓMICA</h3>
<p>El costo total estimado del tratamiento es de S/ 12,000.00 (Doce mil soles), el cual incluye:</p>
<ul>
  <li>Todos los estudios diagnósticos</li>
  <li>Fase higiénica completa</li>
  <li>Prótesis dentales según plan de tratamiento</li>
  <li>Controles durante el primer año</li>
</ul>

<p><strong>Forma de pago:</strong></p>
<ul>
  <li>30% inicial (al firmar el contrato)</li>
  <li>40% al inicio de la fase rehabilitadora</li>
  <li>30% al momento de la entrega de prótesis definitivas</li>
</ul>

<h3>V. OBLIGACIONES DEL PACIENTE</h3>
<ul>
  <li>Asistir puntualmente a todas las citas programadas</li>
  <li>Mantener una higiene oral rigurosa según indicaciones</li>
  <li>Acudir a controles semestrales de mantenimiento</li>
  <li>No consumir alimentos extremadamente duros durante el período de adaptación</li>
  <li>Informar inmediatamente cualquier molestia o incomodidad</li>
  <li>Usar protector nocturno si el profesional lo indica (bruxismo)</li>
  <li>Cumplir con los pagos en las fechas acordadas</li>
</ul>

<h3>VI. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Proporcionar atención profesional especializada</li>
  <li>Utilizar materiales de primera calidad certificados</li>
  <li>Realizar trabajos de laboratorio con técnicos certificados</li>
  <li>Garantizar la estética y función de las prótesis</li>
  <li>Realizar ajustes necesarios sin costo adicional durante el primer año</li>
  <li>Atender urgencias relacionadas con el tratamiento</li>
  <li>Proporcionar instrucciones de cuidado y mantenimiento</li>
</ul>

<h3>VII. SERVICIOS NO INCLUIDOS</h3>
<p>No están incluidos en el costo base del tratamiento:</p>
<ul>
  <li>Tratamientos periodontales profundos (cirugías)</li>
  <li>Cirugías preprotésicas (regularizaciones óseas extensas)</li>
  <li>Implantes dentales (se cotiza por separado)</li>
  <li>Injertos de tejido blando</li>
  <li>Prótesis provisionales de larga duración</li>
  <li>Blanqueamiento dental estético</li>
  <li>Reposición de prótesis por pérdida o rotura no atribuible a LA CLÍNICA</li>
</ul>

<h3>VIII. GARANTÍA</h3>
<p>LA CLÍNICA garantiza:</p>

<p><strong>Para Prótesis Fijas (coronas, puentes):</strong></p>
<ul>
  <li>2 años de garantía contra desprendimiento de porcelana</li>
  <li>2 años de garantía contra fractura de estructura</li>
  <li>Garantía de adaptación marginal</li>
</ul>

<p><strong>Para Prótesis Removibles:</strong></p>
<ul>
  <li>1 año de garantía contra fracturas de base acrílica</li>
  <li>1 año de garantía contra desprendimiento de dientes artificiales</li>
  <li>Ajustes y rebasados incluidos durante el primer año</li>
</ul>

<p><strong>La garantía NO aplica en los siguientes casos:</strong></p>
<ul>
  <li>Daños causados por trauma directo o accidente</li>
  <li>Falta de higiene adecuada que genere enfermedad periodontal</li>
  <li>Incumplimiento de controles de mantenimiento</li>
  <li>Bruxismo no tratado (rechinar de dientes)</li>
  <li>Pérdida o extravío de la prótesis</li>
  <li>Modificaciones realizadas por personal ajeno a LA CLÍNICA</li>
</ul>

<h3>IX. ADAPTACIÓN A LAS PRÓTESIS</h3>
<p>El paciente entiende que:</p>
<ul>
  <li>El período de adaptación puede durar de 2 a 4 semanas</li>
  <li>Pueden presentarse molestias menores iniciales (presión, exceso de saliva, dificultad para hablar)</li>
  <li>Se requieren controles de ajuste durante las primeras semanas</li>
  <li>La fonética puede verse afectada temporalmente</li>
  <li>El cambio en la dimensión vertical puede requerir adaptación neuromuscular</li>
</ul>

<h3>X. MANTENIMIENTO Y CUIDADOS</h3>
<p>El paciente se compromete a:</p>
<ul>
  <li>Cepillar las prótesis después de cada comida</li>
  <li>Usar productos de limpieza recomendados</li>
  <li>No usar blanqueadores o productos abrasivos</li>
  <li>Retirar las prótesis removibles durante la noche (si así se indica)</li>
  <li>Acudir a limpiezas profesionales cada 6 meses</li>
  <li>No realizar ajustes por cuenta propia</li>
</ul>

<h3>XI. CANCELACIÓN Y REEMBOLSO</h3>
<p>En caso de cancelación del tratamiento:</p>
<ul>
  <li>Antes de iniciar: reembolso del 90% del pago inicial</li>
  <li>Durante fase preparatoria: se descontarán los servicios realizados</li>
  <li>Durante fase rehabilitadora: no habrá reembolso, solo podrá utilizarse para otro tratamiento</li>
  <li>Después de instaladas las prótesis: no aplica reembolso</li>
</ul>

<h3>XII. CASOS DE FRACASO O COMPLICACIONES</h3>
<p>El paciente ha sido informado sobre posibles complicaciones:</p>
<ul>
  <li>Sensibilidad dental transitoria</li>
  <li>Necesidad de tratamiento de conducto en dientes pilares</li>
  <li>Fractura de pilares dentales (que podría requerir extracción)</li>
  <li>Movilidad de dientes pilares por enfermedad periodontal</li>
  <li>Cambios en la oclusión que requieran ajustes</li>
  <li>Inflamación gingival por mala higiene</li>
  <li>Pérdida ósea que afecte la retención de prótesis removibles</li>
</ul>

<p>En caso de complicaciones, LA CLÍNICA se compromete a:</p>
<ul>
  <li>Evaluar la situación sin costo adicional</li>
  <li>Proponer soluciones alternativas</li>
  <li>Realizar modificaciones necesarias dentro de la garantía</li>
</ul>

<h3>XIII. CONSENTIMIENTO INFORMADO</h3>
<p>El paciente declara:</p>
<ul>
  <li>Haber sido informado sobre el alcance del tratamiento</li>
  <li>Conocer los tiempos estimados de cada fase</li>
  <li>Comprender los riesgos y limitaciones del tratamiento</li>
  <li>Haber visto y aprobado el diseño de sonrisa propuesto</li>
  <li>Aceptar el plan de tratamiento de forma voluntaria</li>
  <li>Comprometerse a seguir las indicaciones de cuidado y mantenimiento</li>
</ul>

<h3>XIV. FOTOGRAFÍAS Y USO DE IMÁGENES</h3>
<p>El paciente autoriza a LA CLÍNICA a tomar fotografías del tratamiento con fines:</p>
<ul>
  <li>☐ Clínicos (expediente médico)</li>
  <li>☐ Educativos (casos clínicos, presentaciones científicas)</li>
  <li>☐ Promocionales (con identidad protegida)</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Paciente&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma del Rehabilitador Oral</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COP: _______________</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
