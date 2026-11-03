/* =====================================================================
   RESTAURANTE TOKYO MARINGÁ · INTERAÇÕES
   ===================================================================== */
(() => {
  'use strict';

  const C = window.TOKYO_CONFIG;
  const MENU = window.TOKYO_MENU;
  const CATS = window.TOKYO_CATEGORIES;
  const FAVS = window.TOKYO_FAVORITES;
  const byId = Object.fromEntries(MENU.map((d) => [d.id, d]));
  const catLabel = Object.fromEntries(CATS.map((c) => [c.id, c]));

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => matchMedia('(max-width: 860px)').matches;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage indisponível */ } },
  };

  const ICON_PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  /* ------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------ */
  const t0 = performance.now();
  function finishLoad() {
    if (body.classList.contains('loaded')) return;
    const pl = $('#preloader');
    body.classList.add('loaded');
    if (pl) { pl.classList.add('done'); setTimeout(() => pl.remove(), 1000); }
  }
  const minShow = reduce ? 0 : 700;
  addEventListener('load', () => setTimeout(finishLoad, Math.max(0, minShow - (performance.now() - t0))));
  setTimeout(finishLoad, 3200);

  /* ------------------------------------------------------------------
     Links externos (WhatsApp, Instagram, Maps)
     ------------------------------------------------------------------ */
  const WA_MSG = {
    pedido: 'Olá, Tokyo! 🍣 Gostaria de fazer um pedido.',
    reserva: 'Olá, Tokyo! 🍣 Gostaria de reservar uma mesa. Quais horários vocês têm disponíveis?',
  };
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;
  $$('[data-wa]').forEach((a) => { a.href = waLink(WA_MSG[a.dataset.wa] || WA_MSG.pedido); });
  $$('[data-ig]').forEach((a) => { a.href = C.instagram; });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapsQuery)}`;
  $$('[data-maps]').forEach((a) => { a.href = mapsUrl; });
  $('#year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Horários + status "aberto agora"
     ------------------------------------------------------------------ */
  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

  function getStatus() {
    const now = new Date();
    const d = now.getDay();
    const m = now.getHours() * 60 + now.getMinutes();
    const today = C.hours[d] || [];
    for (const [a, b] of today) {
      if (m >= toMin(a) && m < toMin(b)) {
        const left = toMin(b) - m;
        return { open: true, text: left <= 45 ? `Aberto · fecha em ${left} min` : `Aberto agora · até ${b}` };
      }
    }
    for (const [a] of today) if (m < toMin(a)) return { open: false, text: `Fechado · abre hoje às ${a}` };
    for (let i = 1; i <= 7; i++) {
      const nd = (d + i) % 7;
      const sl = C.hours[nd];
      if (sl && sl.length) return { open: false, text: `Fechado · abre ${i === 1 ? 'amanhã' : DAYS[nd].toLowerCase()} às ${sl[0][0]}` };
    }
    return { open: false, text: 'Fechado' };
  }
  function renderStatus() {
    const s = getStatus();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('open', s.open);
      el.classList.toggle('closed', !s.open);
      el.querySelector('span').textContent = s.text;
    });
  }
  function renderHours() {
    const today = new Date().getDay();
    $('#hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const sl = C.hours[d] || [];
      const txt = sl.length ? sl.map(([a, b]) => `${a}–${b}`).join(' · ') : 'Fechado';
      return `<li class="${d === today ? 'today' : ''}"><span>${DAYS[d]}${d === today ? ' <small class="today-tag">hoje</small>' : ''}</span><span>${txt}</span></li>`;
    }).join('');
  }
  renderStatus(); renderHours();
  setInterval(renderStatus, 60_000);

  /* ------------------------------------------------------------------
     Navegação, progresso, parallax e efeitos de rolagem
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const progress = $('#progress');
  const heroBg = $('.hero-bg');
  const tabsBar = $('#tabsBar');
  const bbar = $('#bbar');
  const menuSection = $('#cardapio');
  const cineFrame = $('#cineFrame');
  let lastY = scrollY;
  let ticking = false;
  let stickTop = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  body.classList.add('nav-visible');

  // manifesto: quebra o texto em palavras para acendê-las com a rolagem
  const manifesto = $('#manifesto');
  let words = [];
  let litCount = -1;
  if (manifesto) {
    const HL = ['hora,', 'fresco', 'voltar.'];
    manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w${HL.includes(w) ? ' hl' : ''}">${esc(w)}</span>`).join(' ');
    words = $$('.w', manifesto);
    if (reduce) words.forEach((w) => w.classList.add('on'));
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const measure = () => { stickTop = parseFloat(getComputedStyle(tabsBar).top) || 0; };

  function applyHero(y) {
    if (reduce || y > innerHeight * 1.2) return;
    heroBg.style.transform = `translate3d(${mouse.x}px, ${y * 0.28 + mouse.y}px, 0)`;
  }

  function onScroll() {
    const y = scrollY;
    const vh = innerHeight;
    nav.classList.toggle('scrolled', y > 20);

    if (!body.classList.contains('menu-open')) {
      const dy = y - lastY;
      if (Math.abs(dy) > 6) {
        const hide = dy > 0 && y > vh * 0.8;
        nav.classList.toggle('hide', hide);
        body.classList.toggle('nav-visible', !hide);
        lastY = y;
      }
    }

    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    applyHero(y);

    if (!reduce && words.length) {
      const r = manifesto.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.3));
        const n = Math.round(p * words.length);
        if (n !== litCount) {
          words.forEach((w, i) => w.classList.toggle('on', i < n));
          litCount = n;
        }
      }
    }

    if (!reduce && cineFrame) {
      const r = cineFrame.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        cineFrame.style.setProperty('--p', clamp01((vh - r.top) / (vh * 0.85)).toFixed(3));
      }
    }

    const tbTop = tabsBar.getBoundingClientRect().top;
    tabsBar.classList.toggle('stuck', tbTop <= stickTop + 1 && menuSection.getBoundingClientRect().bottom > 200);

    bbar.classList.toggle('show', y > vh * 0.6);
    ticking = false;
  }
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', () => {
    measure();
    if (innerWidth > 1100 && body.classList.contains('menu-open')) setMenu(false);
    requestTick();
  });
  // a altura do topo muda quando o menu some/aparece: remede ao fim da transição
  tabsBar.addEventListener('transitionend', measure);
  measure();
  onScroll();

  // parallax sutil da foto principal seguindo o mouse
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const hero = $('.hero');
    let raf = 0;
    const loop = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      applyHero(scrollY);
      raf = Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / innerWidth - 0.5) * -24;
      mouse.ty = (e.clientY / innerHeight - 0.5) * -16;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  // link ativo no menu
  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionIO.observe(s));

  // menu mobile
  const burger = $('#burger');
  const mmenu = $('#mmenu');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    body.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mmenu.setAttribute('aria-hidden', String(!open));
    if (open) { nav.classList.remove('hide'); nav.classList.add('scrolled'); }
    else requestTick();
  }
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('a', mmenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ------------------------------------------------------------------
     Cursor (só mouse): ponto vermelho que vira "Ver" sobre os pratos
     ------------------------------------------------------------------ */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cur = $('#cursor');
    const dot = $('span', cur);
    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    body.classList.add('has-cursor');
    const tick = () => {
      pos.x += (pos.tx - pos.x) * 0.22;
      pos.y += (pos.ty - pos.y) * 0.22;
      cur.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pos.tx = e.clientX; pos.ty = e.clientY;
      const t = e.target;
      const view = t.closest('.dish, .fav, .ig, .mode-media');
      const link = !view && t.closest('a, button, input, textarea, label, [role="tab"]');
      const label = view ? (view.classList.contains('ig') ? 'Seguir' : 'Ver') : '';
      if (dot.dataset.label !== label) dot.dataset.label = label;
      cur.classList.toggle('is-view', !!view && !t.closest('.ctl'));
      cur.classList.toggle('is-link', !!link || !!t.closest('.ctl'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  /* ------------------------------------------------------------------
     Reveal on scroll + contador + mapa preguiçoso
     ------------------------------------------------------------------ */
  // .reveal-img usa clip-path, que zera a área medida pelo IntersectionObserver;
  // por isso observamos o elemento pai e revelamos os filhos juntos.
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      // revela também o que ficou para trás num salto de rolagem (âncoras, links do menu)
      if (!en.isIntersecting && en.boundingClientRect.top > 0) return;
      const el = en.target;
      if (el.classList.contains('reveal')) el.classList.add('in');
      $$(':scope > .reveal-img', el).forEach((c) => c.classList.add('in'));
      revealIO.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  $$('.reveal').forEach((el) => revealIO.observe(el));
  new Set($$('.reveal-img').map((el) => el.parentElement)).forEach((p) => revealIO.observe(p));

  const counter = $('[data-count]');
  if (counter) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const target = +counter.dataset.count;
      if (reduce) { counter.textContent = target.toLocaleString('pt-BR'); return; }
      const dur = 1800; const s = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - s) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        counter.textContent = Math.round(target * e).toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(counter);
  }

  const map = $('#map');
  const mapIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    map.src = `https://www.google.com/maps?q=${encodeURIComponent(C.mapsQuery)}&output=embed`;
    mapIO.disconnect();
  }, { rootMargin: '400px' });
  mapIO.observe(map);

  /* ------------------------------------------------------------------
     Carrinho
     ------------------------------------------------------------------ */
  let cart = store.get('tokyo-cart', {});
  Object.keys(cart).forEach((id) => { if (!byId[id] || !(cart[id].q > 0)) delete cart[id]; });
  const qty = (id) => (cart[id] ? cart[id].q : 0);
  const cartCount = () => Object.values(cart).reduce((s, i) => s + i.q, 0);
  const cartTotal = () => Object.entries(cart).reduce((s, [id, i]) => s + byId[id].price * i.q, 0);

  function ctlHTML(id) {
    const q = qty(id);
    const d = byId[id];
    if (!q) return `<button type="button" class="add-btn" data-add="${id}" aria-label="Adicionar ${esc(d.name)}">${ICON_PLUS}<span class="add-txt">Adicionar</span></button>`;
    return `<div class="stepper"><button type="button" data-dec="${id}" aria-label="Remover um ${esc(d.name)}">−</button><output aria-live="polite">${q}</output><button type="button" data-inc="${id}" aria-label="Adicionar mais um ${esc(d.name)}">+</button></div>`;
  }
  function refreshCtl(id) {
    const q = qty(id);
    $$(`[data-ctl="${id}"]`).forEach((el) => {
      const st = el.querySelector('.stepper output');
      if (q && st) st.textContent = q;
      else el.innerHTML = ctlHTML(id);
    });
    $$(`.dish[data-id="${id}"]`).forEach((el) => el.classList.toggle('in-cart', q > 0));
  }
  function saveCart() { store.set('tokyo-cart', cart); }

  function updateCartUI() {
    const n = cartCount();
    const total = brl(cartTotal());
    $$('[data-cart-count]').forEach((el) => { el.textContent = n; });
    $$('[data-cart-total]').forEach((el) => { el.textContent = total; });
    body.classList.toggle('has-items', n > 0);
    $('.bbar-label').textContent = n ? 'Ver meu pedido' : 'Meu pedido';
    renderCart();
  }

  function setQty(id, q, note) {
    if (q <= 0) delete cart[id];
    else cart[id] = { q, note: note !== undefined ? note : (cart[id] && cart[id].note) || '' };
    saveCart();
    refreshCtl(id);
    updateCartUI();
  }
  function add(id, n = 1, opts = {}) {
    if (!isMobile()) { nav.classList.remove('hide'); body.classList.add('nav-visible'); }
    setQty(id, qty(id) + n, opts.note);
    if (opts.from) fly(opts.from, byId[id].img);
    else bumpCart();
    showToast(id, n);
  }

  function bumpCart() {
    const targets = [$('.cart-btn'), $('.bbar-main')];
    targets.forEach((t) => { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); });
  }
  function fly(fromEl, src) {
    if (reduce || !fromEl) { bumpCart(); return; }
    const target = isMobile() && bbar.classList.contains('show') ? $('.bbar-count') : $('.cart-btn');
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) { bumpCart(); return; }
    const size = 64;
    const sx = a.left + a.width / 2 - size / 2;
    const sy = a.top + a.height / 2 - size / 2;
    const dx = b.left + b.width / 2 - size / 2 - sx;
    const dy = b.top + b.height / 2 - size / 2 - sy;
    const img = document.createElement('img');
    img.src = src; img.className = 'flyer'; img.alt = '';
    Object.assign(img.style, { width: `${size}px`, height: `${size}px`, left: `${sx}px`, top: `${sy}px` });
    body.appendChild(img);
    const anim = img.animate([
      { transform: 'translate(0,0) scale(1.4)', opacity: 0.2 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.15 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 90}px) scale(0.8)`, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.7 },
    ], { duration: 760, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
    anim.onfinish = () => { img.remove(); bumpCart(); };
  }

  // toast
  const toast = $('#toast');
  let toastTimer = 0;
  function showToast(id, n) {
    const d = byId[id];
    toast.querySelector('img').src = d.img;
    toast.querySelector('span').textContent = `${n > 1 ? `${n}× ` : ''}${d.name} no pedido`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  toast.addEventListener('pointerenter', () => clearTimeout(toastTimer));
  toast.addEventListener('pointerleave', () => { toastTimer = setTimeout(() => toast.classList.remove('show'), 1400); });

  /* ------------------------------------------------------------------
     Cardápio: abas, filtros, busca
     ------------------------------------------------------------------ */
  const grid = $('#menuGrid');
  const tabs = $('#tabs');
  const tabInd = $('#tabInd');
  const empty = $('#menuEmpty');
  const state = { cat: 'all', filter: 'all', q: '' };

  const priceHTML = (p) => `<small>R$</small>${p.toFixed(2).replace('.', ',')}`;
  function badgesHTML(d) {
    const b = [];
    if (d.tags.includes('top')) b.push('<span class="badge badge--top">Mais pedido</span>');
    if (d.tags.includes('chef')) b.push('<span class="badge badge--chef">Chef indica</span>');
    if (d.tags.includes('spicy')) b.push('<span class="badge">🌶️ Picante</span>');
    if (d.tags.includes('veg')) b.push('<span class="badge">🌿 Veg</span>');
    return b.length ? `<span class="badges">${b.join('')}</span>` : '';
  }
  function dishHTML(d, i) {
    return `<article class="dish${qty(d.id) ? ' in-cart' : ''}" style="--i:${Math.min(i, 12)}" data-id="${d.id}">
      <button class="dish-media" type="button" data-open="${d.id}" aria-label="Ver detalhes de ${esc(d.name)}">
        <img src="${d.img}" alt="${esc(d.name)}" loading="lazy" decoding="async">${badgesHTML(d)}<span class="dish-view">Ver detalhes</span>
      </button>
      <div class="dish-body">
        <div class="dish-top"><h3>${esc(d.name)}</h3><span class="dish-pieces">${esc(d.pieces)}</span></div>
        <p>${esc(d.desc)}</p>
        <div class="dish-foot"><span class="price">${priceHTML(d.price)}</span><div class="ctl" data-ctl="${d.id}">${ctlHTML(d.id)}</div></div>
      </div>
    </article>`;
  }

  function renderTabs() {
    tabs.insertAdjacentHTML('beforeend', CATS.map((c) =>
      `<button type="button" class="tab" role="tab" data-cat="${c.id}" aria-controls="menuGrid" aria-selected="${c.id === state.cat}">${esc(c.label)}${c.jp ? ` <small lang="ja">${c.jp}</small>` : ''}</button>`
    ).join(''));
  }
  function moveInd(animate = true) {
    const active = $(`.tab[data-cat="${state.cat}"]`, tabs);
    if (!active) return;
    if (!animate) tabInd.style.transition = 'none';
    tabInd.style.width = `${active.offsetWidth}px`;
    tabInd.style.transform = `translateX(${active.offsetLeft}px)`;
    if (!animate) { void tabInd.offsetWidth; tabInd.style.transition = ''; }
  }

  function matches(d) {
    if (state.cat !== 'all' && d.cat !== state.cat) return false;
    if (state.filter !== 'all' && !d.tags.includes(state.filter)) return false;
    if (state.q) {
      const hay = norm(`${d.name} ${d.desc} ${catLabel[d.cat].label}`);
      if (!state.q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }
  function renderGrid() {
    const list = MENU.filter(matches);
    empty.hidden = list.length > 0;
    $('#menuCount').textContent = `${list.length} ${list.length === 1 ? 'prato encontrado' : 'pratos encontrados'}`;
    const grouped = state.cat === 'all' && !state.q;
    let html = '';
    let i = 0;
    if (grouped) {
      CATS.filter((c) => c.id !== 'all').forEach((c) => {
        const items = list.filter((d) => d.cat === c.id);
        if (!items.length) return;
        html += `<h3 class="cat-title">${esc(c.label)} <small lang="ja">${c.jp}</small></h3>`;
        html += items.map((d) => dishHTML(d, i++)).join('');
      });
    } else {
      html = list.map((d) => dishHTML(d, i++)).join('');
    }
    grid.innerHTML = html;
  }

  function scrollToMenuTop() {
    const navOff = body.classList.contains('nav-visible') ? nav.offsetHeight : 0;
    const y = grid.getBoundingClientRect().top + scrollY - tabsBar.offsetHeight - navOff - 16;
    if (scrollY > y + 4) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (!t || t.dataset.cat === state.cat) return;
    state.cat = t.dataset.cat;
    $$('.tab', tabs).forEach((b) => b.setAttribute('aria-selected', String(b === t)));
    moveInd();
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    renderGrid();
    scrollToMenuTop();
  });
  $('#chips').addEventListener('click', (e) => {
    const c = e.target.closest('.chip');
    if (!c) return;
    state.filter = c.dataset.filter;
    $$('.chip').forEach((b) => b.classList.toggle('is-on', b === c));
    renderGrid();
  });
  let searchT = 0;
  $('#menuSearch').addEventListener('input', (e) => {
    clearTimeout(searchT);
    searchT = setTimeout(() => { state.q = norm(e.target.value.trim()); renderGrid(); }, 120);
  });

  renderTabs();
  renderGrid();
  requestAnimationFrame(() => moveInd(false));
  addEventListener('resize', () => moveInd(false));
  document.fonts && document.fonts.ready.then(() => moveInd(false));

  /* ------------------------------------------------------------------
     Favoritos (carrossel com arrastar)
     ------------------------------------------------------------------ */
  const favTrack = $('#favsTrack');
  favTrack.innerHTML = FAVS.map((id, i) => {
    const d = byId[id];
    return `<article class="fav" data-id="${id}">
      <img src="${d.img}" alt="${esc(d.name)}" loading="lazy" decoding="async" draggable="false">
      <span class="fav-rank" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div class="fav-body">
        <small>${esc(d.pieces)}</small>
        <h3>${esc(d.name)}</h3>
        <p>${esc(d.desc)}</p>
        <div class="fav-foot"><span class="price">${priceHTML(d.price)}</span><div class="ctl" data-ctl="${id}">${ctlHTML(id)}</div></div>
      </div>
    </article>`;
  }).join('');

  const favStep = () => { const c = $('.fav', favTrack); return c ? c.offsetWidth + 20 : 300; };
  $('[data-fav-prev]').addEventListener('click', () => favTrack.scrollBy({ left: -favStep(), behavior: 'smooth' }));
  $('[data-fav-next]').addEventListener('click', () => favTrack.scrollBy({ left: favStep(), behavior: 'smooth' }));

  let drag = null;
  let suppressClick = false;
  favTrack.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('.ctl')) return;
    drag = { x: e.clientX, left: favTrack.scrollLeft, moved: false, id: e.pointerId };
  });
  favTrack.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      favTrack.classList.add('dragging');
      favTrack.setPointerCapture(drag.id);
    }
    if (drag.moved) favTrack.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 50);
      favTrack.classList.remove('dragging');
    }
    drag = null;
  };
  favTrack.addEventListener('pointerup', endDrag);
  favTrack.addEventListener('pointercancel', endDrag);

  /* ------------------------------------------------------------------
     Modais: sheet do produto + gaveta do pedido
     ------------------------------------------------------------------ */
  const overlay = $('#overlay');
  const sheet = $('#sheet');
  const drawer = $('#drawer');
  let openEl = null;
  let lastFocus = null;
  let sheetId = null;
  let sheetQty = 1;

  function openLayer(el) {
    if (openEl && openEl !== el) closeLayer(true);
    toast.classList.remove('show');
    lastFocus = document.activeElement;
    openEl = el;
    overlay.hidden = false;
    el.hidden = false;
    body.classList.add('lock');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('show');
      el.classList.add('show');
    }));
    setTimeout(() => { const f = $('[data-close]', el); f && f.focus({ preventScroll: true }); }, 60);
  }
  function closeLayer(instant) {
    if (!openEl) return;
    const el = openEl;
    openEl = null;
    el.classList.remove('show');
    el.style.transform = '';
    if (instant) { el.hidden = true; return; }
    overlay.classList.remove('show');
    setTimeout(() => {
      if (openEl !== el) el.hidden = true;
      if (!openEl) { overlay.hidden = true; body.classList.remove('lock'); }
    }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  overlay.addEventListener('click', () => closeLayer());

  // foco preso dentro do modal aberto
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (openEl) closeLayer();
      else if (body.classList.contains('menu-open')) setMenu(false);
    }
    if (e.key === 'Tab' && openEl) {
      const f = $$('button, [href], input, textarea, select', openEl).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function pairHTML(id) {
    const d = byId[id];
    return `<button type="button" class="pair" data-pair="${id}" aria-label="Adicionar ${esc(d.name)}, ${brl(d.price)}"><img src="${d.img}" alt="" loading="lazy"><div><b>${esc(d.name)}</b><small>${esc(d.pieces)} · ${brl(d.price)}</small></div><i aria-hidden="true">+</i></button>`;
  }

  function updateSheetTotal() {
    $('#sheetQty').textContent = sheetQty;
    $('#sheetTotal').textContent = `· ${brl(byId[sheetId].price * sheetQty)}`;
  }
  function openSheet(id) {
    const d = byId[id];
    if (!d) return;
    sheetId = id;
    sheetQty = 1;
    const img = $('#sheetImg');
    img.src = d.img; img.alt = d.name;
    $('#sheetTitle').textContent = d.name;
    $('#sheetPieces').textContent = `${d.pieces} · ${brl(d.price)}`;
    $('#sheetDesc').textContent = d.desc;
    $('#sheetBadges').innerHTML = badgesHTML(d).replace(/^<span class="badges">|<\/span>$/g, '');
    $('#sheetNote').value = (cart[id] && cart[id].note) || '';
    const pairs = (d.pairs || []).filter((p) => byId[p]);
    $('#pairsWrap').hidden = !pairs.length;
    $('#pairs').innerHTML = pairs.map(pairHTML).join('');
    $('.sheet-scroll', sheet).scrollTop = 0;
    updateSheetTotal();
    openLayer(sheet);
  }
  $('#sheetStepper').addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    sheetQty = Math.max(1, Math.min(50, sheetQty + Number(b.dataset.step)));
    updateSheetTotal();
  });
  $('#sheetAdd').addEventListener('click', () => {
    const note = $('#sheetNote').value.trim();
    const from = $('#sheetImg');
    const r = from.getBoundingClientRect();
    const ghost = { getBoundingClientRect: () => r };
    closeLayer();
    add(sheetId, sheetQty, { note, from: ghost });
  });

  // arrastar para fechar (bottom sheet no celular)
  (function sheetDrag() {
    const handles = [$('#sheetHandle'), $('.sheet-media', sheet)];
    let st = null;
    handles.forEach((h) => {
      h.addEventListener('pointerdown', (e) => {
        if (!isMobile() || st) return;
        st = { y: e.clientY, t: performance.now(), id: e.pointerId, dy: 0 };
        h.setPointerCapture(e.pointerId);
        sheet.classList.add('dragging');
      });
      h.addEventListener('pointermove', (e) => {
        if (!st || e.pointerId !== st.id) return;
        let dy = e.clientY - st.y;
        if (dy < 0) dy = -Math.pow(-dy, 0.6); // fricção para cima
        st.dy = dy;
        sheet.style.transform = `translateY(${dy}px)`;
      });
      const end = (e) => {
        if (!st || e.pointerId !== st.id) return;
        const v = st.dy / (performance.now() - st.t);
        sheet.classList.remove('dragging');
        if (st.dy > 140 || (v > 0.5 && st.dy > 20)) closeLayer();
        else sheet.style.transform = '';
        st = null;
      };
      h.addEventListener('pointerup', end);
      h.addEventListener('pointercancel', end);
    });
  })();

  // gaveta do pedido
  function renderCart() {
    const ids = Object.keys(cart);
    const has = ids.length > 0;
    $('#cartEmpty').hidden = has;
    $('#checkout').hidden = !has;
    $('#drawerFoot').hidden = !has;
    $('#cartList').innerHTML = ids.map((id) => {
      const d = byId[id];
      const it = cart[id];
      return `<li class="ci">
        <img src="${d.img}" alt="">
        <div class="ci-info"><b>${esc(d.name)}</b><small>${esc(d.pieces)}</small>${it.note ? `<small class="ci-note">“${esc(it.note)}”</small>` : ''}<strong>${brl(d.price * it.q)}</strong></div>
        <div class="stepper"><button type="button" data-dec="${id}" aria-label="Remover um ${esc(d.name)}">${it.q === 1 ? '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '−'}</button><output>${it.q}</output><button type="button" data-inc="${id}" aria-label="Adicionar mais um ${esc(d.name)}">+</button></div>
      </li>`;
    }).join('');

    // venda cruzada: sugestões que combinam com o que já está no pedido
    const sug = [];
    ids.forEach((id) => (byId[id].pairs || []).forEach((p) => { if (!cart[p] && !sug.includes(p) && byId[p]) sug.push(p); }));
    ['mochi', 'gyoza', 'sake'].forEach((p) => { if (!cart[p] && !sug.includes(p)) sug.push(p); });
    $('#upsell').hidden = !has;
    $('#upsellList').innerHTML = sug.slice(0, 3).map(pairHTML).join('');
  }

  const checkout = $('#checkout');
  checkout.name.value = store.get('tokyo-name', '');
  $('#sendOrder').addEventListener('click', () => {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    const name = checkout.name.value.trim();
    const mode = checkout.mode.value;
    const obs = checkout.obs.value.trim();
    if (name) store.set('tokyo-name', name);
    const lines = ids.map((id) => {
      const d = byId[id]; const it = cart[id];
      return `• ${it.q}× ${d.name} (${d.pieces}) — ${brl(d.price * it.q)}${it.note ? `\n   _Obs.: ${it.note}_` : ''}`;
    });
    const msg = [
      'Olá, Tokyo! 🍣 Quero fazer um pedido:',
      '',
      ...lines,
      '',
      `*Total estimado: ${brl(cartTotal())}*`,
      `Forma: ${mode}`,
      name ? `Nome: ${name}` : '',
      obs ? `Observações: ${obs}` : '',
      '',
      'Pedido montado pelo site 🙌',
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
    window.open(waLink(msg), '_blank', 'noopener');
  });

  /* ------------------------------------------------------------------
     Delegação global de cliques
     ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
    const t = e.target.closest('[data-add],[data-inc],[data-dec],[data-open],[data-open-cart],[data-close],[data-pair]');

    if (t) {
      if (t.dataset.add) {
        const card = t.closest('.dish, .fav');
        const img = card ? $('img', card) : null;
        add(t.dataset.add, 1, { from: img });
        return;
      }
      if (t.dataset.inc) { setQty(t.dataset.inc, qty(t.dataset.inc) + 1); bumpCart(); return; }
      if (t.dataset.dec) { setQty(t.dataset.dec, qty(t.dataset.dec) - 1); return; }
      if (t.dataset.pair) {
        add(t.dataset.pair, 1, { from: $('img', t) });
        t.classList.add('added');
        $('i', t).textContent = '✓';
        return;
      }
      if (t.hasAttribute('data-open')) { e.preventDefault(); openSheet(t.dataset.open); return; }
      if (t.hasAttribute('data-open-cart')) {
        toast.classList.remove('show');
        if (body.classList.contains('menu-open')) setMenu(false);
        openLayer(drawer);
        return;
      }
      if (t.hasAttribute('data-close')) {
        const href = t.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          closeLayer();
          setTimeout(() => { const s = $(href); s && s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 440);
        } else closeLayer();
        return;
      }
    }

    const card = e.target.closest('.dish, .fav');
    if (card && !e.target.closest('.ctl')) openSheet(card.dataset.id);
  });

  updateCartUI();
})();
