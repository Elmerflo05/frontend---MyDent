import type { ConsentTemplate } from '../types';

export const implantes: ConsentTemplate = {
  id: 'implantes',
  nombre: 'Implantes',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA IMPLANTES DENTALES</h2>

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
            Que el Cirujano Dentista.................................................................. me ha explicado que el propósito de la intervención es la reposición
            de los dientes perdidos mediante la fijación de tornillos o láminas al hueso, y posteriormente la colocación de un/ospilar/es metálico/s que soportará
            las futuras piezas dentales artificiales.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He sido informado/a de otras alternativas de tratamiento mediante la utilización de prótesis convencionales. Para llevar a cabo el procedimiento se
            aplicará anestesia, de cuyos posibles riesgos también he sido informado/a, Igualmente se me ha informado de que existen ciertos riesgos potenciales
            en toda intervención quirúrgica realizada en la boca, concretamente:
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">1. Alergia al anestésico, antes, durante o después de la cirugía.</li>
            <li style="margin-bottom: 5px;">2. Molestias, hematomas e inflamación postoperatoria, durante los primeros días.</li>
            <li style="margin-bottom: 5px;">3. Sangrado.</li>
            <li style="margin-bottom: 5px;">4. Infección postoperatoria que requiera tratamiento posterior.</li>
            <li style="margin-bottom: 5px;">5. Lesión de raíces de dientes adyacentes.</li>
            <li style="margin-bottom: 5px;">6. Lesión nerviosa que provoque hipoestesia o anestesia del labio inferior, superior, mentón, dientes, encía y/o de la lengua, que sueles ser transitoria y excepcionalmente permanente.</li>
            <li style="margin-bottom: 5px;">7. Comunicación con los senos nasales o con las fosas nasales.</li>
            <li style="margin-bottom: 5px;">8. Aspiración o deglución de algún instrumento quirúrgico de pequeño tamaño.</li>
            <li style="margin-bottom: 5px;">9. Desplazamiento del implante a estructuras vecinas.</li>
            <li style="margin-bottom: 5px;">10. Rotura de instrumentos.</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            Los implantes han sido utilizados ampliamente en todo el mundo, desde hace más de 25 años y es un procedimiento considerado seguro por la comunidad
            internacional, pero se me ha explicado que, aunque la técnica se realice correctamente, existe un porcentaje de fracasos entre el 8 y el 10 por ciento.
            He sido informado de las complicaciones potenciales de este procedimiento quirúrgico, que incluye además de las anteriores.
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">1. Dehiscencia de sutura y exposición del implante.</li>
            <li style="margin-bottom: 5px;">2. Falta de integración del implante con el hueso lo rodea, con la consiguiente pérdida precoz o tardía del/los implante/s, y la posible planificación de la prótesis planificada.</li>
            <li style="margin-bottom: 5px;">3. Imposibilidad de colocar un implante en la localización prevista, por las características de hueso remanente.</li>
            <li style="margin-bottom: 5px;">4. En casos excepcionales, con atrofia importante ósea, puede producirse una fractura mandibular, que requiera tratamiento posterior.</li>
            <li style="margin-bottom: 5px;">5. Fractura del implante o de algún componente de la prótesis.</li>
            <li style="margin-bottom: 5px;">6. Complicaciones inherentes a la prótesis dental, no cumpliendo las expectativas estéticas, dificultad para la fonación, etc.</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            Entiendo que el tratamiento no concluye con la colocación del implante, sino que será preciso visitar periódicamente al facultativo y seguir escrupulosamente
            las normas de higiene que me ha explicado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo que se me ha explicado por el facultativo de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han
            planteado, y la información complementaria que le he solicitado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>,
            para que se me practique el tratamiento de implantes.
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
