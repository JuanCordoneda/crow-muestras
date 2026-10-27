// Regenera el bloque <!-- head:auto --> de index.html desde config.js: título, descripción, canonical,
// hreflang fr/pt, Open Graph (lo que ven WhatsApp y Facebook al compartir el enlace, que no ejecutan JS)
// y el schema.org «HairSalon» de cada salón. Uso: node scripts/sync-head.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const root = new URL("../", import.meta.url);
const ctx = { window: {} };
runInNewContext(readFileSync(new URL("config.js", root), "utf8"), ctx);
const C = ctx.window.LTB;

const url = C.url.replace(/\/?$/, "/");
const attr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const title = `${C.name} – Lissage brésilien & coiffure Paris 5e | ${C.tagline}`;
const desc = `Salon brésilien à Paris 5e et Clichy : lissage brésilien, blonds, coloration, épilation et soins. ${C.years} ans d'expertise. Réservez sur WhatsApp.`;
const image = url + "og.jpg";
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const salon = s => {
  const groups = new Map();
  for (const [d, h] of Object.entries(s.hours)) if (h) (groups.get(h.join("-")) || groups.set(h.join("-"), { h, days: [] }).get(h.join("-"))).days.push(DAY[d]);
  return {
    "@context": "https://schema.org", "@type": "HairSalon", "@id": `${url}#${s.id}`,
    name: `${C.name} ${s.label}`, alternateName: `${C.formerName} ${s.label}`, url, image,
    telephone: s.tel, knowsLanguage: ["fr", "pt"],
    address: { "@type": "PostalAddress", streetAddress: s.street, postalCode: s.zip, addressLocality: s.city, addressCountry: "FR" },
    openingHoursSpecification: [...groups.values()].map(g => ({ "@type": "OpeningHoursSpecification", dayOfWeek: g.days, opens: g.h[0], closes: g.h[1] })),
    sameAs: [`https://www.instagram.com/${C.instagram}/`],
  };
};

const head = `<!-- head:auto · generado desde config.js con \`node scripts/sync-head.mjs\` -->
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${url}">
<link rel="alternate" hreflang="pt" href="${url}?lang=pt">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(C.name)}">
<meta property="og:title" content="${attr(`${C.name} – ${C.tagline}`)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:locale" content="fr_FR">
<meta property="og:locale:alternate" content="pt_BR">
<script type="application/ld+json">${JSON.stringify(C.salons.map(salon)).replace(/</g, "\\u003c")}</script>
<!-- /head:auto -->`;

const file = new URL("index.html", root);
const html = readFileSync(file, "utf8");
const out = html.replace(/<!-- head:auto[\s\S]*?<!-- \/head:auto -->/, head);
if (out === html && !html.includes(head)) throw new Error("No encontré el bloque <!-- head:auto --> en index.html");
writeFileSync(file, out);
console.log(`head actualizado: ${title}`);
