import type { ConsentTemplate } from '../types';

export const caninosRetenidos: ConsentTemplate = {
  id: 'caninos-retenidos',
  nombre: 'Caninos Retenidos',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA REALIZACIÓN DE EXODONCIA DE CANINOS INCLUÍDOS O RETENIDOS</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo .................................................................................................. (como paciente), con DNI No. ..............................,
            mayor de edad, y con domicilio en .................................................................................................. o Yo
            .................................................................................................. con DNI No. ............., mayor de edad, y con domicilio
            en .................................................................................................. en calidad de representante legal de
            .................................................................................................. <strong>DECLARO</strong> Que el Odontólogo/Estomatólogo
            me ha explicado que es conveniente en mi situación proceder a la extracción de un canino o colmillo incluido dentro del maxilar, En consecuencia,
            comprendo que no mantendré ese diente y que, únicamente, podrá ser sustituido por una prótesis. Así mismo me han informado que:
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>1.-</strong> El propósito principal de la intervención es evitar que la evolución derive en un quiste folicular o en desarrollar un ameloblastoma
            u otro tumor o daño en otros dientes.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>2.-</strong> Me ha explicado que el tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar,
            mediante una inyección, sustancias que proveen un bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad
            con el fin de realizar el tratamiento sin dolor. Me ha explicado que tendrá la sensación de adormecimiento del labio o de la cara, que normalmente
            van a desaparecer en dos o tres horas. También me ha explicado que la administración de la anestesia puede provocar, en el punto en el que se
            administre la inyección, ulceración de la mucosa y dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden
            requerir tratamiento ulterior, y que la anestesia puede provocar bajada de tensión que, en casos menos frecuentes, pueden provocar un síncope o
            fibrilación ventricular, que deben tratarse posteriormente, e incluso, excepcionalmente, la muerte. Comprendo que, aunque de mis antecedentes
            personales no se deduzcan posibles alergias o hipersensibilidad al agente anestésico, la anestesia puede provocar urticarias, dermatitis, asma,
            edema angioneurótico, que en casos extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>3.-</strong> La intervención consiste en la realización de una incisión en la mucosa, posterior despegamiento y eliminación del hueso que
            cubre el canino, para que de esta manera se pueda, con instrumental apropiado, eliminarló.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            <strong>4.-</strong> Aunque se me han realizado los medios diagnósticos que se han estimado precisos, comprendo que es posible que el estado del
            diente que se me va a extraer pueda producir un proceso infeccioso, que puede requerir tratamiento con antibióticos y/o antiinflamatorios, del mismo
            modo que en el curso del procedimiento puede producirse una hemorragia, que exigirá, para cohibirla, la colocación en el alveolo de una sustancia
            coagulante; también sé que en el curso del procedimiento pueden producirse, aunque no es frecuente, la rotura de la corona laceraciones en la mucosa
            de la mejilla, en el labio o en la lengua, o inserción de la raíz en el seno maxilar, que no dependen de la forma o modo de practicarse la intervención,
            ni de su correcta realización, sino que son imprevisibles, en cuyo caso el facultativo tomará las medidas precisas para continuar con la extracción.
            Se me informa también que, aunque no es frecuente, puede producirse luxación de la articulación de la mandíbula, en cuyo caso deberé recibir el
            tratamiento preciso con un especialista en esa materia y ser revisado para control de este proceso.
          </p>

          <p style="text-align: justify; margin-bottom: 10px;">
            Menos grave resultan las complicaciones infecciosas locales, celulitis, trismo, estomatitis, que suelen poder controlarse farmacológicamente, pero
            que pueden precisar tratamiento quirúrgico posterior.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            <strong>5.-</strong> El Dentista me ha explicado que todo acto quirúrgico lleva implícitas una serie de complicaciones comunes y potencialmente
            serias que podrían requerir tratamientos complementarios tanto médicos como quirúrgicos. He comprendido lo que se me ha explicado por el facultativo
            de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han planteado, y la información complementaria que le he
            solicitado. Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento. Estoy satisfecho
            con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>, para que se
            me practique el tratamiento de caninos incluidos.
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
