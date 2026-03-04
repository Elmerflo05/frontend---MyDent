import type { ConsentTemplate } from '../types';

export const endodoncia: ConsentTemplate = {
  id: 'endodoncia',
  nombre: 'Endodoncia',
  categoria: 'Tratamiento',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA ENDODONCIA</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, paciente.................................................................................................. con DNI No. ..............................,
            mayor de edad, y con domicilio en .................................................................................................. o Yo
            .................................................................................................. con DNI No| No............, mayor de edad, y con domicilio
            en .................................................................................................. en calidad de representante legal de
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>DECLARO</strong>
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Que el Cirujano Dentista.................................................................me ha explicado que es conveniente en mi situación proceder a realizar
            el tratamiento endodóntico de mi pieza dentaria, para los que me ha informado debidamente de lo siguiente:
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>1.</strong> El propósito principal de la intervención es la eliminación del tejido pulpar inflamado o infectado, del interior del diente para
            evitar secuelas dolorosas o infecciosas.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>2.</strong> El tratamiento que voy a recibir implica la administración de anestesia local, que consiste en proporcionar, mediante una inyección,
            sustancias que provocan el bloqueo reversible de los nervios de tal manera que se inhibe transitoriamente la sensibilidad con el fin de realizar el
            tratamiento sin dolor. Me ha explicado también que tendrá la sensación de adormecimiento del labio o de la cara que normalmente va a desaparecer en dos
            o tres horas.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Igualmente se me ha explicado que la administración de la anestesia puede provocar, en el punto en el que se administre la inyección, ulceración de la
            mucosa y dolor, y menos frecuentemente, limitaciones en el movimiento de apertura de la boca, que pueden requerir tratamiento ulterior, y que la anestesia
            puede provocar bajada de tensión que, más infrecuentemente, pueden provocar un síncope o fibrilación ventricular, que deben tratarse posteriormente, e
            incluso, excepcionalmente, la muerte. También puede provocar la administración de anestesia urticaria, dermatitis, asma, edema angioneurótico, es decir
            asfixia, que en casos extremos puede requerir tratamiento urgente.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>3.</strong> La intervención consiste en la eliminación y el relleno de la cámara pulpar y los tejidos radiculares con un material que selle la
            cavidad e impida el paso a las bacterias y toxinas infecciosas, conservando el diente o molar.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>4.</strong> Se me ha informado, que, a pesar de realizar correctamente la técnica, cabe la posibilidad de que la infección o el proceso quístico
            o granulomatoso no se eliminen totalmente, por lo que puede ser necesario acudir a la cirugía periapical al cabo de algunas semanas, meses o incluso años.
            Igualmente es posible que no se obtenga el sellado total de los conductos, por lo que también puede ser necesario proceder a una repetición del tratamiento,
            como en el caso de que el relleno quede corto o largo.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            También me ha advertido que es muy posible que después de la endodoncia el diente cambie de color y se oscurezca ligeramente. Y me ha indicado que es
            frecuente que el diente o molar en el que se ha realizado la endodoncia se debilite y tienda a fracturarse posteriormente, por lo que se requieren
            prótesicas e insertar refuerzos intrarradiculares.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>5.</strong> Me ha informado de que todo acto quirúrgico que lleva implícitas una serie de complicaciones comunes y potencialmente serias que
            podrían requerir tratamientos complementarios tanto médicos como quirúrgicos.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            He comprendido lo que se me ha explicado mi cirujano dentista de forma clara, con un lenguaje sencillo, habiendo resuelto todas las dudas que se me han
            planteado, y la información complementaria que le he solicitado.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Me ha queda claro que en cualquier momento y sin necesidad de dar ninguna explicación, puedo revocar este consentimiento.
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            Estoy satisfecho con la información recibida y comprendo el alcance y riesgos de este tratamiento, y en por ello,
          </p>

          <p style="text-align: justify; margin-bottom: 30px;">
            <strong>DOY MI CONSENTIMIENTO</strong>, para que se me practique el tratamiento de endodoncia.
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
