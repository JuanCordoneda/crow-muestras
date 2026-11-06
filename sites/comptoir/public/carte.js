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
// carte et prix relevés sur TheFork (mise à jour du restaurant du 6 novembre 2026)
var MENU = [
 {id:"entrees", name:D("Entrées","Starters","Entradas"), img:"entrees", intro:D("Pour commencer, à partager ou pas.","To start, to share (or not).","Para empezar, para compartir (o no)."), items:[
  {n:"Pulpo al carbón", p:14.9, d:D("Poulpe cuit au charbon à basse température, crème de panais, sel rose de Maras.","Octopus slow-cooked over charcoal, parsnip cream, pink Maras salt.","Pulpo cocido al carbón a baja temperatura, crema de chirivía, sal rosada de Maras.")},
  {n:"Pulpo al olivo", p:13.9, d:D("Poulpe, crème d'olives et patate douce grillée.","Octopus, olive cream and grilled sweet potato.","Pulpo en crema de aceituna con camote a la parrilla.")},
  {n:"Causa de atún", p:11.9, img:"causa-thon", d:D(CAUSA.fr+" et thon.",CAUSA.en+" with tuna.",CAUSA.es+" y atún.")},
  {n:"Tacos de atún", p:13.9, img:"tacos-thon", d:D("Trois tortillas de maïs, guacamole, chimichurri et thon.","Three corn tortillas, guacamole, chimichurri and tuna.","Tres tortillas de maíz, guacamole, chimichurri y atún.")},
  {n:"Causa de palta y camarones", p:12.9, d:D(CAUSA.fr+", avocat et crevettes.",CAUSA.en+", avocado and prawns.",CAUSA.es+", palta y camarones.")},
  {n:D("Causa végétarienne","Vegetarian causa","Causa vegetariana"), p:11.9, v:1, d:D(CAUSA.fr+", quinoa et avocat.",CAUSA.en+", quinoa and avocado.",CAUSA.es+", quinua y palta.")},
  {n:"Empanadas", p:11.9, d:D("Chausson au four : bœuf, oignons, raisins secs et olives.","Baked pastry: beef, onions, raisins and olives.","Empanada al horno de carne, cebolla, pasas y aceitunas.")},
  {n:"Velouté Kantuta", p:9.9, d:D("Velouté de légumes de saison à la crème.","Seasonal vegetable soup with cream.","Crema de verduras de estación.")}
 ]},
 {id:"ceviches", name:D("Ceviches","Ceviches","Ceviches"), img:"ceviches", intro:D("Poisson cru mariné minute au citron vert : le plat national du Pérou.","Raw fish cured to order in lime juice: Peru's national dish.","Pescado crudo marinado al momento en limón: el plato bandera del Perú."), items:[
  {n:"Ceviche clásico", p:16.9, img:"ceviche-classique", d:D("Poisson blanc selon arrivage, citron vert et ají limo.","White fish of the day, lime and ají limo.","Pescado blanco del día, limón y ají limo.")},
  {n:"Ceviche fresa salvaje", p:18.9, d:D("Fraises des bois et fruit de la passion.","Wild strawberries and passion fruit.","Fresas silvestres y maracuyá.")},
  {n:"Ceviche 3 ajíes al carbón", p:18.9, d:D("Trois piments au charbon : rocoto, limo et jaune.","Three charcoal-grilled chillies: rocoto, limo and yellow.","Tres ajíes al carbón: rocoto, limo y amarillo.")},
  {n:"Ceviche nikkei", p:18.9, d:D("Thon mariné au piment jaune fumé, soja et sésame.","Tuna cured with smoked yellow chilli, soy and sesame.","Atún macerado en ají amarillo ahumado, sillao y ajonjolí.")},
  {n:"Ceviche mango", p:19.9, tag:"fav", d:D("Mangue fraîche et piment limo.","Fresh mango and ají limo.","Mango fresco y ají limo.")},
  {n:"Ceviche palta", p:19.9, d:D("Piment jaune fumé et avocat.","Smoked yellow chilli and avocado.","Ají amarillo ahumado y palta.")},
  {n:"Ceviche mixto", p:21.9, d:D("Poisson, poulpe et crevettes au piment jaune fumé.","Fish, octopus and prawns with smoked yellow chilli.","Pescado, pulpo y camarones en ají amarillo ahumado.")}
 ]},
 {id:"plats", name:D("Plats chauds","Hot dishes","Platos calientes"), intro:D("Les classiques de la cuisine de Lima.","Classics from Lima's kitchens.","Los clásicos de la cocina limeña."), items:[
  {n:"Pollo a la brasa", p:20.9, d:D("Poulet rôti à la péruvienne, frites maison, riz et salade.","Peruvian-style roast chicken, homemade fries, rice and salad.","Pollo a la brasa con papas fritas caseras, arroz y ensalada.")},
  {n:"Chupe de camarones", p:18.9, d:D("Soupe de gambas et fruits de mer, riz et sofrito.","Prawn and seafood soup with rice and sofrito.","Sopa de langostinos y mariscos con arroz y sofrito.")},
  {n:"Ají de gallina", p:21.9, d:D("Poulet effiloché, sauce au piment jaune fumé (non piquante), pommes de terre et riz.","Shredded chicken in a mild smoked yellow chilli sauce, potatoes and rice.","Gallina deshilachada en ají amarillo ahumado (no pica), papas y arroz.")},
  {n:"Tallarines verdes con pollo a la brasa", p:22.9, d:D("Spaghettis à la sauce épinards, basilic et fromage, poulet rôti.","Spaghetti in a spinach, basil and cheese sauce, with roast chicken.","Tallarines en salsa de espinaca, albahaca y queso, con pollo a la brasa.")},
  {n:"Arroz chaufa", p:21.9, d:D("Riz sauté à la péruvienne : poulet, œuf, oignon vert et soja.","Peruvian fried rice: chicken, egg, spring onion and soy.","Arroz chaufa de pollo con huevo, cebollita china y sillao.")}
 ]},
 {id:"desserts", name:D("Desserts","Desserts","Postres"), intro:D("Les douceurs de Lima.","Sweet treats from Lima.","Los dulces de Lima."), items:[
  {n:"Postre del día", p:8, d:D("Le dessert du jour, selon l'humeur du chef.","Dessert of the day, ask us!","Pregunta por el postre del día.")},
  {n:D("Panna cotta maison","Homemade panna cotta","Panna cotta casera"), p:8, d:D("Au dulce de leche.","With dulce de leche.","Con manjar blanco.")},
  {n:D("Alfajores (×2)","Alfajores (×2)","Alfajores (×2)"), p:7},
  {n:"Mazamorra morada", p:8, d:D("Crème de maïs violet aux fruits.","Purple corn pudding with fruit.","Postre de maíz morado con frutas.")},
  {n:"Arroz zambito", p:8, d:D("Riz au lait à la chancaca, le sucre de canne péruvien.","Rice pudding with chancaca, Peruvian cane sugar.","Arroz con leche a la chancaca.")},
  {n:"Combinado", p:8, d:D("Mazamorra morada et arroz zambito.","Mazamorra morada and arroz zambito.","Mazamorra morada y arroz zambito.")},
  {n:"Marquise au chocolat", p:10, d:D("Chocolat noir et noix du Brésil.","Dark chocolate and Brazil nuts.","Chocolate negro y castañas.")},
  {n:D("Café ou thé gourmand","Coffee or tea with mini desserts","Café o té con mini postres"), p:10}
 ]},
 {id:"cocktails", name:D("Cocktails","Cocktails","Cócteles"), img:"cocktails", intro:D("Le pisco, l'eau-de-vie de raisin du Pérou, dans tous ses états.","Pisco, Peru's grape brandy, every which way.","El pisco, en todas sus formas."), items:[
  {n:"Pisco sour", p:12, img:"pisco-sour", d:D("Pisco, citron vert, sucre de canne, blanc d'œuf.","Pisco, lime, cane sugar, egg white.","Pisco, limón, jarabe de caña, clara de huevo.")},
  {n:D("Pisco maison","House pisco","Pisco de la casa"), p:12, d:D("Pisco, chicha morada, citron vert, blanc d'œuf.","Pisco, chicha morada, lime, egg white.","Pisco, chicha morada, limón, clara de huevo.")},
  {n:"Pisco maracuyá", p:12},
  {n:D("Pisco mangue","Pisco mango","Pisco mango"), p:12},
  {n:D("Pisco fraise","Pisco strawberry","Pisco fresa"), p:12},
  {n:"Peru libre", p:10, d:D("Pisco, Coca-Cola, citron vert.","Pisco, Coca-Cola, lime.","Pisco, Coca-Cola, limón.")},
  {n:"Mojito", p:10},
  {n:"Cuba libre", p:10},
  {n:"Caïpirinha", p:10}
 ]},
 {id:"boissons", name:D("Bières & softs","Beers & soft drinks","Cervezas y bebidas"), items:[
  {n:D("Cusqueña blonde / brune","Cusqueña lager / dark","Cusqueña rubia / negra"), p:7, d:D("La bière de Cusco.","The beer from Cusco.","La cerveza del Cusco.")},
  {n:"Pilsen", p:7, d:D("Blonde du Pérou.","Peruvian lager.","Rubia peruana.")},
  {n:D("Pression 25 cl","Draught beer 25 cl","Cerveza de barril 25 cl"), p:4.5, d:D("Heineken ou Affligem. 50 cl : 8 €.","Heineken or Affligem. 50 cl: €8.","Heineken o Affligem. 50 cl: 8 €.")},
  {n:"Chicha morada", p:6, d:D("Boisson péruvienne au maïs violet.","Peruvian purple corn drink.","La de siempre, de maíz morado.")},
  {n:"Inca Kola", p:5, d:D("Le soda doré du Pérou.","Peru's golden soda.","La bebida de sabor nacional.")},
  {n:"Milk-shake", p:7, d:D("Mangue ou fruit de la passion.","Mango or passion fruit.","Mango o maracuyá.")},
  {n:D("Thé glacé à la pêche","Peach iced tea","Té helado de durazno"), p:5.5}
 ]},
 {id:"vins", name:D("Vins","Wines","Vinos"), items:[
  {n:D("Verre de vin","Glass of wine","Copa de vino"), p:6, d:D("Blanc ou rouge.","White or red.","Blanco o tinto.")},
  {n:D("Pichet 50 cl","50 cl carafe","Jarra de 50 cl"), p:20, d:D("Blanc, rouge ou rosé. 25 cl : 10,50 €.","White, red or rosé. 25 cl: €10.50.","Blanco, tinto o rosado. 25 cl: 10,50 €.")},
  {n:D("Bouteille d'Argentine ou du Chili","Bottle from Argentina or Chile","Botella de Argentina o Chile"), p:30, d:D("Malbec, carménère, syrah, sauvignon…","Malbec, Carménère, Syrah, Sauvignon…","Malbec, carmenere, syrah, sauvignon…")},
  {n:D("Champagne Le Brun de Neuville","Le Brun de Neuville champagne","Champagne Le Brun de Neuville"), p:70, d:D("Blanc de blancs, la bouteille.","Blanc de blancs, per bottle.","Blanc de blancs, la botella.")}
 ]}
];

/* les incontournables : uniquement des plats dont on a la vraie photo */
var MUST = [
 {img:"ceviche-classique", n:"Ceviche clásico", p:16.9, d:D("Le grand classique de Lima.","Lima's great classic.","El gran clásico limeño.")},
 {img:"causa-thon", n:"Causa de atún", p:11.9, d:D("Pomme de terre jaune citronnée et thon.","Lime-seasoned yellow potato and tuna.","Papa amarilla con limón y atún.")},
 {img:"tacos-thon", n:"Tacos de atún", p:13.9, d:D("Frais et croquants, à partager.","Fresh and crunchy, for sharing.","Frescos y crocantes, para compartir.")},
 {img:"pisco-sour", n:"Pisco sour", p:12, d:D("Le cocktail national, shaké minute.","Peru's national cocktail, shaken to order.","El cóctel bandera, batido al momento.")}
];

MENU.forEach(function(c){c.items.forEach(function(it,k){it.id=c.id+"-"+k;});});
MUST.forEach(function(m){MENU.forEach(function(c){c.items.forEach(function(it){if(it.n===m.n)m.ref=it.id;});});});
window.COMPTOIR_CARTE={menu:MENU,must:MUST};
})();
