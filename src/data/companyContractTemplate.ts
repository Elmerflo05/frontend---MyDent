export const mydentContractTemplate = {
  nombre: 'Convenio Marco Interinstitucional MYDENT',
  descripcion: 'Convenio marco para prestación de servicios odontológicos a empresas',
  nombreEmpresa: '', // Se llenará al crear un nuevo contrato
  ruc: '', // Se llenará al crear un nuevo contrato
  contenido: `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">

  <h1 style="text-align: center; color: #1e3a8a; font-size: 24px; margin-bottom: 30px; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px;">
    CONVENIO MARCO INTERINSTITUCIONAL ENTRE MYDENT Y [NOMBRE EMPRESA]
  </h1>

  <p style="text-align: justify; margin-bottom: 20px;">
    Conste por el presente documento, el convenio que celebran de una parte <strong>LA EMPRESA MYDENT</strong>, con RUC N° <strong>[RUC MYDENT]</strong>, con domicilio fiscal en <strong>[DOMICILIO MYDENT]</strong>, representado por su Gerente General <strong>[NOMBRE GERENTE]</strong>, identificado con DNI N° <strong>[DNI GERENTE]</strong>, a quien en adelante se le denominará <strong>LA EMPRESA PRESTADORA DE SERVICIO DE ODONTOLOGÍA</strong> y la otra parte <strong>[NOMBRE EMPRESA CLIENTE]</strong>, a quien en adelante se le denominará <strong>[TIPO EMPRESA]</strong>; con RUC N° <strong>[RUC EMPRESA]</strong> representado por <strong>[REPRESENTANTE LEGAL]</strong>, designado mediante Resolución <strong>[N° RESOLUCIÓN]</strong>, identificado con Documento Nacional de Identidad N° <strong>[DNI REPRESENTANTE]</strong>, con domicilio legal en <strong>[DOMICILIO EMPRESA]</strong>; a quien en adelante se denominará <strong>EMPRESA USUARIA</strong> en los términos y condiciones siguientes:
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA PRIMERA: DE LAS PARTES
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    <strong>Mydent</strong> es una empresa dedicada a la prestación de servicio de salud en la especialidad de odontología.
  </p>
  <p style="text-align: justify; margin-bottom: 15px;">
    La empresa <strong>[NOMBRE EMPRESA]</strong>, es <strong>[DESCRIPCIÓN EMPRESA]</strong>, que cuenta con trabajadores sujetos a un régimen laboral privado.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA SEGUNDA: DE LA BASE LEGAL
  </h2>
  <ul style="margin-left: 20px; margin-bottom: 15px;">
    <li>Constitución Política del Perú</li>
    <li>Ley General de Salud</li>
    <li>Código Civil</li>
  </ul>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA TERCERA: DE LA NATURALEZA DEL CONVENIO
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    El presente Convenio es de naturaleza prestacional de colaboración interempresarial entre entidades de carácter privada que se regirán exclusivamente por normas del derecho privado.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA CUARTA: DEL OBJETO
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    El objeto del presente convenio consiste en la prestación del servicio de salud en la especialidad de odontología de manera preferencial a los trabajadores con vínculo laboral de la empresa <strong>[NOMBRE EMPRESA]</strong> con un descuento del <strong>[PORCENTAJE]%</strong> de la tarifa vigente propuesto en el Anexo 01, que forma parte del presente convenio, para ser pagado mediante liquidación mensual de descuento por planilla.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA QUINTA: DEL COMPROMISO DE LAS PARTES
  </h2>
  <p style="margin-bottom: 10px;"><strong>Obligaciones de Mydent:</strong></p>
  <ul style="margin-left: 20px; margin-bottom: 15px;">
    <li>Brindar el servicio de odontología con la diligencia ordinaria respectiva a los trabajadores de la empresa <strong>[NOMBRE EMPRESA]</strong></li>
    <li>Garantizar que el servicio que se presta sea brindado cumpliendo con las normas técnicas de seguridad e higiene</li>
    <li>Comunicar a la empresa, cualquier variación de los costos del servicio, con anterioridad a la prestación</li>
    <li>No variar el costo del servicio, sin previo aviso a la empresa</li>
  </ul>

  <p style="margin-bottom: 10px;"><strong>Obligaciones de la empresa [NOMBRE EMPRESA]:</strong></p>
  <ul style="margin-left: 20px; margin-bottom: 15px;">
    <li>Enviar la planilla de trabajadores beneficiarios y sus derechohabientes en caso se incluya en el presente contrato</li>
    <li>Realizar el descuento por planilla de los trabajadores que han hecho uso del servicio de odontología en la empresa Mydent y hacer el depósito respectivo como máximo a los cinco días posteriores del próximo mes al descuento</li>
    <li>Remitir el reporte de la relación de los trabajadores y el monto descontado de acuerdo a la liquidación presentada por Mydent</li>
  </ul>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA SEXTA: DEL FINANCIAMIENTO
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    La prestación del servicio será a todo costo de la empresa Mydent, sin embargo, cualquier costo por concepto que no esté incluida en las tarifas comunicadas a la empresa <strong>[NOMBRE EMPRESA]</strong> será previo acuerdo de las partes que serán suscritas en formatos según el anexo 02.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA SÉPTIMA: VIGENCIA DEL CONVENIO
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    La vigencia del presente convenio es de naturaleza indefinida que comenzará a regir a partir de la suscripción de ambas partes; sin embargo, cualquiera de las partes podrá dar por finalizado el presente convenio, previa comunicación notarial con una antelación de 30 días calendario.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA OCTAVA: EXCLUSIÓN DE RESPONSABILIDADES
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    Cualquier tema sobre responsabilidad civil se regirá por las normas del código civil.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA NOVENA: DE LAS MODIFICACIONES
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    LAS PARTES, de común acuerdo, podrán revisar los alcances del Convenio y efectuar los ajustes, modificaciones y/o ampliaciones de los términos que consideren convenientes, los que constarán en las adendas u otro convenio correspondiente, las cuales formarán parte integrante del presente documento.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA DÉCIMA: RESOLUCIÓN DEL CONVENIO
  </h2>
  <p style="margin-bottom: 10px;">El presente Convenio podrá resolverse:</p>
  <ul style="margin-left: 20px; margin-bottom: 15px;">
    <li>Por acuerdo entre LAS PARTES, el que deberá constar por escrito</li>
    <li>Por caso fortuito o fuerza mayor, debidamente comprobado, que imposibilite su cumplimiento</li>
    <li>Por incumplimiento injustificado de cualquiera de las obligaciones asumidas por las partes en el presente Convenio, que no hubiera sido solucionado en el término de cinco (05) días hábiles contados a partir de su intimación</li>
  </ul>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA DÉCIMA PRIMERA: SOLUCIÓN DE CONTROVERSIAS
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    En esta cláusula las partes manifiestan su voluntad de solucionar las controversias que pudieran surgir en la ejecución del Convenio, mediante el trato directo y la buena fe de las partes.
  </p>
  <p style="text-align: justify; margin-bottom: 15px;">
    LAS PARTES acuerdan expresamente que en caso de surgir discrepancias estas serán solucionadas de manera coordinada en conferencias conjuntas, brindando sus mayores esfuerzos para lograr soluciones armoniosas, sobre la base de los principios de la buena fe y reciprocidad que inspiran el presente instrumento.
  </p>
  <p style="text-align: justify; margin-bottom: 15px;">
    En caso de persistir el desacuerdo se resolverá mediante conciliación y/o arbitraje.
  </p>

  <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1e3a8a; padding-left: 10px;">
    CLÁUSULA DÉCIMA TERCERA: DEL DOMICILIO DE LAS PARTES
  </h2>
  <p style="text-align: justify; margin-bottom: 15px;">
    LAS PARTES señalan como su domicilio legal las direcciones que figuran en la introducción del presente Convenio, lugar donde se les cursará la documentación y modificaciones que se deriven de la ejecución del mismo. Los cambios domiciliarios que pudieran ocurrir, serán comunicados por escrito al domicilio legal de la otra parte con tres (03) días hábiles de anticipación; caso contrario, toda comunicación o notificación al domicilio consignado en la introducción del presente Convenio surtirá todos sus efectos legales.
  </p>
  <p style="text-align: justify; margin-bottom: 30px;">
    En señal de conformidad de todo lo expresado, LAS PARTES firman este Convenio en dos (02) originales de igual valor, como evidencia de su aceptación y acuerdo, en la ciudad de <strong>[CIUDAD]</strong>, a los <strong>[DÍA]</strong> días del mes de <strong>[MES]</strong> de <strong>[AÑO]</strong>.
  </p>

  <div style="page-break-before: always; margin-top: 50px;">
    <h2 style="text-align: center; color: #1e3a8a; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">
      ANEXO 1 - TARIFARIO DE SERVICIOS ODONTOLÓGICOS
    </h2>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
      <thead>
        <tr style="background-color: #1e3a8a; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descripción o SubProcedimientos</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Condición Según Odontograma</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Precio Regular (S/)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Primera consulta</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Control</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Medicación</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES CON COMPROMISO PULPAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Pulpitis aguda</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES CON COMPROMISO PULPAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Gangrena y necrosis</td><td style="border: 1px solid #ddd; padding: 8px;">PERIODONTITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Alveolitis y hemorragias post-exodoncia</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">G.U.N.A. o P.U.N.A.</td><td style="border: 1px solid #ddd; padding: 8px;">GINGIVITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">80.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Traumatismos dental con fractura amelodentinaria</td><td style="border: 1px solid #ddd; padding: 8px;">FRACTURA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Traumatismos dent. con exposición pulpar</td><td style="border: 1px solid #ddd; padding: 8px;">FRACTURA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Traumatismos dent. con luxación o avulsión</td><td style="border: 1px solid #ddd; padding: 8px;">FRACTURA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Prótesis fijas descementadas</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">80.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Reconstrucción de ángulo</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES DE LA DENTINA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">150.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Restauración estética simple</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES DEL ESMALTE</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">70.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Restauración estética compuesta</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES DE LA DENTINA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">130.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Restauración estética compleja</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES DE LA DENTINA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">150.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Tartrectomía supragingival, cepill. mecánico</td><td style="border: 1px solid #ddd; padding: 8px;">GINGIVITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">60.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Topicación de flúor</td><td style="border: 1px solid #ddd; padding: 8px;">MANCHA BLANCA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Inactivación de policaries activas</td><td style="border: 1px solid #ddd; padding: 8px;">FLUOROSIS DENTAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Educación para la salud (fisiot. oral, nutric.)</td><td style="border: 1px solid #ddd; padding: 8px;">FLUOROSIS DENTAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">40.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Sellantes de puntos y fisuras</td><td style="border: 1px solid #ddd; padding: 8px;">SELLANTES</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">40.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Inactivación de caries incipientes</td><td style="border: 1px solid #ddd; padding: 8px;">CARIES DEL ESMALTE</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">40.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Incrustación Metálica</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">350.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Incrustación Resina fotocurado</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">350.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Incrustación Porcelana</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">800.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Perno fibra de vidrio</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Perno fibra de vidrio indirecto</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Perno compuesto (secc. o pasante) indirecto</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Perno preformado simple</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Perno preformado compuesto (doble)</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Reconstrucción muñón sin perno (build up)</td><td style="border: 1px solid #ddd; padding: 8px;">ESPIGO-MUÑÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Corona provisoria de acrílico</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Extracción de corona</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">80.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Extracción de perno</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">80.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">P.P.R. Acrílico wipla provisional</td><td style="border: 1px solid #ddd; padding: 8px;">PPR MAL ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">550.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">P.P.R. Acrílico de 5 dientes o más</td><td style="border: 1px solid #ddd; padding: 8px;">PPR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">P.P.R. Flexible</td><td style="border: 1px solid #ddd; padding: 8px;">PPR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">P.P.R. Cromo Cobalto - de 5 dientes</td><td style="border: 1px solid #ddd; padding: 8px;">PPR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">P.P.R. Cromo Cobalto de 5 dientes o más</td><td style="border: 1px solid #ddd; padding: 8px;">PPR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Prótesis Completa Acrílico</td><td style="border: 1px solid #ddd; padding: 8px;">PRÓTESIS TOTAL BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Prótesis Completa Nylon (flexibles)</td><td style="border: 1px solid #ddd; padding: 8px;">PRÓTESIS TOTAL BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,600.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Prótesis Completa Acrílico con base cromo cobalto</td><td style="border: 1px solid #ddd; padding: 8px;">PRÓTESIS TOTAL BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,600.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Reparación simple</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Rebasado Prótesis Completa autocurado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Rebasado Prótesis Completa termocurado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">350.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Rebasado P.P.R. autocurado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Mantenedor de espacio simple</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Mantenedor de espacio complejo</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Reducción de luxación con inmov. dentaria</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Historia clínica periodontal</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Tratamiento supragingival, por maxilar</td><td style="border: 1px solid #ddd; padding: 8px;">GINGIVITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Tratamiento subgingival, por sector</td><td style="border: 1px solid #ddd; padding: 8px;">GINGIVITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Cirugía periodontal, por sector</td><td style="border: 1px solid #ddd; padding: 8px;">PERIODONTITIS</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Desgaste selectivo, por sesión</td><td style="border: 1px solid #ddd; padding: 8px;">DESGASTE OCLUSAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Exodoncia simple</td><td style="border: 1px solid #ddd; padding: 8px;">REMANENTE RADICULAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">60.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Plástica de comunicación buco-sinusal</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Biopsia por punción o aspiración</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">150.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Exodoncia compleja</td><td style="border: 1px solid #ddd; padding: 8px;">IMPACTACIÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Reimplante dentario inmed. al traumatismo</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Incisión y drenaje de abscesos vía bucal</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Biopsia por escisión</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Alargamiento quirúrg. de la corona clínica</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Cirugía retención dentaria mucosa</td><td style="border: 1px solid #ddd; padding: 8px;">IMPACTACIÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Cirugía retención dentaria ósea</td><td style="border: 1px solid #ddd; padding: 8px;">IMPACTACIÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Germectomía</td><td style="border: 1px solid #ddd; padding: 8px;">IMPACTACIÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Liberación de dientes retenidos</td><td style="border: 1px solid #ddd; padding: 8px;">IMPACTACIÓN</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Apicectomía</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Endodoncia 1 conducto</td><td style="border: 1px solid #ddd; padding: 8px;">TRATAMIENTO PULPAR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Endodoncia 2 conductos</td><td style="border: 1px solid #ddd; padding: 8px;">TRATAMIENTO PULPAR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Endodoncia 3 conductos</td><td style="border: 1px solid #ddd; padding: 8px;">TRATAMIENTO PULPAR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Endodoncia 4 conductos</td><td style="border: 1px solid #ddd; padding: 8px;">TRATAMIENTO PULPAR BUEN ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Retratamiento endodoncia</td><td style="border: 1px solid #ddd; padding: 8px;">TRATAMIENTO PULPAR MAL ESTADO</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Exodoncia de remanente radicular por pieza</td><td style="border: 1px solid #ddd; padding: 8px;">REMANENTE RADICULAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Exodoncia múltiples de remanente radicular 2-4 PZA</td><td style="border: 1px solid #ddd; padding: 8px;">REMANENTE RADICULAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">180.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Exodoncia múltiples (2-4 piezas) P/PERD. SOPORTE SEV</td><td style="border: 1px solid #ddd; padding: 8px;">REMANENTE RADICULAR</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Férula (tomográfica-quirúrgica) Clin-lab</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Férula oclusal de protección (incluye 3 controles)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Ferulización dentaria con resina por 3 piezas</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Ferulización dentaria con resina por pieza</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">60.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Ferulización dentaria con resina por sextante</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Gingivoplastia por pieza</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">60.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Gingivoplastia por sextante</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Injerto de mentón</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Injerto de tejido conectivo</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Ionómero autocurado</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Ionómero fotocurado</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Injerto Autólogo de Mandíbula</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">800.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Mantenimiento de implantes no incl. aditamentos ni RX</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Obturación temporal</td><td style="border: 1px solid #ddd; padding: 8px;">RESTAURACIÓN TEMPORAL</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Provisional autocurado sobre implantes</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">80.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Rebasado de prótesis con acond. de tejido</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Rebasado de prótesis con acrílico termocurado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Jeringa para aclaramiento (Unidad)</td><td style="border: 1px solid #ddd; padding: 8px;">DECOLORACIÓN DE ESMALTE</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Laserterapia por sesión</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">450.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Microabrasión (por pieza)</td><td style="border: 1px solid #ddd; padding: 8px;">MANCHA BLANCA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Microabrasión (por cuadrante)</td><td style="border: 1px solid #ddd; padding: 8px;">MANCHA BLANCA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Remodelado gingival con electrobisturí por pieza</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">70.00</td></tr>
      </tbody>
    </table>
  </div>

  <div style="page-break-before: always; margin-top: 50px;">
    <h2 style="text-align: center; color: #1e3a8a; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">
      ANEXO 2 - TARIFARIO DE ORTODONCIA E IMPLANTES
    </h2>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
      <thead>
        <tr style="background-color: #1e3a8a; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descripción</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Condición</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Precio (S/)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Aparato de contención (SUP-INF)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Guía de erupción</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">350.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Mantenedor de espacio</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Modelos de estudio</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Aparatología fija (inicial) metálicos</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Arco extraoral</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">400.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Arco lingual</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Arco transpalatal o ATP</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Banda</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Aparato ortopedia</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Botón adhesivo</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Control de brackets 1</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">150.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Control de Brackets 2</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">180.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Control de Brackets 3</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">220.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Brackets Autoligantes inicial</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Repegado brackets</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">50.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Inicial Brackets Zafiro</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Control de Brackets 4</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Campaña de Trat.Orto 12 meses</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">3,500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Campaña de Trat.Orto 18 meses</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">4,000.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Campaña de Trat.Orto 24 meses</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">5,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Campaña de Trat.Orto 30 meses</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">5,500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Miniimplantes c/u</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Casquete de interlandi</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Contención fija</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Control de ortodoncia</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Control de ortodoncia interceptivas</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">100.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Placas de contención inferior</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Placas de contención superior</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">250.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Retiro de brackets (2 arcadas)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Escaneado más impresión de modelos contención c/u</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Tratamiento Ortoquirúrgico</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">8,000.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Trat.Orto preventiva e interceptiva A</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">3,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Trat.Orto preventiva e interceptiva B</td><td style="border: 1px solid #ddd; padding: 8px;">POSICIÓN DENTARIA ALTERADA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">2,500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">0,5 CC hueso liofilizado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">300.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">1 Póntico</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">750.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Implante dental</td><td style="border: 1px solid #ddd; padding: 8px;">IMPLANTE</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">2,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">1.0 CC hueso liofilizado</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Aumento de reborde (c/injerto óseo en bloque)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">800.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Aumento de reborde (c/injerto de tej blando)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Carilla de resina (Inc.Laboratorio)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">750.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Carilla de E-max</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,200.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Carillas de porcelana (Inc-Laboratorio)</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Carilla de resina</td><td style="border: 1px solid #ddd; padding: 8px;">-</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">600.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Corona Sobre implantes</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">2,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Corona inceran (Inc-Laboratorio)</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,000.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Corona Jacket de acrílico termocurada(Inc-Laboratorio)</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Corona metal free CEREC pilar zircon CADCAM s/Imp</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">3,000.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Corona Provisional con Ucla de Titanio para HE / H</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">500.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Corona s/implante cement.(CONEXAO NEODENT) car inm</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">2,000.00</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;">Corona s/implante cement.(CONEXAO NEODENT) car.dif</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">2,000.00</td></tr>
        <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 8px;">Corona- E max (Disilicato de litio) (NO lab)</td><td style="border: 1px solid #ddd; padding: 8px;">CORONA DEFINITIVA</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1,200.00</td></tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top: 60px; padding-top: 40px; border-top: 2px solid #ddd;">
    <div style="display: flex; justify-content: space-around; text-align: center;">
      <div style="width: 40%;">
        <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px;">
          <strong>MYDENT</strong><br>
          Gerente General<br>
          DNI: [DNI GERENTE]
        </div>
      </div>
      <div style="width: 40%;">
        <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px;">
          <strong>[NOMBRE EMPRESA]</strong><br>
          Representante Legal<br>
          DNI: [DNI REPRESENTANTE]
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  activo: true
};
