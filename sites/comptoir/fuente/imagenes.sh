#!/bin/sh
# Fotos del Comptoir, de punta a punta:
#   1. descarga los originales (Google Maps y Zenchef) en fuente/originales/
#   2. amplía con Real-ESRGAN las que usa la web (mejorar_fotos.py → fuente/maestras/, PNG sin pérdida)
#   3. saca las webp de 800, 1400 y 2000 px en ../public/img/comptoir (variantes.sh)
# Necesita los modelos de Real-ESRGAN en $MODELOS (ver mejorar_fotos.py). Sin ellos, salta el paso 2
# y las variantes salen de los originales.
set -e
cd "$(dirname "$0")"
orig=originales
mkdir -p "$orig"

G=https://lh3.googleusercontent.com/p
Z=https://ugc.zenchef.com/3/4/9/5/6/6/1/5/0/3
while read -r name url; do
  [ -z "$name" ] && continue
  ext=${url##*.}; case "$ext" in png|jpg) ;; *) ext=jpg ;; esac
  [ -f "$orig/$name.$ext" ] || curl -sfL --max-time 60 -o "$orig/$name.$ext" "$url"
done <<EOF
salle-bar $G/AF1QipOGaKjgDJWZ5RnFuD7BjqgtucSnr4UVfpWkY9ek=s1600-w1600
ceviche-salade $G/AF1QipPD5RK7vr_EjGqq0L_KcnJTLylTxZGZqPspGZAO=s1600-w1600
facade-jour $G/AF1QipP0bpIXV__4TIttL4CBaws_r0PtRiv9_uhrEUBN=s1600-w1600
ceviche-crevettes $G/AF1QipNfmF-Bwz9PX3Q4Vc1AgAO2j56c_tIXQcyLFQ3H=s1600-w1600
epicerie $G/AF1QipNagOGAwr2vrtMR0h-88Q8vML0ANq9q_rIEdIEZ=s1600-w1600
ceviche-charbon $G/AF1QipPgX3q_-PhVgQmImdNg_CMTJBc0-lMlWCG2Yg6E=s1600-w1600
ceviche-agrumes $G/AF1QipPEGVO6BW-hLAHvQBAO9KpCVwWjrftS6Y9n4Jd_=s1600-w1600
salle-claire $G/AF1QipNw6y8p-mlX4zrATtXr4xPF3Xsqu-NubVnNUZu_=s1600-w1600
salle-tableaux-petit $Z/1/8/7/1517838172_292/b26baa1f2516d3466540f11db803c111.jpg
salle-comptoir $Z/1/8/7/1517838172_302/e18dc41254d4e15c413ebb91c657866f.jpg
chefs $Z/1/8/7/1517838188_263/8b2bd09368a9ae2aeed968791d1aa74a.jpg
vins-primeurs $Z/1/8/7/1517838189_305/64310560d38392b05b089e31a4caf7d4.jpg
ceviche-classique $Z/1/8/7/1517838326_197/8bf22b3a845b7d60be595f821cb383b3.png
dressage-causa $Z/1/8/7/1517838326_114/48e22c9ca29f108f0367c167fffe09c2.png
salle-tableaux $Z/1/8/7/1517838461_221/daadb2623995a08dd12480d93889f166.jpg
tacos-thon $Z/9/7/8/1591029313_177/c7a3ce7249077db84da6866ab2319373.png
causa-thon $Z/9/7/8/1591029314_125/471f42546987e820da3ea414ee28ee23.png
poke-bowl $Z/9/7/8/1591029316_418/b2294267204fa1f93e8c7d24ac9d1a8c.png
ceviche-emporter $Z/9/7/8/1591029318_300/87748afc8f9e71c32082e79713d35d2a.png
verrine $Z/9/7/8/1591029331_417/9aff8000cdf1a97979861563f45ebeb7.png
terrasse-soir $Z/9/7/8/1591029432_414/10452476246f4ba6763f84f3ff78fda0.jpg
salle-soir $Z/9/7/8/1644418767_244/e15191387d941f6b3c4c9a54888c2055.png
facade-terrasse $Z/9/7/8/1644418868_131/7797549008f10bb76dc675ff973e5b9a.png
pisco-sour $Z/9/7/8/1644419309_414/2b47d40c97cc782e0cc7ef9f7a11fa0a.png
EOF

# las que salen en la web
USADAS="ceviche-charbon ceviche-crevettes chefs terrasse-soir ceviche-classique causa-thon tacos-thon pisco-sour poke-bowl
  facade-terrasse dressage-causa salle-tableaux salle-soir vins-primeurs salle-claire ceviche-salade"
if [ -n "$MODELOS" ]; then python3 -I mejorar_fotos.py "$orig" maestras "$MODELOS" $USADAS; fi
./variantes.sh maestras "$orig" $USADAS ceviche-agrumes salle-bar
