/**
 * Todos los textos de la web en castellano. Es la referencia: `texts/en.ts` tiene la misma forma
 * y el compilador no deja publicar si le falta algo. Los nombres y descripciones de los
 * tratamientos están aparte, con sus precios, en `treatments.ts`.
 *
 * Tono: cercano y profesional, de tú. En todo lo que roza la salud (lipedema, post-operatorio,
 * embarazo) se habla de aliviar, acompañar y ayudar, nunca de curar: es un tratamiento
 * complementario y la web lo dice donde hace falta.
 *
 * `scripts/pages.mjs` lee de aquí los títulos y descripciones de cada página para escribirlos en
 * el HTML que ven Google y WhatsApp.
 */
import type { SiteLang } from '../shared/routing'
import { en } from './texts/en'

const DISCLAIMER = 'Tratamiento complementario: no sustituye el diagnóstico ni el seguimiento médico.'

const es = {
  meta: {
    title: 'Sculpt Detox Ibiza | Drenaje linfático, maderoterapia y lipedema',
    description: 'Remodelación corporal sin cirugía en Ibiza: drenaje linfático brasileño, maderoterapia, tratamiento de lipedema y post-operatorio. Reserva por WhatsApp.',
    tagline: 'Remodelación corporal sin cirugía en Ibiza',
    lipedemaTitle: 'Lipedema y post-operatorio en Ibiza | Drenaje linfático · Sculpt Detox',
    lipedemaDescription: 'Drenaje linfático manual para aliviar la pesadez y la hinchazón del lipedema y acompañar la recuperación tras una cirugía, en el centro de Ibiza. Tratamiento complementario.',
    lpLipedemaTitle: 'Drenaje linfático para lipedema en Ibiza · Sculpt Detox',
    lpLipedemaDescription: 'Piernas más ligeras y una recuperación post-operatoria acompañada. Valoración personalizada en el centro de Eivissa. Reserva por WhatsApp.',
    lpMaderoTitle: 'Maderoterapia y anticelulitis en Ibiza · Sculpt Detox',
    lpMaderoDescription: 'Maderoterapia y tratamiento anticelulitis en Ibiza para moldear la silueta y mejorar la piel de naranja, sin cirugía. Reserva por WhatsApp.',
    privacyTitle: 'Privacidad y aviso legal · Sculpt Detox Ibiza',
    privacyDescription: 'Quién está detrás de Sculpt Detox y qué hacemos con los datos que nos envías al pedir cita.',
    notFoundTitle: 'Página no encontrada · Sculpt Detox Ibiza',
  },
  nav: {
    skip: 'Saltar al contenido',
    home: 'Inicio',
    homeAria: 'Sculpt Detox, ir al inicio',
    treatments: 'Tratamientos',
    lipedema: 'Lipedema',
    michele: 'Michele',
    reviews: 'Opiniones',
    faq: 'Preguntas',
    contact: 'Contacto',
    book: 'Reservar',
    navigation: 'Navegación principal',
    openMenu: 'Abrir el menú',
    close: 'Cerrar el menú',
    language: 'Idioma',
    switchShort: 'EN',
    switchName: 'English',
    switchLabel: 'View this website in English',
    call: 'Llamar',
    whatsapp: 'WhatsApp',
    findUs: 'Dónde estamos',
    hours: 'Horario',
    fab: 'Reservar por WhatsApp',
  },
  /** Los mensajes que llegan escritos a WhatsApp. */
  wa: {
    generic: '¡Hola Michele! Me gustaría reservar una cita en Sculpt Detox.',
    lipedema: '¡Hola Michele! Me gustaría reservar una valoración para lipedema / post-operatorio.',
    madero: '¡Hola Michele! Me gustaría reservar una sesión de maderoterapia / anticelulitis.',
  },
  hero: {
    eyebrow: 'Drenaje linfático y maderoterapia en Ibiza',
    titleA: 'Tu cuerpo, remodelado',
    titleB: 'sin cirugía',
    text: 'Drenaje linfático brasileño, maderoterapia y tratamientos para lipedema y post-operatorio en el centro de Ibiza.',
    book: 'Reservar por WhatsApp',
    treatments: 'Ver tratamientos',
    rating: '5,0 en Google',
    ratingAria: 'Valoración de 5,0 sobre 5 en Google',
    photoAlt: 'Michele Costa, masoterapeuta de Sculpt Detox, en su cabina de Eivissa',
    langHint: 'View in English',
  },
  trust: {
    label: 'Por qué Sculpt Detox',
    items: [
      { value: '5,0', text: 'en Google' },
      { value: '15+', text: 'años de experiencia' },
      { value: 'Eivissa', text: 'en pleno centro' },
      { value: 'ES · EN', text: 'atención en dos idiomas' },
    ],
  },
  specialty: {
    eyebrow: 'Nuestra especialidad',
    title: 'Lipedema y post-operatorio en Ibiza',
    lead: 'El lipedema provoca una acumulación de grasa en piernas, caderas y a veces brazos que no responde como el resto del cuerpo a la dieta ni al ejercicio, y que suele ir acompañada de pesadez, hinchazón y dolor al tacto.',
    text: 'Con el drenaje linfático manual, Michele trabaja con suavidad la circulación de la linfa para ayudar a aliviar esa sensación de piernas cargadas y reducir la hinchazón. Después de una liposucción u otra cirugía, acompaña la recuperación siguiendo siempre las indicaciones de tu cirujano.',
    points: [
      'Alivio de la sensación de pesadez y tensión',
      'Ayuda a reducir la hinchazón y la retención',
      'Recuperación post-quirúrgica acompañada, fase a fase',
      'Valoración y plan adaptados a tu caso',
    ],
    disclaimer: DISCLAIMER,
    more: 'Leer más sobre lipedema',
    book: 'Pedir valoración',
    photoAlt: 'Sesión de drenaje linfático manual en las piernas, en una camilla',
    photoNote: 'Imagen ilustrativa',
  },
  treatments: {
    eyebrow: 'Tratamientos corporales',
    title: 'Drenaje linfático, maderoterapia y remodelación corporal en Ibiza',
    text: 'Técnicas manuales y protocolos personalizados para moldear, deshinchar y cuidar tu cuerpo, sin cirugía.',
    facialEyebrow: 'Tratamientos faciales',
    facialTitle: 'Rostro descansado, luminoso y definido',
    facialText: 'Desde un Gua Sha que descongestiona hasta un Hydrafacial completo, para cada tipo de piel.',
    from: (amount: string) => `Desde ${amount}`,
    priceTodo: 'Desde XX €',
    minutes: (value: number) => `${value} min`,
    minutesTodo: 'XX min',
    priceLabel: 'Precio',
    durationLabel: 'Duración',
    book: 'Reservar',
    bookAria: (name: string) => `Reservar ${name}`,
    tiersLabel: 'Tres niveles',
    tabsLabel: 'Tipo de tratamiento',
    tabBody: 'Corporales',
    tabFacial: 'Faciales',
    facialPhotoAlt: 'Las manos de Michele durante un tratamiento facial',
    facialPhotoTodo: 'manos trabajando · facial',
    resultsEyebrow: 'Resultados reales',
    resultsTitle: 'Antes y después',
    resultsText: 'Evolución de una clienta de Sculpt Detox tras su plan de sesiones. Cada cuerpo responde de forma distinta: en la primera visita te explicamos qué puedes esperar en tu caso.',
    resultsAlt: 'Antes y después de las piernas de una clienta de Sculpt Detox, vistas de frente',
  },
  steps: {
    eyebrow: 'Cómo funciona',
    title: 'Tres pasos, y te acompañamos en todos',
    items: [
      { title: 'Escríbenos por WhatsApp', text: 'Cuéntanos qué te gustaría mejorar o qué tratamiento te interesa. Te contesta Michele en persona.' },
      { title: 'Evaluación personalizada', text: 'En la primera visita valoramos tu cuerpo, tus hábitos y tus objetivos; si vienes de una cirugía, también las indicaciones de tu médico.' },
      { title: 'Plan de sesiones y seguimiento', text: 'Te proponemos la frecuencia adecuada y medimos tu evolución para ajustar cada sesión a tus resultados.' },
    ],
    photoAlt: 'Michele mide el contorno de cintura de una clienta durante la evaluación',
    photoNote: 'Imagen ilustrativa',
    cta: 'Empezar por WhatsApp',
  },
  about: {
    eyebrow: 'Quién te atiende',
    title: 'Michele Costa',
    role: 'Masoterapeuta · Fundadora de Sculpt Detox',
    paragraphs: [
      'Detrás de cada tratamiento de Sculpt Detox está Michele Costa, masoterapeuta con más de 15 años de experiencia en técnicas manuales de remodelación corporal, drenaje linfático y cuidado facial.',
      'Su forma de trabajar es cercana y sin prisas: cada sesión empieza escuchando cómo estás y qué necesita tu cuerpo ese día, y termina con consejos sencillos para que el resultado dure en casa. Por eso muchas clientas vienen cada semana desde hace años.',
      'Te atiende personalmente en su cabina del centro de Eivissa, en español y en inglés, y combina sus manos con productos naturales elegidos para cada tratamiento.',
    ],
    years: '15+',
    yearsLabel: 'años de experiencia',
    trainingTitle: 'Formación',
    /** PENDIENTE: la formación real de Michele (título, centro y año). */
    training: [
      'Drenaje linfático manual · centro y año (pendiente)',
      'Maderoterapia y remodelación corporal · centro y año (pendiente)',
      'Lipedema y post-operatorio · centro y año (pendiente)',
    ],
    photoAlt: 'Retrato de Michele Costa con el uniforme de Sculpt Detox',
    productsAlt: 'Michele Costa con los complementos naturales Sculpt Detox de cúrcuma y Thermoboost',
  },
  reviews: {
    eyebrow: 'Opiniones',
    title: 'Lo que dicen nuestras clientas',
    text: 'Reseñas reales de Google, todas con cinco estrellas.',
    source: 'Reseña de Google',
    original: 'Original en inglés:',
    stars: 'Cinco estrellas de cinco',
    leave: 'Deja tu reseña en Google',
    items: [
      { quote: 'La mejor terapeuta de Ibiza, la recomiendo muchísimo.', original: 'Best therapist in Ibiza, I highly recommend.' },
      { quote: '¡Sus productos naturales y sus tratamientos son increíbles! Es muy profesional y tiene unas manos mágicas.', original: 'Her natural products and treatments are amazing! She’s very professional and her hands are magic!' },
      { quote: 'Voy a sus sesiones cada semana desde hace dos años. 100 % recomendable.', original: 'I’ve been going to her therapy sessions weekly for two years. 100% recommended.' },
      { quote: 'Los resultados llegaron muy rápido y superaron mis expectativas.', original: 'The results came very quickly, exceeding my expectations.' },
    ],
  },
  booking: {
    eyebrow: 'Reserva',
    title: 'Pide tu cita en un minuto',
    text: 'Elige el tratamiento y cuándo te viene mejor. Se abrirá WhatsApp con el mensaje listo y Michele te confirma el hueco.',
    treatment: 'Tratamiento',
    treatmentPlaceholder: 'Elige un tratamiento',
    groups: { corporal: 'Corporales', facial: 'Faciales' },
    day: 'Día preferido',
    weekend: 'Atendemos de lunes a viernes: elige un día entre semana o te proponemos el más cercano.',
    slot: 'Franja horaria',
    morning: 'Mañana',
    afternoon: 'Tarde',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    first: '¿Es tu primera visita?',
    yes: 'Sí',
    no: 'No',
    submit: 'Enviar por WhatsApp',
    note: 'No guardamos ningún dato en la web: el mensaje sale desde tu WhatsApp.',
    errors: {
      treatment: 'Elige un tratamiento.',
      day: 'Elige un día.',
      slot: 'Elige mañana o tarde.',
      name: 'Escribe tu nombre.',
      first: 'Indica si es tu primera visita.',
    },
    message: (d: { treatment: string; day: string; slot: string; name: string; first: string }) =>
      `¡Hola Michele! Quiero reservar: ${d.treatment}. Día: ${d.day}. Franja: ${d.slot}. Nombre: ${d.name}. Primera visita: ${d.first}.`,
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que más nos preguntan',
    items: [
      {
        q: '¿Cuántas sesiones necesito?',
        a: 'Depende de tu objetivo y de cómo responde tu cuerpo. En la primera visita valoramos tu caso y te proponemos un plan: lo habitual es empezar con un ciclo de sesiones seguidas y pasar después a sesiones de mantenimiento. En un post-operatorio, la frecuencia la marca la fase de tu recuperación.',
      },
      {
        q: '¿Duele la maderoterapia?',
        a: 'La presión es firme y en zonas con más celulitis o retención puede resultar intensa, pero no debería doler. Adaptamos la intensidad en todo momento a lo que toleras: si en algún momento es demasiado, dínoslo y la bajamos. Es normal que la piel quede algo enrojecida durante unas horas.',
      },
      {
        q: '¿Cuándo puedo empezar el drenaje después de una cirugía?',
        a: 'Siempre cuando tu cirujano lo indique. Cada intervención y cada cirujano tienen su protocolo, así que tráenos sus indicaciones y adaptamos las sesiones a la fase en la que estás. Si tienes cualquier síntoma fuera de lo normal, consulta primero con tu médico.',
      },
      {
        q: '¿Puedo hacer tratamientos durante el embarazo?',
        a: 'Sí: el masaje para embarazadas está pensado para esta etapa, normalmente a partir del segundo trimestre y si el embarazo va bien. Los tratamientos intensos —maderoterapia, anticelulitis, infrarrojo— no se hacen durante el embarazo. Ante cualquier duda, consulta con tu matrona o ginecóloga.',
      },
      {
        q: '¿Qué ropa tengo que llevar?',
        a: 'Ven con ropa cómoda; no necesitas traer nada especial. Si vienes por un post-operatorio, trae tu faja o prenda de compresión para ponértela al terminar.',
      },
      {
        q: '¿Qué formas de pago aceptáis?',
        a: 'Puedes pagar en efectivo, con tarjeta o por Bizum.',
      },
      {
        q: '¿Y si tengo que cancelar o cambiar la cita?',
        a: 'Sin problema: avísanos por WhatsApp con al menos 24 horas de antelación y buscamos otro hueco. Así podemos ofrecer tu hora a otra persona.',
      },
      {
        q: '¿Atendéis en inglés?',
        a: 'Sí. Michele atiende en español y en inglés, y la web también está en inglés para que puedas compartirla.',
      },
    ],
  },
  visit: {
    eyebrow: 'Ubicación y horarios',
    title: 'En el centro de Eivissa',
    addressLabel: 'Dirección',
    hoursLabel: 'Horario',
    hours: 'Lunes a viernes · 9:00–18:00',
    hoursNote: 'Con cita previa',
    weekend: 'Sábados y domingos, cerrado',
    contactLabel: 'Contacto',
    directions: 'Cómo llegar',
    mapAlt: 'Cómo llegar: mapa del centro de Eivissa con Sculpt Detox en el Carrer de l’Historiador Josep Clapés, 13',
    mapCredit: '© OpenStreetMap',
    cabinaAlt: 'La cabina de tratamientos de Sculpt Detox',
    cabinaTodo: 'cabina',
  },
  footer: {
    tagline: 'Remodelación corporal sin cirugía en Ibiza. Drenaje linfático, maderoterapia, lipedema y tratamientos faciales.',
    visit: 'Dónde estamos',
    contact: 'Contacto',
    hours: 'Horario',
    follow: 'Síguenos',
    rights: (year: number) => `© ${year} Sculpt Detox · Michele Costa`,
    privacy: 'Privacidad y aviso legal',
    credit: 'Web de',
  },
  lipedemaPage: {
    eyebrow: 'Lipedema y post-operatorio',
    title: 'Drenaje linfático para lipedema y post-operatorio en Ibiza',
    lead: 'Una técnica manual suave para aliviar la pesadez y la hinchazón del lipedema y acompañar tu recuperación después de una cirugía, con seguimiento personalizado en el centro de Eivissa.',
    sections: [
      {
        id: 'que-es',
        title: '¿Qué es el lipedema?',
        paragraphs: [
          'El lipedema es una alteración crónica del tejido graso que afecta casi siempre a mujeres. Provoca una acumulación desproporcionada de grasa, normalmente en piernas y caderas y a veces en los brazos, que no responde a la dieta ni al ejercicio como el resto del cuerpo.',
          'Suele aparecer o empeorar en momentos de cambio hormonal —pubertad, embarazo, menopausia— y es frecuente que pase años sin diagnosticar o se confunda con obesidad o con linfedema.',
        ],
        list: [
          'Piernas o brazos desproporcionados respecto al resto del cuerpo, normalmente de forma simétrica',
          'Sensación de pesadez y cansancio, que aumenta con el calor o al final del día',
          'Dolor o sensibilidad al tacto',
          'Facilidad para que salgan moratones',
          'Hinchazón que no desaparece del todo con el descanso',
        ],
      },
      {
        id: 'drenaje',
        title: 'Cómo puede ayudar el drenaje linfático manual',
        paragraphs: [
          'El drenaje linfático manual es una técnica de maniobras lentas, suaves y rítmicas que estimula la circulación de la linfa. En el lipedema no elimina el tejido graso, pero forma parte de los cuidados complementarios que suelen recomendar los especialistas, junto con la compresión, el movimiento y el seguimiento médico.',
        ],
        list: [
          'Ayuda a aliviar la sensación de pesadez y de piernas cargadas',
          'Contribuye a reducir la hinchazón y la retención de líquidos asociadas',
          'Puede mejorar el confort y la sensibilidad de la zona',
          'Te ayuda a sentir las piernas más ligeras en tu día a día',
        ],
      },
      {
        id: 'post-operatorio',
        title: 'Drenaje linfático post-operatorio',
        paragraphs: [
          'Tras una liposucción, una lipoescultura, una abdominoplastia u otra cirugía de contorno corporal —también la cirugía del lipedema—, el drenaje linfático ayuda a acompañar la recuperación: favorece la reabsorción de la inflamación, alivia la tirantez y contribuye a que el tejido se asiente de forma más uniforme.',
          'Empezamos cuando tu cirujano lo indique y adaptamos la presión, la duración y la frecuencia a la fase en la que estás.',
        ],
        list: [] as string[],
      },
      {
        id: 'como-trabajamos',
        title: 'Cómo trabajamos',
        paragraphs: [
          'Michele cuenta con formación específica y experiencia en el acompañamiento de personas con lipedema. Cada caso empieza con una valoración personalizada: tus síntomas, tu historia, tus objetivos y, si los tienes, el diagnóstico y las indicaciones de tu médico.',
        ],
        list: [
          'Valoración inicial y plan de sesiones a tu medida',
          'Técnica suave, sin dolor, adaptada a la sensibilidad de la zona',
          'Seguimiento de tu evolución sesión a sesión',
          'Respeto absoluto a las pautas de tu médico o cirujano',
        ],
      },
      {
        id: 'limites',
        title: 'Lo que no hacemos',
        paragraphs: [
          'No diagnosticamos el lipedema ni ninguna otra enfermedad, y no prometemos curaciones. Si notas síntomas y aún no tienes diagnóstico, te recomendamos consultar con un especialista en angiología o cirugía vascular. Nuestro trabajo es acompañarte y ayudarte a sentirte mejor, de la mano de tu equipo médico.',
        ],
        list: [] as string[],
      },
    ],
    disclaimer: DISCLAIMER,
    resultsTitle: 'Evolución de una clienta con lipedema',
    resultsText: 'Fotos de una clienta de Sculpt Detox antes y después de su plan de drenaje. Los resultados varían de una persona a otra y no implican la curación del lipedema.',
    resultsAlt: 'Piernas de una clienta con lipedema antes y después de su plan de drenaje linfático en Sculpt Detox',
    indexLabel: 'En esta página',
    faqTitle: 'Preguntas sobre lipedema y post-operatorio',
    faqIds: [0, 2, 4],
    ctaTitle: '¿Hablamos de tu caso?',
    ctaText: 'Escríbenos por WhatsApp y cuéntanos qué te pasa. Te proponemos una primera valoración sin compromiso.',
    cta: 'Pedir cita por WhatsApp',
    breadcrumb: 'Lipedema',
  },
  landing: {
    lipedema: {
      eyebrow: 'Sculpt Detox · Ibiza',
      title: 'Drenaje linfático para lipedema y post-operatorio en Ibiza',
      text: 'Piernas más ligeras y una recuperación acompañada, con técnica manual suave y un plan pensado para ti.',
      benefits: [
        { title: 'Menos pesadez', text: 'Ayuda a aliviar la sensación de piernas cargadas, la tensión y la sensibilidad al tacto.' },
        { title: 'Hinchazón bajo control', text: 'Contribuye a reducir la inflamación, también después de una liposucción o una cirugía de lipedema.' },
        { title: 'Seguimiento a tu medida', text: 'Valoramos tu caso y adaptamos cada sesión a tu fase y a las indicaciones de tu médico.' },
      ],
      testimonial: 2,
      disclaimer: DISCLAIMER,
      photoAlt: 'Sesión de drenaje linfático manual en las piernas',
      photoNote: 'Imagen ilustrativa',
      resultsAlt: 'Piernas de una clienta con lipedema antes y después de su plan de drenaje linfático',
    },
    madero: {
      eyebrow: 'Sculpt Detox · Ibiza',
      title: 'Maderoterapia y tratamiento anticelulitis en Ibiza',
      text: 'Moldea tu silueta y mejora el aspecto de la piel de naranja con técnicas manuales, sin cirugía y sin agujas.',
      benefits: [
        { title: 'Silueta más definida', text: 'Los instrumentos de madera trabajan el tejido en profundidad y ayudan a moldear piernas, glúteos y abdomen.' },
        { title: 'Piel más lisa', text: 'Sesión a sesión mejora el aspecto de la celulitis y la piel se ve más uniforme y tonificada.' },
        { title: 'Circulación activada', text: 'Favorece el retorno de líquidos: menos retención y una sensación de ligereza que se nota.' },
      ],
      testimonial: 3,
      photoAlt: 'Antes y después de las piernas de una clienta de Sculpt Detox, vistas de frente',
    },
    stepsTitle: 'Cómo funciona',
    reviewLabel: 'Opinión de una clienta',
    cta: 'Reservar por WhatsApp',
    ctaTitle: 'Reserva tu primera sesión',
    ctaText: 'Te contesta Michele en persona. Lunes a viernes de 9:00 a 18:00, con cita previa.',
  },
  privacy: {
    title: 'Privacidad y aviso legal',
    updated: 'Última actualización: octubre de 2026',
    sections: [
      {
        title: 'Quién está detrás de esta web',
        text: 'Sculpt Detox es el centro de Michele Costa (NIF: pendiente), en el Carrer de l’Historiador Josep Clapés, 13, 07800 Eivissa (Illes Balears). Puedes escribirnos a contact@sculptdetox.com o al +34 631 21 32 14.',
      },
      {
        title: 'Qué datos tratamos',
        text: 'La web no tiene formularios que guarden datos: el de reserva solo prepara un mensaje que envías tú desde tu WhatsApp. Lo que nos cuentes por WhatsApp, por teléfono o por correo (tu nombre, tu teléfono y, si lo compartes, información sobre tu salud para preparar la sesión) lo usamos únicamente para gestionar tus citas y tu tratamiento.',
      },
      {
        title: 'Datos de salud',
        text: 'Si nos cuentas datos de salud (un diagnóstico, una cirugía, un embarazo), los tratamos con tu consentimiento y solo para adaptar el tratamiento a tu caso. No se comparten con nadie salvo obligación legal.',
      },
      {
        title: 'Cuánto tiempo y tus derechos',
        text: 'Guardamos tus datos mientras seas clienta y, después, el tiempo que exija la ley. Puedes pedir verlos, corregirlos o borrarlos escribiéndonos a contact@sculptdetox.com, y reclamar ante la Agencia Española de Protección de Datos (aepd.es).',
      },
      {
        title: 'Cookies',
        text: 'Esta web no usa cookies de publicidad ni de analítica. Solo guarda en tu navegador una copia de la propia web para que cargue más rápido en la siguiente visita.',
      },
    ],
  },
  notFound: {
    title: 'Esta página no existe',
    text: 'Puede que el enlace sea antiguo o que haya cambiado de dirección. Desde el inicio encontrarás todos los tratamientos.',
    home: 'Ir al inicio',
  },
  error: {
    title: 'Algo no ha cargado bien',
    text: 'Vuelve a intentarlo en un momento. Si tienes prisa, escríbenos directamente por WhatsApp.',
    retry: 'Reintentar',
  },
  photoTodo: 'Foto pendiente',
}

export type Texts = typeof es

const TEXTS: Record<SiteLang, Texts> = { es, en }

export const textsFor = (lang: SiteLang): Texts => TEXTS[lang] ?? es
