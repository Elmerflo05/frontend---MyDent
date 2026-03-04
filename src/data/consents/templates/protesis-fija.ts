import type { ConsentTemplate } from '../types';

export const protesisFija: ConsentTemplate = {
  id: 'protesis-fija',
  nombre: 'Prótesis Fija',
  categoria: 'Rehabilitación',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA PRÓTESIS FIJA</h2>

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
            Que el Cirujano Dentista .................................................................. me ha explicado que es conveniente en mi situación proceder a realizar
            el tratamiento de prótesis dental, dándome la siguiente información:
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Que para realizar un tratamiento de prótesis dental se me ha explicado la necesidad de tallar los dientes pilares de la prótesis, lo que puede conllevar
            la posibilidad de aproximación excesiva a la cámara pulpar (nervio) que nos obligaría a realizar un tratamiento de endodoncia y en algunos casos si el
            muñón queda frágil, a realizar un espigo de fibra o colado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            También se me ha explicado la necesidad de mantener una higiene escrupulosa para evitar el desarrollo de gingivitis y secundariamente enfermedad periodontal.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Asimismo, se me informa sobre la importancia de visitas periódicas (en principio anuales) para controlar la situación de la prótesis y su entorno. Por otro
            lado, se me ha aclarado que existe la posibilidad de fractura de cualquier componente de la prótesis, que implicue la reparación o el cambio total de la
            misma. Si ocurre dentro del periodo de garantía pactado, siempre y cuando se deba al uso adecuado de la prótesis (masticación de alimentos), la restauración
            será asumida por mi dentista, de lo contrario los gastos de reparación y honorarios serán asumidos completamente por mi persona.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo explicado de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han planteado, y la información complementaria
            que le he solicitado. Me queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento. Estoy satisfecho
            con la información recibida y he comprendido el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>, para que se
            me practique el tratamiento de prótesis fija.
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
