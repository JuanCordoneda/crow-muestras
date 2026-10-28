/**
 * Todos los textos de la web en portugués de Brasil. Es la referencia: `texts/fr.ts` y
 * `texts/en.ts` tienen la misma forma y el compilador no deja publicar si les falta algo.
 *
 * Tono: cercano y elegante, de «você». El público llega desde el Instagram de Janaína (@parisabor):
 * ya la conoce, así que se le habla como ella habla en sus vídeos, sin jerga de agencia.
 *
 * Lo marcado con `todo: true` es provisional (lo que Janaína tiene que confirmar): sale con la
 * etiqueta «a completar» mientras `SHOW_TEXT_TODO` esté encendido en `business.ts`.
 *
 * `scripts/pages.mjs` lee de aquí los títulos y descripciones de cada página para escribirlos en
 * el HTML que ven Google, WhatsApp e Instagram.
 */
import type { SiteLang } from '../shared/routing'
import { fr } from './texts/fr'
import { en } from './texts/en'

type Faq = { q: string; a: string; todo?: boolean }
/** Un depoimento real, con permiso: `{ quote: '…', name: 'Nome', place: 'Cidade · mês do ateliê' }`. */
export type Review = { quote: string; name: string; place: string }
/** `todo`: la parte provisional del texto, que solo sale mientras `SHOW_TEXT_TODO` esté encendido. */
type LegalSection = { title: string; text: string; todo?: string }

const pt = {
  meta: {
    title: 'Ateliê de queijos em Paris com Janaína | PariSabor',
    description: 'Degustação de queijos artesanais franceses em Paris: 1h30, máximo 8 pessoas, 98 €. Aprenda a cortar, harmonizar e monte sua tábua. Reserve sua vaga.',
    tagline: 'Experiências gastronômicas em Paris com Janaína',
    linksTitle: 'Janaína · PariSabor | Ateliê de queijos, vale-presente e mais',
    linksDescription: 'Reserve o ateliê de queijos em Paris, ofereça um vale-presente ou fale com a Janaína no WhatsApp.',
    privacyTitle: 'Privacidade · PariSabor',
    privacyDescription: 'Quem está por trás do PariSabor e o que fazemos com os dados que você nos envia ao reservar.',
    notFoundTitle: 'Página não encontrada · PariSabor',
    ogAlt: 'Tábua de queijos artesanais franceses montada no ateliê da Janaína, em Paris',
  },
  nav: {
    skip: 'Pular para o conteúdo',
    homeAria: 'PariSabor, voltar ao início',
    atelier: 'O ateliê',
    dates: 'Datas',
    janaina: 'Janaína',
    gift: 'Presente',
    groups: 'Grupos',
    faq: 'Dúvidas',
    book: 'Reservar',
    navigation: 'Navegação principal',
    openMenu: 'Abrir o menu',
    close: 'Fechar o menu',
    language: 'Idioma',
    switchTo: (name: string) => `Ver o site em ${name}`,
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    email: 'E-mail',
    talk: 'Falar com a Janaína',
  },
  /** Los mensajes que llegan escritos al WhatsApp de Janaína. */
  wa: {
    generic: 'Olá Janaína! Tenho uma dúvida sobre o ateliê de queijos.',
    gift: (people: number) => `Olá Janaína! Quero um vale-presente para o ateliê de queijos para ${people} ${people === 1 ? 'pessoa' : 'pessoas'}.`,
    groups: 'Olá Janaína! Quero organizar um ateliê de queijos privado (empresa, aniversário ou despedida).',
    notify: (name: string) => `Olá Janaína! Quero ser avisado(a) quando abrir: ${name}.`,
    waitlist: (session: string) => `Olá Janaína! Quero entrar na lista de espera do ateliê de queijos de ${session}.`,
    otherDate: 'Olá Janaína! Quero fazer o ateliê de queijos, mas nenhuma das datas serve para mim. Tem outras?',
  },
  hero: {
    eyebrow: 'PariSabor · Paris',
    titleA: 'Ateliê de queijos',
    titleB: 'artesanais franceses',
    text: 'Aprenda a degustar, cortar e harmonizar os queijos franceses como um parisiense, em um ateliê exclusivo para até 8 pessoas.',
    duration: '1h30',
    group: 'máx. 8 pessoas',
    price: (value: number) => `${value} € por pessoa`,
    perPerson: 'por pessoa',
    book: 'Reservar minha vaga',
    dates: 'Ver as datas',
    next: 'Próxima sessão:',
    photoAlt: 'Tábua de queijos franceses com pães, uvas, nozes e damascos, montada no ateliê',
    byline: 'Com a Janaína, do @parisabor',
  },
  /** La franja de Natal bajo el héroe (se enciende y se apaga en `CHRISTMAS_BANNER`, en `business.ts`). */
  christmas: {
    text: 'Presente de Natal para quem ama Paris',
    cta: 'Vale-presente',
  },
  stories: {
    label: 'Ver o ateliê em stories',
    title: 'Ateliê',
    close: 'Fechar',
    previous: 'Anterior',
    next: 'Próximo',
    pause: 'Pausar',
    play: 'Continuar',
    cta: 'Reservar minha vaga',
    items: [
      { kicker: 'A mesa', caption: 'Uma mesa só para 8 pessoas, em Paris.' },
      { kicker: 'Os acompanhamentos', caption: 'Pão de fermentação natural, frutas secas e geleias.' },
      { kicker: 'A tábua', caption: 'No final, você monta a sua e leva para casa.' },
      { kicker: 'Janaína', caption: 'Há mais de 20 anos em Paris, ela conduz cada degustação.' },
    ],
  },
  quiz: {
    eyebrow: 'Teste rápido',
    title: 'Qual queijo francês tem a sua cara?',
    lead: '3 perguntas, 20 segundos. No ateliê, você prova o resultado.',
    start: 'Começar o teste',
    step: (n: number, total: number) => `Pergunta ${n} de ${total}`,
    back: 'Voltar',
    questions: [
      { q: 'Um domingo perfeito em Paris é…', options: ['Piquenique à beira do Sena', 'Café com croissant, sem pressa', 'Fugir para os Alpes', 'Bistrô com um tinto encorpado'] },
      { q: 'Na mesa, você prefere sabores…', options: ['Suaves e amanteigados', 'Frescos e cítricos', 'Frutados, com notas de nozes', 'Intensos, sem medo'] },
      { q: 'Para acompanhar, você escolhe…', options: ['Mel e figos', 'Nozes e damascos', 'Pão de campagne e maçã', 'Pão de centeio e cominho'] },
    ],
    yours: 'O seu queijo é',
    examples: 'Para provar',
    pairing: 'Harmonize com',
    results: {
      fleurie: { name: 'Casca florida', cheeses: 'Brie de Meaux, Camembert de Normandie', text: 'Cremoso, amanteigado e acolhedor. O clássico que todo mundo ama e pouca gente sabe cortar direito.', pairing: 'Pão de campagne, maçã e uma taça de champagne.' },
      lavee: { name: 'Casca lavada', cheeses: 'Époisses, Munster, Maroilles', text: 'Intenso por fora, derretido por dentro. Você não tem medo de aroma, e isso é ótimo.', pairing: 'Pão de centeio, cominho e um Gewurztraminer.' },
      pressee: { name: 'Pasta prensada', cheeses: 'Comté, Beaufort, Tomme de Savoie', text: 'Frutado, com notas de nozes, e cada vez melhor com o tempo. Um queijo de montanha, paciente e generoso.', pairing: 'Nozes, damascos e um vin jaune do Jura.' },
      chevre: { name: 'Queijo de cabra', cheeses: 'Sainte-Maure de Touraine, Valençay, Crottin de Chavignol', text: 'Fresco, leve e cheio de personalidade. Combina com sol, Sena e boas conversas.', pairing: 'Mel, figos e um Sancerre bem gelado.' },
      bleu: { name: 'Queijo azul', cheeses: "Roquefort, Fourme d'Ambert, Bleu d'Auvergne", text: 'Marcante e inesquecível: quem prova não esquece.', pairing: 'Pera, mel e um Sauternes.' },
    },
    book: 'Provar no ateliê',
    share: 'Compartilhar',
    shareText: (name: string) => `Meu queijo francês é: ${name}! Descubra o seu no ateliê de queijos da Janaína em Paris.`,
    copied: 'Link copiado!',
    again: 'Refazer o teste',
  },
  live: {
    eyebrow: 'O ateliê',
    title: 'O que você vai viver',
    lead: '1h30 de imersão nos queijos artesanais franceses, em pequeno grupo e em parceria com a prestigiada Fromagerie Marie-Anne Cantin.',
    items: [
      { title: 'As grandes famílias de queijos franceses', text: 'Pasta mole, casca lavada, pasta prensada, cabra, azul: aprenda a reconhecer cada família e o que esperar dela.' },
      { title: 'Como cortar cada queijo segundo a sua textura', text: 'Cada formato tem o seu corte. Você aprende o gesto certo para que cada pedaço tenha casca e coração.' },
      { title: 'Harmonizações com pães, frutas secas e acompanhamentos', text: 'Pão de fermentação natural, nozes, figos, damascos e geleias: as combinações que realçam cada queijo.' },
      { title: 'Você monta a sua própria tábua de queijos para levar', text: 'No final, você monta a sua tábua com tudo o que aprendeu e leva para casa, pronta para impressionar.' },
    ],
    photoAlt: 'Mesa do ateliê com queijos, pães de fermentação natural, frutas secas e flores de mimosa',
    photoAlt2: 'Detalhe da tábua: queijo de cabra em pirâmide, comté e pães',
  },
  host: {
    eyebrow: 'Com quem',
    title: 'Janaína Pedroza de Macedo',
    role: 'Franco-brasileira, há mais de 20 anos em Paris, curadora de experiências gastronômicas.',
    text: 'Formada em cozinha francesa (CAP Cuisine) e especialista no savoir-vivre à la française, a Janaína mostra todos os dias no @parisabor a Paris que os parisienses comem. No ateliê, ela conduz a degustação em pequeno grupo, com a calma de quem quer que você saia sabendo fazer sozinho.',
    partner: 'Em parceria com a Fromagerie Marie-Anne Cantin',
    partnerNote: 'Queijaria artesanal de Paris, referência em queijos afinados.',
    followers: 'seguidores no Instagram',
    verified: 'Conta verificada',
    photoAlt: 'Janaína Pedroza de Macedo, do PariSabor, em frente a uma entrada do metrô de Paris',
    instagram: 'Ver o @parisabor',
    post: 'Ver o ateliê no Instagram',
    postNote: 'Fotos e vídeo de uma sessão',
  },
  dates: {
    eyebrow: 'Agenda',
    title: 'Próximas datas',
    lead: 'No máximo 8 pessoas por sessão. Escolha a sua data e garanta o seu lugar.',
    left: (left: number, max: number) => (left >= max ? `${left} vagas disponíveis` : left === 1 ? 'resta 1 vaga' : `restam ${left} vagas`),
    /** La barra de plazas de la próxima sesión, para lectores de pantalla. */
    taken: (taken: number, max: number) => `${taken} de ${max} vagas já reservadas`,
    full: 'Esgotado',
    waitlist: 'Lista de espera',
    book: 'Reservar',
    none: 'As próximas datas serão anunciadas em breve. Fale com a Janaína para ser avisado(a).',
    other: 'Nenhuma data serve para você?',
    otherCta: 'Pedir outra data',
    parisTime: 'Horários de Paris',
  },
  booking: {
    eyebrow: 'Reserva',
    title: 'Reserve a sua vaga',
    lead: 'Leva 30 segundos. Ao enviar, o WhatsApp abre com a mensagem pronta e a Janaína confirma a sua vaga.',
    stepsTitle: 'Como funciona',
    steps: [
      { title: 'Escolha a data', text: 'Veja as próximas sessões e as vagas que restam.' },
      { title: 'Envie pelo WhatsApp', text: 'A mensagem já vai pronta: é só tocar em enviar.' },
      { title: 'A Janaína confirma', text: 'Ela responde com o endereço e os detalhes do pagamento.' },
    ],
    includedTitle: 'O que está incluído',
    included: ['Degustação guiada de 1h30 com a Janaína', 'Queijos artesanais, em parceria com a Fromagerie Marie-Anne Cantin', 'Pães, frutas secas e acompanhamentos', 'A sua tábua de queijos para levar'],
    sessionLeft: (left: number) => (left === 1 ? 'Resta 1 vaga nesta data.' : `Restam ${left} vagas nesta data.`),
    remembered: 'Usamos os dados da sua última visita.',
    session: 'Sessão',
    sessionPlaceholder: 'Escolha uma data',
    otherDate: 'Outra data (a combinar)',
    full: 'esgotado',
    people: 'Quantas pessoas?',
    peopleUnit: (count: number) => (count === 1 ? '1 pessoa' : `${count} pessoas`),
    fewer: 'Menos uma pessoa',
    more: 'Mais uma pessoa',
    total: (value: string) => `Total: ${value}`,
    overLimit: (left: number) => `Nesta data ${left === 1 ? 'resta 1 vaga' : `restam ${left} vagas`}. Escolha outra data ou diminua o número de pessoas.`,
    groupHint: 'Mais de 8 pessoas? Veja o ateliê privado para grupos.',
    name: 'Seu nome',
    namePlaceholder: 'Nome e sobrenome',
    phone: 'Seu telefone (WhatsApp)',
    phonePlaceholder: '+55 11 91234-5678',
    language: 'Idioma preferido',
    gift: 'É um presente?',
    yes: 'Sim',
    no: 'Não',
    submit: 'Enviar reserva pelo WhatsApp',
    note: 'Nada é cobrado agora. O endereço e o pagamento são combinados na confirmação.',
    payTitle: 'Prefere garantir já?',
    pay: 'Pagar online',
    payNote: 'Pagamento seguro com cartão. Indique a data escolhida no pagamento.',
    errors: {
      session: 'Escolha uma data.',
      people: 'Não há vagas suficientes nesta data.',
      name: 'Diga-nos o seu nome.',
      phone: 'Precisamos de um telefone para confirmar.',
      gift: 'Diga se é um presente.',
    },
    langNames: { pt: 'Português', fr: 'Francês', en: 'Inglês' } as Record<SiteLang, string>,
    message: (f: { session: string; people: string; name: string; phone: string; language: string; gift: string }) =>
      [
        'Olá Janaína! Quero reservar o ateliê de queijos.',
        `Data: ${f.session}`,
        `Pessoas: ${f.people}`,
        `Nome: ${f.name}`,
        `Telefone: ${f.phone}`,
        `Idioma: ${f.language}`,
        `Presente: ${f.gift}`,
      ].join('\n'),
  },
  gift: {
    eyebrow: 'Vale-presente',
    title: 'Ofereça o ateliê de presente',
    text: 'Para quem ama queijo, Paris ou os dois. Você escolhe para quantas pessoas, e quem recebe escolhe a data depois.',
    points: ['Vale-presente personalizado com o nome de quem recebe', 'A data é escolhida depois, entre as sessões abertas', 'Perfeito para aniversários, casais e viagens a Paris'],
    pointsTodo: [true, false, false],
    people: 'Para quantas pessoas?',
    cta: 'Pedir o vale-presente',
  },
  groups: {
    eyebrow: 'Grupos e eventos privados',
    title: 'Um ateliê só para o seu grupo',
    text: 'Ateliê privado para empresas, aniversários e despedidas, com o mesmo cuidado e um programa adaptado ao seu evento.',
    items: [
      { title: 'Empresas', text: 'Team building, clientes e eventos de equipe.' },
      { title: 'Aniversários', text: 'Uma celebração diferente, em volta de uma bela tábua.' },
      { title: 'Despedidas', text: 'De solteira, de solteiro ou de Paris.' },
    ],
    cta: 'Pedir um orçamento',
  },
  /** Las próximas experiencias: una sola línea con «avise-me» (los `items` van en el mensaje de WhatsApp). */
  more: {
    soon: 'Em breve:',
    line: 'jantares, etiqueta à mesa e passeios',
    notify: 'Quero ser avisado(a)',
    items: [
      { title: 'Jantares guiados', text: 'Uma noite num restaurante parisiense escolhido a dedo, com a Janaína à mesa.' },
      { title: 'Etiqueta à mesa', text: 'O savoir-vivre à la française: como se portar num jantar francês sem errar.' },
      { title: 'Passeios gastronômicos', text: 'Os endereços gourmands de Paris, a pé, com paradas para provar.' },
    ],
  },
  reviews: {
    eyebrow: 'Depoimentos',
    title: 'Quem já viveu o ateliê',
    lead: 'As palavras de quem já montou a sua tábua com a Janaína.',
    /**
     * PENDIENTE: depoimentos reales (con permiso), en los tres idiomas. Mientras la lista esté
     * vacía, la sección no sale; con el primero, aparece sola. Ejemplo:
     * `{ quote: 'As palavras da pessoa…', name: 'Nome', place: 'Cidade · mês do ateliê' }`
     */
    items: [] as Review[],
  },
  faq: {
    eyebrow: 'Dúvidas',
    title: 'Perguntas frequentes',
    more: 'Ficou alguma dúvida?',
    items: [
      { q: 'Onde acontece o ateliê?', a: 'Em Paris. O endereço exato é enviado junto com a confirmação da reserva.', todo: true },
      { q: 'Quanto custa e o que está incluído?', a: '98 € por pessoa: 1h30 de ateliê, a degustação de queijos com pães, frutas secas e acompanhamentos, e a tábua que você monta e leva para casa.' },
      { q: 'Tem vinho?', a: 'Os queijos são servidos com pães, frutas secas e acompanhamentos. Se haverá vinho em harmonização, e se ele está incluído no valor, será confirmado em breve.', todo: true },
      { q: 'Tenho intolerância à lactose ou estou grávida. Posso participar?', a: 'Avise na reserva. Muitos queijos maturados têm pouquíssima lactose, mas cada caso é um caso. Na gravidez, os queijos de leite cru são desaconselhados: a Janaína indica antes o que pode ou não ser provado.', todo: true },
      { q: 'Em que idioma é o ateliê?', a: 'Em português. Também pode ser em francês ou em inglês: indique o idioma preferido na reserva.', todo: true },
      { q: 'Qual é a política de cancelamento?', a: 'As condições de cancelamento e de troca de data são enviadas junto com a confirmação da reserva.', todo: true },
      { q: 'Crianças podem participar?', a: 'O ateliê é pensado para adultos. Para vir com crianças ou adolescentes, fale antes com a Janaína pelo WhatsApp.', todo: true },
      { q: 'Posso dar o ateliê de presente?', a: 'Sim! Peça um vale-presente pelo WhatsApp: você escolhe para quantas pessoas e quem recebe escolhe a data depois.' },
      { q: 'Como chegar?', a: 'O ateliê fica em Paris, perto do metrô. As indicações para chegar são enviadas com a confirmação.', todo: true },
    ] as Faq[],
  },
  links: {
    name: 'Janaína Pedroza de Macedo',
    bio: 'Experiências gastronômicas em Paris',
    book: 'Ateliê de queijos: reservar',
    gift: 'Vale-presente',
    dinners: 'Jantares guiados (em breve)',
    blog: 'Blog PariSabor',
    whatsapp: 'WhatsApp',
    next: 'Próxima sessão:',
    site: 'Ver tudo sobre o ateliê',
  },
  footer: {
    tagline: 'Experiências gastronômicas em Paris com Janaína.',
    contact: 'Contato',
    follow: 'Siga',
    more: 'Mais',
    links: 'Links',
    blog: 'Blog PariSabor',
    rights: (year: number) => `© ${year} PariSabor`,
    privacy: 'Privacidade',
    credit: 'Site por',
  },
  privacy: {
    title: 'Privacidade',
    updated: 'Atualizado em outubro de 2026.',
    sections: [
      { title: 'Quem somos', text: 'PariSabor é a marca de Janaína Pedroza de Macedo, em Paris. Contato: contato@parisabor.com.', todo: 'Dados da empresa (SIRET): a completar.' },
      { title: 'O que acontece com os seus dados', text: 'O formulário de reserva não envia nada a nenhum servidor: ele apenas abre o WhatsApp com a mensagem pronta. Os dados que você nos envia por lá (nome, telefone, data) servem somente para organizar a sua reserva e não são compartilhados com ninguém.' },
      { title: 'Pagamento online', text: 'Se você pagar online, o pagamento é feito diretamente na plataforma de pagamento (Stripe). Não vemos nem guardamos os dados do seu cartão.' },
      { title: 'Os seus direitos', text: 'Você pode pedir para ver, corrigir ou apagar os seus dados escrevendo para contato@parisabor.com, e reclamar junto à CNIL (cnil.fr).' },
      { title: 'Cookies', text: 'Este site não usa cookies de publicidade nem de estatísticas. Ele só guarda no seu navegador uma cópia do próprio site para carregar mais rápido na próxima visita.' },
    ] as LegalSection[],
  },
  notFound: {
    title: 'Esta página não existe',
    text: 'O link pode estar antigo ou ter mudado. No início você encontra o ateliê, as datas e a reserva.',
    home: 'Ir para o início',
  },
  error: {
    title: 'Algo não carregou bem',
    text: 'Tente de novo em um instante. Se estiver com pressa, fale direto com a Janaína pelo WhatsApp.',
    retry: 'Tentar de novo',
  },
  photoTodo: 'Foto a substituir',
  textTodo: 'a completar',
}

export type Texts = typeof pt

const TEXTS: Record<SiteLang, Texts> = { pt, fr, en }

export const textsFor = (lang: SiteLang): Texts => TEXTS[lang] ?? pt
