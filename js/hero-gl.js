/* =====================================================================
   RESTAURANTE TOKYO · ABERTURA EM WEBGL
   Foto do niguiri como cena viva: relevo + luz especular (Blinn-Phong),
   distorção líquida pelo ponteiro, revelação em tinta sumi-ê e grão de filme.

   Desligar: em js/data.js, TOKYO_CONFIG.heroWebGL = false
   Comparar sem o efeito: abrir o site com ?gl=0 no final do endereço
   ===================================================================== */
(() => {
  'use strict';

  const cfg = window.TOKYO_CONFIG || {};
  const wrap = document.querySelector('.hero-bg');
  const photo = document.getElementById('heroImg');
  if (!wrap || !photo) return;

  const off = (reason) => { wrap.dataset.gl = reason; };
  if (cfg.heroWebGL === false || /[?&]gl=0\b/.test(location.search)) return off('desligado');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return off('menos-movimento');

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) return off('sem-webgl');

  /* ---------------------------- Shaders ---------------------------- */
  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uRes;       // tamanho do canvas (px)
    uniform vec2 uImg;       // tamanho da foto (px), só para a proporção
    uniform vec2 uTexel;     // 1 / tamanho da textura
    uniform vec2 uPos;       // object-position (0..1, y para cima)
    uniform vec2 uLight;     // posição da luz em UV do canvas
    uniform float uTime;
    uniform float uReveal;   // 0 → 1.4 revelação em tinta
    uniform float uPick;     // 0 → 1 animação do hashi pegando o niguiri (1 = foto original)
    uniform vec4 uTrail[8];  // xy = ponto, z = força, w = idade (s)

    // Simplex noise 2D (Ashima Arts / Stefan Gustavson, MIT)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 a0 = x - floor(x + 0.5);
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

    // equivalente a object-fit: cover + object-position
    vec2 cover(vec2 uv) {
      float rc = uRes.x / uRes.y, ri = uImg.x / uImg.y;
      vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0);
      return uv * s + (1.0 - s) * uPos;
    }


    // ---------------- Hashi pegando o niguiri ----------------
    // Geometria medida na foto (pixels do quadro 900x1125, y para baixo).
    const vec2 IMG  = vec2(900.0, 1125.0);
    const vec2 UA   = vec2(630.0, 471.0);       // ponto do palito de cima (passa atrás do salmão)
    const vec2 LA   = vec2(630.0, 515.0);       // ponto do palito de baixo (passa na frente)
    const vec2 UD   = vec2(0.8312, -0.5558);    // direção dos palitos, rumo à "mão"
    const vec2 LD   = vec2(0.8079, -0.5893);
    const float UH  = 15.8;                     // meia espessura perpendicular (px)
    const float LH  = 9.8;
    const vec2 HAND = vec2(905.0, 300.0);       // pivô de abrir/fechar
    const vec2 NIG  = vec2(450.0, 600.0);       // centro do niguiri

    vec2 toPx(vec2 t) { return vec2(t.x * IMG.x, (1.0 - t.y) * IMG.y); }
    vec2 toUvPx(vec2 p) { return vec2(p.x / IMG.x, 1.0 - p.y / IMG.y); }
    vec3 texPx(vec2 p) { return texture2D(uTex, toUvPx(p)).rgb; }
    vec2 rot(vec2 p, vec2 c, float a) { float sn = sin(a), cs = cos(a); p -= c; return vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y) + c; }
    float band(vec2 p, vec2 A, vec2 D, float h) { vec2 q = p - A; return 1.0 - smoothstep(h - 3.0, h + 4.0, abs(q.x * D.y - q.y * D.x)); }
    // 1 dentro da foto, 0 fora (evita repetir a borda da textura)
    float inside(vec2 p) { vec2 b = step(vec2(0.0), p) * step(p, IMG); return b.x * b.y; }
    float salmonLike(vec3 c) { return smoothstep(0.62, 0.75, c.r) * smoothstep(0.30, 0.42, c.r - c.g); }

    // máscaras dos palitos na foto original (afinam até a ponta)
    float maskU(vec2 p, float k) { float t = dot(p - UA, UD); float h = UH * k * mix(0.7, 1.0, smoothstep(-192.0, -100.0, t)); return band(p, UA, UD, h) * smoothstep(-196.0, -186.0, t); }
    float maskL(vec2 p, float k) { float t = dot(p - LA, LD); float h = LH * k * mix(0.7, 1.0, smoothstep(-208.0, -120.0, t)); return band(p, LA, LD, h) * smoothstep(-212.0, -202.0, t); }

    // camada do niguiri: a foto sem os palitos (buracos preenchidos com o lado oposto)
    vec3 nigiriLayer(vec2 p) {
      if (inside(p) < 0.5) return texPx(vec2(760.0, 190.0));
      vec3 c = texPx(p);
      // palito de baixo: copia o lado de baixo (fundo ou arroz); palito de cima: só existe sobre o fundo
      float dark = 1.0 - smoothstep(0.22, 0.40, max(c.r, max(c.g, c.b)));
      // palito de baixo (na frente): núcleo sempre; anel externo só se for sombra/borda escura
      // sombra do palito sobre o salmão é um vermelho escuro: limite mais alto só aqui
      float darkL = 1.0 - smoothstep(0.38, 0.58, max(c.r, max(c.g, c.b)));
      float wl = max(maskL(p, 1.05), maskL(p, 1.9) * darkL);
      // palito de cima: no trecho atrás do salmão (t < -100) não há madeira visível para apagar
      float tu = dot(p - UA, UD);
      // sobre o fundo: apaga tudo que não for salmão claro (inclui o brilho da borda da madeira)
      float notSalmon = 1.0 - smoothstep(0.70, 0.85, c.r);
      float wu = max(maskU(p, 1.05), maskU(p, 2.0) * max(dark, notSalmon)) * smoothstep(-106.0, -96.0, tu);
      vec3 bg = texPx(vec2(760.0, 190.0));
      c = mix(c, texPx(p + vec2(0.5893, 0.8079) * (LH * 1.9 + 10.0)), wl);
      c = mix(c, bg, wu);
      return c;
    }
    // palito de cima: a ponta escondida atrás do salmão é reconstruída espelhando a madeira visível
    vec4 stickU(vec2 p) {
      float t = dot(p - UA, UD);
      vec2 q = t < -100.0 ? p + UD * (2.0 * (-100.0 - t)) : p;
      vec3 c = texPx(q);
      return vec4(c, maskU(p, 1.05) * inside(p));
    }
    vec4 stickL(vec2 p) { return vec4(texPx(p), maskL(p, 1.15) * (1.0 - maskU(p, 1.0)) * inside(p)); }

    float easeOutCubic(float x) { float y = 1.0 - x; return 1.0 - y * y * y; }
    float easeInOutCubic(float x) { float y = -2.0 * x + 2.0; return x < 0.5 ? 4.0 * x * x * x : 1.0 - y * y * y * 0.5; }

    // Coreografia (uPick 0 → 1):
    //  0.00–0.40  o niguiri está embaixo ("no prato"); o hashi desce do topo, quase na vertical
    //  0.40–0.50  pegada: leve pressão para baixo
    //  0.50–1.00  os dois sobem juntos até a pose da foto, com balanço amortecido do niguiri
    vec3 scene(vec2 t) {
      vec2 P = toPx(t);
      float p = uPick;
      const vec2 LOW  = vec2(0.0, 360.0);        // niguiri começa 360 px abaixo, saindo do escuro
      const vec2 FROM = vec2(130.0, -1060.0);    // hashi começa acima da tela (relativo à pegada)
      const vec2 GRIP = vec2(515.0, 560.0);      // ponto de pegada na pose final

      float d = easeOutCubic(clamp(p / 0.40, 0.0, 1.0));
      float press = sin(clamp((p - 0.40) / 0.10, 0.0, 1.0) * 3.14159) * 7.0;
      float q = clamp((p - 0.50) / 0.50, 0.0, 1.0);
      float up = easeInOutCubic(q);
      vec2 lift = LOW * (1.0 - up) + vec2(0.0, press);
      // balanço do niguiri pendurado no hashi: zera exatamente em q = 1
      float swing = radians(5.0) * sin(q * 9.0) * (1.0 - q) * (1.0 - q) * smoothstep(0.0, 0.08, q);

      // niguiri: desloca + gira em torno da pegada
      vec3 col = nigiriLayer(rot(P - lift, GRIP, -swing));
      float fg = smoothstep(0.10, 0.20, max(col.r, max(col.g, col.b)));
      // hashi: desce até a pegada e depois acompanha a subida (gira junto no balanço, metade do ângulo)
      vec2 G = rot(P - lift - FROM * (1.0 - d), GRIP, -swing * 0.5);
      vec4 L = stickL(G);
      col = mix(col, L.rgb, L.a);
      vec4 U = stickU(G);
      col = mix(col, U.rgb, U.a * (1.0 - fg));   // palito de trás some atrás do salmão
      return col;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uRes.x / uRes.y;

      // 1) respiração ambiente: deslocamento orgânico quase imperceptível
      vec2 disp = 0.0016 * vec2(snoise(uv * 2.4 + vec2(uTime * 0.04, 0.0)),
                                snoise(uv * 2.4 + vec2(5.2, -uTime * 0.035)));

      // 2) rastro do ponteiro: lente (empurra) + anel de onda que se propaga
      float energy = 0.0;
      for (int i = 0; i < 8; i++) {
        vec4 t = uTrail[i];
        if (t.z < 0.002) continue;
        vec2 d = uv - t.xy; d.x *= aspect;
        float r = length(d);
        vec2 dir = d / (r + 1e-4);
        float lens = exp(-r * r * 60.0) * t.z;
        float ring = sin(r * 70.0 - t.w * 10.0) * exp(-r * 8.0) * t.z;
        vec2 o = dir * (ring * 0.0055 - lens * 0.018);
        o.x /= aspect;
        disp += o;
        energy += lens;
      }

      // 3) amostra com leve aberração cromática proporcional à distorção
      vec2 base = cover(uv + disp);
      vec3 col;
      if (uPick < 1.0) {
        col = scene(base);
      } else {
      vec2 ca = normalize(uv - 0.5 + 1e-4) * (length(disp) * 0.45);
      col = vec3(texture2D(uTex, cover(uv + disp + ca)).r,
                      texture2D(uTex, base).g,
                      texture2D(uTex, cover(uv + disp - ca)).b);

      // 4) iluminação: normal derivada da luminância (bump) + Blinn-Phong
      vec2 tx = uTexel * 3.0;
      float hL = lum(texture2D(uTex, base - vec2(tx.x, 0.0)).rgb);
      float hR = lum(texture2D(uTex, base + vec2(tx.x, 0.0)).rgb);
      float hD = lum(texture2D(uTex, base - vec2(0.0, tx.y)).rgb);
      float hU = lum(texture2D(uTex, base + vec2(0.0, tx.y)).rgb);
      vec3 N = normalize(vec3((hL - hR) * 1.6, (hD - hU) * 1.6, 1.0));
      vec2 lp = uLight - uv; lp.x *= aspect;
      vec3 L = normalize(vec3(lp, 0.35));
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float spec = pow(max(dot(N, H), 0.0), 36.0);
      // máscara do salmão: tons laranja/vermelhos com alguma luz
      float salmon = smoothstep(0.08, 0.30, col.r - col.g) * smoothstep(0.22, 0.55, lum(col));
      col += spec * salmon * vec3(1.0, 0.94, 0.88) * 0.28;
      }
      col += energy * 0.035 * vec3(1.0, 0.5, 0.35);

      // 5) revelação em tinta sumi-ê, do centro do prato para fora
      vec2 cc = uv - vec2(0.56, 0.55); cc.x *= aspect;
      float v = length(cc) * 0.9 + (snoise(uv * 4.0) * 0.5 + 0.5) * 0.35;
      float m = 1.0 - smoothstep(uReveal - 0.12, uReveal, v);
      col = mix(vec3(14.0, 13.0, 12.0) / 255.0, col, m);

      // 6) grão de filme
      col += (hash(uv * uRes + fract(uTime * 7.0) * 100.0) - 0.5) * 0.022;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn('[hero-gl] shader:', e.message);
    return off('erro-shader');
  }
  gl.useProgram(prog);

  // um triângulo que cobre a tela inteira (mais barato que dois)
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uTex', 'uRes', 'uImg', 'uTexel', 'uPick', 'uPos', 'uLight', 'uTime', 'uReveal', 'uTrail'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  /* ---------------------------- Estado ---------------------------- */
  const TRAIL = 8;
  const trail = new Float32Array(TRAIL * 4);
  let trailHead = 0;
  const pointer = { x: 0.6, y: 0.55, inside: false, lastX: 0, lastY: 0, lastT: 0 };
  const light = { x: 0.62, y: 0.58 };
  let reveal = 0, revealStart = 0, t0 = performance.now(), last = t0;
  let running = false, visible = true, raf = 0, ready = false;
  let frames = 0;
  let forcedPick = null;   // para testes quadro a quadro

  function sizeCanvas() {
    // celular com a foto ampliada precisa da mesma nitidez do desktop
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // teto de ~2,4 milhões de pixels para manter 60 fps em GPUs modestas
    const max = 2.4e6;
    if (w * h * dpr * dpr > max) dpr = Math.sqrt(max / (w * h));
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    // acompanha o object-position definido no CSS (muda entre desktop e celular)
    const pos = getComputedStyle(photo).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    gl.uniform2f(U.uPos, isNaN(pos[0]) ? 0.5 : pos[0], 1 - (isNaN(pos[1]) ? 0.5 : pos[1]));
  }

  function toUv(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
  }

  function onMove(e) {
    const p = toUv(e);
    const now = performance.now();
    const dt = Math.max(16, now - pointer.lastT);
    const dist = Math.hypot(p.x - pointer.lastX, p.y - pointer.lastY);
    pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
    if (dist > 0.012 || now - pointer.lastT > 60) {
      const speed = dist / dt * 1000;            // UV por segundo
      const i = trailHead * 4;
      trail[i] = p.x; trail[i + 1] = p.y;
      trail[i + 2] = Math.min(1, 0.25 + speed * 0.9);
      trail[i + 3] = 0;
      trailHead = (trailHead + 1) % TRAIL;
      pointer.lastX = p.x; pointer.lastY = p.y; pointer.lastT = now;
    }
    if (!running && ready && visible) start();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = (now - t0) / 1000;

    // revelação em tinta começa quando o preloader sai
    if (document.body.classList.contains('loaded')) {
      if (!revealStart) revealStart = now;
      reveal = Math.min(1.4, ((now - revealStart) / 900) * 1.4);
    }
    // hashi: começa logo após a tinta, dura 3 s e termina exatamente na foto original
    const pick = forcedPick !== null ? forcedPick : (revealStart ? Math.min(1, Math.max(0, (now - revealStart - 250) / 3000)) : 0);
    gl.uniform1f(U.uPick, pick);

    // rastro: decai de forma independente da taxa de quadros
    const decay = Math.pow(0.955, dt * 60);
    let alive = false;
    for (let i = 0; i < TRAIL; i++) {
      trail[i * 4 + 2] *= decay;
      trail[i * 4 + 3] += dt;
      if (trail[i * 4 + 2] > 0.002) alive = true;
    }

    // luz: segue o ponteiro; sem interação, passeia devagar sobre o prato
    const tx = pointer.inside ? pointer.x : 0.62 + Math.cos(time * 0.35) * 0.14;
    const ty = pointer.inside ? pointer.y : 0.58 + Math.sin(time * 0.35) * 0.12;
    light.x += (tx - light.x) * 0.06;
    light.y += (ty - light.y) * 0.06;

    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uReveal, reveal);
    gl.uniform2f(U.uLight, light.x, light.y);
    gl.uniform4fv(U.uTrail, trail);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frames++;

    if (frames === 2) wrap.classList.add('gl-on');
    raf = running ? requestAnimationFrame(frame) : 0;
  }

  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  /* ---------------------------- Textura ---------------------------- */
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    wrap.insertBefore(canvas, wrap.firstChild);
    try {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      // WebGL1 só gera mipmaps em texturas potência de 2: reamostra a foto antes
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const want = Math.max(canvas.clientWidth, canvas.clientHeight) * Math.min(window.devicePixelRatio || 1, 1.5);
      const pot = Math.min(maxTex, want > 1100 ? 2048 : 1024);
      const c2 = document.createElement('canvas');
      c2.width = c2.height = pot;
      const ctx = c2.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, pot, pot);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, c2);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform2f(U.uTexel, 1 / pot, 1 / pot);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } catch (e) {
      // ex.: site aberto direto do arquivo (file://) — o navegador bloqueia a textura
      canvas.remove();
      return off('sem-textura');
    }
    gl.uniform1i(U.uTex, 0);
    gl.uniform2f(U.uImg, img.naturalWidth, img.naturalHeight);
    sizeCanvas();
    ready = true;
    wrap.dataset.gl = 'ligado';
    start();
  };
  img.onerror = () => off('sem-textura');
  // usa exatamente a foto que o navegador escolheu (leve no celular, grande no desktop)
  const pick = () => { img.src = photo.currentSrc || photo.src; };
  if (photo.complete && photo.currentSrc) pick(); else photo.addEventListener('load', pick, { once: true });

  /* ------------------- Eventos, pausa e economia ------------------- */
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerdown', onMove, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.inside = false; });

  new ResizeObserver(() => { if (ready) sizeCanvas(); }).observe(canvas);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && ready) start(); else stop();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible && ready) start(); });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); stop();
    wrap.classList.remove('gl-on'); canvas.remove(); off('contexto-perdido');
  });

  // para testes: window.__heroGL.fps()
  window.__heroGL = {
    estado: () => wrap.dataset.gl,
    congelar: (p) => { forcedPick = p; },
    fps: () => new Promise((res) => { const f0 = frames, s = performance.now(); setTimeout(() => res(Math.round((frames - f0) / ((performance.now() - s) / 1000))), 2000); }),
  };
})();
