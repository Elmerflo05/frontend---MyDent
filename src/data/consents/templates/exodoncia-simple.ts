import type { ConsentTemplate } from '../types';

export const exodonciaSimple: ConsentTemplate = {
  id: 'exodoncia-simple',
  nombre: 'Exodoncia Simple',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA EXODONCIA SIMPLE</h2>

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
            Que el Cirujano Dentista.................................................................. me ha explicado que es conveniente en mi situación realizar la
            extracción de una o más piezas dentarias:
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>1.-</strong> En consecuencia, comprendo que no mantendré esa o esas piezas dentarias y que, únicamente, podrá ser sustituido por una prótesis
            o implante. Que podría recurrir a técnicas conservadoras como la periodoncia o la endodoncia, y las descarto por el estado que presenta, y que no hace
            razonable su conservación.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>2.-</strong> Me ha explicado que el tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar,
            mediante una inyección, sustancias que provocan un bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad con
            el fin de realizar el tratamiento sin dolor. Asimismo, me ha explicado que tendrá la sensación de adormecimiento del labio o de la cara, que normalmente
            van a desaparecer en dos o tres horas. También me explicó que la administración de la anestesia puede provocar, en el punto en el que se administre la
            inyección, ulceración de la mucosa y dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden requerir tratamiento
            ulterior, y que la anestesia puede provocar bajada de tensión que, en casos menos frecuentes, pueden provocar un síncope o fibrilación ventricular, que
            deben tratarse posteriormente, e incluso, excepcionalmente, la muerte. Comprendo que, aunque de mis antecedentes personales no se deduzcan posibles
            alergias o hipersensibilidad al agente anestésico, la anestesia puede provocar urticaria, dermatitis, asma, edema angioneurótico (asfixia), que en casos
            extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>3.-</strong> La intervención consiste en el empleo alternado de instrumental especializado quirúrgico, aplicando fuerza manual, de leve a moderada,
            cuya finalidad es mover y finalmente extraer del alveolo la pieza o piezas dentales problema.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>4.-</strong> Aunque se me han realizado los medios diagnósticos que se han estimado precisos, comprendo que es posible que el estado inflamatorio
            del diente/molar que se me va a extraer pueda producir un proceso infeccioso, que puede requerir tratamiento con antibióticos y/o antiinflamatorios, del
            mismo modo en el curso del procedimiento puede producirse una hemorragia, que exigirá, para cohibirla, la colocación en el alveolo de una torunda de algodón
            seca u otro producto hemostático, incluso sutura. También sé que en el curso del procedimiento pueden producirse, aunque no es frecuente, la rotura de la
            corona, heridas en la mucosa de la mejilla o en la lengua, intrusión de la raíz en el seno maxilar, fractura del maxilar, que no dependen de la forma o
            modo de practicarse la intervención, ni de su correcta realización, sino que son imprevisibles, en cuyo caso el cirujano dentista tomará las medidas
            pertinentes para continuar con el tratamiento.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>5.-</strong> Mi dentista me ha explicado que todo acto quirúrgico lleva implícitas una serie de complicaciones comunes y potencialmente serias
            que podrían requerir tratamientos complementarios tanto médicos como quirúrgicos.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo que se me ha explicado de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han planteado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>,
            para que se me practique el tratamiento de extracción simple.
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
