/* 智能简史 · a ~10-second, wide-and-short history of intelligence.
 *
 *   0 – 3 s   a walker straightens up from ape to human
 *   3 – 4.6   speech, then oracle-bone 人 言 文 written on the strip
 *   4.6 – 6.2 the strip becomes a tape; a Turing head replaces the human
 *   6.2 – 7.8 a small MLP grows above the head, activations flow
 *   7.8 – 8.5 head and MLP fold into one machine
 *             (the Turing head encodes Turing's "Can machines think?" into the tape, one ASCII byte per cell, shown in hex)
 *   8.5 →     the machine answers in real o200k_base tokens: "Attention Is All You Need" …,
 *             then a laptop arrives and it types them, forever
 *
 * Pure function of time: render(t) draws exactly one frame, so the same code
 * plays live on the page and can be stepped frame-by-frame to export an MP4.
 * Colours come from CSS custom properties, so light/dark themes just work.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var H = 200, CX = 500, GY = 150, TAPE_H = 28, CELL = 38;
  var VW = 46, STRIDE = 26;            // walking speed (px/s) and stride, matched so feet don't slide
  // Timeline, in real seconds (~32 s of story, then an endless typing loop):
  //    0 – 5     an ape straightens into a human; a dog joins
  //    5 – 8     speech, then 人 言 文 written on the strip; a cat joins
  //    8 – 9.4   the strip becomes a tape, the human is carried off, a Turing head drops in
  //    9.4 – 17  the head reads 人言文 and encodes "Can machines think?" — one ASCII byte per cell
  //   17.4 – 22  an MLP learns to tell the cat from the dog
  //   22 – 24    the network folds into the head: one machine; the cat naps on its roof
  //   24 – 30    the machine answers in tokens: "Attention Is All You Need. …"
  //   30 →       a laptop arrives, the dog naps on the desk, the machine types, forever
  var LAP_IN = 29.4, LAP_DONE = 30.6, ARMS_DONE = 31.2;
  function story(t) { return t; }
  // the MLP scene was choreographed on a compact clock; M() places it at 17.4–23.6 s
  var MK = 2.7556;
  function M(x) { return 17.4 + (x - 6.2) * MK; }
  var T_END = 32;                       // seconds until the endless typing loop is established

  // Question and answer, 67 years apart:
  //   the Turing machine writes Turing's (1950) "Can machines think?" onto the tape in 8-bit ASCII;
  //   the LLM answers with Vaswani et al. (2017) — real o200k_base tokens + ids:
  //   "Attention Is All You Need" + the first sentence of the abstract
  var QUESTION = 'Can machines think?';
  var TOKENS = [["Attention",80207],[" Is",2763],[" All",2545],[" You",1608],[" Need",19792],[".",13],[" The",623],[" dominant",42647],[" sequence",16281],[" trans",1643],["duction",23838],[" models",7015],[" are",553],[" based",4122],[" on",402],[" complex",8012],[" recurrent",94157],[" or",503],[" convolution",137447],["al",280],[" neural",58480],[" networks",20240],[" that",484],[" include",3931],[" an",448],[" encoder",49416],[" and",326],[" a",261],[" decoder",53790],[".",13]];

  /* ── small math helpers ─────────────────────────────────────────────── */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function smooth(e0, e1, x) { var k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function ik(a, b, l1, l2, dir) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
    var base = Math.atan2(dy, dx);
    var c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    var ang = base - dir * Math.acos(c);
    return [a[0] + l1 * Math.cos(ang), a[1] + l1 * Math.sin(ang)];
  }
  function pts(arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

  /* ── motion profiles ────────────────────────────────────────────────── */
  function walkSpeed(t) { return t < 4.3 ? VW : t < 5.0 ? VW * (5.0 - t) / 0.7 : 0; }
  var V_ENC = 100, V_TOK = 100;
  function tapeSpeed(t) {
    if (t < 8.0) return 0;
    var v = 40 * smooth(8.0, 8.5, t);                     // carry the human away
    v += (V_ENC - 40) * smooth(9.6, 10.2, t);             // the head encodes, ~2.6 characters a second
    v -= V_ENC * smooth(17.0, 17.6, t);                   // stop: the cat and dog hold still to be classified
    v += V_TOK * smooth(22.9, 23.6, t);                   // token pace — the answer lands right after the question
    return v;
  }
  var T_TAB = 26, DT = 1 / 200, N = Math.ceil(T_TAB / DT) + 1, WK = new Float64Array(N), TP = new Float64Array(N);
  (function () {
    for (var i = 1; i < N; i++) {
      var t = (i - 0.5) * DT;
      WK[i] = WK[i - 1] + walkSpeed(t) * DT;
      TP[i] = TP[i - 1] + tapeSpeed(t) * DT;
    }
  })();
  function table(arr, t, vEnd) {
    if (t <= 0) return 0;
    if (t >= T_TAB) return arr[N - 1] + vEnd * (t - T_TAB);
    var f = t / DT, i = Math.floor(f);
    return lerp(arr[i], arr[Math.min(i + 1, N - 1)], f - i);
  }
  function walked(t) { return table(WK, t, 0); }
  function taped(t) { return table(TP, t, V_TOK); }
  // inverse of taped(): when did the tape reach offset s?
  function tapeTime(s) {
    if (s <= 0) return 8.0;
    if (s >= TP[N - 1]) return T_TAB + (s - TP[N - 1]) / V_TOK;
    var lo = 0, hi = N - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (TP[m] < s) lo = m; else hi = m; }
    return lo * DT;
  }

  /* ── the walker's skeleton ──────────────────────────────────────────── */
  function pose(p, phase, amp) {
    var legL = 36 + 8 * p, stride = STRIDE * amp, lift = 7 * amp;
    var bob = amp * 1.4 * (1 - Math.cos(2 * phase)) / 2;
    var hip = [0, GY - legL * lerp(0.8, 0.94, p) - bob];
    var J = { hip: hip, legs: [], arms: [] };
    for (var i = 0; i < 2; i++) {
      var u = ((phase / (2 * Math.PI) + i * 0.5) % 1 + 1) % 1, fx, fy;
      if (u < 0.5) { fx = stride / 2 - 2 * u * stride; fy = GY; }
      else { var s = (u - 0.5) * 2; fx = -stride / 2 + s * stride; fy = GY - lift * Math.sin(Math.PI * s); }
      var foot = [hip[0] + fx + 2, fy];
      J.legs.push([hip, ik(hip, foot, legL / 2, legL / 2, 1), foot]);
    }
    var beta = lerp(1.02, 0.05, p), spineL = lerp(28, 38, p);
    var sh = [hip[0] + Math.sin(beta) * spineL, hip[1] - Math.cos(beta) * spineL];
    J.shoulder = sh;
    var gam = lerp(1.3, 0.1, p), neck = lerp(8, 10, p);
    J.r = lerp(8.5, 9.5, p);
    J.head = [sh[0] + Math.sin(gam) * (neck + J.r * 0.7), sh[1] - Math.cos(gam) * (neck + J.r * 0.7)];
    J.muzzle = 1 - smooth(0.2, 0.75, p);
    var armL = lerp(54, 38, p), q = smooth(0.25, 0.6, p);
    for (var k = 0; k < 2; k++) {
      // ape: knuckle-walking, hands planted on the ground; human: free swing
      var u2 = ((phase / (2 * Math.PI) + k * 0.5 + 0.25) % 1 + 1) % 1, ax, ay;
      if (u2 < 0.5) { ax = stride / 2 - 2 * u2 * stride; ay = GY - 1; }
      else { var s2 = (u2 - 0.5) * 2; ax = -stride / 2 + s2 * stride; ay = GY - 1 - lift * Math.sin(Math.PI * s2); }
      var apeHand = [sh[0] + 6 + ax, ay];
      var sw = 0.38 * amp * Math.sin(phase + k * Math.PI);
      var humHand = [sh[0] + Math.sin(sw) * armL * 0.95, sh[1] + Math.cos(sw) * armL * 0.95];
      var hand = [lerp(apeHand[0], humHand[0], q), lerp(apeHand[1], humHand[1], q)];
      J.arms.push([sh, ik(sh, hand, armL / 2, armL / 2, -1), hand]);
    }
    J.legW = lerp(10, 8, p); J.armW = lerp(8, 6.5, p); J.torsoW = lerp(21, 15, p);
    return J;
  }

  /* ── oracle-bone glyphs (simplified, drawn as strokes) ───────────────── */
  var GLYPHS = [
    // 人 — a person bowing, in profile
    'M2 -12 C 0 -4, -4 4, -9 11 M0 -3 C 3 2, 6 7, 8 11',
    // 言 — a mouth with a reed above it
    'M-8 1 Q -8 11, 0 11 Q 8 11, 8 1 M0 1 L0 -8 M-6 -8 L6 -8 M-4 -12 L4 -12',
    // 文 — a frontal figure with a mark on the chest
    'M0 -13 L0 -9 M-10 -6 L10 -6 M-6 -6 L6 12 M6 -6 L-6 12 M-2 0 L2 3'
  ];

  /* ── styles: one engine, three looks ─────────────────────────────────── */
  var STYLES = {
    // 线稿：ink outlines + flat swatch fills, like the page's illustration
    ink:   { rough: true,  outline: true,  fill: true,  thin: false },
    // 剪影：solid silhouettes in the page's text colour, clay for "energy"
    cut:   { rough: true,  outline: false, fill: true,  thin: false },
    // 单线：monoline drawing, no fills
    line:  { rough: false, outline: false, fill: false, thin: true }
  };

  function mount(host, opts) {
    opts = opts || {};
    var style = STYLES[opts.style] ? opts.style : 'ink';
    var S = STYLES[style];
    var framing = opts.framing === 'walk' ? 'walk' : 'center';
    var uid = 'ih' + Math.random().toString(36).slice(2, 7);

    host.classList.add('ih', 'ih-' + style);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', opts.label || '智能简史动画：古猿直立成人，说出语言、写下甲骨文“人言文”；纸带变成图灵机纸带，读写头取代了人；读写头上长出一个小型神经网络；一只狗和一只猫先后来到人身边，后来成了神经网络分辨猫狗的训练样本；二者合成一台机器，猫跳上机器顶上睡觉；图灵机读完“人言文”，把图灵的提问 Can machines think? 逐字编码（ASCII 十六进制）写上纸带；最后机器用 token 作答，打印论文《Attention Is All You Need》的标题与摘要首句，随后伸出机械臂，在笔记本电脑上不停打字，狗跳上书桌趴下。');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    host.appendChild(svg);

    function mk(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    }
    function css(e, o) { for (var k in o) e.style[k] = o[k]; return e; }

    var defs = mk('defs', {});
    var f = mk('filter', { id: uid + 'r', x: '-5%', y: '-20%', width: '110%', height: '140%' }, defs);
    mk('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '2', seed: '4' }, f);
    mk('feDisplacementMap', { in: 'SourceGraphic', scale: '2.2' }, f);
    var clip = mk('clipPath', { id: uid + 'c' }, defs);
    var clipRect = mk('rect', { x: 0, y: 0, width: 1000, height: H }, clip);

    var root = mk('g', { 'clip-path': 'url(#' + uid + 'c)' });
    var scene = mk('g', S.rough ? { filter: 'url(#' + uid + 'r)' } : {}, root);
    var g = {};
    ['ground', 'desk', 'tape', 'cells', 'marks', 'walker', 'speech', 'petsBack', 'head', 'net', 'laptop', 'arms', 'chips', 'pets'].forEach(function (n) { g[n] = mk('g', {}, scene); });

    var INK = 'var(--ih-ink)', LINE = 'var(--ih-line)', BG = 'var(--ih-bg)';
    var SW = S.thin ? 1.8 : 2.4;        // outline width

    // colour of a "thing" in each style
    function paint(e, swatch, opt) {
      opt = opt || {};
      if (style === 'ink') css(e, { fill: swatch, stroke: INK, strokeWidth: opt.w || SW });
      else if (style === 'cut') css(e, { fill: opt.cutFill || LINE, stroke: 'none' });
      else css(e, { fill: opt.lineFill || BG, stroke: LINE, strokeWidth: opt.w || SW });
      return e;
    }
    function textInk(e) { css(e, { fill: style === 'ink' ? INK : style === 'cut' ? BG : LINE }); return e; }

    /* ground */
    var ground = css(mk('line', { x1: -10, y1: GY, x2: 1010, y2: GY }, g.ground), { stroke: LINE, strokeWidth: 2, strokeLinecap: 'round' });
    var tufts = [];
    for (var i = 0; i < 26; i++) {
      var tf = mk('path', { d: hash(i) < 0.5 ? 'M0 0 l2 -5 M4 0 l1 -4' : 'M0 3 h6 M10 4 h3' }, g.ground);
      css(tf, { stroke: LINE, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' });
      tufts.push(tf);
    }

    /* tape band + cells */
    var band = paint(mk('rect', { x: -20, y: GY, width: 1040, height: TAPE_H, rx: 2 }, g.tape), 'var(--ih-manilla)', { cutFill: 'var(--ih-cut-tape)' });
    var cellLines = [];
    for (i = 0; i < 34; i++) cellLines.push(css(mk('line', { y1: GY + 3, y2: GY + TAPE_H - 3 }, g.cells), { stroke: style === 'ink' ? INK : LINE, strokeWidth: 1.4, strokeLinecap: 'round' }));
    var bits = [], chars = [];
    var markCol = style === 'ink' ? INK : LINE;
    for (i = 0; i < 34; i++) {
      var bt = mk('text', { y: GY + 11, 'text-anchor': 'middle', 'font-size': 9.5 }, g.marks);
      css(bt, { fontFamily: 'var(--ih-font-mono)', fill: markCol, letterSpacing: '0.5px', opacity: 0.8 });
      var ch = mk('text', { y: GY + 23.5, 'text-anchor': 'middle', 'font-size': 12.5 }, g.marks);
      css(ch, { fontFamily: 'var(--ih-font-token)', fill: markCol, whiteSpace: 'pre' });
      bits.push(bt); chars.push(ch);
    }
    var glyphEls = GLYPHS.map(function (d) {
      var e = mk('path', { d: d, pathLength: 1 }, g.marks);
      css(e, { fill: 'none', stroke: style === 'ink' ? INK : LINE, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeDasharray: '1 1' });
      return e;
    });

    /* walker: far limbs, torso, head, near limbs — outline pass then fill pass per part */
    var W = { parts: [] };
    function limb(key, far) {
      var o = mk('polyline', {}, g.walker), fl = mk('polyline', {}, g.walker);
      [o, fl].forEach(function (e) { css(e, { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }); });
      return { key: key, far: far, o: o, f: fl };
    }
    W.legFar = limb('leg', 1); W.armFar = limb('arm', 1);
    W.torso = limb('torso', 0);
    W.headO = mk('circle', {}, g.walker); W.muzzle = mk('ellipse', {}, g.walker); W.headF = mk('circle', {}, g.walker);
    W.eye = mk('circle', { r: 1.4 }, g.walker);
    W.hair = mk('path', {}, g.walker);
    W.legNear = limb('leg', 0); W.armNear = limb('arm', 0);
    var speech = [0, 1, 2].map(function () { return css(mk('path', {}, g.speech), { fill: 'none', stroke: LINE, strokeWidth: 2, strokeLinecap: 'round' }); });

    /* Turing head → machine body */
    var body = paint(mk('rect', { rx: 6 }, g.head), 'var(--ih-heather)', { cutFill: LINE });
    var nozzle = paint(mk('path', {}, g.head), 'var(--ih-heather)', { cutFill: LINE });
    var win = mk('rect', { rx: 4 }, g.head);
    css(win, style === 'ink' ? { fill: 'var(--ih-ivory)', stroke: INK, strokeWidth: 2 } : style === 'cut' ? { fill: BG, stroke: 'none' } : { fill: 'none', stroke: LINE, strokeWidth: 1.6 });
    var reader = css(mk('rect', { width: CELL - 4, height: TAPE_H + 6, rx: 4, y: GY - 3 }, g.head), { fill: 'none', stroke: style === 'cut' ? 'var(--ih-clay)' : style === 'ink' ? INK : LINE, strokeWidth: 2.4 });

    /* machine details: rollers on the tape, a state dial, indicator lights */
    var rollers = [0, 1].map(function () {
      var gr = mk('g', {}, g.head);
      paint(mk('circle', { r: 6 }, gr), 'var(--ih-ivory)', { cutFill: LINE });
      css(mk('path', { d: 'M-4 0 H4 M0 -4 V4' }, gr), { stroke: style === 'cut' ? BG : style === 'ink' ? INK : LINE, strokeWidth: 1.6, strokeLinecap: 'round', fill: 'none' });
      return gr;
    });
    var dial = mk('g', {}, g.head);
    paint(mk('circle', { r: 6.5 }, dial), 'var(--ih-ivory)', { cutFill: BG, w: 1.8 });
    var needle = css(mk('line', { x1: 0, y1: 0, x2: 0, y2: -4.5 }, dial), { stroke: style === 'cut' ? LINE : style === 'ink' ? INK : LINE, strokeWidth: 1.6, strokeLinecap: 'round' });
    var lights = [0, 1, 2].map(function () { return mk('circle', { r: 3.4 }, g.head); });

    /* MLP: layers 3-4-3 */
    var LAYERS = [3, 4, 2], nodes = [], edges = [];
    LAYERS.forEach(function (n, l) { for (var j = 0; j < n; j++) nodes.push({ l: l, j: j, n: n }); });
    nodes.forEach(function (a) { nodes.forEach(function (b) { if (b.l === a.l + 1) edges.push([a, b]); }); });
    var edgeEls = edges.map(function () { return css(mk('line', {}, g.net), { stroke: LINE, strokeWidth: 1.2, strokeOpacity: 0.55 }); });
    var feedEls = [0, 1].map(function () { return css(mk('line', {}, g.net), { stroke: LINE, strokeWidth: 1.2, strokeOpacity: 0.55, strokeDasharray: '3 3' }); });
    var nodeEls = nodes.map(function () { return mk('circle', {}, g.net); });

    /* the companions: a dog and a cat, domesticated alongside us — and, ten thousand years later,
       the network's training data (Kaggle's "Dogs vs. Cats") */
    var PET = {
      dog: { leg: 14, rx: 16, ry: 7.5, hr: 6.5, w: 4.6, stride: 16, col: 'var(--ih-kraft)', spot: CX - 110, enter: [3.8, 5.3] },
      cat: { leg: 10, rx: 12, ry: 6, hr: 5.6, w: 3.6, stride: 12, col: 'var(--ih-oat)', spot: CX - 168, enter: [6.0, 7.4] }
    };
    function pair(parent) {
      var o = mk('polyline', {}, parent), f = mk('polyline', {}, parent);
      [o, f].forEach(function (e) { css(e, { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }); });
      return { o: o, f: f };
    }
    function makePet(kind) {
      var A = { kind: kind, P: PET[kind], g: mk('g', {}, g.pets) };
      A.legsFar = [pair(A.g), pair(A.g)];
      A.tail = pair(A.g);
      A.body = mk('ellipse', {}, A.g);
      A.legsNear = [pair(A.g), pair(A.g)];
      A.earBack = mk('path', {}, A.g);
      A.head = mk('circle', {}, A.g);
      A.snout = mk('ellipse', {}, A.g);
      A.earFront = mk('ellipse', {}, A.g);
      A.eye = mk('ellipse', {}, A.g);
      A.nose = mk('circle', { r: 1.4 }, A.g);
      return A;
    }
    var pets = { dog: makePet('dog'), cat: makePet('cat') };
    var finder = css(mk('path', {}, g.net), { fill: 'none', stroke: 'var(--ih-clay)', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' });
    var finderLink = css(mk('line', {}, g.net), { stroke: 'var(--ih-clay)', strokeWidth: 1.2, strokeDasharray: '3 3' });

    var outLabels = ['猫', '狗'].map(function (ch) {
      var e = mk('text', { 'font-size': 13, 'dominant-baseline': 'central' }, g.net);
      css(e, { fontFamily: 'var(--ih-font-label)', fill: LINE });
      e.textContent = ch; return e;
    });
    var probBars = [0, 1].map(function () { return mk('rect', { height: 5, rx: 2.5 }, g.net); });
    var verdict = css(mk('path', {}, g.net), { fill: 'none', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' });
    var SAMPLES = [['cat', 0.34], ['dog', 0.71], ['cat', 0.94]];   // [truth, p(correct)] as training goes on

    /* desk + laptop + arms for the final scene */
    var LX = 652;                                  // laptop centre
    var deskTop = paint(mk('rect', { x: LX - 80, y: 134, width: 232, height: 7, rx: 2 }, g.desk), 'var(--ih-kraft)', { cutFill: LINE });
    var deskLegs = [LX - 68, LX + 140].map(function (x) { return paint(mk('rect', { x: x - 3.5, y: 141, width: 7, height: 60 }, g.desk), 'var(--ih-kraft)', { cutFill: LINE }); });
    var lapBase = paint(mk('path', { d: 'M' + (LX - 60) + ' 126 H' + (LX + 60) + ' L' + (LX + 68) + ' 134 H' + (LX - 68) + ' Z' }, g.laptop), 'var(--ih-oat)', { cutFill: LINE });
    var keys = css(mk('path', { d: 'M' + (LX - 52) + ' 130 H' + (LX + 52) }, g.laptop), { stroke: style === 'cut' ? BG : style === 'ink' ? INK : LINE, strokeWidth: 1.4, strokeDasharray: '5 3', fill: 'none' });
    var lapLid = paint(mk('rect', { x: LX - 56, y: 60, width: 112, height: 66, rx: 5 }, g.laptop), 'var(--ih-oat)', { cutFill: LINE });
    var lapScreen = mk('rect', { x: LX - 48, y: 67, width: 96, height: 52, rx: 2 }, g.laptop);
    css(lapScreen, style === 'ink' ? { fill: 'var(--ih-ivory)', stroke: INK, strokeWidth: 1.6 } : style === 'cut' ? { fill: BG, stroke: 'none' } : { fill: BG, stroke: LINE, strokeWidth: 1.4 });
    var screenText = mk('g', {}, g.laptop);
    var lines = [0, 1, 2, 3, 4].map(function () { return css(mk('path', {}, screenText), { stroke: style === 'ink' ? INK : LINE, strokeWidth: 3, strokeLinecap: 'round', fill: 'none' }); });
    var caret = css(mk('rect', { width: 2, height: 7 }, screenText), { fill: 'var(--ih-clay)' });
    var arms = [0, 1].map(function () {
      var o = css(mk('polyline', {}, g.arms), { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' });
      var f = css(mk('polyline', {}, g.arms), { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' });
      var hnd = paint(mk('circle', { r: 4.5 }, g.arms), 'var(--ih-heather)', { cutFill: LINE });
      if (style === 'ink') { css(o, { stroke: INK, strokeWidth: 9 }); css(f, { stroke: 'var(--ih-heather)', strokeWidth: 4.5 }); }
      else if (style === 'cut') { css(o, { stroke: LINE, strokeWidth: 5 }); css(f, { display: 'none' }); }
      else { css(o, { stroke: LINE, strokeWidth: 1.8 }); css(f, { display: 'none' }); }
      return { o: o, f: f, h: hnd };
    });

    /* chips, created lazily */
    var chips = [], chipPool = [];
    var measurer = mk('text', { x: -999, y: -999, 'font-size': 15 });
    css(measurer, { fontFamily: 'var(--ih-font-token)' });
    function measure(s) {
      measurer.textContent = s.replace(/^ /, ' ');
      var w = 0; try { w = measurer.getComputedTextLength(); } catch (e) {}
      return w || s.length * 7.6;
    }
    var widths = TOKENS.map(function (tk) { return measure(tk[0]); });
    var SWATCHES = ['var(--ih-manilla)', 'var(--ih-cactus)', 'var(--ih-heather)', 'var(--ih-peach)'];
    function chipEl() {
      var grp = mk('g', {}, g.chips), r = mk('rect', { rx: 5, height: 22 }, grp), tx = mk('text', { 'text-anchor': 'middle', 'font-size': 15 }, grp);
      css(tx, { fontFamily: 'var(--ih-font-token)', whiteSpace: 'pre' }); textInk(tx);
      return { g: grp, r: r, t: tx };
    }

    /* ── layout of fixed story positions (tape coordinates) ─────────── */
    var Sstop = framing === 'center' ? walked(5.0) : 0;          // ground offset when the human stops
    var glyphU = [562, 600, 638].map(function (x) { return x + Sstop; });
    var cellOrigin = glyphU[0] - CELL / 2;
    var headOn = 9.4;
    var firstChipU = null, firstTyped = null;

    function groundOffset(t) { return (framing === 'center' ? walked(t) : 0) + taped(t); }
    var writeFrom = groundOffset(headOn + 0.1);

    var viewX = 0, viewW = 1000;
    function fit() {
      var r = host.getBoundingClientRect();
      var aspect = r.width && r.height ? r.width / r.height : 5;
      viewW = Math.min(1000, Math.max(420, H * aspect));
      viewX = CX - viewW / 2;
      svg.setAttribute('viewBox', viewX.toFixed(1) + ' 0 ' + viewW.toFixed(1) + ' ' + H);
      clipRect.setAttribute('x', viewX); clipRect.setAttribute('width', viewW);
    }

    function render(realT) {
      var t = story(realT);
      var off = groundOffset(t);
      var L = viewX - 40, R = viewX + viewW + 40;

      /* ground tufts scroll, fade once the strip forms */
      var tuftA = 1 - smooth(5.3, 6.2, t);
      tufts.forEach(function (e, i) {
        var u = i * 61 + hash(i + 3) * 30;
        var x = ((u - off) % 1600 + 1600) % 1600 - 300;
        e.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + (GY + 4) + ')');
        e.style.opacity = tuftA;
      });

      /* strip: line → paper band → tape */
      var bandK = smooth(5.4, 6.1, t);
      band.setAttribute('height', (TAPE_H * bandK).toFixed(2));
      band.style.opacity = bandK > 0.01 ? 1 : 0;
      ground.style.opacity = 1;
      var cellK = smooth(8.0, 8.8, t);
      var k0 = Math.floor((L + off - cellOrigin) / CELL);
      cellLines.forEach(function (e, i) {
        var x = cellOrigin + (k0 + i) * CELL - off;
        e.setAttribute('x1', x.toFixed(1)); e.setAttribute('x2', x.toFixed(1));
        e.style.opacity = cellK;
      });

      /* glyphs written by the human, read by the head */
      glyphEls.forEach(function (e, i) {
        var t0 = 6.0 + i * 0.6, x = glyphU[i] - off;
        var drawn = smooth(t0, t0 + 0.55, t);
        var read = x <= CX + 1 && t > headOn;
        e.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + (GY + 14) + ') scale(0.82)');
        e.style.strokeDashoffset = (1 - drawn).toFixed(3);
        e.style.opacity = drawn > 0 && !read ? 1 : 0;
      });

      /* the Turing head encodes the question: one character per cell, its ASCII code (hex) above it */
      var kFirst = Math.ceil((writeFrom + CX - cellOrigin) / CELL - 0.5);
      bits.forEach(function (e, i) {
        var k = k0 + i, u = cellOrigin + (k + 0.5) * CELL, x = u - off;
        var passed = u - CX;                    // tape offset at which this cell reached the head
        var c = k - kFirst;
        var on = t > headOn && c >= 0 && c < QUESTION.length && off >= passed;
        e.setAttribute('x', x.toFixed(1)); chars[i].setAttribute('x', x.toFixed(1));
        if (on) {
          var code = QUESTION.charCodeAt(c);
          e.textContent = ('0' + code.toString(16).toUpperCase()).slice(-2);   // ASCII in hex: C → 43
          chars[i].textContent = QUESTION[c] === ' ' ? '␣' : QUESTION[c];
          var a = smooth(0, 8, off - passed);
          e.style.opacity = a * 0.8; chars[i].style.opacity = a * (QUESTION[c] === ' ' ? 0.45 : 1);
        } else { e.style.opacity = 0; chars[i].style.opacity = 0; }
      });

      /* walker */
      var p = smooth(0.4, 4.5, t);
      var dist = walked(t);
      var amp = 1 - smooth(4.25, 5.05, t);
      var phase = 2 * Math.PI * dist / (2 * STRIDE);
      var wx = framing === 'center' ? CX : CX - walked(5.0) + dist;
      if (t > 8.0) wx -= taped(t);              // carried off by the moving tape
      var wA = 1 - smooth(8.3, 9.1, t);
      g.walker.style.opacity = wA;
      if (wA > 0) drawWalker(pose(p, phase, amp), wx, p);

      /* speech: three arcs from the mouth */
      speech.forEach(function (e, i) {
        var t0 = 5.05 + i * 0.27, k = smooth(t0, t0 + 0.75, t), fade = 1 - smooth(t0 + 0.5, t0 + 1.25, t);
        var r = 6 + 9 * i + 6 * k, hx = CX + 14, hy = GY - 86;
        e.setAttribute('d', 'M' + (hx + r * 0.5).toFixed(1) + ' ' + (hy - r * 0.6).toFixed(1) + ' Q ' + (hx + r).toFixed(1) + ' ' + hy + ' ' + (hx + r * 0.5).toFixed(1) + ' ' + (hy + r * 0.6).toFixed(1));
        e.style.opacity = (k > 0 ? 1 : 0) * fade;
      });

      /* head → machine */
      var hIn = smooth(8.6, 9.4, t), morph = smooth(M(7.8), M(8.45), t);
      var drop = (1 - hIn) * -70;
      var bw = lerp(44, 124, morph), bh = lerp(32, 94, morph);
      var bx = CX - bw / 2, by = lerp(110, 46, morph) + drop;
      body.setAttribute('x', bx.toFixed(1)); body.setAttribute('y', by.toFixed(1));
      body.setAttribute('width', bw.toFixed(1)); body.setAttribute('height', bh.toFixed(1));
      if (style === 'ink') body.style.fill = 'color-mix(in srgb, var(--ih-oat) ' + Math.round(morph * 100) + '%, var(--ih-heather))';
      var ny = by + bh;
      nozzle.setAttribute('d', 'M' + (CX - 9) + ' ' + (ny - 1).toFixed(1) + ' L' + (CX + 9) + ' ' + (ny - 1).toFixed(1) + ' L' + CX + ' ' + (GY - 2 + drop * 0).toFixed(1) + ' Z');
      g.head.style.opacity = hIn;
      var spread = lerp(15, 44, morph);
      rollers.forEach(function (r, i) {
        var rx = CX + (i ? spread : -spread), ry = Math.min(GY - 6, ny + 2);
        r.setAttribute('transform', 'translate(' + rx.toFixed(1) + ',' + (GY - 6 + drop).toFixed(1) + ') rotate(' + ((-off / 6) * 57.3 % 360).toFixed(1) + ')');
      });
      // the dial ticks to a new state for every cell written
      var state = Math.floor(Math.max(0, off - writeFrom) / CELL);
      var ang = t < headOn ? 0 : (hash(state) * 300 - 150);
      dial.setAttribute('transform', 'translate(' + (bx + 13).toFixed(1) + ',' + (by + bh / 2 - (morph * (bh / 2 - 13))).toFixed(1) + ')');
      needle.setAttribute('transform', 'rotate(' + ang.toFixed(0) + ')');
      lights.forEach(function (e, i) {
        var lx = bx + bw - 10 - i * 9, ly = by + 9;
        e.setAttribute('cx', lx.toFixed(1)); e.setAttribute('cy', ly.toFixed(1));
        var on = t > headOn && hash(i * 13 + Math.floor(t * (t > M(8.45) ? 6 : 3))) > 0.45;
        var col = on ? 'var(--ih-clay)' : (style === 'cut' ? BG : 'var(--ih-ivory)');
        if (style === 'ink') css(e, { fill: col, stroke: INK, strokeWidth: 1.4 });
        else if (style === 'cut') css(e, { fill: col, stroke: 'none' });
        else css(e, { fill: on ? 'var(--ih-clay)' : BG, stroke: LINE, strokeWidth: 1.4 });
        e.style.opacity = i < 1 + Math.round(morph * 2) ? 1 : 0;
      });
      reader.setAttribute('x', (CX - (CELL - 4) / 2).toFixed(1));
      reader.style.opacity = hIn * (1 - morph);
      // window inside the machine where the network keeps living
      var ww = 76 * morph, wh = 40 * morph;
      win.setAttribute('x', (CX - ww / 2).toFixed(1)); win.setAttribute('y', (by + 14).toFixed(1));
      win.setAttribute('width', ww.toFixed(1)); win.setAttribute('height', wh.toFixed(1));
      win.style.opacity = morph > 0.05 ? 1 : 0;

      /* MLP above the head, then shrinking into the window */
      var grow = smooth(M(6.2), M(6.7), t);
      var netA = grow;
      g.net.style.opacity = netA;
      var big = { x0: CX - 64, dx: 64, y0: 56, dy: 19, r: 7.5 };
      var small = { x0: CX - 26, dx: 26, y0: by + 14 + 20, dy: 9.5, r: 3.6 };
      // fold in two beats: the big network shrinks into the head, then reappears inside the window
      var mA = smooth(M(7.8), M(8.08), t), mB = smooth(M(8.12), M(8.45), t);
      var pos = nodes.map(function (nd) {
        var B = [big.x0 + nd.l * big.dx, big.y0 + (nd.j - (nd.n - 1) / 2) * big.dy];
        var Sm = [small.x0 + nd.l * small.dx, small.y0 + (nd.j - (nd.n - 1) / 2) * small.dy];
        if (mB > 0) return [Sm[0], Sm[1], small.r * mB];
        return [lerp(B[0], CX, mA), lerp(B[1], 108, mA), big.r * (1 - mA)];
      });
      nodeEls.forEach(function (e, i) {
        var nd = nodes[i], P = pos[i];
        var appear = smooth(M(6.2 + nd.l * 0.12), M(6.5 + nd.l * 0.12), t);
        // activation: waves travelling input → output, then a steady shimmer inside the machine
        var wave = Math.max(0, Math.sin((t - M(6.6)) * 5.2 / MK - nd.l * 1.4 + hash(i) * 0.6));
        var act = t < M(6.6) ? 0 : clamp(wave * (0.6 + 0.4 * hash(i * 3 + Math.floor(t * 2.5 / MK))), 0, 1);
        e.setAttribute('cx', P[0].toFixed(1)); e.setAttribute('cy', P[1].toFixed(1));
        e.setAttribute('r', (P[2] * appear).toFixed(2));
        var pct = Math.round(act * 100);
        if (style === 'ink') css(e, { fill: 'color-mix(in srgb, var(--ih-clay) ' + pct + '%, var(--ih-cactus))', stroke: INK, strokeWidth: lerp(2, 1.4, morph) });
        else if (style === 'cut') css(e, { fill: 'color-mix(in srgb, var(--ih-clay) ' + pct + '%, ' + 'var(--ih-line)' + ')', stroke: 'none' });
        else css(e, { fill: 'color-mix(in srgb, var(--ih-clay) ' + pct + '%, var(--ih-bg))', stroke: LINE, strokeWidth: 1.6 });
      });
      /* which training sample is on screen, and what the network predicts */
      var T0 = M(6.65), SW = 0.4 * MK;                    // ~1.1 s per training sample
      var si = clamp(Math.floor((t - T0) / SW), 0, 2), smp = SAMPLES[si];
      var sT = T0 + si * SW, within = (t - sT) / MK;     // within-sample time, on the compact clock
      var trainK = smooth(M(6.5), M(6.7), t) * (1 - smooth(M(7.8), M(8.05), t));
      var pc = t < T0 ? 0.5 : lerp(0.5, smp[1], smooth(0.08, 0.26, within));
      var probs = smp[0] === 'cat' ? [pc, 1 - pc] : [1 - pc, pc];
      var outIdx = [nodes.length - 2, nodes.length - 1];
      outIdx.forEach(function (ni, k) {
        var P = pos[ni];
        outLabels[k].setAttribute('x', (P[0] + 13).toFixed(1)); outLabels[k].setAttribute('y', P[1].toFixed(1));
        outLabels[k].style.opacity = trainK;
        var bw2 = 30 * probs[k];
        probBars[k].setAttribute('x', (P[0] + 29).toFixed(1)); probBars[k].setAttribute('y', (P[1] - 2.5).toFixed(1));
        probBars[k].setAttribute('width', bw2.toFixed(1));
        css(probBars[k], { fill: k === (smp[0] === 'cat' ? 0 : 1) ? 'var(--ih-clay)' : 'color-mix(in srgb, var(--ih-line) 35%, transparent)', opacity: trainK * (t > T0 ? 1 : 0) });
        if (t > T0 && t < M(7.85)) {
          var pct2 = Math.round(probs[k] * 100);
          nodeEls[ni].style.fill = style === 'line' ? 'color-mix(in srgb, var(--ih-clay) ' + pct2 + '%, var(--ih-bg))' : 'color-mix(in srgb, var(--ih-clay) ' + pct2 + '%, ' + (style === 'ink' ? 'var(--ih-cactus)' : 'var(--ih-line)') + ')';
        }
      });
      // a viewfinder frames whichever animal is the current sample
      var tgt = petState(smp[0], t), fx = tgt.x, P0 = PET[smp[0]];
      var fw = P0.rx + P0.hr + 8, fTop = GY - P0.leg - P0.ry * 2 - P0.hr - 8, fBot = GY + 3, fl = 7;
      var x0f = fx - P0.rx - 8, x1f = fx + fw;
      finder.setAttribute('d', 'M' + x0f + ' ' + (fTop + fl) + ' V' + fTop + ' H' + (x0f + fl) + ' M' + (x1f - fl) + ' ' + fTop + ' H' + x1f + ' V' + (fTop + fl) +
        ' M' + x1f + ' ' + (fBot - fl) + ' V' + fBot + ' H' + (x1f - fl) + ' M' + (x0f + fl) + ' ' + fBot + ' H' + x0f + ' V' + (fBot - fl));
      var fK = trainK * (t > T0 ? 1 : 0) * smooth(0, 0.06, within);
      finder.style.opacity = fK;
      finderLink.setAttribute('x1', ((x0f + x1f) / 2).toFixed(1)); finderLink.setAttribute('y1', fTop.toFixed(1));
      finderLink.setAttribute('x2', pos[1][0].toFixed(1)); finderLink.setAttribute('y2', (pos[1][1] + pos[1][2]).toFixed(1));
      finderLink.style.opacity = fK * 0.8;
      finderLink.style.strokeDashoffset = (-realT * 20).toFixed(1);
      var ok = smp[1] > 0.5, vK = smooth(0.24, 0.3, within) * (t > T0 ? 1 : 0) * trainK;
      var vx = x1f + 4, vy = fTop - 6;
      verdict.setAttribute('d', ok ? 'M' + (vx - 5) + ' ' + vy + ' l4 4 l7 -9' : 'M' + (vx - 4) + ' ' + (vy - 4) + ' l8 8 M' + (vx + 4) + ' ' + (vy - 4) + ' l-8 8');
      css(verdict, { stroke: ok ? 'var(--ih-ok)' : 'var(--ih-clay)', opacity: vK });

      drawPet(pets.dog, t, off, realT);
      drawPet(pets.cat, t, off, realT);

      var edgeCol = style === 'ink' && mB > 0 ? INK : LINE;
      edgeEls.forEach(function (e, i) {
        e.style.stroke = edgeCol;
        var a = pos[nodes.indexOf(edges[i][0])], b = pos[nodes.indexOf(edges[i][1])];
        e.setAttribute('x1', a[0].toFixed(1)); e.setAttribute('y1', a[1].toFixed(1));
        e.setAttribute('x2', b[0].toFixed(1)); e.setAttribute('y2', b[1].toFixed(1));
        e.style.opacity = smooth(M(6.35), M(6.75), t) * (1 - smooth(M(7.8), M(8.1), t) * 0.6);
      });
      // the head feeds the input layer and receives from the output layer
      var inMid = pos[1], outMid = pos[nodes.length - 2];
      [[inMid, [CX - 10, by]], [outMid, [CX + 10, by]]].forEach(function (pr, i) {
        var e = feedEls[i];
        e.setAttribute('x1', pr[0][0].toFixed(1)); e.setAttribute('y1', (pr[0][1] + pr[0][2]).toFixed(1));
        e.setAttribute('x2', pr[1][0].toFixed(1)); e.setAttribute('y2', pr[1][1].toFixed(1));
        e.style.opacity = smooth(M(6.5), M(6.9), t) * (1 - smooth(M(7.8), M(8.1), t));
        e.style.strokeDashoffset = (-t * 18).toFixed(1);
      });

      /* tokens printed onto the tape */
      if (t < M(8.45)) { chips.forEach(function (c) { if (c.el) c.el.g.style.display = 'none'; }); [g.desk, g.laptop, g.arms].forEach(function (e) { e.style.opacity = 0; }); return; }
      if (firstChipU === null) firstChipU = CX + groundOffset(M(8.45));
      // build the list far enough ahead
      while (!chips.length || chips[chips.length - 1].u + 400 < off + R) {
        var idx = chips.length ? chips[chips.length - 1].i + 1 : 0;
        var prev = chips[chips.length - 1];
        var tk = TOKENS[idx % TOKENS.length], w = widths[idx % TOKENS.length] + 14;
        var gap = idx % TOKENS.length === 0 && idx ? 40 : 5;
        var u = prev ? prev.u + prev.w / 2 + gap + w / 2 : firstChipU;
        chips.push({ i: idx, u: u, w: w, tk: tk, el: null });
      }
      var lastPrinted = null;
      if (firstTyped === null) {
        var thr = groundOffset(ARMS_DONE) + CX;
        for (var ci = 0; ci < chips.length; ci++) if (chips[ci].u >= thr) { firstTyped = chips[ci].i; break; }
      }
      chips.forEach(function (c) {
        var x = c.u - off;
        var printed = off >= c.u - CX;
        if (printed && (!lastPrinted || c.i > lastPrinted.i)) lastPrinted = c;
        var visible = printed && x + c.w / 2 > L && x - c.w / 2 < R;
        if (!visible) { if (c.el) { c.el.g.style.display = 'none'; chipPool.push(c.el); c.el = null; } return; }
        if (!c.el) {
          c.el = chipPool.pop() || chipEl();
          var sw = SWATCHES[c.i % SWATCHES.length];
          paint(c.el.r, sw, { cutFill: LINE, w: 2 });
          c.el.t.textContent = c.tk[0].replace(/^ /, ' ');
          c.el.r.setAttribute('width', c.w.toFixed(1));
          c.el.r.setAttribute('x', (-c.w / 2).toFixed(1)); c.el.r.setAttribute('y', -11);
          c.el.t.setAttribute('y', 5);
          c.el.g.setAttribute('data-id', c.tk[1]);
        }
        c.el.g.style.display = '';
        var age = (off - (c.u - CX)) / Math.max(tapeSpeed(t), 60);
        var pop = smooth(0, 0.22, age);
        var yy = lerp(GY - 6, GY + TAPE_H / 2, pop);
        c.el.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + yy.toFixed(1) + ') scale(' + lerp(0.5, 1, pop).toFixed(3) + ')');
      });
      // keep the list from growing forever
      while (chips.length > 4 && chips[0].u - off + chips[0].w < L - 200 && !chips[0].el) chips.shift();

      /* final scene: desk + laptop slide in, the machine types every token it prints */
      var lapK = smooth(LAP_IN, LAP_DONE, t);
      var slide = (1 - lapK) * 420;
      [g.desk, g.laptop].forEach(function (e) { e.setAttribute('transform', 'translate(' + slide.toFixed(1) + ',0)'); e.style.opacity = lapK > 0 ? 1 : 0; });
      var armK = smooth(LAP_DONE - 0.2, ARMS_DONE, t);
      var typing = t >= ARMS_DONE && lastPrinted;
      var age = typing ? (off - (lastPrinted.u - CX)) / V_TOK : 9;
      arms.forEach(function (a, i) {
        var sh = [CX + 58, 84 + i * 20];
        var rest = [CX + 70, 110 + i * 10];
        var key = [LX - 34 + i * 30, 125];
        var tap = typing && (lastPrinted.i % 2) === i ? 1 - smooth(0, 0.14, age) : 0;
        var hand = [lerp(rest[0], key[0], armK), lerp(rest[1], key[1], armK) - 4 + tap * 4 - (1 - tap) * 3 * (typing ? 1 : 0)];
        // telescoping arms: they grow out of the machine instead of unfolding
        var ext = lerp(0.25, 1, armK);
        hand = [lerp(sh[0], hand[0], ext), lerp(sh[1], hand[1], ext)];
        var el = ik(sh, hand, (40 + i * 9) * ext, (42 + i * 9) * ext, -1);
        var str = pts([sh, el, hand]);
        a.o.setAttribute('points', str); a.f.setAttribute('points', str);
        a.h.setAttribute('cx', hand[0].toFixed(1)); a.h.setAttribute('cy', hand[1].toFixed(1));
      });
      g.arms.style.opacity = armK > 0.01 ? 1 : 0;
      // screen: one page per pass through the quote
      var shown = [];
      if (typing) {
        var n = TOKENS.length, page = Math.floor(lastPrinted.i / n);
        var from = Math.max(page * n, firstTyped === null ? lastPrinted.i : firstTyped);
        for (var q = from; q <= lastPrinted.i; q++) shown.push(widths[q % n] * 0.28 + 2);
      }
      var lx = LX - 42, lyy = 75, maxW = 84, cur = 0, row = 0, segs = [[]];
      shown.forEach(function (w) { if (cur + w > maxW && cur > 0) { row++; cur = 0; segs[row] = []; } segs[row].push([cur, cur + w - 2]); cur += w; });
      var first = Math.max(0, segs.length - 5);
      lines.forEach(function (e, i) {
        var sg = segs[first + i] || [];
        e.setAttribute('d', sg.map(function (s2) { return 'M' + (lx + s2[0]).toFixed(1) + ' ' + (lyy + i * 9) + ' H' + (lx + Math.max(s2[0] + 0.5, s2[1])).toFixed(1); }).join(' '));
      });
      var cr = Math.min(segs.length - 1, 4);
      caret.setAttribute('x', (lx + cur + 1).toFixed(1)); caret.setAttribute('y', (lyy - 3.5 + cr * 9).toFixed(1));
      caret.style.opacity = typing && Math.floor(realT * 2.2) % 2 === 0 ? 1 : (typing ? 0.15 : 0);
    }

    /* where a pet is, as a pure function of story time */
    function petX(kind, t) {
      var P = PET[kind], start = Math.max(viewX - 40, CX - 340);
      return lerp(start, P.spot, smooth(P.enter[0], P.enter[1], t));
    }
    function petState(kind, t) {
      var P = PET[kind];
      var st = { x: petX(kind, t), y: GY, air: 0, lie: 0, sleep: 0, landed: false, vis: t >= P.enter[0] };
      // the cat leaps onto the machine's warm roof; the dog, later, onto the desk
      var J = kind === 'cat' ? [23.8, 24.3, CX - 32, 46, 36] : [30.7, 31.3, LX + 100, 134, 70];
      if (t >= J[0]) {
        var k = clamp((t - J[0]) / (J[1] - J[0]), 0, 1);
        st.x = lerp(P.spot, J[2], k);
        st.y = lerp(GY, J[3], k) - J[4] * 4 * k * (1 - k);
        st.air = k < 1 ? 1 : 0;
        st.landed = k >= 1;
        st.lie = smooth(J[1] + 0.05, J[1] + 0.45, t);
        st.sleep = smooth(J[1] + 0.5, J[1] + 0.8, t);
      }
      return st;
    }
    function drawPet(A, t, off, realT) {
      var P = A.P, st = petState(A.kind, t);
      A.g.style.display = st.vis ? '' : 'none';
      // the dog's leap to the desk passes behind the machine
      var layer = A.kind === 'dog' && st.air ? g.petsBack : g.pets;
      if (A.g.parentNode !== layer) layer.appendChild(A.g);
      if (!st.vis) return;
      // gait follows actual travel over the ground (walking on the moving tape counts)
      var dt = 0.02, st2 = petState(A.kind, t + dt);
      var speed = st.landed || st.air ? 0 : Math.abs((st2.x + groundOffset(t + dt)) - (st.x + off)) / dt;
      var amp = clamp(speed / 25, 0, 1);
      var phase = (st.x + (st.landed ? 0 : off)) / P.stride * Math.PI;
      var lie = st.lie, air = st.air, x = st.x, yb = st.y;
      var bodyY = lerp(yb - P.leg - P.ry * 0.45, yb - P.ry * 0.9, lie);
      var rx = P.rx * lerp(1, 1.06, lie), ry = P.ry * lerp(1, 0.95, lie);
      function legs(near) {
        return [1, -1].map(function (side, k) {          // side: +1 front, -1 back
          var hip = [x + side * rx * 0.6, bodyY + ry * 0.35];
          var ph = phase + (near ? 0 : Math.PI) + (k ? Math.PI : 0);
          var foot = [hip[0] + P.stride * 0.45 * Math.sin(ph) * amp, yb - 4 * Math.max(0, Math.cos(ph)) * amp];
          var fly = [hip[0] + side * P.leg * 0.7, hip[1] + P.leg * 0.65];
          foot = [lerp(foot[0], fly[0], air), lerp(foot[1], fly[1], air)];
          var tuck = [hip[0] + side * 3, hip[1] + 1.5];
          return [hip, [lerp(foot[0], tuck[0], lie), lerp(foot[1], tuck[1], lie)]];
        });
      }
      var far = legs(false), near = legs(true);
      // head: up and forward when standing, resting on the paws when lying
      var hx = lerp(x + rx + P.hr * 0.45, x + rx + P.hr * 0.2, lie);
      var hy = lerp(bodyY - ry - P.hr * 0.25, yb - P.hr * 0.95, lie);
      // tail: up (dog wags) or a long curl (cat); wraps around the body when lying
      var tb = [x - rx * 0.92, bodyY - ry * 0.2], wag = Math.sin(realT * (A.kind === 'dog' ? 14 : 3)) * (A.kind === 'dog' ? 2.5 : 1.5) * (1 - st.sleep * 0.7);
      var tailUp = A.kind === 'dog'
        ? [tb, [tb[0] - 5, tb[1] - 6 + wag * 0.3], [tb[0] - 6 + wag, tb[1] - 13]]
        : [tb, [tb[0] - 7, tb[1] - 1], [tb[0] - 11 + wag, tb[1] - 9], [tb[0] - 9 + wag, tb[1] - 17]];
      var tailDown = A.kind === 'dog'
        ? [tb, [tb[0] - 4, yb - 2], [x, yb - 1]]
        : [tb, [tb[0] - 5, yb - 2], [x - rx * 0.2, yb - 1], [x + rx * 0.6, yb - 2]];
      var tail = tailUp.map(function (q, i) { return [lerp(q[0], tailDown[i][0], lie), lerp(q[1], tailDown[i][1], lie)]; });

      var skin = P.col, shade = 'color-mix(in srgb, var(--ih-ink) 18%, ' + P.col + ')';
      function seg(part, chain, w, col) {
        var sp = pts(chain);
        part.o.setAttribute('points', sp); part.f.setAttribute('points', sp);
        if (style === 'ink') { css(part.o, { stroke: INK, strokeWidth: w + 4, display: '' }); css(part.f, { stroke: col, strokeWidth: w, display: '' }); }
        else if (style === 'cut') { css(part.o, { display: 'none' }); css(part.f, { stroke: col === skin ? LINE : 'color-mix(in srgb, var(--ih-line) 70%, var(--ih-bg))', strokeWidth: w, display: '' }); }
        else { css(part.o, { stroke: LINE, strokeWidth: 1.8, display: '' }); css(part.f, { display: 'none' }); }
      }
      far.forEach(function (c, i) { seg(A.legsFar[i], c, P.w, shade); });
      seg(A.tail, tail, P.w * 0.75, skin);
      near.forEach(function (c, i) { seg(A.legsNear[i], c, P.w, skin); });
      A.body.setAttribute('cx', x.toFixed(1)); A.body.setAttribute('cy', bodyY.toFixed(1));
      A.body.setAttribute('rx', rx.toFixed(1)); A.body.setAttribute('ry', ry.toFixed(1));
      A.head.setAttribute('cx', hx.toFixed(1)); A.head.setAttribute('cy', hy.toFixed(1)); A.head.setAttribute('r', P.hr);
      var R = P.hr;
      if (A.kind === 'cat') {
        A.earBack.setAttribute('d', 'M' + (hx - R * 0.85) + ' ' + (hy - R * 0.35) + ' L' + (hx - R * 0.6) + ' ' + (hy - R * 1.65) + ' L' + (hx - R * 0.05) + ' ' + (hy - R * 0.85) + ' Z M' + (hx + R * 0.15) + ' ' + (hy - R * 0.9) + ' L' + (hx + R * 0.75) + ' ' + (hy - R * 1.6) + ' L' + (hx + R * 0.9) + ' ' + (hy - R * 0.3) + ' Z');
        A.snout.setAttribute('rx', 0); A.earFront.setAttribute('rx', 0);
        A.nose.setAttribute('cx', (hx + R * 0.95).toFixed(1)); A.nose.setAttribute('cy', (hy + R * 0.2).toFixed(1)); A.nose.setAttribute('r', 1);
      } else {
        A.earBack.setAttribute('d', '');
        A.snout.setAttribute('cx', (hx + R * 0.95).toFixed(1)); A.snout.setAttribute('cy', (hy + R * 0.35).toFixed(1));
        A.snout.setAttribute('rx', (R * 0.62).toFixed(1)); A.snout.setAttribute('ry', (R * 0.45).toFixed(1));
        A.earFront.setAttribute('cx', (hx - R * 0.35).toFixed(1)); A.earFront.setAttribute('cy', (hy + R * 0.2).toFixed(1));
        A.earFront.setAttribute('rx', (R * 0.38).toFixed(1)); A.earFront.setAttribute('ry', (R * 0.8).toFixed(1));
        A.earFront.setAttribute('transform', 'rotate(18 ' + (hx - R * 0.35).toFixed(1) + ' ' + (hy + R * 0.2).toFixed(1) + ')');
        A.nose.setAttribute('cx', (hx + R * 1.5).toFixed(1)); A.nose.setAttribute('cy', (hy + R * 0.2).toFixed(1)); A.nose.setAttribute('r', 1.5);
      }
      A.eye.setAttribute('cx', (hx + R * 0.35).toFixed(1)); A.eye.setAttribute('cy', (hy - R * 0.15).toFixed(1));
      A.eye.setAttribute('rx', 1.3); A.eye.setAttribute('ry', lerp(1.3, 0.35, st.sleep).toFixed(2));
      var featureCol = style === 'cut' ? BG : style === 'ink' ? INK : LINE;
      [A.body, A.head, A.snout, A.earBack, A.earFront].forEach(function (e) {
        var c = e === A.earFront ? shade : skin;
        if (style === 'ink') css(e, { fill: c, stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' });
        else if (style === 'cut') css(e, { fill: e === A.earFront ? 'color-mix(in srgb, var(--ih-line) 70%, var(--ih-bg))' : LINE, stroke: 'none' });
        else css(e, { fill: BG, stroke: LINE, strokeWidth: 1.6, strokeLinejoin: 'round' });
      });
      css(A.eye, { fill: featureCol }); css(A.nose, { fill: featureCol });
    }

    function drawWalker(J, x0, p) {
      var skin = 'color-mix(in srgb, var(--ih-peach) ' + Math.round(p * 100) + '%, var(--ih-kraft))';
      var far = 'color-mix(in srgb, var(--ih-ink) 18%, ' + skin + ')';
      function sh(P) { return [P[0] + x0, P[1]]; }
      function set(part, chain, w, near) {
        var s = pts(chain.map(sh));
        part.o.setAttribute('points', s); part.f.setAttribute('points', s);
        if (style === 'ink') {
          css(part.o, { stroke: INK, strokeWidth: w + 5, display: '' });
          css(part.f, { stroke: near ? skin : far, strokeWidth: w, display: '' });
        } else if (style === 'cut') {
          css(part.o, { display: 'none' });
          css(part.f, { stroke: near ? LINE : 'color-mix(in srgb, var(--ih-line) 70%, var(--ih-bg))', strokeWidth: w, display: '' });
        } else {
          css(part.o, { stroke: LINE, strokeWidth: 2, display: '' });
          css(part.f, { display: 'none' });
        }
      }
      set(W.legFar, J.legs[1], J.legW, false);
      set(W.armFar, J.arms[1], J.armW, false);
      set(W.torso, [J.hip, J.shoulder], J.torsoW, true);
      set(W.legNear, J.legs[0], J.legW, true);
      set(W.armNear, J.arms[0], J.armW, true);
      var hx = J.head[0] + x0, hy = J.head[1];
      [W.headO, W.headF].forEach(function (c) { c.setAttribute('cx', hx.toFixed(1)); c.setAttribute('cy', hy.toFixed(1)); });
      var mz = J.muzzle;
      W.muzzle.setAttribute('cx', (hx + J.r * 0.75).toFixed(1)); W.muzzle.setAttribute('cy', (hy + J.r * 0.35).toFixed(1));
      W.muzzle.setAttribute('rx', (J.r * 0.6 * mz).toFixed(2)); W.muzzle.setAttribute('ry', (J.r * 0.45 * mz).toFixed(2));
      W.eye.setAttribute('cx', (hx + J.r * 0.45).toFixed(1)); W.eye.setAttribute('cy', (hy - J.r * 0.15).toFixed(1));
      if (style === 'ink') {
        W.headO.setAttribute('r', (J.r + 2.5).toFixed(2)); css(W.headO, { fill: INK, display: '' });
        W.headF.setAttribute('r', J.r.toFixed(2)); css(W.headF, { fill: skin, display: '' });
        css(W.muzzle, { fill: skin, stroke: INK, strokeWidth: 2 }); css(W.eye, { fill: INK });
      } else if (style === 'cut') {
        css(W.headO, { display: 'none' }); W.headF.setAttribute('r', J.r.toFixed(2)); css(W.headF, { fill: LINE, display: '' });
        css(W.muzzle, { fill: LINE, stroke: 'none' }); css(W.eye, { fill: BG });
      } else {
        css(W.headO, { display: 'none' }); W.headF.setAttribute('r', J.r.toFixed(2)); css(W.headF, { fill: BG, stroke: LINE, strokeWidth: 2, display: '' });
        css(W.muzzle, { fill: BG, stroke: LINE, strokeWidth: 1.6 }); css(W.eye, { fill: LINE });
      }
      // hair: appears as the walker becomes human
      var hk = smooth(0.55, 0.95, p), R = J.r;
      W.hair.setAttribute('d', 'M' + (hx - R * 1.02).toFixed(1) + ' ' + (hy + R * 0.1).toFixed(1) +
        ' A ' + R.toFixed(1) + ' ' + R.toFixed(1) + ' 0 0 1 ' + (hx + R * 0.7).toFixed(1) + ' ' + (hy - R * 0.72).toFixed(1) +
        ' Q ' + (hx + R * 0.1).toFixed(1) + ' ' + (hy - R * 0.25).toFixed(1) + ' ' + (hx - R * 0.35).toFixed(1) + ' ' + (hy + R * 0.25).toFixed(1) + ' Z');
      css(W.hair, { fill: style === 'cut' ? 'color-mix(in srgb, var(--ih-line) 60%, var(--ih-bg))' : style === 'ink' ? INK : LINE, stroke: 'none', opacity: hk });
      // muzzle sits under the head outline in the ink style
      if (style === 'ink') g.walker.insertBefore(W.muzzle, W.headO);
    }

    /* ── playback ─────────────────────────────────────────────────────── */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var t = 0, last = null, playing = !reduce && opts.autoplay !== false, visible = true, raf = 0;
    function frame(now) {
      raf = 0;
      if (last !== null) t += Math.min(0.05, (now - last) / 1000);
      last = now;
      render(t);
      if (playing && visible) raf = requestAnimationFrame(frame); else last = null;
    }
    function kick() { if (!raf && playing && visible) raf = requestAnimationFrame(frame); }
    fit();
    render(reduce ? 60 : 0);
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); render(t || (reduce ? 60 : 0)); }).observe(host);
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(host);
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { widths = TOKENS.map(function (tk) { return measure(tk[0]); }); kick(); });

    return {
      play: function () { playing = true; kick(); },
      pause: function () { playing = false; },
      toggle: function () { playing = !playing; kick(); return playing; },
      replay: function () { t = 0; chips.forEach(function (c) { if (c.el) { c.el.g.style.display = 'none'; chipPool.push(c.el); } }); chips = []; firstChipU = null; firstTyped = null; playing = true; render(0); kick(); },
      seek: function (s) { t = s; render(s); },
      isPlaying: function () { return playing; },
      render: render
    };
  }

  window.IntelHistory = { mount: mount, T_END: T_END };
})();
