import type { ConsentTemplate } from '../types';

export const ortodoncia: ConsentTemplate = {
  id: 'ortodoncia',
  nombre: 'Ortodoncia',
  categoria: 'Tratamiento',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA ORTODONCIA</h2>

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
            un tratamiento ortodóntico, con objeto de conseguir una mejor alineación de los dientes, para de esta manera prevenir problemas posteriores, mejorando
            a la vez la masticación y la estética.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Para ello se emplean aparatos de ortodoncia que pueden ser removibles o fijos.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Se que es posible que los aparatos removibles se pierdan fácilmente si no están en la boca, y que en este caso el coste de reposición correrá por mi cuenta.
            El Dentista me ha explicado que los aparatos pueden producir úlceras o llagas, dolor en los dientes que están con los aparatos y que es frecuente que con
            el tiempo se produzca reabsorción de las raíces, de manera que éstas queden más pequeñas, así como la disminución de las encías, que pueden requerir
            tratamiento posterior. También me ha explicado el Dentista que el tratamiento puede requerir la extracción de algún o algunos dientes sanos, incluso puede
            ser necesario la extracción de las muelas del juicio.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            También sé que el tratamiento ortodóntico puede ser largo en el tiempo, meses e incluso años, lo que no depende de la técnica empleada ni de su correcta
            realización sino de factores generalmente biológicos, y de la respuesta de mi organismo, totalmente impredecibles, y que durante todo este tiempo deberé
            extremar las medidas de higiene de la boca para evitar caries y enfermedad de las encías.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            El Dentista me ha explicado que suspenderé el tratamiento si la higiene no es la adecuada porque corre gran riesgo mi dentición de sufrir lesiones cariosas
            múltiples u otros padecimientos derivados de la escasez de higiene oral.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Asimismo, me ha informado que tras la conclusión del tratamiento, se pueden producir algunos movimientos dentarios no deseados y que deberé acudir periódicamente
            para ser revisado(a) y que puede haber recaídas. He comprendido lo explicado de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que
            se me han planteado, y la información complementaria que he solicitado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento. Estoy satisfecho con la información
            recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello, <strong>DOY MI CONSENTIMIENTO</strong>, para que se me practique el tratamiento
            de ortodoncia.
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
