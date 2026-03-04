import type { ConsentTemplate } from '../types';

export const cirugiaBucalMenor: ConsentTemplate = {
  id: 'cirugia-bucal-menor',
  nombre: 'Cirugía Bucal Menor',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA CIRUGÍA ORAL MENOR</h2>

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
            Que el Cirujano Dentista.................................................................. me ha explicado que el propósito de la intervención de cirugía
            oral menor es para resolver alguno de los siguientes problemas de la cavidad oral <strong>(borrar los que no correspondan): extracción de piezas dentarias
            o restos apicales incluidos, frenestración o tracción de dientes retenidos, plastia de frenillos labiales, extirpación de quistes maxilares y pequeños
            tumores de los mismos o del resto de la cavidad bucal y cirugía preprotésica fundamentalmente.</strong>
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Para llevar a cabo el procedimiento se aplicará anestesia, de cuyos posibles riesgos también he sido informado/a, es posible que los fármacos utilizados
            puedan producir determinadas alteraciones del nivel de conciencia por lo que se me ha informado que no podré realizar determinadas actividades inmediatamente,
            tales como conducir un vehículo.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Igualmente se me ha informado de que existen ciertos riesgos potenciales y complicaciones, algunas de ellas inevitables, concretamente:
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">1.- Alergia al anestésico u otro medicamento utilizado, antes o después de la cirugía.</li>
            <li style="margin-bottom: 5px;">2.- Hematoma y edema de la región.</li>
            <li style="margin-bottom: 5px;">3.- Hemorragia postoperatoria.</li>
            <li style="margin-bottom: 5px;">4.- Dehiscencia de la sutura.</li>
            <li style="margin-bottom: 5px;">5.- Daño de dientes adyacentes.</li>
            <li style="margin-bottom: 5px;">6.- Hipoestesia o anestesia del nervio dentario inferior, temporal o definitiva.</li>
            <li style="margin-bottom: 5px;">7.- Hipoestesia o anestesia del nervio lingual, temporal o definitiva.</li>
            <li style="margin-bottom: 5px;">8.- Hipoestesia o anestesia del nervio infraorbitario, temporal o definitiva.</li>
            <li style="margin-bottom: 5px;">9.- Infección postoperatoria.</li>
            <li style="margin-bottom: 5px;">10.- Osteítis.</li>
            <li style="margin-bottom: 5px;">11.- Sinusitis.</li>
            <li style="margin-bottom: 5px;">12.- Comunicación buconasal y/o bucosinusal.</li>
            <li style="margin-bottom: 5px;">13.- Fracturas óseas.</li>
            <li style="margin-bottom: 5px;">14.- Rotura de instrumentos.</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            Tras la información recibida, he comprendido la naturaleza y propósitos del tratamiento de cirugía que se me va a practicar.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo que se me ha explicado de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han planteado, y la
            información complementaria que le he solicitado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>,
            para que se me practique el tratamiento de cirugía.
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
