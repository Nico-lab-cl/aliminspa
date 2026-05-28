export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML string containing the rich content
    coverImage: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    tags: string[];
    metaTitle: string;
    metaDescription: string;
}

export const BLOG_CATEGORIES = [
    'Todo',
    'Educación Legal',
    'Inversión Inmobiliaria',
    'Guía del Comprador'
] as const;

export const BLOG_POSTS: BlogPost[] = [
    {
        id: '1',
        slug: 'que-es-el-rol-propio-y-por-que-es-vital',
        title: '¿Qué es el Rol Propio y por qué es vital al comprar un terreno?',
        excerpt: 'Descubre qué es el Rol Propio, cómo verificarlo en el Conservador de Bienes Raíces y por qué es el único documento que garantiza tu propiedad legal en Chile.',
        coverImage: '/images/projects/lomas-del-mar-v2.jpg',
        category: 'Educación Legal',
        author: 'Equipo Legal Alimin',
        date: '2026-05-28',
        readTime: '6 min de lectura',
        tags: ['Rol Propio', 'Aspectos Legales', 'Conservador de Bienes Raíces', 'Inversión Segura'],
        metaTitle: '¿Qué es el Rol Propio en Chile? Guía Legal Completa | Alimin Inmobiliaria',
        metaDescription: 'Evita estafas inmobiliarias. Conoce qué es el Rol Propio, cómo se inscribe un terreno en el CBR y por qué es fundamental para ser el dueño exclusivo de tu lote.',
        content: `
            <p>Al buscar terrenos en venta en el Litoral Central o en cualquier región de Chile, una de las frases más repetidas por las inmobiliarias serias es: <strong>"Terrenos con Rol Propio"</strong>. Pero, ¿sabes realmente qué significa este término y por qué comprar un lote sin él puede convertirse en la peor pesadilla financiera de tu vida?</p>
            
            <p>En este artículo te explicamos de forma sencilla y clara los aspectos legales que debes dominar para proteger tu inversión.</p>

            <h2>¿Qué es el Rol Propio?</h2>
            <p>El Rol Propio es el número identificador único que el Servicio de Impuestos Internos (SII) le asigna a una propiedad inmobiliaria en Chile. Piensa en él como el "RUT" o la cédula de identidad de tu terreno. Este número permite diferenciar tu lote de cualquier otro en el territorio nacional.</p>
            
            <p>Cuando un terreno tiene Rol Propio, significa que:</p>
            <ul>
                <li>Está debidamente subdividido de acuerdo a las normativas de la Dirección de Obras Municipales (DOM) y el Servicio Agrícola y Ganadero (SAG).</li>
                <li>Cuenta con su propia inscripción de dominio en el Conservador de Bienes Raíces (CBR) correspondiente.</li>
                <li>Te permite ser el <strong>dueño exclusivo y absoluto</strong> de esa porción de tierra, y no de un porcentaje de un terreno más grande.</li>
            </ul>

            <div class="blog-callout">
                <strong>Importante:</strong> Si compras un terreno que no cuenta con su propio rol, jurídicamente no estás comprando un terreno, sino una "acción y derecho" sobre una propiedad matriz. Esto se conoce técnicamente como un loteo irregular.
            </div>

            <h2>¿Cuál es la diferencia entre Rol Propio y Derechos sobre un terreno?</h2>
            <p>Esta es la mayor fuente de estafas e irregularidades en el mercado de parcelas de agrado y terrenos de veraneo. Aquí te presentamos una comparación directa:</p>
            
            <table class="blog-table">
                <thead>
                    <tr>
                        <th>Característica</th>
                        <th>Terreno con Rol Propio</th>
                        <th>Venta de Derechos (Loteo Irregular)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Propiedad Legal</strong></td>
                        <td>Eres dueño del 100% de tu lote delimitado.</td>
                        <td>Eres co-propietario de un porcentaje del terreno global junto a cientos de personas.</td>
                    </tr>
                    <tr>
                        <td><strong>Inscripción en CBR</strong></td>
                        <td>Inscrito a tu nombre con deslindes claros.</td>
                        <td>Se inscribe un derecho general, sin deslindes físicos garantizados en la escritura matriz.</td>
                    </tr>
                    <tr>
                        <td><strong>Construcción y Permisos</strong></td>
                        <td>Puedes solicitar patente municipal, luz, agua y permisos de edificación.</td>
                        <td>Es ilegal construir y los servicios básicos pueden ser denegados o compartidos de forma informal.</td>
                    </tr>
                    <tr>
                        <td><strong>Venta o Herencia</strong></td>
                        <td>Puedes vender, hipotecar o heredar tu propiedad sin consultar a nadie.</td>
                        <td>Vender es sumamente complejo y los bancos jamás te otorgarán un crédito hipotecario sobre derechos.</td>
                    </tr>
                </tbody>
            </table>

            <h2>Los peligros de comprar terrenos sin Rol Propio</h2>
            <p>Comprar bajo la modalidad de "derechos" o loteos irregulares (a veces llamados loteos brujos) conlleva graves riesgos:</p>
            <ol>
                <li><strong>Demoliciones forzosas:</strong> Al no contar con autorizaciones de la Dirección de Obras Municipales, el municipio local puede ordenar la paralización de obras y demolición de viviendas construidas de forma irregular.</li>
                <li><strong>Imposibilidad de urbanizar de forma legal:</strong> Las empresas eléctricas (como Litoral en nuestra zona) y sanitarias exigen el Rol Propio y la carpeta de dominio vigente para instalar empalmes independientes.</li>
                <li><strong>Conflictos vecinales:</strong> Al ser todos dueños de una porción común del terreno matriz, cualquier decisión legal sobre el predio requiere la firma y consentimiento de todos los copropietarios, lo que suele derivar en eternas disputas judiciales.</li>
            </ol>

            <h2>¿Cómo verificar si un terreno tiene Rol Propio real?</h2>
            <p>Antes de transferir dinero o firmar una promesa de compraventa, realiza los siguientes pasos:</p>
            <ul>
                <li><strong>Solicita el Certificado de Dominio Vigente:</strong> Pídelo a la inmobiliaria y compruébalo directamente en el Conservador de Bienes Raíces (para El Tabo, corresponde al Conservador de San Antonio).</li>
                <li><strong>Revisa el plano de subdivisión aprobado:</strong> Asegúrate de que el plano del loteo cuente con el timbre oficial del SAG y esté archivado en el Conservador de Bienes Raíces.</li>
                <li><strong>Consulta en el SII:</strong> Ingresa al portal web del Servicio de Impuestos Internos y busca el rol en el mapa de avalúos para confirmar que corresponde exactamente a la ubicación física del lote que te están ofreciendo.</li>
            </ul>

            <h2>Nuestra Garantía en Alimin Inmobiliaria</h2>
            <p>En <strong>Alimin Inmobiliaria</strong>, la transparencia legal es nuestra prioridad número uno. Todos los proyectos que comercializamos, incluyendo <em>Lomas del Mar</em> y <em>Arena y Sol</em>, cuentan con:</p>
            <ul>
                <li>Planos aprobados y debidamente archivados.</li>
                <li>Roles de avalúo individuales del SII.</li>
                <li>Inscripción vigente en el Conservador de Bienes Raíces de San Antonio.</li>
                <li>Factibilidad certificada de servicios básicos.</li>
            </ul>
            <p>No arriesgues el patrimonio de tu familia. Invierte siempre de manera informada, segura y con todas las de la ley.</p>
        `
    },
    {
        id: '2',
        slug: '5-ventajas-de-invertir-en-terrenos-urbanizados',
        title: '5 ventajas de invertir en terrenos urbanizados en El Tabo',
        excerpt: 'Conoce los beneficios económicos, legales y de calidad de vida que ofrece comprar terrenos completamente urbanizados en el Litoral Central de Chile.',
        coverImage: '/images/projects/arena-y-sol-v2.jpg',
        category: 'Inversión Inmobiliaria',
        author: 'Inversiones Alimin',
        date: '2026-05-28',
        readTime: '5 min de lectura',
        tags: ['Inversión', 'Terrenos Urbanizados', 'El Tabo', 'Plusvalía', 'Litoral Central'],
        metaTitle: '5 Ventajas de Terrenos Urbanizados en El Tabo | Alimin Inmobiliaria',
        metaDescription: '¿Vale la pena comprar terrenos urbanizados? Descubre las ventajas de contar con agua certificada por la Seremi, luz eléctrica y rol propio en El Tabo, Chile.',
        content: `
            <p>El Litoral Central de Chile, y en particular la comuna de <strong>El Tabo</strong>, se ha consolidado como uno de los polos de atracción inmobiliaria más dinámicos del país. Con el aumento del teletrabajo y el deseo de escapar del estrés de Santiago, la demanda de terrenos en la costa se ha disparado. Sin embargo, no todos los terrenos son iguales.</p>
            
            <p>A continuación, analizamos las 5 ventajas indiscutibles de optar por terrenos completamente urbanizados en lugar de sitios rurales sin servicios.</p>

            <h2>1. Agua Certificada: Salud y Legalidad</h2>
            <p>El agua es el recurso más crítico. Comprar un terreno que depende de camiones aljibe sin certificación o de pozos informales pone en riesgo la salud de tu familia y desvaloriza tu propiedad. En los proyectos de Alimin, el agua cuenta con resolución sanitaria aprobada por la SEREMI de Salud de Valparaíso, lo que garantiza:</p>
            <ul>
                <li>Agua apta para el consumo humano con controles de calidad periódicos.</li>
                <li>Flujo constante para abastecer tu futura vivienda sin sorpresas ni racionamiento.</li>
                <li>Cumplimiento total de las exigencias municipales para la obtención de la recepción final de edificación.</li>
            </ul>

            <h2>2. Luz Eléctrica Lista para Empalmar</h2>
            <p>Traer luz eléctrica a un predio aislado de forma particular puede costar millones de pesos y demorar meses de trámites burocráticos con la compañía eléctrica local. Al adquirir un lote urbanizado, cada terreno cuenta con su postación y empalme instalado en el frontis. Solo debes solicitar tu medidor individual, un proceso rápido y directo.</p>

            <h2>3. Plusvalía Acelerada y Retorno de Inversión</h2>
            <p>Un terreno urbanizado incrementa su valor comercial a un ritmo mucho mayor que un terreno rústico. La urbanización de un sector atrae mejores construcciones, pavimentación de caminos de acceso y mayor seguridad. Comprar hoy en preventa un terreno urbanizado en El Tabo garantiza que tu patrimonio crecerá año tras año gracias a la alta demanda turística y residencial de la zona.</p>

            <div class="blog-callout">
                <strong>Dato de Plusvalía:</strong> El valor del metro cuadrado en El Tabo ha experimentado un crecimiento sostenido de entre el 8% y 12% anual durante los últimos 4 años, impulsado por proyectos de urbanización de alta calidad.
            </div>

            <h2>4. Facilidad para la Autoconstrucción</h2>
            <p>Construir tu casa de descanso o retiro es una experiencia maravillosa si cuentas con las herramientas adecuadas. Tener agua potable y luz desde el primer día en la parcela facilita enormemente las labores de las cuadrillas de construcción, permitiendo:</p>
            <ul>
                <li>Reducir los tiempos de obra (menores costos de mano de obra).</li>
                <li>Evitar el arriendo de costosos generadores eléctricos a combustible.</li>
                <li>Mejorar el fragüe y preparación de materiales como el hormigón utilizando agua limpia y regulada.</li>
            </ul>

            <h2>5. Vida en Comunidad y Seguridad</h2>
            <p>Nuestros proyectos urbanizados se estructuran dentro de recintos cerrados con accesos controlados (portón automático y veredas pavimentadas). Esto ofrece un entorno seguro para que tus hijos jueguen al aire libre y te brinda total tranquilidad cuando dejas tu casa de veraneo deshabitada durante los meses de invierno.</p>

            <h2>Conclusión</h2>
            <p>Comprar un terreno no es solo adquirir tierra; es asegurar el espacio donde construirás tus mejores recuerdos. Optar por la urbanización es sinónimo de tranquilidad, plusvalía e inversión inteligente. ¡Ven a conocer nuestros proyectos en El Tabo y da el primer paso hacia tu sueño!</p>
        `
    },
    {
        id: '3',
        slug: 'guia-definitiva-comprar-terreno-litoral-central',
        title: 'Guía definitiva para comprar tu primer terreno en el Litoral Central',
        excerpt: '¿Pensando en comprar un terreno en la playa? Te presentamos una lista de verificación legal y práctica para hacer tu compra de forma segura y sin contratiempos.',
        coverImage: '/images/projects/libertad-y-alegria.webp',
        category: 'Guía del Comprador',
        author: 'Asesoría Alimin Inmobiliaria',
        date: '2026-05-28',
        readTime: '7 min de lectura',
        tags: ['Guía del Comprador', 'Litoral Central', 'Primer Terreno', 'Checklist', 'El Tabo'],
        metaTitle: 'Guía de Compra de Terrenos en el Litoral Central | Alimin Inmobiliaria',
        metaDescription: 'Todo lo que necesitas saber antes de comprar tu parcela o lote en la costa chilena. Requisitos legales, factibilidad de servicios y consejos de expertos.',
        content: `
            <p>Cumplir el sueño de tener una casa en la playa, a pocos minutos del mar y rodeado de naturaleza, comienza por una decisión fundamental: **comprar el terreno indicado**. El Litoral Central de Chile, que abarca balnearios emblemáticos como El Tabo, El Quisco y Algarrobo, ofrece excelentes opciones, pero requiere actuar con cautela y conocimiento técnico.</p>
            
            <p>En esta guía definitiva, hemos consolidado el paso a paso que todo comprador primerizo debe seguir para realizar una compra 100% segura.</p>

            <h2>Paso 1: Definir el uso del terreno</h2>
            <p>Antes de empezar a visitar loteos, define claramente cuál será el propósito principal de tu propiedad:</p>
            <ul>
                <li><strong>Segunda vivienda / Veraneo:</strong> Prioriza la cercanía a playas principales, facilidad de acceso vial y que el recinto cuente con seguridad (cierres perimetrales).</li>
                <li><strong>Vivienda principal / Retiro:</strong> Exige conectividad de Internet estable, cercanía a servicios comerciales, centros de salud y colegios.</li>
                <li><strong>Inversión pura:</strong> Busca zonas de alta plusvalía y proyectos en etapas de preventa donde el valor de compra inicial sea menor.</li>
            </ul>

            <h2>Paso 2: Checklist Legal Indispensable</h2>
            <p>La seguridad jurídica de tu compra es innegociable. Nunca firmes un contrato sin validar lo siguiente:</p>
            <ol>
                <li><strong>Copia autorizada de la inscripción de dominio:</strong> Con una vigencia no mayor a 30 días, emitida por el Conservador de Bienes Raíces local.</li>
                <li><strong>Certificado de Hipotecas, Gravámenes y Prohibiciones (GP):</strong> Para asegurar que el terreno no está embargado, hipotecado o con prohibición judicial de venta.</li>
                <li><strong>Certificado de Informaciones Previas (CIP):</strong> Emitido por la Dirección de Obras Municipales. Este documento detalla qué puedes construir, la altura máxima permitida, los distanciamientos con vecinos y si el terreno se encuentra en zona de riesgo (por ejemplo, remociones en masa o inundabilidad).</li>
            </ol>

            <div class="blog-callout">
                <strong>Consejo Profesional:</strong> En Alimin Inmobiliaria, nuestro equipo legal realiza este estudio de títulos para cada lote y lo entrega sin costo al comprador para garantizar absoluta transparencia jurídica.
            </div>

            <h2>Paso 3: Factibilidad Técnica de Servicios</h2>
            <p>Un error común es asumir que un terreno campestre o cercano a la playa cuenta con servicios básicos automáticos. Debes verificar en terreno:</p>
            <ul>
                <li><strong>Electricidad:</strong> Si existen postes de tendido eléctrico cercanos y si el loteo cuenta con autorización de paso de servidumbres para la instalación de cableado.</li>
                <li><strong>Agua potable:</strong> Confirma si el sector cuenta con red de agua potable (como Esval), si cuenta con pozos inscritos en la DGA (Dirección General de Aguas) o si el proyecto posee un sistema privado certificado por la Seremi de Salud.</li>
                <li><strong>Alcantarillado:</strong> En zonas de litoral que no cuentan con red de alcantarillado público, deberás instalar una fosa séptica. Asegúrate de que el terreno tenga las dimensiones y la capacidad de absorción necesarias para la aprobación de este sistema por parte de la autoridad sanitaria.</li>
            </ul>

            <h2>Paso 4: Entender los costos adicionales de la compra</h2>
            <p>El precio de venta del lote no es el único desembolso. Debes provisionar fondos para:</p>
            <ul>
                <li><strong>Gastos notariales:</strong> Firma de la escritura pública de compraventa (aproximadamente entre $80.000 y $150.000 pesos).</li>
                <li><strong>Inscripción en el Conservador de Bienes Raíces:</strong> El trámite de traspaso de propiedad en el CBR tiene un costo equivalente aproximado al 0.2% o 0.3% del valor total de la venta del terreno.</li>
                <li><strong>Contribuciones:</strong> Averigua si el lote está exento del pago de contribuciones territoriales en el SII o el monto anual estimado.</li>
            </ul>

            <h2>Paso 5: Agendar visitas presenciales</h2>
            <p>Nunca compres "en verde" un terreno sin haber caminado sobre él. Durante tu visita presencial, presta atención a:</p>
            <ul>
                <li>La pendiente del terreno (terrenos muy inclinados requieren costosos movimientos de tierra y muros de contención).</li>
                <li>El estado de los caminos en días de lluvia (accesibilidad).</li>
                <li>La cobertura de señal celular del sector.</li>
                <li>La distancia real en minutos (midiendo con GPS o vehículo) hacia los balnearios y playas cercanas.</li>
            </ul>

            <h2>¡Estás listo para dar el paso!</h2>
            <p>Seguir esta guía te evitará dolores de cabeza y te garantizará una inversión exitosa. Si quieres asesoría personalizada para encontrar tu lote soñado en El Tabo, no dudes en contactar a nuestros asesores comerciales. Estamos listos para guiarte en cada paso del camino.</p>
        `
    }
];
