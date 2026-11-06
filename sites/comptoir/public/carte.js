/*
 * La carte du Comptoir : la lisent la web (index.html) et la page interne (admin/).
 * Chaque plat reçoit un id (catégorie-position) pour que les modifications de la page interne
 * retrouvent le bon plat, et chaque incontournable pointe vers son plat (ref) : son prix et sa
 * photo suivent ceux de la carte.
 */
(function(){
"use strict";
function D(fr,en,es){return {fr:fr,en:en,es:es};}
var CAUSA = D("Purée de pomme de terre jaune citronnée","Lime-seasoned yellow potato mash","Masa de papa amarilla con limón");
var MENU = [
 {id:"entrees", name:D("Entrées","Starters","Entradas"), img:"entrees", intro:D("Pour commencer, à partager ou pas.","To start, to share (or not).","Para empezar, para compartir (o no)."), items:[
  {n:"Pulpo al carbón", p:15, d:D("Poulpe grillé au charbon.","Charcoal-grilled octopus.","Pulpo a la brasa.")},
  {n:"Pulpo al olivo", p:13, d:D("Poulpe, crème d'olive noire.","Octopus, black olive cream.","Pulpo en crema de aceituna.")},
  {n:"Causa de palta y camarones", p:12, d:D(CAUSA.fr+", avocat et crevettes.",CAUSA.en+", avocado and prawns.",CAUSA.es+", palta y camarones.")},
  {n:"Causa de atún", p:11, img:"causa-thon", d:D(CAUSA.fr+" et thon.",CAUSA.en+" with tuna.",CAUSA.es+" y atún.")},
  {n:"Tacos de atún", p:12, img:"tacos-thon"},
  {n:"Velouté Kantuta", p:9}
 ]},
 {id:"ceviches", name:D("Ceviches","Ceviches","Ceviches"), img:"ceviches", intro:D("Poisson cru mariné minute au citron vert : le plat national du Pérou.","Raw fish cured to order in lime juice: Peru's national dish.","Pescado crudo marinado al momento en limón: el plato bandera del Perú."), items:[
  {n:"Ceviche clásico", p:15, img:"ceviche-classique"},
  {n:"Ceviche fresa salvaje", p:16},
  {n:"Ceviche aux 3 piments au charbon", p:17},
  {n:"Ceviche saumon ají amarillo", p:17},
  {n:"Ceviche nikkei", p:18},
  {n:"Ceviche mixto", p:20, d:D("Poulpe & crevettes.","Octopus & prawns.","Pulpo y camarones.")},
  {n:"Ceviche à la mangue", p:20, tag:"fav"},
  {n:"Ceviche ají amarillo y palta", p:20}
 ]},
 {id:"plats", name:D("Plats","Mains","Platos"), img:"plats", items:[
  {n:"Empanadas de bœuf", p:15},
  {n:"Poké bowl végétarien avocat", p:15, v:1, img:"poke-bowl"}
 ]},
 {id:"desserts", name:D("Desserts","Desserts","Postres"), intro:D("Les douceurs de Lima.","Sweet treats from Lima.","Los dulces de Lima."), items:[
  {n:"Postre del día", p:7, d:D("Le dessert du jour, selon l'humeur du chef.","Dessert of the day, ask us!","Pregunta por el postre del día.")},
  {n:"Dulce de leche", p:8},
  {n:"Mazamorra morada", p:8, d:D("Crème de maïs violet aux fruits.","Purple corn pudding with fruit.","Postre de maíz morado con frutas.")},
  {n:"Arroz zambito", p:8, d:D("Riz au lait à la chancaca, le sucre de canne péruvien.","Rice pudding with chancaca, Peruvian cane sugar.","Arroz con leche a la chancaca.")},
  {n:"Marquise au chocolat", p:10}
 ]},
 {id:"cocktails", name:D("Cocktails","Cocktails","Cócteles"), img:"cocktails", intro:D("Le pisco, l'eau-de-vie de raisin du Pérou, dans tous ses états.","Pisco, Peru's grape brandy, every which way.","El pisco, en todas sus formas."), items:[
  {n:"Pisco sour", p:10, img:"pisco-sour", d:D("Pisco, citron vert, blanc d'œuf, angostura.","Pisco, lime, egg white, angostura.","Pisco, limón, clara de huevo, amargo de angostura.")},
  {n:"Mojito", p:10},
  {n:"Cuba libre", p:10},
  {n:"Chilcano", p:12, d:D("Pisco, ginger ale, citron vert.","Pisco, ginger ale, lime.","Pisco, ginger ale, limón.")},
  {n:"Pisco maracuyá", p:12},
  {n:D("Pisco mangue","Pisco mango","Pisco mango"), p:12},
  {n:D("Pisco fraise","Pisco strawberry","Pisco fresa"), p:12},
  {n:"Shot de pisco", p:5}
 ]},
 {id:"boissons", name:D("Bières & softs","Beers & soft drinks","Cervezas y bebidas"), items:[
  {n:D("Cusqueña blonde / brune","Cusqueña lager / dark","Cusqueña rubia / negra"), p:6, d:D("La bière de Cusco.","The beer from Cusco.","La cerveza del Cusco.")},
  {n:"Chicha morada", p:6, d:D("Boisson péruvienne au maïs violet.","Peruvian purple corn drink.","La de siempre, de maíz morado.")},
  {n:"Inca Kola", p:5, d:D("Le soda doré du Pérou.","Peru's golden soda.","La bebida de sabor nacional.")},
  {n:"Milk-shake maca", p:8, d:D("Mangue, fraise ou maracuyá.","Mango, strawberry or passion fruit.","Mango, fresa o maracuyá.")}
 ]}
];

/* les incontournables : uniquement des plats dont on a la vraie photo */
var MUST = [
 {img:"ceviche-classique", n:"Ceviche clásico", p:15, d:D("Le grand classique de Lima.","Lima's great classic.","El gran clásico limeño.")},
 {img:"causa-thon", n:"Causa de atún", p:11, d:D("Pomme de terre jaune citronnée et thon.","Lime-seasoned yellow potato and tuna.","Papa amarilla con limón y atún.")},
 {img:"tacos-thon", n:"Tacos de atún", p:12, d:D("Frais et croquants, à partager.","Fresh and crunchy, for sharing.","Frescos y crocantes, para compartir.")},
 {img:"pisco-sour", n:"Pisco sour", p:10, d:D("Le cocktail national, shaké minute.","Peru's national cocktail, shaken to order.","El cóctel bandera, batido al momento.")}
];

MENU.forEach(function(c){c.items.forEach(function(it,k){it.id=c.id+"-"+k;});});
MUST.forEach(function(m){MENU.forEach(function(c){c.items.forEach(function(it){if(it.n===m.n)m.ref=it.id;});});});
window.COMPTOIR_CARTE={menu:MENU,must:MUST};
})();
