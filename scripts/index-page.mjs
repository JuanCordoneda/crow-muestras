/**
 * `dist/index.html`: la portada del dominio de muestras, para uso interno de Crow Agency.
 * Una tarjeta por web con su miniatura (el og.jpg de cada una) y el enlace. Sin datos de clientes:
 * solo el nombre del negocio y su rubro.
 */
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const renderIndex = (sites) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Muestras · Crow Agency</title>
  <link rel="icon" href="/crow-icon.png" type="image/png" />
  <meta name="theme-color" content="#f6f3ef" />
  <style>
    :root{--bg:#f6f3ef;--card:#fff;--ink:#1b1714;--muted:#6f655d;--line:#e7e0d8;--brand:#f05a22;--brand-ink:#c2410c}
    @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141110;--card:#1f1b19;--ink:#f3eee9;--muted:#a89d94;--line:#332d29;--brand:#ff6a2e;--brand-ink:#ff8a57}}
    :root[data-theme="dark"]{--bg:#141110;--card:#1f1b19;--ink:#f3eee9;--muted:#a89d94;--line:#332d29;--brand:#ff6a2e;--brand-ink:#ff8a57}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;-webkit-font-smoothing:antialiased}
    main{max-width:1080px;margin:0 auto;padding:32px max(16px,env(safe-area-inset-right)) 48px max(16px,env(safe-area-inset-left))}
    header{display:flex;align-items:center;gap:12px;margin-bottom:28px}
    header img.icon{width:40px;height:40px;flex:none}
    header img.word{height:22px;width:auto}
    h1{margin:0 0 4px;font-size:clamp(26px,6vw,36px);line-height:1.15;letter-spacing:-.02em}
    .lead{margin:0 0 28px;color:var(--muted)}
    ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
    a.card{display:flex;flex-direction:column;height:100%;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .15s ease,border-color .15s ease}
    a.card:hover{transform:translateY(-2px);border-color:var(--brand)}
    a.card:focus-visible{outline:3px solid var(--brand);outline-offset:3px}
    .thumb{aspect-ratio:1200/630;background:var(--line);overflow:hidden}
    .thumb img{display:block;width:100%;height:100%;object-fit:cover}
    .body{display:flex;flex-direction:column;gap:2px;padding:14px 16px 16px;flex:1}
    .body strong{font-size:17px;line-height:1.3}
    .body span{color:var(--muted);font-size:14px}
    .body code{margin-top:auto;padding-top:10px;color:var(--brand-ink);font:600 13px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace}
    footer{margin-top:36px;color:var(--muted);font-size:13px}
  </style>
</head>
<body>
  <main>
    <header>
      <img class="icon" src="/crow-icon.png" alt="" width="40" height="40" />
      <img class="word" src="/crow-wordmark.png" alt="Crow Agency" width="147" height="22" />
    </header>
    <h1>Muestras</h1>
    <p class="lead">Webs de muestra en preparación. No indexadas en buscadores.</p>
    <ul>
${sites.map((site) => `      <li>
        <a class="card" href="/${site.name}/">
          <div class="thumb"><img src="/${site.name}/og.jpg" alt="" loading="lazy" width="1200" height="630" /></div>
          <div class="body">
            <strong>${esc(site.title)}</strong>
            <span>${esc(site.what)}</span>
            <code>/${site.name}/</code>
          </div>
        </a>
      </li>`).join('\n')}
    </ul>
    <footer>Crow Agency</footer>
  </main>
</body>
</html>
`
