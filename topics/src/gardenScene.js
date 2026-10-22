// Рисунок грядки в разрезе: небо, растение, почва и корни. Всё строится строкой SVG.
// Случайность нужна только для «живой» формы — она сидированная, чтобы от дня к дню
// рисунок не дрожал, а менялся лишь вслед за моделью.
import { DAYS, fmt, fmtTime } from '@/garden.js';

const W = 360,
  HGT = 380,
  G = 140,
  K = 3.4,
  CX = 180;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;

// Неизменная «анатомия» грядки: корневая система в долях глубины, камешки, неровность поверхности.
function makeBed(seed) {
  const rand = rng(seed);
  const roots = [];

  // x — в долях ширины кроны корней, y — в долях глубины
  function grow(x, y, angle, len, width, level) {
    const steps = level === 0 ? 7 : level === 1 ? 4 : 3;
    let px = x,
      py = y,
      a = angle;
    for (let s = 0; s < steps; s++) {
      a += (rand() - 0.5) * (level === 0 ? 0.35 : 0.6);
      if (level > 0) a += (Math.PI / 2 - a) * 0.12; // боковые корни постепенно клонятся вниз
      const seg = len / steps;
      const nx = px + Math.cos(a) * seg * (level === 0 ? 0.6 : 1.4);
      const ny = py + Math.sin(a) * seg;
      const w = width * (1 - s / (steps + 1));
      roots.push({ x1: px, y1: py, x2: nx, y2: ny, w, level });
      if (level < 2 && s < steps - 1) {
        const n = level === 0 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          if (rand() < (level === 0 ? 0.9 : 0.55)) {
            const side = k === 0 ? -1 : 1;
            const dir = level === 0 ? side : rand() < 0.5 ? -1 : 1;
            const ba = Math.PI / 2 + dir * (0.7 + rand() * 0.6);
            grow(nx, ny, ba, len * (level === 0 ? 0.45 + rand() * 0.2 : 0.35) * (1 - ny * 0.5), w * 0.55, level + 1);
          }
        }
      }
      px = nx;
      py = ny;
    }
  }

  grow(0, 0, Math.PI / 2, 1, 3.2, 0);
  // мочковатые корни у самого стебля
  for (let k = 0; k < 4; k++) {
    grow((rand() - 0.5) * 0.05, 0.02, Math.PI / 2 + (k < 2 ? -1 : 1) * (0.9 + rand() * 0.5), 0.35, 1.3, 1);
  }

  const pebbles = [];
  for (let k = 0; k < 70; k++) {
    pebbles.push({
      x: rand() * W,
      y: G + 8 + rand() * (HGT - G - 10),
      r: 0.8 + rand() * 1.8,
      light: rand() < 0.35,
      rot: rand() * 180,
    });
  }
  const stones = [];
  for (let k = 0; k < 5; k++) {
    stones.push({
      x: 30 + rand() * (W - 60),
      y: G + 150 + rand() * 70,
      rx: 5 + rand() * 7,
      ry: 3 + rand() * 4,
      rot: rand() * 40 - 20,
    });
  }

  let surface = `M0 ${G}`;
  for (let x = 12; x <= W; x += 12) {
    surface += ` L${x} ${r1(G + (rand() - 0.5) * 3)}`;
  }

  const cracks = [];
  for (let k = 0; k < 6; k++) {
    const x0 = 40 + k * 50 + rand() * 20;
    const pts = [[x0, G]];
    for (let s = 1; s <= 4; s++) pts.push([x0 + (rand() - 0.5) * 8, G + s * 6]);
    cracks.push(pts);
  }

  return { roots, pebbles, stones, surface, cracks };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function leafColor(s) {
  if (s.dead) return { fill: '#8c7b63', vein: '#6e604c' };
  if (s.rot >= 3) return { fill: 'hsl(52 42% 44%)', vein: 'hsl(52 40% 32%)' };
  const t = s.H / 100;
  const hue = lerp(45, 108, t),
    sat = lerp(35, 48, t),
    light = lerp(44, 32, t);
  return { fill: `hsl(${hue} ${sat}% ${light}%)`, vein: `hsl(${hue} ${sat}% ${light + 14}%)` };
}

// один листочек: заострённый овал с жилкой, растёт вдоль оси x
function leaflet(len, color, curl) {
  const w = len * 0.36 * (1 - curl * 0.5);
  return (
    `<path d="M0 0 C ${r1(len * 0.25)} ${r1(-w)}, ${r1(len * 0.7)} ${r1(-w * 0.9)}, ${r1(len)} 0 C ${r1(len * 0.7)} ${r1(w * 0.8)}, ${r1(len * 0.25)} ${r1(w)}, 0 0 Z" fill="${color.fill}"/>` +
    `<path d="M0 0 Q ${r1(len * 0.5)} ${r1(-w * 0.1)} ${r1(len * 0.95)} 0" stroke="${color.vein}" stroke-width="0.6" fill="none"/>`
  );
}

// сложный лист, как у томата: черешок, пара боковых листочков и верхушечный
function compoundLeaf(len, color, curl) {
  const small = len * 0.42,
    tip = len * 0.55;
  return (
    `<line x1="0" y1="0" x2="${r1(len * 0.62)}" y2="0" stroke="${color.fill}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<g transform="translate(${r1(len * 0.3)} 0) rotate(-55)">${leaflet(small, color, curl)}</g>` +
    `<g transform="translate(${r1(len * 0.3)} 0) rotate(${55 + curl * 20})">${leaflet(small * 0.9, color, curl)}</g>` +
    `<g transform="translate(${r1(len * 0.55)} 0)">${leaflet(tip, color, curl)}</g>`
  );
}

function bezier(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    a: Math.atan2(2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y), 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)),
  };
}

function plant(s) {
  const color = leafColor(s);
  const h = 18 + s.B * 1.02;
  const droop = s.dead ? 1 : s.H < 50 ? (50 - s.H) / 50 : 0;
  const lean = ((s.dead ? 38 : droop * 18) * Math.PI) / 180;
  const p0 = { x: CX, y: G };
  const p2 = { x: CX + Math.sin(lean) * h, y: G - Math.cos(lean) * h * (1 - droop * 0.15) };
  const p1 = { x: CX + Math.sin(lean) * h * 0.1, y: G - h * 0.6 };
  const stemW = 2.2 + s.B / 30;
  const stemColor = s.dead ? '#7d6b52' : color.fill;

  let out = `<path d="M${p0.x} ${p0.y} Q ${r1(p1.x)} ${r1(p1.y)} ${r1(p2.x)} ${r1(p2.y)}" stroke="${stemColor}" stroke-width="${r1(stemW)}" fill="none" stroke-linecap="round"/>`;
  // светлый блик на стебле — объём
  out += `<path d="M${p0.x - stemW * 0.2} ${p0.y} Q ${r1(p1.x - stemW * 0.2)} ${r1(p1.y)} ${r1(p2.x)} ${r1(p2.y)}" stroke="rgba(255,255,255,0.18)" stroke-width="${r1(stemW * 0.3)}" fill="none" stroke-linecap="round"/>`;

  const n = Math.min(9, 2 + Math.floor(s.B / 11));
  const shrink = s.dead ? 0.7 : 0.75 + (0.25 * s.H) / 100;
  const curl = s.dead ? 1 : droop;
  const fruitNodes = [];
  for (let k = 0; k < n; k++) {
    const t = 0.12 + 0.8 * (k / Math.max(1, n - 1)) * (n > 1 ? 1 : 0);
    const pt = bezier(p0, p1, p2, t);
    const side = k % 2 ? 1 : -1;
    const len = (14 + s.B * 0.3 * (1 - k / (n + 3))) * shrink;
    // лист отходит от стебля вверх; при увядании поникает
    const up = -38 + droop * 95 + (s.dead ? 20 : 0);
    const stemDeg = (pt.a * 180) / Math.PI + 90; // отклонение стебля от вертикали
    out += `<g transform="translate(${r1(pt.x)} ${r1(pt.y)}) scale(${side} 1) rotate(${r1(up + side * stemDeg)})">${compoundLeaf(len, color, curl)}</g>`;
    fruitNodes.push({ x: pt.x, y: pt.y, side });
  }

  // верхушка: молодые листочки светлее
  if (!s.dead) {
    const young = { fill: s.rot >= 3 ? color.fill : `hsl(95 50% ${s.H > 50 ? 45 : 50}%)`, vein: color.vein };
    const tipDeg = (lean * 180) / Math.PI;
    out += `<g transform="translate(${r1(p2.x)} ${r1(p2.y)}) rotate(${r1(tipDeg - 90 - 25 + droop * 60)})">${leaflet(7 + s.B * 0.04, young, curl)}</g>`;
    out += `<g transform="translate(${r1(p2.x)} ${r1(p2.y)}) rotate(${r1(tipDeg - 90 + 25 + droop * 60)})">${leaflet(6 + s.B * 0.04, young, curl)}</g>`;
  }

  // цветы, затем плоды — только у здорового растения
  if (!s.dead && s.H > 50 && s.rot < 3 && s.B >= 35) {
    const flowers = Math.min(3, 1 + Math.floor((s.B - 35) / 12));
    for (let k = 0; k < flowers; k++) {
      const node = fruitNodes[fruitNodes.length - 1 - k];
      if (!node) break;
      const fx = node.x - node.side * 6,
        fy = node.y - 4;
      for (let p = 0; p < 5; p++) {
        const a = p * 72;
        out += `<ellipse cx="${r1(fx)}" cy="${r1(fy - 2.4)}" rx="1.3" ry="2.4" fill="#f2d33a" transform="rotate(${a} ${r1(fx)} ${r1(fy)})"/>`;
      }
      out += `<circle cx="${r1(fx)}" cy="${r1(fy)}" r="1.1" fill="#c98a12"/>`;
    }
  }
  if (!s.dead && s.H > 40 && s.B >= 55) {
    const fruits = Math.min(5, Math.floor((s.B - 46) / 9));
    const ripe = Math.min(1, (s.B - 55) / 35);
    const rad = 4 + s.B * 0.035;
    const fill = `hsl(${lerp(88, 6, ripe)} ${lerp(45, 72, ripe)}% ${lerp(42, 47, ripe)}%)`;
    for (let k = 0; k < fruits; k++) {
      const node = fruitNodes[1 + k];
      if (!node) break;
      const fx = node.x + node.side * (5 + rad * 0.4),
        fy = node.y + 5 + rad;
      out += `<path d="M${r1(node.x)} ${r1(node.y)} Q ${r1(fx)} ${r1(node.y)} ${r1(fx)} ${r1(fy - rad)}" stroke="${color.fill}" stroke-width="1" fill="none"/>`;
      out += `<circle cx="${r1(fx)}" cy="${r1(fy)}" r="${r1(rad)}" fill="${fill}"/>`;
      out += `<ellipse cx="${r1(fx - rad * 0.35)}" cy="${r1(fy - rad * 0.35)}" rx="${r1(rad * 0.3)}" ry="${r1(rad * 0.2)}" fill="rgba(255,255,255,0.45)"/>`;
      out += `<path d="M${r1(fx - 2.5)} ${r1(fy - rad)} L${r1(fx)} ${r1(fy - rad + 1.5)} L${r1(fx + 2.5)} ${r1(fy - rad)}" stroke="#3f6b2a" stroke-width="1.2" fill="none"/>`;
    }
  }

  return out;
}

function roots(s, bed) {
  const depth = s.D * K;
  const spread = Math.min(150, 30 + depth * 0.55);
  const rotting = s.rot >= 3;
  const base = s.dead ? '#8f8577' : rotting ? '#7a6750' : '#efe3c4';
  const tipColor = s.dead ? '#7d7366' : rotting ? '#5b4a38' : '#f7efd9';
  let out = '';
  for (const seg of bed.roots) {
    const x1 = CX + seg.x1 * spread,
      y1 = G + seg.y1 * depth;
    const x2 = CX + seg.x2 * spread,
      y2 = G + seg.y2 * depth;
    const c = seg.level === 2 ? tipColor : base;
    const w = Math.max(0.5, seg.w * (0.6 + depth / 300));
    out += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c}" stroke-width="${r1(w)}" stroke-linecap="round" opacity="${seg.level === 2 ? 0.8 : 0.95}"/>`;
  }
  return out;
}

function tool(kind, x, y) {
  if (kind === 'bucket') {
    return `<g transform="translate(${x} ${y})"><path d="M0 0 L22 0 L19 22 L3 22 Z" fill="#9aa6ad"/><path d="M0 0 L22 0" stroke="#6c777d" stroke-width="2"/><path d="M1 0 Q11 -14 21 0" stroke="#6c777d" stroke-width="1.4" fill="none"/><path d="M4 6 L18 6" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/></g>`;
  }
  if (kind === 'barrel') {
    return `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="26" height="28" rx="6" fill="#8a5a34"/><path d="M0 8 H26 M0 20 H26" stroke="#4a4f52" stroke-width="2"/><path d="M8 0 V28 M18 0 V28" stroke="rgba(0,0,0,.15)"/><circle cx="13" cy="33" r="5" fill="#333"/><circle cx="13" cy="33" r="2" fill="#888"/></g>`;
  }
  return `<g transform="translate(${x} ${y})"><path d="M2 6 Q2 0 8 0 L20 0 Q26 0 26 6 L26 22 L2 22 Z" fill="#4f9a74"/><path d="M26 8 L40 -4" stroke="#4f9a74" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="41" cy="-5" rx="3.5" ry="2" fill="#3e7d5d" transform="rotate(-40 41 -5)"/><path d="M6 0 Q14 -12 22 0" stroke="#3e7d5d" stroke-width="2" fill="none"/></g>`;
}

function sceneSVG(s, bed, id, toolKind) {
  const m = Math.max(0, Math.min(1, s.m));
  const depth = s.D * K;
  const rotting = s.rot >= 3;
  const soggy = rotting || m > 0.88;
  const dry = m < 0.2 && !s.dead;
  const wetAlpha = r1((0.08 + 0.6 * m) * 100) / 100;
  const wetH = depth + 22;

  // палитру неба берём потеплее, когда почва пересыхает: так засуху видно сразу
  const skyTop = dry ? '#e9dcb8' : '#bcdcf2';
  const skyBottom = dry ? '#f6eedb' : '#eaf5fb';

  let defs =
    `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>` +
    `<radialGradient id="${id}sun"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffd95a"/><stop offset="1" stop-color="#ffd95a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b6a4c"/><stop offset=".5" stop-color="#705238"/><stop offset="1" stop-color="#58412d"/></linearGradient>` +
    `<linearGradient id="${id}wet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d12" stop-opacity="${wetAlpha}"/><stop offset=".8" stop-color="#2b1d12" stop-opacity="${wetAlpha}"/><stop offset="1" stop-color="#2b1d12" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${id}wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d5f36"/><stop offset=".5" stop-color="#b07a48"/><stop offset="1" stop-color="#8a5a31"/></linearGradient>` +
    `<linearGradient id="${id}puddle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0f0"/><stop offset="1" stop-color="#3f8ac4"/></linearGradient>` +
    `<radialGradient id="${id}drain"><stop offset="0" stop-color="#3f8ac4" stop-opacity=".5"/><stop offset="1" stop-color="#3f8ac4" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="${id}ground"><path d="${bed.surface} L${W} ${HGT} L0 ${HGT} Z"/></clipPath>`;

  let sky =
    `<rect width="${W}" height="${G + 4}" fill="url(#${id}sky)"/>` +
    `<circle cx="318" cy="36" r="${dry ? 34 : 26}" fill="url(#${id}sun)"/>`;
  if (!dry) {
    sky += `<g fill="#ffffff" opacity=".85"><ellipse cx="130" cy="34" rx="22" ry="8"/><ellipse cx="144" cy="28" rx="14" ry="9"/><ellipse cx="118" cy="30" rx="10" ry="7"/></g>`;
  }
  // дальний план: полоска травы у горизонта
  sky += `<path d="M0 ${G - 10} Q 90 ${G - 18} 180 ${G - 11} T ${W} ${G - 12} L${W} ${G} L0 ${G} Z" fill="${dry ? '#b9b27a' : '#9cc47a'}" opacity=".6"/>`;

  // почва
  let soil =
    `<g clip-path="url(#${id}ground)">` +
    `<rect y="${G - 6}" width="${W}" height="${HGT - G + 6}" fill="url(#${id}soil)"/>` +
    `<rect y="${G - 6}" width="${W}" height="${r1(wetH + 6)}" fill="url(#${id}wet)"/>`;
  for (const p of bed.pebbles) {
    soil += `<ellipse cx="${r1(p.x)}" cy="${r1(p.y)}" rx="${r1(p.r)}" ry="${r1(p.r * 0.7)}" fill="${p.light ? 'rgba(255,240,215,0.16)' : 'rgba(20,10,0,0.22)'}" transform="rotate(${r1(p.rot)} ${r1(p.x)} ${r1(p.y)})"/>`;
  }
  for (const st of bed.stones) {
    soil +=
      `<ellipse cx="${r1(st.x)}" cy="${r1(st.y)}" rx="${r1(st.rx)}" ry="${r1(st.ry)}" fill="#8e8a82" transform="rotate(${r1(st.rot)} ${r1(st.x)} ${r1(st.y)})"/>` +
      `<ellipse cx="${r1(st.x - st.rx * 0.3)}" cy="${r1(st.y - st.ry * 0.35)}" rx="${r1(st.rx * 0.45)}" ry="${r1(st.ry * 0.3)}" fill="rgba(255,255,255,.25)"/>`;
  }
  if (rotting) {
    soil += `<rect y="${G}" width="${W}" height="${r1(depth + 10)}" fill="#26301f" opacity=".42"/>`;
    for (let k = 0; k < 14; k++) {
      soil += `<circle cx="${40 + ((k * 53) % 280)}" cy="${r1(G + 12 + ((k * 37) % Math.max(20, depth)))}" r="${1 + (k % 3)}" fill="none" stroke="rgba(190,220,200,.45)"/>`;
    }
  }
  // сухая корка и трещины
  if (dry) {
    soil += `<rect y="${G - 4}" width="${W}" height="14" fill="#c9ab82" opacity="${r1((0.2 - m) * 3)}"/>`;
    const len = Math.min(1, (0.2 - m) * 7);
    for (const c of bed.cracks) {
      const n = Math.max(2, Math.round(c.length * len));
      soil += `<polyline points="${c
        .slice(0, n)
        .map((p) => p.join(','))
        .join(' ')}" fill="none" stroke="#3a2818" stroke-width="1.3" stroke-linejoin="round"/>`;
    }
  }
  soil += '</g>';
  soil += `<path d="${bed.surface}" stroke="${dry ? '#a78662' : soggy ? '#2f2219' : '#4a3424'}" stroke-width="2.2" fill="none"/>`;

  // линейка глубины
  let ruler = '';
  for (let cm = 10; cm <= 60; cm += 10) {
    const y = G + cm * K;
    ruler += `<line x1="18" x2="26" y1="${y}" y2="${y}" stroke="#f2e6c9" opacity=".6"/><text x="29" y="${y + 3.5}" font-size="9" fill="#f2e6c9" opacity=".8">${cm}</text>`;
  }

  // короба грядки по краям
  const boards = [0, W - 12]
    .map(
      (x) =>
        `<rect x="${x}" y="${G - 16}" width="12" height="52" fill="url(#${id}wood)"/>` +
        `<path d="M${x + 4} ${G - 12} V${G + 32} M${x + 8} ${G - 8} V${G + 30}" stroke="rgba(60,30,10,.3)" stroke-width=".8"/>` +
        `<rect x="${x}" y="${G - 16}" width="12" height="3" fill="rgba(255,255,255,.18)"/>`,
    )
    .join('');

  let extra = '';
  if (s.W > 0) {
    extra += tool(toolKind, 24, 26);
    extra += `<text x="24" y="${toolKind === 'barrel' ? 78 : 64}" font-size="11" fill="#1f4f7a" font-weight="bold">занятие ${fmtTime(s.W)}</text>`;
    const drops = Math.min(26, 8 + Math.round(Math.sqrt(s.W) * 3));
    const rand = rng(s.d * 97 + drops);
    for (let k = 0; k < drops; k++) {
      const x = CX - 60 + rand() * 120,
        y = 20 + rand() * (G - 40);
      extra += `<path d="M${r1(x)} ${r1(y)} q -1.8 4.5 0 6.5 q 1.8 -2 0 -6.5 Z" fill="#3f8ac4" opacity="${r1(0.55 + rand() * 0.4)}"/>`;
    }
  }
  if (soggy) {
    extra += `<ellipse cx="${CX}" cy="${G + 1}" rx="${rotting ? 150 : 90}" ry="3.5" fill="url(#${id}puddle)" opacity=".75"/>`;
  }
  if (s.runoff > 0.5) {
    const rx = 14 + Math.min(58, s.runoff * 0.7);
    extra +=
      `<ellipse cx="${r1(W - 18 - rx)}" cy="${G + 1}" rx="${r1(rx)}" ry="5" fill="url(#${id}puddle)"/>` +
      `<ellipse cx="${r1(W - 26 - rx * 1.2)}" cy="${G - 1}" rx="${r1(rx * 0.35)}" ry="1.2" fill="rgba(255,255,255,.7)"/>` +
      `<path d="M${W - 16} ${G - 2} q 6 2 6 10 t 4 30" stroke="#3f8ac4" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>` +
      `<text x="${W - 18}" y="${G - 22}" font-size="11" text-anchor="end" fill="#1f4f7a" font-weight="bold">мимо ${fmtTime(s.runoff)}</text>`;
  }
  if (s.drain > 0.5) {
    const y = G + depth + 8;
    extra += `<ellipse cx="${CX}" cy="${r1(y + 14)}" rx="80" ry="26" fill="url(#${id}drain)"/>`;
    for (let k = 0; k < 5; k++) {
      const x = CX - 44 + k * 22,
        yy = y + (k % 2) * 10;
      extra += `<path d="M${x} ${r1(yy)} q -2 5 0 7 q 2 -2 0 -7 Z" fill="#6fb2e6"/>`;
    }
    extra += `<text x="${CX + 58}" y="${r1(y + 20)}" font-size="10" fill="#dcecf8">впустую ${fmtTime(s.drain)}</text>`;
  }

  const status = s.dead ? 'учёба брошена' : `в памяти ${Math.round(m * 100)}%`;
  const caption = `${status}, прочность ${fmt(s.D)}`;
  const footer =
    `<rect x="${W - 196}" y="${HGT - 24}" width="188" height="18" rx="9" fill="rgba(0,0,0,.35)"/>` +
    `<text x="${W - 102}" y="${HGT - 11}" font-size="11" text-anchor="middle" fill="#f5ecd8">${caption}</text>`;

  return (
    `<svg viewBox="0 0 ${W} ${HGT}" font-family="Calibri, sans-serif" role="img" aria-label="Знания ученика: ${caption}">` +
    `<defs>${defs}</defs>${sky}${soil}${ruler}${roots(s, bed)}${plant(s)}${boards}${extra}${footer}</svg>`
  );
}

// полоска занятий по дням: синим усвоенное, охрой потраченное впустую
function stripSVG(run, day) {
  const w = 600,
    h = 58,
    base = 44,
    x = (d) => (d - 0.5) * 10;
  let g = '';
  for (let d = 1; d <= DAYS; d++) {
    const o = run[d];
    if (!o.W) continue;
    const H = Math.min(42, Math.sqrt(o.W) * 5.2),
      h1 = H * (o.toRoot / o.W);
    const op = d <= day ? 1 : 0.3;
    g +=
      `<rect x="${x(d) - 3.5}" y="${r1(base - H)}" width="7" height="${r1(H - h1)}" fill="#c9a86a" opacity="${op}"/>` +
      `<rect x="${x(d) - 3.5}" y="${r1(base - h1)}" width="7" height="${r1(h1)}" fill="#2f7fbf" opacity="${op}"/>`;
  }
  g += `<line x1="0" x2="${w}" y1="${base}" y2="${base}" stroke="#ccc"/>`;
  for (let d = 10; d <= 60; d += 10) {
    g += `<text x="${x(d)}" y="${h - 2}" font-size="10" text-anchor="middle" fill="#888">${d}</text>`;
  }
  if (day > 0) g += `<line x1="${x(day)}" x2="${x(day)}" y1="0" y2="${base}" stroke="#333" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${g}</svg>`;
}

function lineChart(series, yMax, band, day, unit) {
  const Wc = 320,
    Hh = 170,
    l = 34,
    r = 8,
    t = 10,
    b = 22,
    iw = Wc - l - r,
    ih = Hh - t - b;
  const X = (d) => l + (iw * d) / DAYS,
    Y = (v) => t + ih * (1 - Math.min(v, yMax) / yMax);
  let g = '';
  if (band)
    g += `<rect x="${l}" y="${Y(band[1])}" width="${iw}" height="${Y(band[0]) - Y(band[1])}" fill="#4c8b3a" opacity=".13"/>`;
  for (let k = 0; k <= 4; k++) {
    const v = (yMax * k) / 4;
    g += `<line x1="${l}" x2="${Wc - r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6e6e6"/><text x="${l - 5}" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="#888">${Math.round(v)}${unit}</text>`;
  }
  for (let d = 0; d <= 60; d += 20)
    g += `<text x="${X(d)}" y="${Hh - 6}" font-size="9" text-anchor="middle" fill="#888">${d}</text>`;
  series.forEach((sr) => {
    const pts = sr.v.map((v, d) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`);
    g += `<polyline points="${pts.join(' ')}" fill="none" stroke="${sr.c}" stroke-width="1.2" opacity=".35"/>`;
    g += `<polyline points="${pts.slice(0, day + 1).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="2.2" stroke-linejoin="round"/>`;
    g += `<circle cx="${X(day)}" cy="${Y(sr.v[day])}" r="3.5" fill="${sr.c}"/>`;
  });
  g += `<line x1="${X(day)}" x2="${X(day)}" y1="${t}" y2="${t + ih}" stroke="#333" opacity=".4"/>`;
  return `<svg viewBox="0 0 ${Wc} ${Hh}" aria-hidden="true">${g}</svg>`;
}

export { makeBed, sceneSVG, stripSVG, lineChart };
