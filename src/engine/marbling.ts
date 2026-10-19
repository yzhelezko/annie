// Ink-on-bath marbling after Lu, Jaffer et al., "Mathematical Marbling" (IEEE CG&A, 2012).
// Every operation is a homeomorphism of the plane, so inks displace each other but never cross or mix,
// and painting inks oldest-first stays correct after any number of drops and strokes.

export interface Ink {
  pts: number[];
  color: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Bath {
  inks: Ink[] = [];
  base: string;
  w: number;
  h: number;
  seg: number;

  constructor(w: number, h: number, base: string, seg = 3.5) {
    this.w = w;
    this.h = h;
    this.base = base;
    this.seg = seg;
  }

  /** Places a new circular ink of radius r0 and returns it; grow it with `spread`. */
  drop(cx: number, cy: number, r0: number, color: string): Ink {
    this.spread(cx, cy, r0);
    const n = Math.max(16, Math.ceil((2 * Math.PI * r0) / this.seg));
    const pts = new Array<number>(n * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts[i * 2] = cx + Math.cos(a) * r0;
      pts[i * 2 + 1] = cy + Math.sin(a) * r0;
    }
    const ink = { pts, color, minX: 0, minY: 0, maxX: 0, maxY: 0 };
    bounds(ink);
    this.inks.push(ink);
    return ink;
  }

  /** Pushes every ink outward as if a drop of radius r landed at (cx, cy). Additive in r². */
  spread(cx: number, cy: number, r: number) {
    const r2 = r * r;
    for (const ink of this.inks) {
      const p = ink.pts;
      for (let i = 0; i < p.length; i += 2) {
        const dx = p[i] - cx;
        const dy = p[i + 1] - cy;
        const s = Math.sqrt(1 + r2 / (dx * dx + dy * dy || 1e-9));
        p[i] = cx + dx * s;
        p[i + 1] = cy + dy * s;
      }
    }
    this.refine();
  }

  /**
   * Draws a comb of parallel tines across the whole bath (a shear, so always injective).
   * angle: tine direction; spacing: distance between tines; shift: travel at a tine;
   * sharp: falloff (smaller is crisper); alternate: neighbouring tines run opposite ways (gel-git).
   */
  comb(angle: number, spacing: number, offset: number, shift: number, sharp: number, alternate = false) {
    const mx = Math.cos(angle);
    const my = Math.sin(angle);
    const half = spacing / 2;
    const atHalf = sharp / (half + sharp);
    for (const ink of this.inks) {
      const p = ink.pts;
      for (let i = 0; i < p.length; i += 2) {
        const t = -p[i] * my + p[i + 1] * mx - offset;
        const k = Math.round(t / spacing);
        const d = Math.abs(t - k * spacing);
        let z = sharp / (d + sharp);
        if (alternate) z = ((z - atHalf) / (1 - atHalf)) * (k & 1 ? -1 : 1);
        z *= shift;
        p[i] += mx * z;
        p[i + 1] += my * z;
      }
    }
    this.refine();
  }

  /** Drags a stylus from (ax, ay) to (bx, by). Sub-stepped so each step stays injective. */
  stroke(ax: number, ay: number, bx: number, by: number, radius: number, strength = 0.85) {
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.01) return;
    const steps = Math.ceil(len / (radius / 3));
    const mx = (bx - ax) / len;
    const my = (by - ay) / len;
    const step = len / steps;
    const a = step * strength;
    const reach = radius * 8;
    const reach2 = reach * reach;
    const touched = new Set<Ink>();
    for (let s = 0; s < steps; s++) {
      const sx = ax + mx * step * s;
      const sy = ay + my * step * s;
      for (const ink of this.inks) {
        if (ink.maxX < sx - reach || ink.minX > sx + reach + step || ink.maxY < sy - reach || ink.minY > sy + reach + step) continue;
        const p = ink.pts;
        let moved = false;
        for (let i = 0; i < p.length; i += 2) {
          const qx = p[i] - sx;
          const qy = p[i + 1] - sy;
          const along = Math.min(step, Math.max(0, qx * mx + qy * my));
          const ex = qx - mx * along;
          const ey = qy - my * along;
          const d2 = ex * ex + ey * ey;
          if (d2 > reach2) continue;
          const f = radius / (Math.sqrt(d2) + radius);
          const z = a * f * f;
          p[i] += mx * z;
          p[i + 1] += my * z;
          moved = true;
        }
        if (moved) {
          this.refineInk(ink);
          touched.add(ink);
        }
      }
    }
    if (touched.size) this.cull();
  }

  /** Rotational stroke around (cx, cy) at ring radius r: the nightingale's-nest swirl. */
  swirl(cx: number, cy: number, r: number, shift: number, sharp: number) {
    for (const ink of this.inks) {
      const p = ink.pts;
      for (let i = 0; i < p.length; i += 2) {
        const dx = p[i] - cx;
        const dy = p[i + 1] - cy;
        const rho = Math.hypot(dx, dy) || 1e-9;
        const th = (shift * sharp) / (Math.abs(rho - r) + sharp) / rho;
        const c = Math.cos(th);
        const s = Math.sin(th);
        p[i] = cx + dx * c - dy * s;
        p[i + 1] = cy + dx * s + dy * c;
      }
    }
    this.refine();
  }

  /** Keeps vertex spacing near `seg` inside the visible area and coarse outside it. */
  refine() {
    for (const ink of this.inks) this.refineInk(ink);
    this.cull();
  }

  refineInk(ink: Ink) {
    const max = this.seg * 1.6;
    const min = this.seg * 0.35;
    const coarse = this.seg * 24;
    const pad = this.seg * 40;
    const x0 = -pad, y0 = -pad, x1 = this.w + pad, y1 = this.h + pad;
    const p = ink.pts;
    const n = p.length;
    const out: number[] = [];
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (let i = 0; i < n; i += 2) {
      const ax = p[i], ay = p[i + 1];
      const j = (i + 2) % n;
      const bx = p[j], by = p[j + 1];
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < min && out.length >= 2 && n > 32) continue;
      out.push(ax, ay);
      if (ax < a) a = ax;
      if (ax > c) c = ax;
      if (ay < b) b = ay;
      if (ay > d) d = ay;
      const visible = (ax > x0 && ax < x1 && ay > y0 && ay < y1) || (bx > x0 && bx < x1 && by > y0 && by < y1);
      const limit = visible ? max : coarse;
      if (len > limit) {
        const k = Math.ceil(len / limit);
        for (let s = 1; s < k; s++) out.push(ax + (dx * s) / k, ay + (dy * s) / k);
      }
    }
    ink.pts = out;
    ink.minX = a; ink.minY = b; ink.maxX = c; ink.maxY = d;
  }

  /** An ink that covers the whole view hides everything beneath it: fold those into the base. */
  cull() {
    for (let k = this.inks.length - 1; k > 0; k--) {
      const ink = this.inks[k];
      if (ink.minX > -1 || ink.minY > -1 || ink.maxX < this.w + 1 || ink.maxY < this.h + 1) continue;
      if (covers(ink, this.w, this.h)) {
        this.base = ink.color;
        this.inks.splice(0, k + 1);
        return;
      }
    }
  }

  vertexCount() {
    let n = 0;
    for (const ink of this.inks) n += ink.pts.length / 2;
    return n;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.base;
    ctx.fillRect(0, 0, this.w, this.h);
    for (const ink of this.inks) {
      if (ink.maxX < 0 || ink.minX > this.w || ink.maxY < 0 || ink.minY > this.h) continue;
      const p = ink.pts;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
      ctx.closePath();
      ctx.fillStyle = ink.color;
      ctx.fill();
    }
  }
}

function bounds(ink: Ink) {
  const p = ink.pts;
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (let i = 0; i < p.length; i += 2) {
    const x = p[i], y = p[i + 1];
    if (x < a) a = x;
    if (x > c) c = x;
    if (y < b) b = y;
    if (y > d) d = y;
  }
  ink.minX = a; ink.minY = b; ink.maxX = c; ink.maxY = d;
}

function inside(p: number[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const yi = p[i + 1], yj = p[j + 1];
    if (yi > y !== yj > y && x < ((p[j] - p[i]) * (y - yi)) / (yj - yi) + p[i]) hit = !hit;
  }
  return hit;
}

function covers(ink: Ink, w: number, h: number) {
  const p = ink.pts;
  if (!inside(p, 0, 0) || !inside(p, w, 0) || !inside(p, 0, h) || !inside(p, w, h)) return false;
  // corners inside is not enough for a concave ink: no vertex may enter the view
  for (let i = 0; i < p.length; i += 2) {
    if (p[i] > 0 && p[i] < w && p[i + 1] > 0 && p[i + 1] < h) return false;
  }
  return true;
}

/** Small deterministic PRNG so a seed always lifts the same print. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Op =
  | { kind: 'drop'; x: number; y: number; r: number; color: string; dur: number; at: number }
  | { kind: 'comb'; angle: number; spacing: number; offset: number; shift: number; sharp: number; alternate: boolean; dur: number; at: number }
  | { kind: 'swirl'; x: number; y: number; r: number; shift: number; sharp: number; dur: number; at: number };

export type Pattern = 'battal' | 'gelgit' | 'tarakli' | 'bulbul';

/**
 * Builds a timeline in the order a marbler works: scattered ground, ringed drops, then combing.
 * Sizes are relative to the bath so a print composes the same at any resolution.
 */
export function recipe(w: number, h: number, colors: string[], rand: () => number, pattern: Pattern): Op[] {
  const ops: Op[] = [];
  const unit = Math.sqrt(w * h);
  const pick = (i: number) => colors[i % colors.length];
  let t = 0;
  let c = Math.floor(rand() * colors.length);

  const ground = Math.round(30 + rand() * 10);
  for (let i = 0; i < ground; i++) {
    ops.push({ kind: 'drop', x: rand() * w, y: rand() * h, r: unit * (0.06 + rand() * 0.07), color: pick(c++), dur: 420, at: t });
    t += 45;
  }
  const centers = 2 + Math.floor(rand() * 2);
  for (let k = 0; k < centers; k++) {
    const x = w * (0.15 + rand() * 0.7);
    const y = h * (0.15 + rand() * 0.7);
    const rings = 6 + Math.floor(rand() * 4);
    for (let i = 0; i < rings; i++) {
      ops.push({ kind: 'drop', x, y, r: unit * (0.03 + rand() * 0.035), color: pick(c++), dur: 360, at: t });
      t += 50;
    }
  }
  t += 160;
  const dur = 900;
  if (pattern === 'gelgit' || pattern === 'tarakli') {
    ops.push({ kind: 'comb', angle: Math.PI / 2, spacing: unit * 0.09, offset: 0, shift: unit * 0.16, sharp: unit * 0.02, alternate: true, dur, at: t });
    t += dur + 80;
  }
  if (pattern === 'tarakli') {
    ops.push({ kind: 'comb', angle: 0, spacing: unit * 0.05, offset: rand() * unit, shift: unit * 0.06, sharp: unit * 0.008, alternate: false, dur, at: t });
    t += dur;
  }
  if (pattern === 'bulbul') {
    for (let k = 0; k < 3; k++) {
      ops.push({ kind: 'swirl', x: w * (0.2 + rand() * 0.6), y: h * (0.2 + rand() * 0.6), r: unit * 0.08, shift: unit * 0.5, sharp: unit * 0.05, dur, at: t });
      t += dur * 0.6;
    }
  }
  return ops;
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Advances one op from progress `from` to `to` (0..1). Drop growth is area-linear, like real pigment. */
export function advance(bath: Bath, op: Op, from: number, to: number, state: Map<Op, number>) {
  if (op.kind === 'drop') {
    const r1 = op.r * Math.sqrt(easeOut(to));
    if (!state.has(op)) {
      const r0 = Math.max(op.r * 0.02, r1);
      bath.drop(op.x, op.y, r0, op.color);
      state.set(op, r0);
      return;
    }
    const r0 = state.get(op)!;
    if (r1 > r0) {
      bath.spread(op.x, op.y, Math.sqrt(r1 * r1 - r0 * r0));
      state.set(op, r1);
    }
  } else {
    const k = easeInOut(to) - easeInOut(from);
    if (k <= 0) return;
    if (op.kind === 'comb') bath.comb(op.angle, op.spacing, op.offset, op.shift * k, op.sharp, op.alternate);
    else bath.swirl(op.x, op.y, op.r, op.shift * k, op.sharp);
  }
}

/** Runs a timeline to completion with no animation (reduced motion, static prints). */
export function settle(bath: Bath, ops: Op[]) {
  const state = new Map<Op, number>();
  for (const op of ops) advance(bath, op, 0, 1, state);
}

/** Serializes inks as SVG path data (for build-time prints: crisp in PDF, no JS on screen). */
export function toSvgPaths(bath: Bath, tol = 0.8, digits = 1): { d: string; color: string }[] {
  const f = 10 ** digits;
  const r = (v: number) => Math.round(v * f) / f;
  const out: { d: string; color: string }[] = [];
  for (const ink of bath.inks) {
    if (ink.maxX < 0 || ink.minX > bath.w || ink.maxY < 0 || ink.minY > bath.h) continue;
    const p = ink.pts;
    let lx = p[0], ly = p[1];
    let d = `M${r(lx)} ${r(ly)}`;
    for (let i = 2; i < p.length; i += 2) {
      if (Math.abs(p[i] - lx) + Math.abs(p[i + 1] - ly) < tol) continue;
      lx = p[i];
      ly = p[i + 1];
      d += `L${r(lx)} ${r(ly)}`;
    }
    out.push({ d: d + 'Z', color: ink.color });
  }
  return out;
}
