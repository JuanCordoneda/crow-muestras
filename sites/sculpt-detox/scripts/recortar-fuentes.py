"""
Recorta los ejes de las tipografías variables a lo que de verdad usa la web.

Fraunces se descarga con el eje de peso de 100 a 900 aunque el CSS solo pide dos pesos: 600 para
todos los titulares y 500 para la línea en cursiva del héroe. Las interpolaciones que nadie pinta
son casi la mitad del fichero, y la cursiva es lo más pesado que descarga la portada.

- Redonda: se queda con el eje limitado a 500–600 (sigue siendo variable).
- Cursiva: se convierte en una instancia fija de peso 500.

No se recortan caracteres: el juego latino entero se queda, así que cambiar un titular más adelante
—o traducirlo a otro idioma— no deja letras sin dibujar.

Lo llama `scripts/fonts.mjs` si encuentra Python con fontTools; si no está, la web funciona igual
con los ficheros tal como los da Google. Uso: python3 scripts/recortar-fuentes.py <carpeta>
"""
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
except ImportError:  # pragma: no cover
    print('[fuentes] fontTools no está instalado (pip install fonttools brotli): no se recortan los ejes.')
    sys.exit(0)

folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/fonts')

# fichero → qué hacer con el eje de peso
PLAN = {
    'Fraunces-500-700-latin.woff2': {'wght': (500, 600)},
    'Fraunces-500-700-latin-ext.woff2': {'wght': (500, 600)},
    'Fraunces-500-700-italic-latin.woff2': {'wght': 500},
    'Fraunces-500-700-italic-latin-ext.woff2': {'wght': 500},
}

saved = 0
for name, limits in PLAN.items():
    path = folder / name
    if not path.exists():
        continue
    before = path.stat().st_size
    font = TTFont(path)
    if 'fvar' not in font:
        continue
    axes = {axis.axisTag: (axis.minValue, axis.maxValue) for axis in font['fvar'].axes}
    # Ya recortado (una segunda pasada no tiene nada que hacer).
    if axes.get('wght') in ((500, 600), None) and isinstance(limits.get('wght'), tuple):
        continue
    trimmed = instancer.instantiateVariableFont(font, limits, inplace=False, updateFontNames=False)
    trimmed.flavor = 'woff2'
    trimmed.save(path)
    after = path.stat().st_size
    saved += before - after
    print(f'[fuentes] {name}: {before // 1024} kB → {after // 1024} kB')

print(f'[fuentes] {saved // 1024} kB menos en tipografías' if saved else '[fuentes] nada que recortar')
