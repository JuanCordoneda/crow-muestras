#!/bin/sh
# Webp de cada foto en 800, 1400 y 2000 px (+ -xl de hasta 2560 px si la maestra da para más),
# a partir de las maestras de mejorar_fotos.py; si una foto no se amplió, se usa el original.
# Uso: ./variantes.sh <carpeta_maestras> <carpeta_originales> nombre [nombre ...]
set -e
up=$1; orig=$2; shift 2
out="$(dirname "$0")/../public/img/comptoir"
for n in "$@"; do
  src=$(ls "$up/$n".png 2>/dev/null || ls "$orig/$n".* | head -1)
  w=$(magick identify -format '%w' "$src")
  # Lanczos para reducir y un enfoque suave: la foto queda nítida sin halos
  enc() { magick "$src" -auto-orient -strip -colorspace sRGB -filter Lanczos -resize "$1x>" -unsharp 0x0.6+0.5+0.008 -quality "$2" -define webp:method=6 "$out/$3"; }
  enc 800 80 "$n-800.webp"
  enc 1400 80 "$n-1400.webp"
  enc 2000 82 "$n.webp"
  if [ "$w" -gt 2200 ]; then enc 2560 82 "$n-xl.webp"; fi
  printf '%-20s %5spx  ' "$n" "$w"; ls -l "$out/$n"*.webp | awk '{printf "%s %dKB  ", $9, $5/1024}' | sed "s#$out/##g"; echo
done
