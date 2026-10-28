// Máscara del pelo para el probador de rubios («Trouvez votre blond»): blanco = pelo (cálido y claro),
// transparente = pared gris y ropa azul. Así el cambio de tono solo tiñe el pelo.
// Uso: node scripts/mascara-pelo.mjs [foto-original] [salida]   (por defecto img/blonds-1600.webp → img/blonds-mascara.png: misma foto que muestra la web)
import sharp from "sharp";
const [src = "img/blonds-1600.webp", out = "img/blonds-mascara.png"] = process.argv.slice(2);
const W = 1600;
const { data, info } = await sharp(src).rotate().resize(W, W, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const a = Buffer.alloc(info.width * info.height);
for (let i = 0, p = 0; i < a.length; i++, p += 3) {
  const r = data[p], g = data[p + 1], b = data[p + 2], lum = .3 * r + .59 * g + .11 * b, warm = r - b;
  // rampa suave en vez de corte seco: bordes del pelo naturales
  const t = Math.min(1, Math.max(0, (warm - 10) / 28)) * Math.min(1, Math.max(0, (lum - 45) / 50));
  a[i] = Math.round(t * 255);
}
const alpha = await sharp(a, { raw: { width: info.width, height: info.height, channels: 1 } }).blur(2.2).toColourspace("b-w").raw().toBuffer();
await sharp({ create: { width: info.width, height: info.height, channels: 3, background: "#fff" } })
  .joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
  .png({ compressionLevel: 9 }).toFile(out);
console.log("máscara:", out);
