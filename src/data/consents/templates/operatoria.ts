import type { ConsentTemplate } from '../types';

export const operatoria: ConsentTemplate = {
  id: 'operatoria',
  nombre: 'Operatoria',
  categoria: 'Tratamiento',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA OBTURACIONES</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo .................................................................................................. (como paciente), con DNI No. ..............................,
            mayor de edad, y con domicilio en .................................................................................................. o Yo
            .................................................................................................. con DNI No. ............., mayor de edad, y con domicilio
            en .................................................................................................. en calidad de representante legal de
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>DECLARO</strong>
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Que el Cirujano Dentista.................................................................. me ha explicado que es conveniente en mi situación proceder a realizar
            una obturación o empaste a un diente o molar, dándome la siguiente información:
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>1.-</strong> El propósito principal de la intervención es restaurar los tejidos dentarios duros y proteger la pulpa, para conservar el diente/molar
            y su función, restableciendo al momento la forma y estética adecuada.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>2.-</strong> Me ha explicado que el tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar,
            mediante una inyección, sustancias que proveen un bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad con el
            fin de realizar el tratamiento sin dolor. Me ha explicado que tendrá la sensación de adormecimiento del labio o de la cara, que normalmente van a
            desaparecer en dos o tres horas. También me ha explicado que la administración de la anestesia puede provocar, en el punto en el que se administre la
            inyección, ulceración de la mucosa y dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden requerir tratamiento
            ulterior, y que la anestesia puede provocar la baja de presión arterial que, en casos menos frecuentes, pueden provocar un síncope o fibrilación ventricular,
            que deben tratarse posteriormente, e incluso, excepcionalmente, la muerte. Comprendo que, aunque de mis antecedentes personales no se deduzcan posibles
            alergias o hipersensibilidad al agente anestésico, la anestesia puede provocar urticaria, dermatitis, asma, edema angioneurótico (asfixia), que en casos
            extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>3.-</strong> La intervención consiste en eliminar de la cavidad el tejido cariado y rellenarla posteriormente con materiales plásticos adhesivos
            para lograr que se consolide, en este momento, conservando la integridad de la pieza dental.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>4.-</strong> Mi dentista me ha advertido que es frecuente que se produzca una mayor sensibilidad, sobre todo al frío, que normalmente desaparecerá
            de modo espontáneo. También me ha recomendado que vuelva a la consulta lo más pronto posible, si advierto signos de movilidad o alteraciones de la oclusión
            (mordida), pues en ese caso sería preciso ajustarla, para aliviar el dolor y para impedir la formación de una enfermedad periodontal y/o trauma.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Comprendo que la obturación puede reactivar procesos infecciosos que hagan necesaria la endodoncia y que, especialmente si la caries es profunda, el
            diente/molar quedará frágil y podrá ser necesario llevar a cabo otro tipo de reconstrucción o colocar una corona protésica. También comprendo que es posible
            que no me encuentre satisfecho con la forma y el color del diente tras el tratamiento, porque las cualidades de las restauraciones directas nunca serán
            idénticas a su aspecto de diente sano.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo que se me ha explicado de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han planteado, y la
            información complementaria que le he solicitado. Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este
            consentimiento. Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>,
            para que se me practique el tratamiento de obturación.
          </p>

          <p style="margin-bottom: 50px;">
            En Lima, a ..........................de .....................................................de.......................
          </p>

          <div style="display: flex; justify-content: space-between; margin-top: 60px;">
            <div style="text-align: left;">
              <p>El Paciente o</p>
              <p>Representante Legal</p>
            </div>
            <div style="text-align: right;">
              <p>El Odontólogo / Estomatólogo</p>
              <p>COP ..................</p>
            </div>
          </div>
        </div>
      `,
  ultimaActualizacion: new Date()
};
