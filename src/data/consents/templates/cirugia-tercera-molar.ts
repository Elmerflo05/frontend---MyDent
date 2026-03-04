import type { ConsentTemplate } from '../types';

export const cirugiaTerceraMolar: ConsentTemplate = {
  id: 'cirugia-tercera-molar',
  nombre: 'Cirugía Tercera Molar',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA EXODONCIA QUIRÚRGICA DE TERCEROS MOLARES INCLUIDOS</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, .................................................................................................. <strong>COMO PACIENTE</strong>, en pleno uso de mis facultades,
            libre y voluntariamente, DECLARO que he sido debidamente INFORMADO/A, por el cirujano abajo firmante, y en consecuencia, le AUTORIZO junto con sus
            colaboradores, para que me sea realizado el procedimiento denominado..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            .... La extracción de las muelas del juicio incluidas está indicada en ocasiones para evitar problemas como: dolor, inflamación, infección, formación
            de quistes, enfermedad periodontal, caries, maloclusión, pérdida prematura de otros dientes, pérdida prematura de hueso, etc.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Este procedimiento se realiza con el fin de conseguir un indudable beneficio, sin embargo, no está exento de POSIBLES COMPLICACIONES, algunas de ellas
            inevitables en casos excepcionales, siendo las estadísticamente más frecuentes:
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">- Alergia al anestésico u otro medicamento utilizado, antes, durante o después de la cirugía.</li>
            <li style="margin-bottom: 5px;">- Hematoma e hinchazón de la región. - Hemorragia postoperatoria. - Infección postoperatoria.</li>
            <li style="margin-bottom: 5px;">- Apertura de los puntos de sutura.</li>
            <li style="margin-bottom: 5px;">- Apertura limitada de la boca durante días o semanas</li>
            <li style="margin-bottom: 5px;">- Daño a los dientes o tejidos vecinos.</li>
            <li style="margin-bottom: 5px;">- Abandono accidental de un pequeño fragmento de raíz, cuya extracción supondría una ampliación injustificada de la cirugía.</li>
            <li style="margin-bottom: 5px;">- Falta de sensibilidad parcial o total, temporal o permanente del nervio dentario inferior (sensibilidad del labio inferior).</li>
            <li style="margin-bottom: 5px;">- Falta de sensibilidad parcial o total del nervio lingual, temporal o permanente (de la lengua y del gusto).</li>
            <li style="margin-bottom: 5px;">- Sinusitis. - Comunicación entre la boca y la nariz o los senos maxilares.</li>
            <li style="margin-bottom: 5px;">- Fracturas óseas.</li>
            <li style="margin-bottom: 5px;">- Desplazamiento de dientes a estructuras vecinas.</li>
            <li style="margin-bottom: 5px;">- Tragado o aspiración de dientes o de alguna de sus partes.</li>
            <li style="margin-bottom: 5px;">- Rotura de instrumentos. Rotura de la aguja de anestesia.</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            - En fumadores, los riesgos de infección o dehiscencia de la herida son mayores. La intervención puede realizarse con ANESTESIA GENERAL O LOCAL con
            el riesgo inherente asociado a las mismas, que serán informados por su anestesista; y los fármacos utilizados pueden producir determinadas alteraciones
            del nivel de conciencia por lo que no podrá realizar determinadas actividades inmediatamente, tales como conducir un vehículo. Recibida la anterior
            información, considero que he comprendido la naturaleza y propósitos del tratamiento propuesto, así como sus riesgos conocidos y las alternativas terapéuticas.
            Además, en conversación personal con mi cirujano he tenido la oportunidad de consultar y resolver mis posibles dudas, y de obtener cuanta información
            complementaria he creído necesaria. Por ello, me considero en condiciones de valorar debidamente los posibles beneficios que puedo obtener.
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, D/Doña. .................................................................................................. (nombre y apellidos, a mano, o pegatina del
            centro sanitario) <strong>COMO PACIENTE</strong> (o su representante legal), en pleno uso de mis facultades, libre y voluntariamente, DECLARO que he sido
            debidamente, INFORMADO/A, por el cirujano abajo firmante, y en consecuencia, le AUTORIZO junto con sus colaboradores, para que me sea realizado el
            procedimiento diagnóstico/terapéutico denominado..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            En ocasiones excepcionales, durante la cirugía pueden surgir situaciones imprevistas que obliguen al cirujano a realizar un procedimiento adicional o
            distinto del planificado. En ese caso, autorizo al cirujano a tomar las decisiones que crea más justificadas y convenientes para mi salud.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Este consentimiento puede ser revocado discrecionalmente por mí, sin necesidad de justificación alguna, en cualquier momento antes de realizar el procedimiento.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
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
