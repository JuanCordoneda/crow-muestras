/* LTB Concept · todo lo editable del sitio, en un solo lugar.
   - Nombre / bajada: cambiar `name` y `tagline` (y luego `node scripts/sync-head.mjs` para el <head>: título, SEO, schema).
   - Precios y duraciones: `price` (número, en €) y `min` (minutos). Mientras estén en null se ve «à partir de XX €» / «XX min».
   - Fotos avant/après e Instagram: poner la ruta de la foto (p. ej. "img/aa-lissage-1-avant.webp") en lugar de null. */
window.LTB = {
  name: "LTB Concept",
  tagline: "by La Touche Brésilienne",
  formerName: "La Touche Brésilienne",
  owner: "Dany",
  url: "https://ltbconcept.fr",            // dominio definitivo: a confirmar
  instagram: "ltbconcept",
  reviewsUrl: "https://www.google.com/maps/search/?api=1&query=La%20Touche%20Br%C3%A9silienne%20Paris", // ficha de Google: poner el enlace directo cuando se tenga
  proposal: "Dany",                         // franja «Proposition pour …» arriba; null para quitarla
  years: 18,
  rating: { value: 4.6, count: 1450 },

  salons: [
    {
      id: "paris", label: "Paris 5e",
      street: "41 rue Pierre Nicole", zip: "75005", city: "Paris",
      transport: { fr: "RER B · Port-Royal", pt: "RER B · Port-Royal" },
      phone: "07 83 00 86 92", tel: "+33783008692", wa: "33783008692",
      // 0 = dimanche … 6 = samedi
      hours: { 1: ["10:00", "18:30"], 2: ["10:00", "18:30"], 3: ["10:00", "18:30"], 4: ["10:00", "18:30"], 5: ["10:00", "18:30"], 6: ["10:00", "18:30"] },
    },
    {
      id: "clichy", label: "Clichy",
      street: "79 rue Henri Barbusse", zip: "92110", city: "Clichy",
      transport: { fr: "Hauts-de-Seine", pt: "Hauts-de-Seine" },
      phone: "06 24 44 38 50", tel: "+33624443850", wa: "33624443850",
      hours: { 1: ["10:00", "18:00"], 2: ["10:00", "18:30"], 3: ["10:00", "18:30"], 4: ["10:00", "18:30"], 5: ["10:00", "18:30"], 6: ["10:00", "18:30"] },
    },
  ],

  brands: ["L'Oréal Professionnel", "Schwarzkopf Professional"],

  categories: [
    { id: "cheveux", fr: "Cheveux", pt: "Cabelo" },
    { id: "esthetique", fr: "Esthétique", pt: "Estética" },
  ],

  services: [
    { id: "lissage", cat: "cheveux", img: "lissage", star: true, price: null, min: null,
      fr: "Lissage brésilien", pt: "Escova progressiva",
      badge: { fr: "Notre service star", pt: "Nosso carro-chefe" },
      desc: { fr: "Des cheveux lisses, doux et légers, sans frisottis, qui gardent leur mouvement naturel.", pt: "Cabelos lisos, macios e leves, sem frizz, mantendo o movimento natural." },
      tags: { fr: ["Anti-frisottis", "Brillance", "Toucher soyeux"], pt: ["Antifrizz", "Brilho", "Toque sedoso"] } },
    { id: "meches", cat: "cheveux", img: "blonds", price: null, min: null,
      fr: "Mèches & balayage", pt: "Mechas & balayage",
      badge: { fr: "Spécialiste des blonds", pt: "Especialista em loiros" },
      desc: { fr: "Blonds lumineux, balayages fondus, mèches sur mesure : notre signature.", pt: "Loiros luminosos, balayages esfumados, mechas sob medida: a nossa assinatura." },
      tags: { fr: ["Blond polaire", "Blond doré", "Balayage"], pt: ["Loiro platinado", "Loiro dourado", "Balayage"] } },
    { id: "coupe", cat: "cheveux", img: "brushing", price: null, min: null,
      fr: "Coupe & brushing", pt: "Corte & escova",
      desc: { fr: "Une coupe pensée pour vous et un brushing net, souple et lumineux.", pt: "Um corte pensado para você e uma escova impecável, leve e brilhante." } },
    { id: "coloration", cat: "cheveux", img: "coloration", price: null, min: null,
      fr: "Coloration", pt: "Coloração",
      desc: { fr: "Une couleur riche et durable, du plus naturel au plus audacieux, dans le respect de la fibre.", pt: "Uma cor intensa e duradoura, do mais natural ao mais ousado, respeitando a fibra." } },
    { id: "soins", cat: "cheveux", img: "soin", price: null, min: null,
      fr: "Soins capillaires", pt: "Tratamentos capilares",
      desc: { fr: "Hydratation, nutrition, reconstruction : des soins adaptés à la nature de vos cheveux.", pt: "Hidratação, nutrição, reconstrução: tratamentos adaptados ao seu tipo de cabelo." } },

    { id: "epilation", cat: "esthetique", img: "epilation", price: null, min: null,
      fr: "Épilation", pt: "Depilação",
      badge: { fr: "Dont épilation brésilienne", pt: "Inclui depilação brasileira" },
      desc: { fr: "Toutes zones, dont l'épilation brésilienne, avec douceur et précision.", pt: "Todas as áreas, inclusive a depilação brasileira, com delicadeza e precisão." } },
    { id: "manucure", cat: "esthetique", img: "manucure", price: null, min: null,
      fr: "Manucure & semi-permanent", pt: "Manicure & esmaltação em gel",
      desc: { fr: "Des mains soignées et une couleur impeccable qui dure.", pt: "Mãos bem cuidadas e uma cor impecável que dura." } },
    { id: "bbglow", cat: "esthetique", img: "bbglow", price: null, min: null,
      fr: "BB Glow", pt: "BB Glow",
      desc: { fr: "Un teint unifié et lumineux, effet bonne mine.", pt: "Uma pele uniforme e iluminada, com efeito glow." } },
    { id: "microneedling", cat: "esthetique", img: "microneedling", price: null, min: null,
      fr: "Microneedling", pt: "Microagulhamento",
      desc: { fr: "Un grain de peau affiné et un éclat retrouvé.", pt: "Uma textura de pele mais fina e o viço de volta." } },
    { id: "blanchiment", cat: "esthetique", img: "sourire", price: null, min: null,
      fr: "Blanchiment dentaire", pt: "Clareamento dental",
      desc: { fr: "Pour un sourire plus lumineux.", pt: "Para um sorriso mais luminoso." } },
    { id: "bronzage", cat: "esthetique", img: "bronzage", price: null, min: null,
      fr: "Bronzage", pt: "Bronzeamento",
      desc: { fr: "Un hâle doré et naturel, sans soleil.", pt: "Um bronzeado dourado e natural, sem sol." } },
  ],

  // Avant / Après: `before` y `after` = ruta de cada foto (null = recuadro «photo à remplacer»)
  beforeAfter: [
    { cat: "lissage", service: "lissage", before: null, after: null },
    { cat: "blonds", service: "meches", before: null, after: null },
    { cat: "lissage", service: "lissage", before: null, after: null },
    { cat: "esthetique", service: "bbglow", before: null, after: null },
    { cat: "blonds", service: "meches", before: null, after: null },
    { cat: "lissage", service: "lissage", before: null, after: null },
    { cat: "blonds", service: "meches", before: null, after: null },
    { cat: "esthetique", service: "microneedling", before: null, after: null },
  ],

  // Últimas publicaciones de Instagram (null = recuadro «photo à remplacer»)
  instagramPosts: [null, null, null, null, null, null],

  reviews: [
    { service: "lissage",
      fr: "Mes cheveux sont restés doux et soyeux, même après le premier shampoing.",
      pt: "Meu cabelo continuou macio e sedoso, mesmo depois da primeira lavagem." },
    { service: "epilation",
      fr: "La meilleure esthéticienne de Paris : douceur et précision.",
      pt: "A melhor esteticista de Paris: delicadeza e precisão." },
    { service: null,
      fr: "Salon propre, ambiance familiale, accueil adorable.",
      pt: "Salão limpo, ambiente familiar, atendimento adorável." },
  ],
};
