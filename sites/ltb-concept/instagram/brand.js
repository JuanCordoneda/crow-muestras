// Rellena el nombre del salón en los posts desde ../config.js (el mismo nombre que la web)
(function(){
  var C = window.LTB, w = C.name.split(" "), v = { name: C.name, tagline: C.tagline, former: C.formerName, mono: w[0], rest: w.slice(1).join(" "), ig: "@" + C.instagram };
  document.querySelectorAll("[data-brand]").forEach(function(el){
    var k = el.dataset.brand;
    if (k === "logo") el.innerHTML = v.mono + (v.rest ? ' <span class="script">' + v.rest + "</span>" : "");
    else el.textContent = v[k];
  });
})();
// Tipografía francesa: ’, espacio fino insécable antes de ; ! ? y espacio insécable antes de : » y después de «
(function(){
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) {
    if (n.parentElement.closest("script,style")) continue;
    n.nodeValue = n.nodeValue.replace(/(\w)'(\w)/g, "$1\u2019$2").replace(/[ \u00A0]([;!?])/g, "\u202F$1").replace(/ ([:»])/g, "\u00A0$1").replace(/« /g, "«\u00A0");
  }
})();
