/*
 * Ilustraciones de los platos (SVG dibujado a mano, vista desde arriba). No hay fotos del
 * restaurante: cuando Ana mande las suyas, se cambian por <img>.
 * Lo usan app.js y fuente/og.html.
 */
;(function () {
  // Pseudoaleatorio con semilla: los granos y frijoles quedan siempre en el mismo sitio.
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

  const sombra = '<ellipse cx="100" cy="106" rx="92" ry="90" fill="#5b3a1a" opacity=".1"/>'
  const plato = (borde = '#ecdfc8') => `${sombra}
    <circle cx="100" cy="100" r="92" fill="#fffdf8" stroke="${borde}" stroke-width="2"/>
    <circle cx="100" cy="100" r="77" fill="none" stroke="#f2e8d6" stroke-width="2"/>`

  function bandeja() {
    const r = rnd(7)
    let frijoles = ''
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 15
      const x = 133 + Math.cos(a) * d, y = 64 + Math.sin(a) * d
      frijoles += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4.2" ry="2.8" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${r() > .5 ? '#9b4a2b' : '#86391f'}"/>`
    }
    let granos = ''
    for (let i = 0; i < 22; i++) {
      const x = 52 + r() * 46, y = 58 + r() * 26
      granos += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 3).toFixed(1)}" y2="${(y + 1.4).toFixed(1)}" stroke="#eadfcb" stroke-width="1.6" stroke-linecap="round"/>`
    }
    let carne = ''
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 16
      carne += `<circle cx="${(126 + Math.cos(a) * d).toFixed(1)}" cy="${(108 + Math.sin(a) * d * .8).toFixed(1)}" r="${(2.5 + r() * 2.5).toFixed(1)}" fill="${['#8b4a2d', '#a35a34', '#73391f'][i % 3]}"/>`
    }
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">${plato()}
      <circle cx="133" cy="64" r="25" fill="#e3d3b4"/><circle cx="133" cy="64" r="20" fill="#6e2f1a"/>${frijoles}
      <path d="M46 82c-5-17 9-32 29-32 18 0 30 9 30 23 0 13-12 21-29 23-14 2-26-3-30-14z" fill="#fff" stroke="#efe5d3" stroke-width="2"/>${granos}
      <path d="M66 98c2-11 13-17 24-14 10 3 15 12 11 21-4 8-15 11-25 8-8-3-11-9-10-15z" fill="#fff" stroke="#f1e6d2" stroke-width="1.5"/>
      <circle cx="84" cy="101" r="8.5" fill="#f2b632"/><circle cx="81.5" cy="98.5" r="2.6" fill="#fbe08f"/>
      ${carne}
      <g transform="rotate(-16 66 134)">
        <rect x="40" y="122" width="54" height="24" rx="9" fill="#bd6a2e"/>
        <rect x="40" y="122" width="54" height="9" rx="4.5" fill="#f1d39c"/>
        <path d="M50 134v9M60 134v9M70 134v9M80 134v9" stroke="#9c5222" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g transform="rotate(-28 134 142)">
        <ellipse cx="134" cy="136" rx="25" ry="8.5" fill="#e39a32" stroke="#b9691f" stroke-width="2"/>
        <ellipse cx="132" cy="152" rx="23" ry="8" fill="#eaa73e" stroke="#b9691f" stroke-width="2"/>
      </g>
      <g transform="rotate(12 160 104)">
        <path d="M150 84c14 4 20 18 16 34-2 6-6 6-7 1-3-12-6-21-12-28-3-4-1-8 3-7z" fill="#b5d377" stroke="#5e8a3a" stroke-width="2.4"/>
        <path d="M143 94c10 5 13 16 10 28-1 4-4 4-5 1-2-9-4-15-8-21-2-4 0-9 3-8z" fill="#c4dc8a" stroke="#5e8a3a" stroke-width="2.2"/>
      </g>
      <circle cx="101" cy="160" r="16" fill="#f3d58a" stroke="#d6b062" stroke-width="2"/>
      <path d="M92 155l18 0M92 162l18 0" stroke="#c9963f" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </svg>`
  }

  function sancocho() {
    const r = rnd(11)
    const mazorca = (cx, cy) => {
      let granos = ''
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        granos += `<circle cx="${(cx + Math.cos(a) * 11).toFixed(1)}" cy="${(cy + Math.sin(a) * 11).toFixed(1)}" r="3.4" fill="#f7d65a" stroke="#dcae2c" stroke-width="1"/>`
      }
      return `<circle cx="${cx}" cy="${cy}" r="16" fill="#e9bb35"/>${granos}<circle cx="${cx}" cy="${cy}" r="5.5" fill="#f2e3b0"/>`
    }
    let cilantro = ''
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, d = 18 + r() * 46
      const x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d
      cilantro += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(r() * 360)})"><circle cx="0" cy="-3" r="3" fill="#4f8b3b"/><circle cx="3" cy="2" r="3" fill="#5f9c45"/><circle cx="-3" cy="2" r="3" fill="#4f8b3b"/></g>`
    }
    let brillo = ''
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2, d = 30 + r() * 36
      brillo += `<ellipse cx="${(100 + Math.cos(a) * d).toFixed(1)}" cy="${(100 + Math.sin(a) * d).toFixed(1)}" rx="${(3 + r() * 4).toFixed(1)}" ry="2" fill="#f8d37a" opacity=".8"/>`
    }
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">${sombra}
      <circle cx="100" cy="100" r="92" fill="#c4553a"/>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#a5432c" stroke-width="3"/>
      <circle cx="100" cy="100" r="84" fill="none" stroke="#d9765a" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="76" fill="#eab552"/>
      <circle cx="100" cy="100" r="76" fill="none" stroke="#d99a36" stroke-width="3"/>${brillo}
      ${mazorca(76, 82)}${mazorca(128, 128)}
      <rect x="110" y="56" width="34" height="18" rx="8" transform="rotate(24 127 65)" fill="#f6efda" stroke="#e1d2ad" stroke-width="2"/>
      <rect x="56" y="118" width="32" height="17" rx="8" transform="rotate(-18 72 126)" fill="#f6efda" stroke="#e1d2ad" stroke-width="2"/>
      <ellipse cx="104" cy="106" rx="14" ry="11" fill="#e7c47c" stroke="#cfa457" stroke-width="2"/>
      <path d="M134 86c8-6 20-2 22 7 2 9-6 15-15 14-9-1-14-15-7-21z" fill="#dba36a" stroke="#b97f45" stroke-width="2"/>
      <path d="M96 140c6-5 16-3 18 4 1 7-6 11-12 10-7-1-10-10-6-14z" fill="#dba36a" stroke="#b97f45" stroke-width="2"/>
      ${cilantro}
    </svg>`
  }

  function empanadas() {
    const una = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})">
      <path d="M-34 8Q-34-30 0-30Q34-30 34 8Z" fill="#e2a03b" stroke="#bf7e24" stroke-width="2"/>
      <path d="M-30 4Q-30-26 0-26Q30-26 30 4" fill="none" stroke="#c4842a" stroke-width="5" stroke-dasharray=".1 7" stroke-linecap="round"/>
      <path d="M-18-6Q-10-16 6-17" fill="none" stroke="#f3c877" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    </g>`
    const r = rnd(3)
    let aji = ''
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 11
      aji += `<circle cx="${(100 + Math.cos(a) * d).toFixed(1)}" cy="${(100 + Math.sin(a) * d).toFixed(1)}" r="${(1.3 + r() * 1.4).toFixed(1)}" fill="${['#d2453a', '#f6f1e4', '#2f6b2a'][i % 3]}"/>`
    }
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">${plato('#d9e2f2')}
      <circle cx="100" cy="100" r="86" fill="none" stroke="#24498a" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round" opacity=".55"/>
      ${una(100, 52, 0)}${una(144, 128, 120)}${una(56, 128, 240)}
      <circle cx="100" cy="100" r="19" fill="#fff" stroke="#e6dac4" stroke-width="2"/>
      <circle cx="100" cy="100" r="14" fill="#79a94b"/>${aji}
      <path d="M150 62a16 16 0 0 1 0 26z" fill="#9cc65b" stroke="#5e8a3a" stroke-width="2"/>
    </svg>`
  }

  function jugo() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="182" rx="52" ry="9" fill="#5b3a1a" opacity=".1"/>
      <path d="M128 18l-14 44" stroke="#c8433a" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 52h84l-10 124a8 8 0 0 1-8 7H76a8 8 0 0 1-8-7z" fill="#fffdf8" stroke="#e1d4bd" stroke-width="3"/>
      <path d="M63 78h74l-7 96a6 6 0 0 1-6 5H76a6 6 0 0 1-6-5z" fill="#f2b632"/>
      <path d="M63 78h74l-1 12c-12 5-24-3-36 2s-24 3-36-2z" fill="#f7cd63"/>
      <path d="M78 96l-3 70" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>
      <circle cx="148" cy="62" r="20" fill="#f7cd63" stroke="#e0a42a" stroke-width="3"/>
      <path d="M148 46v32M132 62h32M137 51l22 22M159 51l-22 22" stroke="#e0a42a" stroke-width="1.6" opacity=".7"/>
      <circle cx="148" cy="62" r="5" fill="#fff3c9"/>
    </svg>`
  }

  window.ART = { bandeja: bandeja(), sancocho: sancocho(), empanadas: empanadas(), jugo: jugo() }
})()
