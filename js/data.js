/* =====================================================================
   RESTAURANTE TOKYO MARINGÁ · CONFIGURAÇÃO E CARDÁPIO
   ---------------------------------------------------------------------
   Edite aqui: telefone, horários, preços e pratos.
   ⚠ Itens marcados com EXEMPLO precisam ser confirmados com o restaurante.
   ===================================================================== */

window.TOKYO_CONFIG = {
  // EXEMPLO: WhatsApp no formato internacional, só números (55 + DDD + número)
  whatsapp: '5544999999999',
  instagram: 'https://www.instagram.com/tokyomaringa/',
  mapsQuery: 'Shopping Avenida Center, Av. São Paulo, 743, Maringá - PR',

  // EXEMPLO: horários por dia da semana (0 = domingo ... 6 = sábado)
  hours: {
    0: [['11:00', '15:00'], ['18:30', '23:00']],
    1: [['11:00', '14:30'], ['18:30', '22:30']],
    2: [['11:00', '14:30'], ['18:30', '22:30']],
    3: [['11:00', '14:30'], ['18:30', '22:30']],
    4: [['11:00', '14:30'], ['18:30', '22:30']],
    5: [['11:00', '14:30'], ['18:30', '23:30']],
    6: [['11:00', '15:00'], ['18:30', '23:30']],
  },
};

window.TOKYO_CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'combos',   label: 'Combinados',            jp: '盛り合わせ' },
  { id: 'rolls',    label: 'Hots, Rolls & Temakis', jp: '巻き' },
  { id: 'nigiri',   label: 'Niguiris & Sashimis',   jp: '握り' },
  { id: 'quentes',  label: 'Pratos Quentes',        jp: '温' },
  { id: 'entradas', label: 'Entradas',              jp: '前菜' },
  { id: 'doces',    label: 'Doces & Bebidas',       jp: '甘味' },
];

/* tags: top = mais pedido · chef = chef recomenda · spicy = picante · veg = vegetariano
   pairs: ids de pratos sugeridos como acompanhamento (venda cruzada)
   price: EXEMPLO, valores ilustrativos para a prévia                            */
window.TOKYO_MENU = [
  // ---------- COMBINADOS ----------
  { id: 'barca-tokyo', cat: 'combos', name: 'Barca Tokyo', pieces: '60 peças', price: 189.9, img: 'img/barca.jpg', tags: ['top', 'chef'],
    desc: 'A estrela da casa. Uma barca generosa com uramakis, hots crocantes, niguiris e sashimis de salmão fresquinho. Feita pra dividir… ou não.',
    pairs: ['sake', 'gyoza', 'mochi'] },
  { id: 'combinado-familia', cat: 'combos', name: 'Combinado Família', pieces: '80 peças', price: 239.9, img: 'img/platter.webp', tags: ['top'],
    desc: 'Sashimis em lâminas generosas, niguiris, uramakis e hossomakis em uma travessa que faz todo mundo sacar o celular antes do primeiro hashi.',
    pairs: ['yakisoba', 'harumaki', 'parfait-matcha'] },
  { id: 'combinado-casal', cat: 'combos', name: 'Combinado Casal', pieces: '40 peças', price: 149.9, img: 'img/overhead.jpg', tags: ['top'],
    desc: 'O date perfeito: uma seleção equilibrada de frios, hots e niguiris pensada para dois. Só falta a companhia.',
    pairs: ['sake', 'mochi', 'gyoza'] },
  { id: 'combinado-chef', cat: 'combos', name: 'Combinado do Chef', pieces: '30 peças', price: 119.9, img: 'img/combinado.webp', tags: ['chef'],
    desc: 'O chef escolhe o melhor do dia e monta peça por peça. Confie e se surpreenda a cada mordida.',
    pairs: ['lamen', 'sake'] },
  { id: 'salmao-lovers', cat: 'combos', name: 'Salmão Lovers', pieces: '24 peças', price: 99.9, img: 'img/board.webp', tags: [],
    desc: 'Para quem é apaixonado por salmão: uramaki, hot, niguiri e jô. Tudo salmão, tudo irresistível.',
    pairs: ['hot-filadelfia', 'temaki-salmao'] },

  // ---------- HOTS, ROLLS & TEMAKIS ----------
  { id: 'hot-filadelfia', cat: 'rolls', name: 'Hot Filadélfia', pieces: '10 peças', price: 34.9, img: 'img/hotroll.webp', tags: ['top'],
    desc: 'Empanado na hora: casquinha crocante por fora, salmão e cream cheese derretendo por dentro, finalizado com molho tarê adocicado.',
    pairs: ['temaki-salmao', 'gyoza', 'mochi'] },
  { id: 'jo-salmao', cat: 'rolls', name: 'Jô Maçaricado', pieces: '6 peças', price: 32.9, img: 'img/joe.webp', tags: ['chef', 'top'],
    desc: 'Arroz envolto em uma lâmina de salmão, cream cheese e um toque de maçarico. O dourado que derrete na boca.',
    pairs: ['hot-filadelfia', 'sashimi-premium'] },
  { id: 'temaki-salmao', cat: 'rolls', name: 'Temaki Salmão Completo', pieces: '1 unidade', price: 32.9, img: 'img/temaki.webp', tags: ['top'],
    desc: 'Cone de alga crocante recheado de arroz, salmão em cubos, cream cheese e cebolinha. Clássico que nunca decepciona.',
    pairs: ['hot-filadelfia', 'harumaki'] },
  { id: 'dragon-roll', cat: 'rolls', name: 'Dragon Roll', pieces: '10 peças', price: 44.9, img: 'img/dragon.webp', tags: ['chef'],
    desc: 'Uramaki de camarão empanado coberto com abacate e fios de tarê. Bonito de ver, melhor ainda de comer.',
    pairs: ['spicy-tuna', 'sake'] },
  { id: 'uramaki-salmao', cat: 'rolls', name: 'Uramaki Salmão', pieces: '8 peças', price: 29.9, img: 'img/uramaki-salmao.jpg', tags: [],
    desc: 'Arroz por fora, salmão, cream cheese e pepino por dentro, com gergelim tostado. Simples e perfeito.',
    pairs: ['niguiri-salmao', 'gyoza'] },
  { id: 'uramaki-tobiko', cat: 'rolls', name: 'Uramaki Tobiko', pieces: '8 peças', price: 36.9, img: 'img/uramaki-ovas.webp', tags: [],
    desc: 'Salmão, kani e cream cheese, coroado com ovas de tobiko que estalam a cada mordida.',
    pairs: ['jo-salmao', 'sake'] },
  { id: 'spicy-tuna', cat: 'rolls', name: 'Spicy Atum', pieces: '8 peças', price: 38.9, img: 'img/tuna-roll.webp', tags: ['spicy'],
    desc: 'Atum fresco com maionese apimentada da casa e um toque de pimenta. Para quem gosta de emoção.',
    pairs: ['dragon-roll', 'sake'] },

  // ---------- NIGUIRIS & SASHIMIS ----------
  { id: 'sashimi-premium', cat: 'nigiri', name: 'Sashimi Premium', pieces: '15 fatias', price: 59.9, img: 'img/sashimi-bowl.webp', tags: ['chef'],
    desc: 'Fatias espessas de salmão e peixe branco, cortadas na hora sobre gelo, com nabo e limão-siciliano.',
    pairs: ['niguiri-mix', 'sake'] },
  { id: 'niguiri-salmao', cat: 'nigiri', name: 'Niguiri Salmão', pieces: '2 unidades', price: 14.9, img: 'img/nigiri-chop.jpg', tags: ['top'],
    desc: 'Bolinho de arroz temperado no ponto, coberto por uma lâmina generosa de salmão. A pureza do sushi.',
    pairs: ['jo-salmao', 'uramaki-salmao'] },
  { id: 'niguiri-mix', cat: 'nigiri', name: 'Niguiri Mix', pieces: '8 unidades', price: 44.9, img: 'img/niguiris.webp', tags: [],
    desc: 'Seleção de niguiris de salmão, atum, peixe branco e kani. Uma viagem por sabores em oito mordidas.',
    pairs: ['sashimi-premium', 'mochi'] },
  { id: 'duo-salmao', cat: 'nigiri', name: 'Duo Salmão & Gergelim', pieces: '12 peças', price: 42.9, img: 'img/niguiri-slate.webp', tags: [],
    desc: 'Niguiris de salmão e uramakis com gergelim preto e branco, servidos na pedra.',
    pairs: ['hot-filadelfia'] },
  { id: 'niguiri-kani', cat: 'nigiri', name: 'Niguiri Kani', pieces: '2 unidades', price: 11.9, img: 'img/kani.webp', tags: [],
    desc: 'Kani macio sobre arroz temperado e uma faixa de nori. Leve, delicado e viciante.',
    pairs: ['niguiri-salmao'] },
  { id: 'poke-salmao', cat: 'nigiri', name: 'Poke de Salmão', pieces: 'Bowl', price: 42.9, img: 'img/poke.webp', tags: [],
    desc: 'Salmão em cubos, ovo marinado, folhas frescas, gergelim e molho especial sobre arroz japonês.',
    pairs: ['parfait-matcha'] },

  // ---------- PRATOS QUENTES ----------
  { id: 'yakisoba', cat: 'quentes', name: 'Yakisoba Tokyo', pieces: 'Individual', price: 39.9, img: 'img/yakisoba.jpg', tags: ['top'],
    desc: 'Macarrão salteado no wok em fogo alto com legumes crocantes, carne e frango, envolvido no molho da casa.',
    pairs: ['gyoza', 'harumaki'] },
  { id: 'lamen', cat: 'quentes', name: 'Lámen Tradicional', pieces: 'Tigela', price: 44.9, img: 'img/ramen.webp', tags: ['chef'],
    desc: 'Caldo encorpado cozido por horas, macarrão firme, chashu, ovo marinado de gema mole, menma e nori.',
    pairs: ['gyoza'] },
  { id: 'tonkatsu', cat: 'quentes', name: 'Tonkatsu', pieces: 'Porção', price: 42.9, img: 'img/katsu.webp', tags: [],
    desc: 'Lombo empanado no panko, sequinho e crocante, com molho tonkatsu e arroz gohan.',
    pairs: ['yakisoba'] },
  { id: 'salmao-grelhado', cat: 'quentes', name: 'Salmão Grelhado', pieces: 'Porção', price: 59.9, img: 'img/salmao-grelhado.jpg', tags: [],
    desc: 'Posta alta de salmão grelhada na manteiga, pele crocante e acompanhamentos da estação.',
    pairs: ['sashimi-premium'] },

  // ---------- ENTRADAS ----------
  { id: 'gyoza', cat: 'entradas', name: 'Guioza', pieces: '6 unidades', price: 26.9, img: 'img/gyoza.webp', tags: ['top'],
    desc: 'Pastelzinho japonês recheado de carne suína e legumes, selado na chapa até dourar embaixo.',
    pairs: ['yakisoba', 'hot-filadelfia'] },
  { id: 'harumaki', cat: 'entradas', name: 'Harumaki de Legumes', pieces: '4 unidades', price: 19.9, img: 'img/harumaki.webp', tags: ['veg'],
    desc: 'Rolinhos primavera crocantes recheados de legumes frescos. Impossível comer só um.',
    pairs: ['yakisoba', 'temaki-salmao'] },

  // ---------- DOCES & BEBIDAS ----------
  { id: 'mochi', cat: 'doces', name: 'Trio de Mochi', pieces: '3 unidades', price: 24.9, img: 'img/mochi.jpg', tags: ['chef', 'veg'],
    desc: 'Massa de arroz macia e elástica envolvendo sorvete. O final doce que todo japonês merece.',
    pairs: ['parfait-matcha'] },
  { id: 'parfait-matcha', cat: 'doces', name: 'Parfait de Matcha', pieces: 'Taça', price: 27.9, img: 'img/parfait.webp', tags: ['veg'],
    desc: 'Camadas de sorvete de matcha, creme, frutas e crocante. Bonito, refrescante e memorável.',
    pairs: ['mochi'] },
  { id: 'sake', cat: 'doces', name: 'Saquê da Casa', pieces: 'Garrafa 300 ml', price: 49.9, img: 'img/sake.webp', tags: [],
    desc: 'Saquê japonês servido gelado, a harmonização clássica para sushis e sashimis. Kanpai!',
    pairs: ['sashimi-premium', 'barca-tokyo'] },
];

// Pratos exibidos no carrossel "Os queridinhos de Maringá"
window.TOKYO_FAVORITES = ['hot-filadelfia', 'barca-tokyo', 'jo-salmao', 'temaki-salmao', 'yakisoba', 'dragon-roll', 'sashimi-premium'];
