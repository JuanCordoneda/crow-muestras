// Convierte las fotos originales de `fotos/` (jpg, png, webp, tif, heic) en webp nítidos para la web:
// img/<nombre>-640.webp … -3200.webp, y escribe img/fotos.js con la proporción de cada foto. Con eso la
// web calcula qué tamaño necesita cada caja (también con object-fit: cover y en retina) y nunca estira
// una foto. Uso: npm run fotos  (o: npm run fotos -- nombre)
import sharp from "sharp";
import { readdirSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, basename } from "node:path";

const root = new URL("../", import.meta.url);
const SRC = new URL("fotos/", root), OUT = new URL("img/", root);
export const WIDTHS = [640, 1024, 1600, 2400, 3200];
// Fotos del hero: además, recorte vertical 9:16 para móviles (punto de interés en % x, % y),
// así en el teléfono no se estira una foto horizontal para llenar la pantalla
const VERTICAL = { "hero-brune": [62, 30], "lissage": [50, 40], "blonds": [50, 35], "brushing-blond": [60, 40] };
const V_WIDTHS = [720, 1080, 1440];
const MANIFEST = new URL("fotos.js", OUT);
let man = {};
try { man = JSON.parse(readFileSync(MANIFEST, "utf8").replace(/^[^{]*/, "").replace(/;\s*$/, "")); } catch {}
mkdirSync(OUT, { recursive: true });

const only = process.argv.slice(2);
const files = readdirSync(SRC).filter(f => /\.(jpe?g|png|webp|tiff?|heic|avif)$/i.test(f) && (!only.length || only.includes(basename(f, extname(f)))));
if (!files.length) console.log("No hay fotos en fotos/ (o ninguna con ese nombre).");

for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const img = sharp(new URL(f, SRC).pathname, { failOn: "none" }).rotate(); // rotate(): respeta la orientación de la foto del móvil
  const meta = await img.metadata(), swap = (meta.orientation || 1) >= 5;
  const width = swap ? meta.height : meta.width, height = swap ? meta.width : meta.height;
  man[name] = +(width / height).toFixed(4);
  const warn = width < 1600 ? `  ⚠ solo ${width}px de ancho: pedir la foto original (sin pasar por WhatsApp)` : "";
  for (const w of WIDTHS) {
    await img.clone()
      .resize({ width: w, withoutEnlargement: true, kernel: "lanczos3" })
      .sharpen({ sigma: 0.45 })
      .webp({ quality: w <= 1024 ? 82 : 78, smartSubsample: true, effort: 5 })
      .toFile(new URL(`${name}-${w}.webp`, OUT).pathname);
  }
  if (VERTICAL[name]) {
    const [fx, fy] = VERTICAL[name], cw = Math.min(width, Math.round(height * 9 / 16)), ch = Math.min(height, Math.round(cw * 16 / 9));
    const left = Math.round((width - cw) * fx / 100), top = Math.round((height - ch) * fy / 100);
    const crop = img.clone().extract({ left, top, width: cw, height: ch });
    for (const w of V_WIDTHS) await crop.clone().resize({ width: w, withoutEnlargement: true, kernel: "lanczos3" }).sharpen({ sigma: 0.45 })
      .webp({ quality: 80, smartSubsample: true, effort: 5 }).toFile(new URL(`${name}-v-${w}.webp`, OUT).pathname);
    man[`${name}-v`] = +(9 / 16).toFixed(4);
  }
  console.log(`✓ ${name} (${width}px)${warn}`);
}
writeFileSync(MANIFEST, `/* Generado por npm run fotos: proporción (ancho / alto) de cada foto */\nwindow.FOTOS = ${JSON.stringify(man)};\n`);
