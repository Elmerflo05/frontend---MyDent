import type { ConsentTemplate } from '../types';

export const cirugiaOcular: ConsentTemplate = {
  id: 'cirugia-ocular',
  nombre: 'Cirugía Ocular',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA REALIZACIÓN DE CIRUGÍA OCULAR</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo .................................................................................................. (como paciente), con DNI No. ..............................,
            mayor de edad, y con domicilio en .................................................................................................. o Yo
            .................................................................................................. con DNI No. ............., mayor de edad, y con domicilio
            en .................................................................................................. en calidad de representante legal de
            .................................................................................................. <strong>DECLARO</strong> Que el Cirujano-Dentista me ha explicado
            que es conveniente en mi situación proceder a realizar cirugía periapical a un diente, dándome la siguiente información:
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>1.-</strong> El propósito principal de la intervención es eliminar lesiones, quistes o tumores en la región ocular o periocular que puedan comprometer la visión o la función del ojo.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>2.-</strong> Me ha explicado que el tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar,
            mediante una inyección, sustancias que proveen un bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad
            con el fin de realizar el tratamiento sin dolor. Me ha explicado que tendrá la sensación de adormecimiento del labio o de la encía, que normalmente
            van a desaparecer en unas 2 o 3 horas. También me ha explicado que la administración de la anestesia puede provocar, en el punto en el que se
            administre la inyección, ulceración de la mucosa y dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden
            requerir tratamiento ulterior, y que la anestesia puede provocar bajada de tensión que, en casos menos frecuentes, pueden provocar un síncope o
            fibrilación ventricular, que deben tratarse posteriormente, e incluso, excepcionalmente, la muerte. Comprendo que, aunque de mis antecedentes
            personales no se deduzcan posibles alergias o hipersensibilidad al agente anestésico, la anestesia puede provocar urticaria, dermatitis, asma,
            edema angioneurótico (asfixia), que en casos extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>3.-</strong> La intervención consiste en la incisión a nivel de la mucosa, eliminación de la lesión ocular o periocular, y posterior sutura.
            El procedimiento puede incluir la extirpación de quistes, tumores benignos o malignos, o la corrección de alteraciones en los tejidos blandos alrededor del ojo.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>4.-</strong> Aunque se me han realizado los medios diagnósticos que se han estimado precisos, comprendo que pueden producirse procesos
            edematosos, inflamación, dolor, sangrado o hematomas en la región ocular o periocular, o en el área intervenida. Aunque la intención es practicar
            la intervención, ni de su correcta realización, sino que son imprevisibles, en cuyo caso si el facultativo tomará las medidas precisas y continuar
            el procedimiento. También se ha explicado que, aunque con menos frecuencia y con independencia de la técnica empleada en el procedimiento y de su
            correcta realización, puede resultar lesionado el nervio óptico o estructuras oculares, lo que implica pérdida parcial o total de la visión. Asimismo,
            existe también la posibilidad excepcional, e independiente de la técnica empleada y su correcta realización, de lesionar el globo ocular y provocar
            una situación que deba solucionarse por cirugía oftalmológica especializada o requerir tratamiento complementario.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            <strong>5.-</strong> El Dentista me ha explicado que todo acto quirúrgico lleva implícitas una serie de complicaciones comunes y potencialmente
            serias que podrían requerir tratamientos complementarios tanto médicos como quirúrgicos, y que por mi situación actual pueden aumentar las complicaciones.
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">

          <p style="text-align: justify; margin-bottom: 30px;">
            He comprendido lo que se me ha explicado por el facultativo de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me
            han planteado, y la información complementaria que le he solicitado. Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna
            explicación, puedo revocar este consentimiento. Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento,
            y en por ello, <strong>DOY MI CONSENTIMIENTO</strong> para que me practique el tratamiento de cirugía ocular.
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
              <p>Cirujano-Dentista</p>
              <p>COP ..................</p>
            </div>
          </div>
        </div>
      `,
  ultimaActualizacion: new Date()
};
