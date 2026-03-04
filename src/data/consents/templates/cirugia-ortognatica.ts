import type { ConsentTemplate } from '../types';

export const cirugiaOrtognatica: ConsentTemplate = {
  id: 'cirugia-ortognatica',
  nombre: 'Cirugía Ortognática',
  categoria: 'Cirugía',
  contenido: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px;">CONSENTIMIENTO INFORMADO PARA LA CIRUGÍA ORTOGNÁTICA O DE LAS DEFORMIDADES DENTOFACIALES</h2>

          <p style="text-align: justify; margin-bottom: 15px;">
            La cirugía ortognática se realiza para corregir la posición de los huesos maxilares, con los consiguientes beneficios estéticos y/o funcionales.
            Se realiza mediante osteotomías (cortes) en los huesos de la cara y su posterior recolocación en la posición adecuada. Se fijan con osteosíntesis,
            que es el empleo de materiales que permanecen indefinidamente en su lugar y que habitualmente no hay que quitar, o de materiales que se reabsorben
            con el tiempo. El tratamiento ortodóncico suele ser necesario antes y después de la cirugía.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Este procedimiento se realiza con el fin de conseguir un indudable beneficio, sin embargo, no está exento de POSIBLES COMPLICACIONES, algunas de ellas
            inevitables en casos excepcionales siendo la estadísticamente más frecuentes:
          </p>

          <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 5px;">- Hematoma e inflamación postoperatoria.</li>
            <li style="margin-bottom: 5px;">- Hemorragia intra o postoperatoria, que puede requerir transfusión.</li>
            <li style="margin-bottom: 5px;">- Infección postoperatoria, e incluso osteomielitis.</li>
            <li style="margin-bottom: 5px;">- Dolor postoperatorio.</li>
            <li style="margin-bottom: 5px;">- Falta de sensibilidad parcial o total de los labios, mentón, mejilla, nariz, encía, lengua, dientes o paladar. Normalmente es temporal, pero puede ser permanente.</li>
            <li style="margin-bottom: 5px;">- Los dientes próximos a la cirugía pueden resultar dañados y requerir tratamiento, e incluso la extracción. - Mala unión de los fragmentos óseos.</li>
            <li style="margin-bottom: 5px;">- Recidiva (recaída) total o parcial de la deformidad.</li>
            <li style="margin-bottom: 5px;">- Sinusitis.</li>
            <li style="margin-bottom: 5px;">- Comunicación entre la boca y la nariz o los senos maxilares.</li>
            <li style="margin-bottom: 5px;">- Deformidad del tabique nasal o de la nariz.</li>
            <li style="margin-bottom: 5px;">- No cumplimiento de las expectativas estéticas y/o cambios emocionales reactivos a los cambios faciales.</li>
            <li style="margin-bottom: 5px;">- Rotura de instrumentos.</li>
            <li style="margin-bottom: 5px;">- En fumadores, los riesgos de infección o dehiscencia de las heridas son mayores. Riesgos específicos en su caso ..................................................................................................
            ..................................................................................................</li>
          </ul>

          <p style="text-align: justify; margin-bottom: 15px;">
            En la mayoría de los casos, esta cirugía se realiza con anestesia general (con los riesgos inherentes a ella), que serán informados por su anestesista.
            También puede ser necesario el uso de transfusiones (pudiendo detraerse sangre especiales).
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Recibida la anterior información, considero que he comprendido la naturaleza y propósitos del tratamiento propuesto, así como sus riesgos conocidos
            y las alternativas terapéuticas. Además en conversación personal con mi cirujano he tenido la oportunidad de consultar y resolver mis posibles dudas,
            y de obtener cuanta información complementaria he creído necesaria. Por ello, me considero en condiciones de valorar debidamente tanto los posibles
            riesgos como la utilidad y beneficios que puedo obtener.
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            Yo, .................................................................................................. <strong>COMO PACIENTE</strong>, en pleno uso de mis facultades,
            libre y voluntariamente, DECLARO que he sido debidamente INFORMADO/A, por el cirujano abajo firmante, y en consecuencia, le AUTORIZO junto con sus
            colaboradores, para que me sea realizado el procedimiento denominado..................................................................................................
            ..................................................................................................
          </p>

          <p style="text-align: justify; margin-bottom: 15px;">
            En ocasiones excepcionales, durante la cirugía pueden surgir situaciones imprevistas que obliguen al cirujano a realizar algún procedimiento adicional
            o distinto al planificado. En ese caso, autorizo al cirujano a tomar las decisiones que crea más justificadas y convenientes para mi salud. Este
            consentimiento puede ser revocado discrecionalmente por mí, sin necesidad de justificación alguna, en cualquier momento antes de realizar el procedimiento.
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
              <p>El Odontólogo / Estomatólogo</p>
              <p>COP ..................</p>
            </div>
          </div>
        </div>
      `,
  ultimaActualizacion: new Date()
};
