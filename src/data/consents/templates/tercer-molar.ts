import type { ConsentTemplate } from '../types';

export const tercerMolar: ConsentTemplate = {
  id: 'tercer-molar',
  nombre: 'Tercer Molar',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA EXODONCIA DE LA TERCERA MOLAR</h2>

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
            Que el Cirujano Dentista.................................................................. me ha explicado que es conveniente en mi situación proceder a la
            extracción de un cordal o muela de juicio por los síntomas y signos que manifiesto Entiendo que el objetivo del procedimiento consiste en conseguir
            eliminar los problemas y complicaciones que su mantenimiento en la boca pueda ocasionar.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me ha explicado que el tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar, mediante una inyección,
            sustancias que provocan un bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad con el fin de realizar el
            tratamiento sin dolor. Me ha explicado que tendrá la sensación de adormecimiento del labio o de la cara, que normalmente van a desaparecer en dos o tres horas.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            También me ha explicado que la administración de la anestesia puede provocar, en el punto en el que se administre la inyección, ulceración de la mucosa y
            dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden requerir tratamiento ulterior, y que la anestesia puede
            provocar la baja de la presión arterial que, en casos menos frecuentes, pueden provocar un síncope o fibrilación ventricular, que deben tratarse posteriormente,
            e incluso, excepcionalmente, la muerte.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Comprendo que, aunque de mis antecedentes personales no se deduzcan posibles alergias o hipersensibilidad al agente anestésico, la anestesia puede provocar
            urticarias, dermatitis, asma, edema angioneurótico (asfixia), que en casos extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Aunque se me han practicado los medios diagnósticos que se han estimado necesarios, comprendo que es posible que el estado inflamatorio o la pieza que se me
            va a extraer pueda producir un proceso infeccioso, que puede requerir tratamiento con antibióticos y antiinflamatorios, del mismo modo que en el curso del
            procedimiento puede producirse una hemorragia profusa, que exigirá bloquearse con la colocación en el alveolo de una sustancia coagulante o mediante sutura.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            También sé que en el curso del procedimiento pueden producirse, aunque no es frecuente, la rotura de la corona, laceraciones en la mucosa yugal o en la lengua,
            inserción de la raíz en el seno maxilar, fractura del tabique intrarradicular o de la tuberosidad, que no dependen de la forma o modo de practicarse la intervención,
            ni de su correcta realización, sino que son imprevisibles, en cuyo caso el cirujano dentista tomará las medidas precisas, y continuará con la extracción.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, D/Doña. .................................................................................................. (nombre y apellidos, a mano, o pegatina del centro
            sanitario) <strong>COMO PACIENTE</strong> (o su representante legal), en pleno uso de mis facultades, libre y voluntariamente, DECLARO que he sido debidamente,
            INFORMADO/A, por el cirujano abajo firmante, y en consecuencia, le AUTORIZO junto con sus colaboradores, para que me sea realizado el procedimiento
            diagnóstico/terapéutico denominado..................................................................................................
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            En ocasiones excepcionales, durante la cirugía pueden surgir situaciones imprevistas que obliguen al cirujano a realizar algún procedimiento adicional o distinto
            al planificado. En ese caso, autorizo al cirujano a tomar las decisiones que crea más justificadas y convenientes para mi salud.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Este consentimiento puede ser revocado discrecionalmente por mí, sin necesidad de justificación alguna, en cualquier momento antes de realizar el procedimiento.
            Observaciones..................................................................................................
            ..................................................................................................
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Y, para que así conste, firmo el presente original después de leído, por duplicado, cuya copia se me proporciona.
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
              <p>El Cirujano Dentista</p>
              <p>COP ..................</p>
            </div>
          </div>
        </div>
      `,
  ultimaActualizacion: new Date()
};
