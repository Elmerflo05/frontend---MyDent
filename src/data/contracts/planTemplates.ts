/**
 * Plantillas base para contratos de planes de salud dental
 */

export interface PlanContract {
  id: string;
  nombre: string;
  tipo: 'personal' | 'familiar' | 'planitium' | 'gold';
  descripcion: string;
  precio: number;
  duracion: string;
  contenido: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const planTemplates: PlanContract[] = [
  {
    id: 'contrato_plan_personal',
    nombre: 'Contrato Plan Personal',
    tipo: 'personal',
    descripcion: 'Plan de salud dental individual con cobertura básica y preventiva',
    precio: 50,
    duracion: '12 meses',
    contenido: `
<h2>CONTRATO PLAN PERSONAL DE SALUD DENTAL</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el titular del plan:</p>

<p><strong>Nombre del Titular:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha de Inicio:</strong> _______________________________</p>

<h3>I. DESCRIPCIÓN DEL PLAN</h3>
<p>El Plan Personal es un programa de salud dental diseñado para brindar atención preventiva y tratamientos básicos a un titular individual.</p>

<h3>II. INVERSIÓN MENSUAL</h3>
<p>Cuota mensual: S/ 50.00 (Cincuenta soles)</p>
<p>Forma de pago: Mensual, por adelantado</p>
<p>Día de pago: Cada día ____ de cada mes</p>

<h3>III. COBERTURA Y BENEFICIOS</h3>

<p><strong>Servicios con cobertura del 100% (SIN COSTO para el paciente):</strong></p>
<ul>
  <li>✓ 2 limpiezas dentales al año (profilaxis profesional)</li>
  <li>✓ 2 consultas de evaluación preventiva al año</li>
  <li>✓ 2 aplicaciones de flúor al año</li>
  <li>✓ 1 radiografía panorámica al año</li>
  <li>✓ Atención de emergencias (evaluación y control de dolor)</li>
  <li>✓ Consultas ilimitadas de orientación y diagnóstico</li>
</ul>

<p><strong>Servicios con descuento del 20%:</strong></p>
<ul>
  <li>◆ Resinas (obturaciones estéticas)</li>
  <li>◆ Extracciones simples</li>
  <li>◆ Curaciones</li>
  <li>◆ Radiografías periapicales</li>
</ul>

<p><strong>Servicios con descuento del 15%:</strong></p>
<ul>
  <li>◆ Tratamientos de conducto (endodoncia)</li>
  <li>◆ Extracciones complejas</li>
  <li>◆ Limpiezas profundas (raspado y alisado radicular)</li>
  <li>◆ Cirugías dentales menores</li>
</ul>

<p><strong>Servicios con descuento del 10%:</strong></p>
<ul>
  <li>◆ Coronas y puentes</li>
  <li>◆ Prótesis dentales</li>
  <li>◆ Blanqueamiento dental</li>
  <li>◆ Ortodoncia</li>
  <li>◆ Implantes dentales</li>
</ul>

<h3>IV. VIGENCIA Y RENOVACIÓN</h3>
<ul>
  <li>Vigencia inicial: 12 meses a partir de la fecha de contratación</li>
  <li>Período de carencia: 30 días para servicios con descuento</li>
  <li>Renovación: Automática, salvo notificación con 30 días de anticipación</li>
  <li>Los beneficios sin costo se renuevan cada año calendario</li>
</ul>

<h3>V. CONDICIONES DE USO</h3>
<ul>
  <li>El plan es personal e intransferible</li>
  <li>Válido en todas las sedes de LA CLÍNICA</li>
  <li>Requiere programación previa de citas</li>
  <li>Los beneficios no utilizados no son acumulables ni reembolsables</li>
  <li>El plan debe estar al día en pagos para hacer uso de los beneficios</li>
</ul>

<h3>VI. OBLIGACIONES DEL TITULAR</h3>
<ul>
  <li>Realizar el pago mensual en la fecha acordada</li>
  <li>Presentar DNI y tarjeta de afiliación en cada consulta</li>
  <li>Programar citas con anticipación</li>
  <li>Asistir puntualmente a las citas o cancelar con 24 horas de anticipación</li>
  <li>Informar cambios en datos de contacto</li>
  <li>Seguir las indicaciones del profesional tratante</li>
</ul>

<h3>VII. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Proporcionar los servicios incluidos en el plan</li>
  <li>Aplicar los descuentos correspondientes automáticamente</li>
  <li>Programar citas en horarios disponibles</li>
  <li>Atender con profesionales calificados</li>
  <li>Mantener instalaciones y equipos en óptimas condiciones</li>
  <li>Respetar la confidencialidad de la información del paciente</li>
</ul>

<h3>VIII. SUSPENSIÓN DEL SERVICIO</h3>
<p>El servicio se suspenderá automáticamente en los siguientes casos:</p>
<ul>
  <li>Mora en el pago superior a 15 días</li>
  <li>Incumplimiento de las condiciones del contrato</li>
  <li>Uso fraudulento del plan</li>
  <li>Conducta inadecuada o agresiva hacia el personal</li>
</ul>

<h3>IX. CANCELACIÓN</h3>
<p>El titular puede cancelar el plan en cualquier momento:</p>
<ul>
  <li>Notificar con 30 días de anticipación</li>
  <li>No hay devolución de pagos realizados</li>
  <li>Los beneficios terminan al final del mes pagado</li>
  <li>Posibilidad de reactivación pagando la cuota del mes en curso</li>
</ul>

<h3>X. EXCLUSIONES</h3>
<p>El plan NO cubre:</p>
<ul>
  <li>✗ Tratamientos estéticos no necesarios médicamente</li>
  <li>✗ Tratamientos iniciados antes de la afiliación</li>
  <li>✗ Tratamientos realizados fuera de LA CLÍNICA</li>
  <li>✗ Medicamentos</li>
  <li>✗ Prótesis provisionales de larga duración</li>
  <li>✗ Tratamientos durante el período de carencia</li>
</ul>

<h3>XI. MODIFICACIONES AL PLAN</h3>
<p>LA CLÍNICA se reserva el derecho de:</p>
<ul>
  <li>Modificar los beneficios con notificación de 60 días</li>
  <li>Ajustar precios anualmente (máximo variación IPC + 5%)</li>
  <li>Agregar nuevos beneficios sin costo adicional</li>
</ul>

<h3>XII. TRANSFERENCIA</h3>
<p>El plan puede ser transferido a otra persona:</p>
<ul>
  <li>Previo pago de un cargo administrativo de S/ 30.00</li>
  <li>El nuevo titular debe cumplir período de carencia de 30 días</li>
  <li>Se mantienen los beneficios ya utilizados en el período</li>
</ul>

<h3>XIII. ATENCIÓN DE EMERGENCIAS</h3>
<p>En caso de emergencia dental (dolor agudo, trauma, infección):</p>
<ul>
  <li>Atención prioritaria sin cita previa (según disponibilidad)</li>
  <li>Evaluación y control de dolor sin costo</li>
  <li>Tratamiento definitivo con los descuentos del plan</li>
  <li>Disponible en horario de atención de LA CLÍNICA</li>
</ul>

<h3>XIV. CONSENTIMIENTO</h3>
<p>El titular declara:</p>
<ul>
  <li>Haber leído y comprendido todos los términos del contrato</li>
  <li>Aceptar las condiciones, beneficios y exclusiones del plan</li>
  <li>Comprometerse al pago mensual oportuno</li>
  <li>Autorizar el débito automático (si aplica)</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Titular&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma Autorizada LA CLÍNICA</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Cargo: _______________</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contrato_plan_familiar',
    nombre: 'Contrato Plan Familiar',
    tipo: 'familiar',
    descripcion: 'Plan de salud dental para toda la familia (hasta 5 miembros) con cobertura completa',
    precio: 150,
    duracion: '12 meses',
    contenido: `
<h2>CONTRATO PLAN FAMILIAR DE SALUD DENTAL</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el titular del plan:</p>

<p><strong>Nombre del Titular:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha de Inicio:</strong> _______________________________</p>

<h3>I. DESCRIPCIÓN DEL PLAN</h3>
<p>El Plan Familiar es un programa integral de salud dental que cubre al titular y hasta 4 dependientes (máximo 5 personas en total), ofreciendo atención preventiva y descuentos significativos en todos los tratamientos.</p>

<h3>II. BENEFICIARIOS</h3>
<p><strong>Titular:</strong> _______________________________</p>
<p><strong>Dependiente 1:</strong> _______________________________</p>
<p><strong>Dependiente 2:</strong> _______________________________</p>
<p><strong>Dependiente 3:</strong> _______________________________</p>
<p><strong>Dependiente 4:</strong> _______________________________</p>

<p>*Los dependientes pueden ser: cónyuge, hijos, padres o hermanos del titular</p>

<h3>III. INVERSIÓN MENSUAL</h3>
<p>Cuota mensual: S/ 150.00 (Ciento cincuenta soles)</p>
<p>Forma de pago: Mensual, por adelantado</p>
<p>Día de pago: Cada día ____ de cada mes</p>

<h3>IV. COBERTURA Y BENEFICIOS POR PERSONA</h3>

<p><strong>Servicios con cobertura del 100% (SIN COSTO):</strong></p>
<ul>
  <li>✓ 2 limpiezas dentales al año por persona</li>
  <li>✓ 2 consultas de evaluación preventiva al año por persona</li>
  <li>✓ 2 aplicaciones de flúor al año por persona</li>
  <li>✓ 1 radiografía panorámica al año por persona</li>
  <li>✓ Atención de emergencias ilimitada (evaluación y alivio de dolor)</li>
  <li>✓ Consultas de orientación y diagnóstico ilimitadas</li>
  <li>✓ 1 blanqueamiento dental al año para el titular</li>
</ul>

<p><strong>Servicios con descuento del 30%:</strong></p>
<ul>
  <li>◆ Resinas (obturaciones estéticas)</li>
  <li>◆ Extracciones simples</li>
  <li>◆ Curaciones</li>
  <li>◆ Radiografías periapicales</li>
  <li>◆ Selladores de fosas y fisuras (niños)</li>
</ul>

<p><strong>Servicios con descuento del 25%:</strong></p>
<ul>
  <li>◆ Tratamientos de conducto (endodoncia)</li>
  <li>◆ Extracciones complejas y cirugías menores</li>
  <li>◆ Limpiezas profundas (raspado y alisado radicular)</li>
  <li>◆ Tratamientos periodontales</li>
  <li>◆ Odontopediatría especializada</li>
</ul>

<p><strong>Servicios con descuento del 20%:</strong></p>
<ul>
  <li>◆ Coronas y puentes</li>
  <li>◆ Prótesis dentales (fijas y removibles)</li>
  <li>◆ Blanqueamiento dental (dependientes)</li>
  <li>◆ Ortodoncia infantil y de adultos</li>
  <li>◆ Implantes dentales</li>
  <li>◆ Cirugías mayores</li>
</ul>

<h3>V. BENEFICIOS ADICIONALES EXCLUSIVOS</h3>
<ul>
  <li>★ Programa de ortodoncia preventiva para niños (evaluación anual gratuita)</li>
  <li>★ Educación en salud bucal familiar (charlas trimestrales)</li>
  <li>★ Recordatorios automáticos de citas y controles</li>
  <li>★ Atención prioritaria para programación de citas</li>
  <li>★ Descuento del 10% en productos de higiene oral en LA CLÍNICA</li>
  <li>★ Plan de emergencia 24/7 (orientación telefónica)</li>
</ul>

<h3>VI. VIGENCIA Y RENOVACIÓN</h3>
<ul>
  <li>Vigencia inicial: 12 meses a partir de la fecha de contratación</li>
  <li>Período de carencia: 30 días para servicios con descuento</li>
  <li>Renovación: Automática, salvo notificación con 30 días de anticipación</li>
  <li>Los beneficios sin costo se renuevan cada año calendario por persona</li>
  <li>Posibilidad de agregar dependientes durante la vigencia (prorrateo de cuota)</li>
</ul>

<h3>VII. CONDICIONES DE USO</h3>
<ul>
  <li>Todos los beneficiarios deben registrarse al iniciar el plan</li>
  <li>Cada beneficiario recibe su tarjeta de afiliación personal</li>
  <li>Válido en todas las sedes de LA CLÍNICA</li>
  <li>Requiere presentación de DNI y tarjeta en cada consulta</li>
  <li>Los beneficios son individuales y no transferibles entre miembros</li>
  <li>El plan debe estar al día en pagos para que todos los beneficiarios accedan</li>
</ul>

<h3>VIII. INCORPORACIÓN DE NUEVOS DEPENDIENTES</h3>
<p>Es posible agregar dependientes durante la vigencia del plan:</p>
<ul>
  <li>Máximo 5 personas en total (incluido el titular)</li>
  <li>Pago prorrateado según mes de incorporación</li>
  <li>Nuevo dependiente cumple período de carencia de 30 días</li>
  <li>Cargo de incorporación: S/ 30.00 por persona</li>
</ul>

<h3>IX. RETIRO DE DEPENDIENTES</h3>
<p>El titular puede retirar dependientes del plan:</p>
<ul>
  <li>Notificación con 15 días de anticipación</li>
  <li>Reducción proporcional de la cuota mensual a partir del mes siguiente</li>
  <li>Los beneficios del dependiente retirado terminan al final del mes notificado</li>
</ul>

<h3>X. OBLIGACIONES DEL TITULAR</h3>
<ul>
  <li>Realizar el pago mensual completo en la fecha acordada</li>
  <li>Mantener actualizada la información de todos los beneficiarios</li>
  <li>Informar cambios de dependientes (altas/bajas)</li>
  <li>Asegurar que todos los beneficiarios sigan las normas de LA CLÍNICA</li>
  <li>Responder por el comportamiento de los dependientes menores de edad</li>
</ul>

<h3>XI. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Proporcionar atención de calidad a todos los beneficiarios</li>
  <li>Aplicar descuentos automáticamente</li>
  <li>Llevar registro individual de beneficios utilizados por cada miembro</li>
  <li>Programar citas con disponibilidad preferente</li>
  <li>Enviar recordatorios de controles preventivos</li>
  <li>Mantener confidencialidad de datos de todos los beneficiarios</li>
</ul>

<h3>XII. SUSPENSIÓN DEL SERVICIO</h3>
<p>El servicio se suspende para TODOS los beneficiarios en caso de:</p>
<ul>
  <li>Mora en el pago superior a 15 días</li>
  <li>Incumplimiento grave del contrato por parte del titular</li>
  <li>Uso fraudulento del plan por cualquier beneficiario</li>
  <li>Conducta inadecuada reiterada de cualquier miembro</li>
</ul>

<h3>XIII. CANCELACIÓN</h3>
<p>El titular puede cancelar el plan:</p>
<ul>
  <li>Notificar con 30 días de anticipación</li>
  <li>Sin devolución de pagos realizados</li>
  <li>Los beneficios de todos los miembros terminan al final del mes pagado</li>
  <li>Posibilidad de reactivación pagando la cuota del mes en curso más un cargo de reactivación de S/ 50.00</li>
</ul>

<h3>XIV. EXCLUSIONES</h3>
<p>El plan NO cubre:</p>
<ul>
  <li>✗ Tratamientos estéticos no necesarios médicamente</li>
  <li>✗ Tratamientos iniciados antes de la afiliación de cada dependiente</li>
  <li>✗ Tratamientos realizados fuera de LA CLÍNICA</li>
  <li>✗ Medicamentos y productos farmacéuticos</li>
  <li>✗ Aparatos de ortodoncia perdidos o dañados por negligencia</li>
  <li>✗ Tratamientos durante período de carencia (primeros 30 días)</li>
  <li>✗ Procedimientos experimentales</li>
</ul>

<h3>XV. PROGRAMA INFANTIL (menores de 12 años)</h3>
<p>Beneficios especiales para niños incluidos en el plan:</p>
<ul>
  <li>Evaluación de ortodoncia preventiva anual sin costo</li>
  <li>Educación de higiene bucal personalizada</li>
  <li>Aplicación de selladores con 40% de descuento</li>
  <li>Atención con odontopediatra especializado</li>
</ul>

<h3>XVI. MODIFICACIONES AL PLAN</h3>
<p>LA CLÍNICA puede:</p>
<ul>
  <li>Modificar beneficios con notificación de 60 días</li>
  <li>Ajustar precios anualmente (máximo variación IPC + 5%)</li>
  <li>Agregar nuevos servicios sin costo adicional</li>
  <li>Los cambios no afectan tratamientos en curso</li>
</ul>

<h3>XVII. TRANSFERENCIA DE TITULARIDAD</h3>
<p>La titularidad puede transferirse a otro miembro de la familia:</p>
<ul>
  <li>El nuevo titular debe ser mayor de 18 años</li>
  <li>Cargo administrativo de S/ 50.00</li>
  <li>Mantiene los mismos beneficiarios registrados</li>
  <li>El nuevo titular asume todas las obligaciones del contrato</li>
</ul>

<h3>XVIII. CONSENTIMIENTO</h3>
<p>El titular declara:</p>
<ul>
  <li>Haber leído y comprendido todos los términos del contrato</li>
  <li>Aceptar las condiciones para sí y para todos los dependientes</li>
  <li>Tener autorización de los dependientes mayores de edad</li>
  <li>Tener patria potestad sobre los dependientes menores</li>
  <li>Comprometerse al pago mensual oportuno</li>
  <li>Informar verazmente los datos de todos los beneficiarios</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Titular&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma Autorizada LA CLÍNICA</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Cargo: _______________</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contrato_plan_planitium',
    nombre: 'Contrato Plan Planitium',
    tipo: 'planitium',
    descripcion: 'Plan premium con cobertura extendida y servicios especializados incluidos',
    precio: 200,
    duracion: '12 meses',
    contenido: `
<h2>CONTRATO PLAN PLANITIUM DE SALUD DENTAL</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el titular del plan:</p>

<p><strong>Nombre del Titular:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha de Inicio:</strong> _______________________________</p>

<h3>I. DESCRIPCIÓN DEL PLAN</h3>
<p>El Plan Planitium es nuestro programa premium de salud dental que ofrece la más amplia cobertura en servicios preventivos, restauradores y especializados, diseñado para personas que buscan atención dental integral de la más alta calidad.</p>

<h3>II. INVERSIÓN MENSUAL</h3>
<p>Cuota mensual: S/ 200.00 (Doscientos soles)</p>
<p>Forma de pago: Mensual, por adelantado (descuento del 5% por pago anual anticipado)</p>
<p>Día de pago: Cada día ____ de cada mes</p>

<h3>III. COBERTURA Y BENEFICIOS INCLUIDOS</h3>

<p><strong>Servicios con cobertura del 100% (SIN COSTO):</strong></p>
<ul>
  <li>✓ Limpiezas dentales ILIMITADAS (hasta una por mes)</li>
  <li>✓ Consultas de evaluación preventiva ILIMITADAS</li>
  <li>✓ 4 aplicaciones de flúor profesional al año</li>
  <li>✓ 2 radiografías panorámicas al año</li>
  <li>✓ Radiografías periapicales ILIMITADAS</li>
  <li>✓ 2 blanqueamientos dentales al año</li>
  <li>✓ Atención de emergencias 24/7 (incluye tratamiento básico)</li>
  <li>✓ 1 evaluación de ortodoncia con diseño digital de sonrisa</li>
  <li>✓ Fotografías clínicas y seguimiento digital</li>
  <li>✓ Consultas de segunda opinión con especialistas</li>
</ul>

<p><strong>Servicios con descuento del 50%:</strong></p>
<ul>
  <li>◆ Todas las resinas (obturaciones estéticas)</li>
  <li>◆ Todas las extracciones (simples y complejas)</li>
  <li>◆ Curaciones y reconstrucciones</li>
  <li>◆ Incrustaciones estéticas (Inlays/Onlays)</li>
  <li>◆ Carillas de resina</li>
</ul>

<p><strong>Servicios con descuento del 40%:</strong></p>
<ul>
  <li>◆ Tratamientos de conducto (endodoncia) - todas las piezas</li>
  <li>◆ Limpiezas profundas y raspados</li>
  <li>◆ Cirugías periodontales</li>
  <li>◆ Cirugías de terceros molares (muelas del juicio)</li>
  <li>◆ Apicectomías</li>
  <li>◆ Biopsias y cirugías menores</li>
</ul>

<p><strong>Servicios con descuento del 35%:</strong></p>
<ul>
  <li>◆ Coronas de porcelana o zirconio</li>
  <li>◆ Puentes fijos</li>
  <li>◆ Carillas de porcelana</li>
  <li>◆ Prótesis removibles (parciales y totales)</li>
  <li>◆ Prótesis flexibles</li>
  <li>◆ Rehabilitación oral completa</li>
</ul>

<p><strong>Servicios con descuento del 30%:</strong></p>
<ul>
  <li>◆ Tratamiento de ortodoncia completo (brackets metálicos o estéticos)</li>
  <li>◆ Ortodoncia con alineadores invisibles</li>
  <li>◆ Implantes dentales (incluye corona)</li>
  <li>◆ Injertos óseos y elevación de seno</li>
  <li>◆ Cirugía maxilofacial</li>
  <li>◆ Tratamientos con láser</li>
</ul>

<h3>IV. BENEFICIOS PREMIUM EXCLUSIVOS</h3>
<ul>
  <li>★ Atención prioritaria y preferencial en todas las sedes</li>
  <li>★ Acceso a agenda VIP para citas en horarios preferenciales</li>
  <li>★ Asistente personal de salud dental (coordinación de citas y tratamientos)</li>
  <li>★ Plan de tratamiento personalizado con seguimiento digital</li>
  <li>★ Sala de espera VIP con comodidades especiales</li>
  <li>★ Kit dental premium de bienvenida (valor S/ 150)</li>
  <li>★ Kit de higiene dental trimestral (cepillo, pasta, hilo dental de marca premium)</li>
  <li>★ Descuento del 20% en productos de ortodoncia y estética</li>
  <li>★ Línea de atención telefónica prioritaria 24/7</li>
  <li>★ Asesoría de especialistas vía telefónica sin costo</li>
  <li>★ Recordatorios personalizados vía WhatsApp</li>
  <li>★ Informes digitales de cada tratamiento con fotografías</li>
  <li>★ Programa de puntos: acumula puntos por cada visita (canjeables por servicios)</li>
  <li>★ 2 sesiones al año de higiene bucal educativa personalizada</li>
</ul>

<h3>V. COBERTURA PARA EMERGENCIAS</h3>
<p>Atención de emergencia 24/7 que incluye:</p>
<ul>
  <li>Evaluación inmediata sin costo</li>
  <li>Control de dolor (anestesia, medicación)</li>
  <li>Curaciones de emergencia</li>
  <li>Inmovilización de piezas móviles</li>
  <li>Drenaje de abscesos</li>
  <li>Cementación de coronas desprendidas</li>
  <li>Reparación de prótesis fracturadas (emergencia)</li>
</ul>

<h3>VI. GARANTÍAS EXTENDIDAS</h3>
<p>Como miembro Planitium, obtiene garantías extendidas en:</p>
<ul>
  <li>Resinas: 2 años (contra filtración o fractura)</li>
  <li>Coronas y puentes: 3 años (estructura y porcelana)</li>
  <li>Endodoncia: 2 años (retratamiento sin costo si falla)</li>
  <li>Implantes: 5 años (garantía de osteointegración)</li>
  <li>Prótesis removibles: 2 años (fracturas y ajustes)</li>
  <li>Blanqueamiento: 1 año (retoque sin costo)</li>
</ul>

<h3>VII. VIGENCIA Y RENOVACIÓN</h3>
<ul>
  <li>Vigencia inicial: 12 meses</li>
  <li>SIN período de carencia (beneficios inmediatos desde día 1)</li>
  <li>Renovación automática con beneficios acumulativos por antigüedad</li>
  <li>Beneficios adicionales por cada año de renovación</li>
  <li>Los beneficios sin costo se renuevan cada año calendario</li>
</ul>

<h3>VIII. BENEFICIOS POR ANTIGÜEDAD</h3>
<p>Por cada año de permanencia continua en el plan:</p>
<ul>
  <li>Año 2: +5% de descuento adicional en todos los servicios</li>
  <li>Año 3: +10% de descuento adicional + 1 blanqueamiento extra</li>
  <li>Año 4: +15% de descuento adicional + evaluación de implantes gratuita</li>
  <li>Año 5+: +20% de descuento adicional + membresía vitalicia con tarifa preferencial</li>
</ul>

<h3>IX. TRANSFERIBILIDAD LIMITADA</h3>
<p>Beneficio exclusivo Planitium:</p>
<ul>
  <li>El titular puede compartir hasta 4 limpiezas al año con familiares directos</li>
  <li>Los descuentos se pueden aplicar a tratamientos de cónyuge e hijos menores</li>
  <li>Posibilidad de regalo de servicios incluidos (limpiezas, blanqueamientos)</li>
</ul>

<h3>X. CONDICIONES DE USO</h3>
<ul>
  <li>Válido en todas las sedes de LA CLÍNICA a nivel nacional</li>
  <li>Tarjeta Planitium personalizada con chip digital</li>
  <li>Acceso a app móvil exclusiva para gestión de beneficios</li>
  <li>Requiere programación de citas (excepto emergencias)</li>
  <li>El plan debe estar al día en pagos para acceder a beneficios</li>
</ul>

<h3>XI. OBLIGACIONES DEL TITULAR</h3>
<ul>
  <li>Realizar pago mensual puntual</li>
  <li>Presentar tarjeta Planitium en cada visita</li>
  <li>Asistir a citas o cancelar con 48 horas de anticipación (VIP)</li>
  <li>Mantener datos de contacto actualizados en la app</li>
  <li>Seguir recomendaciones de profesionales</li>
  <li>Acudir a controles preventivos semestrales (para mantener garantías extendidas)</li>
</ul>

<h3>XII. OBLIGACIONES DE LA CLÍNICA</h3>
<ul>
  <li>Proporcionar atención de la más alta calidad</li>
  <li>Atención con especialistas certificados</li>
  <li>Aplicar descuentos automáticamente</li>
  <li>Programación preferencial de citas</li>
  <li>Mantener sala VIP en condiciones óptimas</li>
  <li>Proporcionar asistente personal de salud dental</li>
  <li>Enviar kits trimestrales puntualmente</li>
  <li>Responder consultas telefónicas en máximo 2 horas</li>
</ul>

<h3>XIII. SUSPENSIÓN</h3>
<p>El servicio se suspende solo en caso de:</p>
<ul>
  <li>Mora superior a 30 días (periodo extendido para miembros Planitium)</li>
  <li>Uso fraudulento comprobado</li>
  <li>Conducta inadecuada grave</li>
</ul>

<p>Proceso de reactivación preferencial dentro de los 60 días posteriores.</p>

<h3>XIV. CANCELACIÓN</h3>
<ul>
  <li>Notificación con 30 días de anticipación</li>
  <li>Derecho a uso de beneficios hasta el último día pagado</li>
  <li>Opción de congelamiento del plan por hasta 3 meses (una vez al año)</li>
  <li>Reactivación sin cargos adicionales dentro de los 6 meses</li>
  <li>Conservación de beneficios de antigüedad si reactiva dentro de 1 año</li>
</ul>

<h3>XV. PROTECCIÓN DEL PLAN</h3>
<p>Beneficios de protección incluidos:</p>
<ul>
  <li>Seguro dental de emergencia en caso de accidente (cobertura hasta S/ 2,000)</li>
  <li>Protección de pagos: 2 meses de gracia en caso de hospitalización</li>
  <li>Continuidad del plan en caso de viaje (cobertura internacional básica)</li>
</ul>

<h3>XVI. EXCLUSIONES</h3>
<p>Exclusiones mínimas (el plan tiene cobertura más amplia):</p>
<ul>
  <li>✗ Tratamientos puramente estéticos sin indicación médica</li>
  <li>✗ Tratamientos experimentales no aprobados</li>
  <li>✗ Medicamentos (aunque sí incluye recetas)</li>
  <li>✗ Tratamientos realizados en otras instituciones</li>
</ul>

<h3>XVII. UPGRADES Y BENEFICIOS ESPECIALES</h3>
<ul>
  <li>Acceso preferencial a nuevas tecnologías (láser, CAD/CAM)</li>
  <li>Prueba gratuita de nuevos tratamientos (como embajador Planitium)</li>
  <li>Invitaciones a eventos de salud dental</li>
  <li>Descuentos en servicios de spa dental</li>
  <li>Partner benefits: descuentos en clínicas asociadas a nivel nacional</li>
</ul>

<h3>XVIII. CONSENTIMIENTO</h3>
<p>El titular declara:</p>
<ul>
  <li>Haber revisado todos los beneficios y exclusiones del Plan Planitium</li>
  <li>Comprender las condiciones de garantías extendidas</li>
  <li>Aceptar el compromiso de pago mensual</li>
  <li>Autorizar el uso de su información para personalización de servicios</li>
  <li>Aceptar recibir comunicaciones sobre beneficios y promociones exclusivas</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Titular Planitium&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma Autorizada LA CLÍNICA</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Cargo: _______________</p>

<p style="text-align: center; margin-top: 30px; color: #666;">
  <strong>Bienvenido a la experiencia Planitium - Su salud dental, nuestra prioridad</strong>
</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contrato_plan_gold',
    nombre: 'Contrato Plan Gold',
    tipo: 'gold',
    descripcion: 'Plan élite con cobertura total y servicios VIP ilimitados para máximo bienestar dental',
    precio: 350,
    duracion: '12 meses',
    contenido: `
<h2>CONTRATO PLAN GOLD - MEMBRESÍA ÉLITE DE SALUD DENTAL</h2>

<p>El presente contrato se celebra entre la Clínica Dental MyDent (en adelante "LA CLÍNICA") y el miembro Gold:</p>

<p><strong>Nombre del Miembro Gold:</strong> _______________________________</p>
<p><strong>DNI:</strong> _______________________________</p>
<p><strong>Fecha de Inicio:</strong> _______________________________</p>
<p><strong>Número de Membresía Gold:</strong> GOLD-__________</p>

<h3>I. DESCRIPCIÓN DEL PLAN</h3>
<p>El Plan Gold representa la membresía más exclusiva y completa en salud dental, diseñada para quienes buscan lo mejor en prevención, tratamiento y experiencia de atención dental. Ofrece cobertura integral sin límites, servicios VIP ilimitados y acceso a tecnología dental de vanguardia.</p>

<h3>II. INVERSIÓN EN SU SALUD DENTAL</h3>
<p>Cuota mensual: S/ 350.00 (Trescientos cincuenta soles)</p>
<p><strong>Opciones de pago con beneficios adicionales:</strong></p>
<ul>
  <li>Mensual: S/ 350.00</li>
  <li>Trimestral: S/ 997.50 (5% de descuento)</li>
  <li>Semestral: S/ 1,890.00 (10% de descuento)</li>
  <li>Anual: S/ 3,570.00 (15% de descuento + kit Gold premium de S/ 500)</li>
</ul>

<h3>III. COBERTURA GOLD - SERVICIOS ILIMITADOS</h3>

<p><strong>✦ SERVICIOS CON COBERTURA 100% ILIMITADA ✦</strong></p>
<ul>
  <li>✓ Limpiezas dentales profesionales ILIMITADAS</li>
  <li>✓ Consultas médicas especializadas ILIMITADAS (todas las especialidades)</li>
  <li>✓ Aplicaciones de flúor y barniz ILIMITADAS</li>
  <li>✓ Radiografías de todo tipo ILIMITADAS (periapical, panorámica, cefalométrica, cone beam)</li>
  <li>✓ Blanqueamientos dentales ILIMITADOS (hasta uno por mes)</li>
  <li>✓ Pulido y profilaxis ILIMITADOS</li>
  <li>✓ Fotografías clínicas y diseño digital de sonrisa ILIMITADO</li>
  <li>✓ Evaluaciones de ortodoncia con simulación 3D ILIMITADAS</li>
  <li>✓ Consultas de segunda y tercera opinión con board de especialistas</li>
  <li>✓ Escaneos intraorales 3D ILIMITADOS</li>
  <li>✓ Análisis de oclusión digital</li>
</ul>

<p><strong>✦ SERVICIOS DE EMERGENCIA 24/7/365 ✦</strong></p>
<ul>
  <li>✓ Atención de emergencia inmediata SIN COSTO (incluye tratamiento completo)</li>
  <li>✓ Línea directa Gold con atención en 15 minutos</li>
  <li>✓ Servicio de ambulancia dental (traslado a clínica si es necesario)</li>
  <li>✓ Atención a domicilio en caso de emergencia (área metropolitana)</li>
  <li>✓ Kit de emergencia dental portátil personalizado</li>
</ul>

<p><strong>✦ DESCUENTOS PREMIUM EN TRATAMIENTOS ✦</strong></p>

<p><u>Descuento del 70% en:</u></p>
<ul>
  <li>◆ Todas las resinas y obturaciones</li>
  <li>◆ Todas las extracciones (simple, compleja, quirúrgica)</li>
  <li>◆ Curaciones y reconstrucciones de todo tipo</li>
  <li>◆ Incrustaciones (Inlay, Onlay, Overlay)</li>
  <li>◆ Carillas de resina y composite</li>
</ul>

<p><u>Descuento del 60% en:</u></p>
<ul>
  <li>◆ Endodoncia completa (todas las piezas, incluye retratamientos)</li>
  <li>◆ Apicectomías</li>
  <li>◆ Tratamientos periodontales profundos</li>
  <li>◆ Cirugías periodontales (injertos, colgajos)</li>
  <li>◆ Extracciones de terceros molares incluidas o impactadas</li>
  <li>◆ Cirugías de tejidos blandos</li>
  <li>◆ Biopsias</li>
</ul>

<p><u>Descuento del 50% en:</u></p>
<ul>
  <li>◆ Coronas de porcelana, zirconio o disilicato de litio</li>
  <li>◆ Puentes fijos (todas las unidades)</li>
  <li>◆ Carillas de porcelana y zirconio</li>
  <li>◆ Prótesis removibles (parciales y totales)</li>
  <li>◆ Prótesis flexibles y valplast</li>
  <li>◆ Prótesis sobre implantes</li>
  <li>◆ Rehabilitación oral completa</li>
</ul>

<p><u>Descuento del 45% en:</u></p>
<ul>
  <li>◆ Tratamiento completo de ortodoncia con brackets</li>
  <li>◆ Ortodoncia estética (brackets de zafiro/cerámica)</li>
  <li>◆ Ortodoncia lingual</li>
  <li>◆ Alineadores invisibles (tratamiento completo)</li>
  <li>◆ Ortodoncia interceptiva (niños)</li>
  <li>◆ Microimplantes ortodóncicos</li>
</ul>

<p><u>Descuento del 40% en:</u></p>
<ul>
  <li>◆ Implantes dentales de todas las marcas premium</li>
  <li>◆ Cirugía de implantes con guía digital</li>
  <li>◆ Injertos óseos (autólogo, xenoinjerto, sintético)</li>
  <li>◆ Elevación de seno maxilar</li>
  <li>◆ Regeneración ósea guiada</li>
  <li>◆ Cirugía maxilofacial</li>
  <li>◆ Cirugía ortognática</li>
  <li>◆ Tratamientos con láser dental (diodo, erbio)</li>
  <li>◆ Plasma rico en factores de crecimiento (PRF)</li>
</ul>

<h3>IV. BENEFICIOS GOLD EXCLUSIVOS - EXPERIENCIA VIP</h3>

<p><strong>⭐ Concierge Dental Personal:</strong></p>
<ul>
  <li>Asistente personal exclusivo para gestión de todas sus citas</li>
  <li>Coordinación de tratamientos complejos con múltiples especialistas</li>
  <li>Recordatorios personalizados vía WhatsApp, email o llamada</li>
  <li>Acompañamiento en todo el proceso de tratamiento</li>
</ul>

<p><strong>⭐ Acceso VIP:</strong></p>
<ul>
  <li>Sala de espera Gold privada con amenidades premium</li>
  <li>Cafetería gourmet complimentaria</li>
  <li>WiFi de alta velocidad dedicado</li>
  <li>Televisión privada con streaming</li>
  <li>Estacionamiento preferencial reservado</li>
  <li>Acceso sin filas ni tiempos de espera</li>
</ul>

<p><strong>⭐ Atención Preferencial:</strong></p>
<ul>
  <li>Citas en horarios exclusivos (incluso fines de semana si lo requiere)</li>
  <li>Sesiones extendidas sin apuros (hasta 2 horas si es necesario)</li>
  <li>Atención con los especialistas más experimentados</li>
  <li>Posibilidad de solicitar al mismo profesional siempre</li>
</ul>

<p><strong>⭐ Tecnología de Vanguardia:</strong></p>
<ul>
  <li>Acceso prioritario a nuevas tecnologías y tratamientos</li>
  <li>Diseño digital de sonrisa con software 3D</li>
  <li>Impresiones digitales (sin moldes incómodos)</li>
  <li>Fabricación CAD/CAM de restauraciones en el día</li>
  <li>Sedación consciente disponible sin costo adicional (si lo requiere)</li>
</ul>

<p><strong>⭐ Regalos y Beneficios Adicionales:</strong></p>
<ul>
  <li>Kit Gold de bienvenida (valor S/ 500): cepillo eléctrico Oral-B, irrigador Waterpik, productos premium</li>
  <li>Kit trimestral Gold (valor S/ 200/trimestre): productos de higiene de marcas internacionales</li>
  <li>Protector bucal deportivo personalizado (si practica deportes)</li>
  <li>Protector nocturno si presenta bruxismo</li>
  <li>Estuche Gold personalizado para prótesis removibles</li>
</ul>

<p><strong>⭐ Programa de Bienestar Integral:</strong></p>
<ul>
  <li>2 sesiones anuales de spa dental (higiene + masaje facial + aromaterapia)</li>
  <li>Evaluación nutricional para salud bucal</li>
  <li>Plan personalizado de prevención con coach de salud dental</li>
  <li>Acceso a webinars exclusivos con especialistas</li>
</ul>

<p><strong>⭐ Red Gold Nacional e Internacional:</strong></p>
<ul>
  <li>Atención preferencial en clínicas afiliadas Gold a nivel nacional</li>
  <li>Cobertura internacional de emergencia (principales ciudades de Latinoamérica)</li>
  <li>Coordinación de tratamientos en el extranjero si lo requiere</li>
</ul>

<h3>V. GARANTÍAS GOLD - LAS MÁS AMPLIAS DEL MERCADO</h3>

<p>Como miembro Gold, sus tratamientos están protegidos con garantías extendidas:</p>

<ul>
  <li><strong>Resinas y obturaciones:</strong> 3 años contra filtración, fractura o desprendimiento</li>
  <li><strong>Endodoncia:</strong> 3 años - retratamiento sin costo si se requiere</li>
  <li><strong>Coronas y puentes:</strong> 5 años en estructura y porcelana</li>
  <li><strong>Carillas:</strong> 5 años contra desprendimiento o fractura</li>
  <li><strong>Implantes dentales:</strong> 10 años en el implante + 5 años en la corona</li>
  <li><strong>Prótesis removibles:</strong> 3 años contra fracturas + ajustes ilimitados</li>
  <li><strong>Ortodoncia:</strong> Garantía de resultados + 2 años de retención incluida</li>
  <li><strong>Blanqueamiento:</strong> 2 años - retoques sin costo</li>
</ul>

<p><strong>Garantía de Satisfacción Gold:</strong> Si no está satisfecho con algún tratamiento, LA CLÍNICA se compromete a corregirlo o mejorarlo sin costo adicional.</p>

<h3>VI. COBERTURA FAMILIAR GOLD</h3>

<p>Beneficio exclusivo para miembros Gold:</p>
<ul>
  <li>El titular puede inscribir hasta 3 dependientes directos por una cuota adicional de S/ 100 por persona</li>
  <li>Los dependientes acceden a:</li>
  <li style="margin-left: 30px;">✓ Todos los servicios preventivos ilimitados (limpiezas, flúor, consultas)</li>
  <li style="margin-left: 30px;">✓ Descuentos del 40% en todos los tratamientos</li>
  <li style="margin-left: 30px;">✓ Acceso a sala VIP</li>
  <li style="margin-left: 30px;">✓ Emergencias 24/7</li>
  <li style="margin-left: 30px;">✓ Kit semestral de higiene</li>
</ul>

<h3>VII. PROGRAMA DE PUNTOS GOLD</h3>

<p>Sistema de recompensas exclusivo:</p>
<ul>
  <li>Acumule 1 punto por cada S/ 10 invertidos en tratamientos</li>
  <li>Bonificación: 100 puntos al inscribirse + 50 puntos en cada aniversario</li>
  <li>Canje de puntos por:</li>
  <li style="margin-left: 30px;">• Servicios adicionales</li>
  <li style="margin-left: 30px;">• Productos de higiene dental premium</li>
  <li style="margin-left: 30px;">• Descuentos en tratamientos futuros</li>
  <li style="margin-left: 30px;">• Donación a fundaciones de salud dental</li>
</ul>

<h3>VIII. BENEFICIOS POR ANTIGÜEDAD GOLD</h3>

<p>Recompensas por lealtad incremental:</p>
<ul>
  <li><strong>Año 2:</strong> +10% descuento adicional en TODOS los servicios + 1 tratamiento de spa dental gratis</li>
  <li><strong>Año 3:</strong> +15% descuento adicional + upgrade a implantes premium sin costo adicional</li>
  <li><strong>Año 4:</strong> +20% descuento adicional + 1 rehabilitación menor sin costo (hasta S/ 1,500)</li>
  <li><strong>Año 5:</strong> +25% descuento adicional + Membresía Gold Lifetime (tarifa congelada de por vida)</li>
  <li><strong>Año 10:</strong> Membresía Gold Platinum Lifetime (50% de cuota mensual de por vida + todos los beneficios)</li>
</ul>

<h3>IX. SEGURO DENTAL GOLD INCLUIDO</h3>

<p>Cobertura de protección sin costo adicional:</p>
<ul>
  <li>Cobertura de emergencias por accidente: hasta S/ 5,000 anuales</li>
  <li>Protección de pagos: hasta 3 meses de gracia en caso de hospitalización o incapacidad</li>
  <li>Cobertura internacional de emergencia: hasta $1,000 USD en caso de emergencia dental en el extranjero</li>
  <li>Seguro de vida para implantes: si un implante falla por cualquier causa, reposición sin costo (durante vigencia de garantía)</li>
</ul>

<h3>X. VIGENCIA Y RENOVACIÓN</h3>

<ul>
  <li>Vigencia inicial: 12 meses</li>
  <li><strong>SIN período de carencia</strong> - Acceso inmediato a TODOS los beneficios desde el día 1</li>
  <li>Renovación automática con incremento máximo del IPC (sin aumentos abusivos)</li>
  <li>Opción de congelar membresía hasta 6 meses al año (por viaje, enfermedad, etc.)</li>
  <li>Transferencia de membresía a familiar directo permitida (con aprobación)</li>
</ul>

<h3>XI. CONDICIONES PREFERENCIALES</h3>

<ul>
  <li>Válido en todas las sedes de LA CLÍNICA a nivel nacional</li>
  <li>Tarjeta Gold personalizada de metal con chip NFC</li>
  <li>App móvil Gold con funciones exclusivas</li>
  <li>Portal web personal con historial completo y fotografías</li>
  <li>Atención telefónica Gold: respuesta en máximo 1 hora</li>
  <li>Cancelación de citas sin penalización (hasta 24 horas antes)</li>
</ul>

<h3>XII. OBLIGACIONES DEL MIEMBRO GOLD</h3>

<ul>
  <li>Realizar pago mensual puntual (o plan elegido)</li>
  <li>Presentar tarjeta Gold en cada visita</li>
  <li>Asistir a evaluaciones preventivas semestrales (para mantener garantías extendidas)</li>
  <li>Notificar cambios en condiciones médicas relevantes</li>
  <li>Seguir plan de tratamiento recomendado por especialistas</li>
  <li>Usar los beneficios con responsabilidad</li>
</ul>

<h3>XIII. COMPROMISOS DE LA CLÍNICA CON MIEMBROS GOLD</h3>

<ul>
  <li>Atención con los mejores especialistas certificados</li>
  <li>Uso de materiales de la más alta calidad (marcas premium internacionales)</li>
  <li>Cumplimiento de tiempos prometidos</li>
  <li>Transparencia total en costos y tratamientos</li>
  <li>Respeto absoluto a la privacidad y confidencialidad</li>
  <li>Mejora continua de servicios y beneficios</li>
  <li>Comunicación proactiva de nuevos tratamientos y tecnologías</li>
</ul>

<h3>XIV. POLÍTICA DE SATISFACCIÓN GARANTIZADA</h3>

<p>Compromiso Gold de excelencia:</p>
<ul>
  <li>Si no está satisfecho con algún servicio, LA CLÍNICA lo corregirá sin costo</li>
  <li>Evaluación de satisfacción después de cada tratamiento</li>
  <li>Línea directa con dirección médica para resolver inquietudes</li>
  <li>Comité de calidad que revisa casos complejos</li>
  <li>Encuestas de satisfacción con incentivos por participación</li>
</ul>

<h3>XV. SUSPENSIÓN (CASOS EXCEPCIONALES)</h3>

<p>El servicio solo se suspende en casos extremos:</p>
<ul>
  <li>Mora superior a 60 días (el doble que otros planes)</li>
  <li>Uso fraudulento comprobado y documentado</li>
  <li>Conducta violenta o amenazante (situación muy excepcional)</li>
</ul>

<p>Antes de suspender, LA CLÍNICA contactará al miembro Gold para encontrar soluciones.</p>

<h3>XVI. CANCELACIÓN</h3>

<ul>
  <li>Notificación con 30 días de anticipación</li>
  <li>Uso de beneficios hasta el último día de cobertura</li>
  <li>Conservación de puntos acumulados por 12 meses</li>
  <li>Opción de congelamiento antes de cancelar (hasta 6 meses)</li>
  <li>Reactivación preferencial sin cargos durante 12 meses</li>
  <li>Conservación de beneficios de antigüedad si reactiva dentro de 24 meses</li>
  <li>Reembolso proporcional en caso de pago anual anticipado (primer año)</li>
</ul>

<h3>XVII. EXCLUSIONES MÍNIMAS</h3>

<p>El Plan Gold tiene las exclusiones más limitadas:</p>
<ul>
  <li>✗ Procedimientos puramente cosméticos sin fundamento médico</li>
  <li>✗ Tratamientos experimentales no aprobados por autoridades de salud</li>
  <li>✗ Medicamentos recetados (aunque sí incluye las recetas y orientación)</li>
  <li>✗ Tratamientos realizados en instituciones externas no afiliadas</li>
  <li>✗ Daños autoinfligidos intencionalmente</li>
</ul>

<h3>XVIII. BENEFICIOS COMUNITARIOS Y RESPONSABILIDAD SOCIAL</h3>

<p>Como miembro Gold, contribuye a:</p>
<ul>
  <li>Programa de donación: LA CLÍNICA dona servicios a comunidades por cada miembro Gold</li>
  <li>Opción de donar puntos a causas de salud dental infantil</li>
  <li>Participación en jornadas de salud comunitaria (voluntario)</li>
  <li>Acceso a eventos de responsabilidad social de LA CLÍNICA</li>
</ul>

<h3>XIX. ACTUALIZACIONES Y MEJORAS</h3>

<ul>
  <li>Los miembros Gold reciben automáticamente nuevos beneficios sin costo adicional</li>
  <li>Notificación anticipada de nuevas tecnologías y tratamientos</li>
  <li>Beta tester de nuevos servicios antes del lanzamiento público</li>
  <li>Voz y voto en encuestas sobre mejoras al plan</li>
</ul>

<h3>XX. PRIVACIDAD Y PROTECCIÓN DE DATOS</h3>

<ul>
  <li>Cumplimiento estricto de Ley de Protección de Datos Personales</li>
  <li>Encriptación de información médica</li>
  <li>Acceso restringido solo a profesionales autorizados</li>
  <li>No compartición de datos con terceros sin consentimiento</li>
  <li>Derecho a solicitar eliminación de datos al cancelar membresía</li>
</ul>

<h3>XXI. CONSENTIMIENTO INFORMADO</h3>

<p>El miembro Gold declara:</p>
<ul>
  <li>Haber revisado y comprendido todos los beneficios, condiciones y exclusiones</li>
  <li>Estar conforme con la inversión mensual y los términos de pago</li>
  <li>Comprender las garantías extendidas y sus condiciones</li>
  <li>Aceptar el uso de información para personalización de servicios</li>
  <li>Autorizar comunicaciones sobre beneficios, promociones y eventos Gold</li>
  <li>Comprometerse al cumplimiento de las obligaciones del plan</li>
  <li>Aceptar que la membresía Gold es un compromiso de excelencia mutua</li>
</ul>

<p><br><br></p>
<p>_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________</p>
<p>Firma del Miembro Gold&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Firma Director General LA CLÍNICA</p>
<p>DNI: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Cargo: Director General</p>

<p style="text-align: center; margin-top: 40px; font-size: 18px; color: #b8860b;">
  <strong>⭐ BIENVENIDO A LA FAMILIA GOLD ⭐</strong><br>
  <span style="font-size: 14px; color: #666;">
    Su sonrisa perfecta es nuestra misión. Gracias por confiar en nosotros.
  </span>
</p>
`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
