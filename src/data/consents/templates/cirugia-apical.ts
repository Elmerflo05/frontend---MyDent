import type { ConsentTemplate } from '../types';

export const cirugiaApical: ConsentTemplate = {
  id: 'cirugia-apical',
  nombre: 'Cirugía Apical',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA REALIZACIÓN DE LA CIRUGÍA PERIAPICAL Y APICECTOMÍA</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, .................................................................................................. <strong>COMO PACIENTE</strong>, en pleno uso de mis facultades,
            libre y voluntariamente, DECLARO que he sido debidamente INFORMADO/A, por el cirujano abajo firmante, y en consecuencia, le AUTORIZO junto con sus
            colaboradores, para que me sea realizado el procedimiento denominado..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me doy por enterado/a de los siguientes puntos relativos a dicho procedimiento:
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            La cirugía oral se hace necesaria para el tratamiento de muy diversas problemas y patologías de la cavidad oral.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Entre dichas patologías se encuentran las lesiones periapicales y de los ápices (raíces) radiculares de los diversos dientes, para cuyo correcto tratamiento
            se hace necesaria la cirugía periapical.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Como consecuencia de una caries, patología dental o un traumatismo dental se puede producir una necrosis de la pulpa, seguida de una infección crónica
            en la región apical o periapical de su raíz, que con el tiempo desarrolla un proceso destructivo y, por ello, DOY MI CONSENTIMIENTO para que se me practique
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            El paso inicial para tratamiento de estas lesiones suele ser la endodoncia (matar el nervio) del diente afectado y, en caso de fracaso de la misma,
            no resolución completa de la lesión o gran tamaño de la misma, se realiza la apicectomía de todas las raíces afectadas.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            La apicectomía es la extirpación del extremo final de una raíz dental, con limpieza de la cavidad residual y obturación y sellado de las condiciones
            radiculares cuando es necesario para su curación en mi boca, siendo en casos excepcionales.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He sido informado y entiendo que la realización de esta intervención NO GARANTIZA la permanencia de la pieza dental en cuestión en mi boca, siendo
            en ocasiones necesaria la extracción de la misma.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            En casos indicados es necesaria la reconstrucción del lecho quirúrgico mediante injertos de hueso, fracción plasmática rica en factores de crecimiento
            de propio paciente u otros materiales sintéticos, con el fin de asegurar el éxito y viabilidad de los dientes tratados.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Todos estos procedimientos tienen el fin de conseguir un indudable beneficio, sin embargo, no están exentos, de complicaciones, algunas de ellas
            inevitables en casos excepcionales, siendo las estadísticamente más frecuentes:
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">• Alergia al anestésico, o medicaciones utilizadas antes, durante o después de la cirugía.</li>
            <li style="margin-bottom: 5px;">• Hematoma, hemorragia e inflamación postoperatoria de la zona intervenida</li>
            <li style="margin-bottom: 5px;">• Infección postoperatoria del lecho quirúrgico y/o materiales utilizados.</li>
            <li style="margin-bottom: 5px;">• Apertura de los puntos de sutura.</li>
            <li style="margin-bottom: 5px;">• Daño a los dientes vecinos.</li>
            <li style="margin-bottom: 5px;">• Falta de sensibilidad parcial o total, temporal o permanente del nervio dentario inferior (sensibilidad del labio inferior).</li>
            <li style="margin-bottom: 5px;">• Falta de sensibilidad parcial o total del nervio lingual, temporal o definitiva (de la lengua y del gusto).</li>
            <li style="margin-bottom: 5px;">• Falta de sensibilidad parcial o total del nervio infraorbitario (de la mejilla), temporal o definitiva.</li>
            <li style="margin-bottom: 5px;">• Infección de los tejidos o del hueso.</li>
            <li style="margin-bottom: 5px;">• Sinusitis.</li>
            <li style="margin-bottom: 5px;">• Comunicación entre la boca y la nariz o los senos maxilares.</li>
            <li style="margin-bottom: 5px;">• Fracturas óseas.</li>
            <li style="margin-bottom: 5px;">• Rotura de instrumental</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            Recibida la anterior información, considero que he comprendido la naturaleza y propósitos del procedimiento ..................................................................................................
            Además, en entrevista personal con el doctor .................................................................................................. he sido informado/a,
            en términos que he comprendido, del alcance de dicho tratamiento. En la entrevista he tenido la oportunidad de proponer y resolver mis posibles dudas,
            y de obtener cuanta información complementaria he creído necesaria. Por ello, me considero en condiciones de sopesar debidamente tanto us posibles riesgos
            como la utilidad y beneficios que de él puedo obtener. Estoy satisfecho/a con la información que se me ha proporcionado y, por ello, <strong>DOY MI CONSENTIMIENTO</strong>
            para que se me practique ..................................................................................................
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Este consentimiento puede ser revocado por mí sin necesidad de justificación alguna, en cualquier momento antes de realizar el procedimiento.
            Observaciones ..................................................................................................
            ..................................................................................................
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
              <p>El Odontólogo / Estomatólogo</p>
              <p>COP ..................</p>
            </div>
          </div>
        </div>
      `,
  ultimaActualizacion: new Date()
};
