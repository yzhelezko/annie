import { Bath, recipe, advance, settle, rng, type Ink, type Op, type Pattern } from '../engine/marbling';

const PATTERNS: Pattern[] = ['battal', 'gelgit', 'tarakli', 'bulbul'];
const VERTEX_BUDGET = 160_000;
const SWAY_PERIOD = 6400;
const IDLE_BEFORE_DRIP = 4000;
const DRIP_EVERY = 3600;

export interface Live {
  /** Paints the current bath into another canvas, cover-fitted: the print lifted from it. */
  liftInto(target: HTMLCanvasElement): void;
}

export function mountBath(root: HTMLElement): Live {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.bath')!;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const colors: string[] = JSON.parse(root.dataset.pigments!);
  const choice = root.dataset.pattern as Pattern | 'random';
  const name = root.dataset.name ?? '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const chip = root.querySelector<HTMLElement>('[data-act="next"] .chip');
  const status = root.querySelector<HTMLElement>('[role="status"]');
  const sheet = root.querySelector<HTMLElement>('.sheet');

  let bath: Bath;
  let ops: Op[] = [];
  const progress = new Map<Op, number>();
  const growth = new Map<Op, number>();
  let clock = 0;
  let last = 0;
  let raf = 0;
  let frames = 0;
  let dirty = true;
  let visible = true;
  let touched = false;
  let lastTouch = -Infinity;
  let lastDrip = 0;
  let sway = 0;
  let next = 1;
  let fine = 3;
  let view = { s: 1, ox: 0, oy: 0, dpr: 1 };
  // the water is always moving unless the visitor asked for stillness
  const alive = () => !reduce && visible && !document.hidden;

  const unit = () => Math.sqrt(bath.w * bath.h);

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const s = Math.max(r.width / bath.w, r.height / bath.h);
    view = { s, ox: (r.width - bath.w * s) / 2, oy: (r.height - bath.h * s) / 2, dpr };
    dirty = true;
  }

  function compose(seed = (Math.random() * 2 ** 31) | 0) {
    const r = canvas.getBoundingClientRect();
    const rand = rng(seed);
    const pattern = choice === 'random' ? PATTERNS[Math.floor(rand() * PATTERNS.length)] : choice;
    const order = colors.slice(1).concat(colors[0]);
    fine = r.width < 700 ? 2.6 : 3;
    bath = new Bath(Math.max(1, r.width), Math.max(1, r.height), colors[0], fine);
    ops = recipe(bath.w, bath.h, order, rand, pattern);
    progress.clear();
    growth.clear();
    pour = null;
    clock = 0;
    sway = 0;
    fit();
    if (reduce) {
      settle(bath, ops);
      ops = [];
    }
    play();
  }

  function play() {
    if (!raf && visible) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(64, now - last);
    clock += dt;
    last = now;
    frames++;

    if (ops.length) {
      const live: Op[] = [];
      for (const op of ops) {
        if (op.at > clock) {
          live.push(op);
          continue;
        }
        const p = Math.min(1, (clock - op.at) / op.dur);
        advance(bath, op, progress.get(op) ?? 0, p, growth);
        progress.set(op, p);
        if (p < 1) live.push(op);
      }
      ops = live;
      dirty = true;
    }

    if (pour) flow(dt);

    if (alive()) {
      // gentle back-and-forth swell: a shear that returns to where it started every period
      const u = unit();
      const target = Math.sin((clock / SWAY_PERIOD) * Math.PI * 2) * u * 0.014;
      if (!coarse || frames % 2 === 0) {
        bath.comb(Math.PI / 2, u * 0.14, u * 0.031, target - sway, u * 0.07, true, frames % 12 === 0);
        sway = target;
        dirty = true;
      }
      if (clock - lastTouch > IDLE_BEFORE_DRIP && clock - lastDrip > DRIP_EVERY && !ops.length) {
        lastDrip = clock;
        drip();
      }
      if (frames % 90 === 0) bath.prune(Math.max(bath.w, bath.h) * 0.6);
    }

    // detail follows the vertex budget both ways, so a busy moment never coarsens the bath for good
    if (frames % 30 === 0) {
      const n = bath.vertexCount();
      if (n > VERTEX_BUDGET && bath.seg < fine * 2) bath.seg *= 1.15;
      else if (n < VERTEX_BUDGET * 0.5 && bath.seg > fine) bath.seg = Math.max(fine, bath.seg / 1.15);
    }
    if (dirty) draw();
    if (alive() || ops.length || pour) play();
  }

  function draw() {
    dirty = false;
    const { s, ox, oy, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bath.base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, ox * dpr, oy * dpr);
    bath.render(ctx);
  }

  function schedule(op: Op) {
    op.at = clock;
    ops.push(op);
    play();
  }

  const take = () => {
    const color = colors[next % colors.length];
    next++;
    if (chip) chip.style.background = colors[next % colors.length];
    return color;
  };

  function drop(x: number, y: number) {
    schedule({ kind: 'drop', x, y, r: unit() * (0.045 + Math.random() * 0.04), color: take(), dur: 520, at: 0 });
  }

  function drip() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    schedule({ kind: 'drop', x: bath.w * (0.08 + Math.random() * 0.84), y: bath.h * (0.08 + Math.random() * 0.84), r: unit() * (0.02 + Math.random() * 0.035), color, dur: 1100, at: 0 });
  }

  function comb() {
    const u = unit();
    if (Math.random() < 0.3) {
      schedule({ kind: 'swirl', x: bath.w * (0.25 + Math.random() * 0.5), y: bath.h * (0.25 + Math.random() * 0.5), r: u * (0.06 + Math.random() * 0.08), shift: u * 0.5 * (Math.random() < 0.5 ? -1 : 1), sharp: u * 0.05, dur: 1300, at: 0 });
      return;
    }
    const vertical = Math.random() < 0.5;
    schedule({
      kind: 'comb',
      angle: vertical ? Math.PI / 2 : 0,
      spacing: u * (0.05 + Math.random() * 0.06),
      offset: Math.random() * u,
      shift: u * (0.06 + Math.random() * 0.08) * (Math.random() < 0.5 ? -1 : 1),
      sharp: u * 0.012,
      alternate: Math.random() < 0.6,
      dur: 1100,
      at: 0,
    });
  }

  // Holding the pointer pours pigment: the drop keeps spreading, area growing linearly with time.
  let pour: { x: number; y: number; r: number; held: boolean; ink: Ink } | null = null;
  function flow(dt: number) {
    const p = pour!;
    const u = unit();
    const min = u * 0.045;
    const max = u * 0.32;
    const rate = (p.held ? 0.000014 : 0.00006) * u * u;
    if ((!p.held && p.r >= min) || p.r >= max) {
      pour = null;
      return;
    }
    const r1 = Math.min(max, Math.sqrt(p.r * p.r + rate * dt));
    bath.spread(p.x, p.y, Math.sqrt(r1 * r1 - p.r * p.r));
    p.r = r1;
    dirty = true;
  }

  // Pointer = stylus. Hovering stirs, dragging combs, holding pours. On touch, vertical drags scroll (pan-y).
  const toBath = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.ox) / view.s, y: (e.clientY - r.top - view.oy) / view.s };
  };
  let pen: { x: number; y: number; moved: number } | null = null;
  let hover: { x: number; y: number } | null = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    first();
    const p = toBath(e);
    pen = { ...p, moved: 0 };
    const r0 = unit() * 0.006;
    pour = { ...p, r: r0, held: true, ink: bath.drop(p.x, p.y, r0, take()) };
    canvas.setPointerCapture(e.pointerId);
    play();
  });
  canvas.addEventListener('pointermove', (e) => {
    lastTouch = clock;
    const events = e.getCoalescedEvents?.() ?? [e];
    if (!pen) {
      if (e.pointerType !== 'mouse' || reduce) return;
      const radius = unit() * 0.02;
      for (const ev of events) {
        const p = toBath(ev);
        if (hover) bath.stroke(hover.x, hover.y, p.x, p.y, radius, 0.32);
        hover = p;
      }
      dirty = true;
      play();
      return;
    }
    const radius = unit() * 0.012;
    for (const ev of events) {
      const p = toBath(ev);
      const d = Math.hypot(p.x - pen.x, p.y - pen.y);
      if (pen.moved + d > 6 || pen.moved > 6) {
        // a drag that starts straight away is combing, not pouring: lift the barely-started drop back out
        if (pour?.held && pour.r < unit() * 0.03) {
          bath.inks = bath.inks.filter((k) => k !== pour!.ink);
          pour = null;
        } else if (pour) pour.held = false;
        bath.stroke(pen.x, pen.y, p.x, p.y, radius);
      }
      pen.moved += d;
      pen.x = p.x;
      pen.y = p.y;
    }
    dirty = true;
    play();
  });
  const release = () => {
    if (pour) pour.held = false;
    pen = null;
    hover = null;
    play();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => (hover = null));

  // Scrolling within the hero sways the paint in broad waves. Displacement depends only on how far the hero
  // is scrolled (clamped) and the field is smooth, so scrolling back returns the paint where it was.
  const scrollPos = () => Math.min(Math.max(scrollY, 0), root.offsetHeight);
  let scrolled = scrollPos();
  addEventListener(
    'scroll',
    () => {
      const pos = scrollPos();
      const d = pos - scrolled;
      scrolled = pos;
      if (!d || reduce || !bath) return;
      const u = unit();
      bath.comb(Math.PI / 2, u * 0.18, u * 0.04, d * 0.08, u * 0.07, true);
      dirty = true;
      play();
    },
    { passive: true },
  );

  function first() {
    lastTouch = clock;
    if (touched) return;
    touched = true;
    root.classList.add('touched');
  }

  root.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    first();
    if (act === 'next') drop(bath.w * (0.2 + Math.random() * 0.6), bath.h * (0.2 + Math.random() * 0.6));
    else if (act === 'comb') comb();
    else if (act === 'fresh') compose();
    else if (act === 'lift') lift();
  });

  async function lift() {
    const scale = Math.min(2, 4000 / bath.w);
    const out = document.createElement('canvas');
    out.width = Math.round(bath.w * scale);
    out.height = Math.round(bath.h * scale);
    const c = out.getContext('2d')!;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    bath.render(c);
    // the marbler's seal: name and date on a paper slip, bottom right
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const label = `${name} · ${date}`;
    c.font = `600 13px ${getComputedStyle(document.body).fontFamily}`;
    const w = c.measureText(label).width + 20;
    c.fillStyle = getComputedStyle(root).getPropertyValue('--paper') || '#efefea';
    c.fillRect(bath.w - w - 16, bath.h - 44, w, 28);
    c.fillStyle = getComputedStyle(root).getPropertyValue('--ink') || '#141416';
    c.textBaseline = 'middle';
    c.fillText(label, bath.w - w - 6, bath.h - 30);
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebru-${slug(name)}-${date}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (status) status.textContent = root.dataset.lifted ?? '';
    // the sheet lifts away with the print; the bath stays as the visitor left it
    if (sheet && !reduce) {
      sheet.style.backgroundImage = `url(${url})`;
      sheet.classList.remove('lifting');
      sheet.classList.add('laying');
      await new Promise((r) => setTimeout(r, 380));
      sheet.classList.replace('laying', 'lifting');
      setTimeout(() => sheet.classList.remove('lifting'), 1100);
    }
  }

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) play();
  }).observe(root);
  document.addEventListener('visibilitychange', () => document.hidden || play());

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      fit();
      draw();
    }, 60);
  }).observe(canvas);

  if (chip) chip.style.background = colors[next % colors.length];
  compose();
  root.classList.add('live');

  return {
    liftInto(target) {
      const r = target.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      target.width = Math.round(r.width * dpr);
      target.height = Math.round(r.height * dpr);
      const c = target.getContext('2d', { alpha: false })!;
      const s = Math.max(r.width / bath.w, r.height / bath.h);
      c.fillStyle = bath.base;
      c.fillRect(0, 0, target.width, target.height);
      c.setTransform(dpr * s, 0, 0, dpr * s, ((r.width - bath.w * s) / 2) * dpr, ((r.height - bath.h * s) / 2) * dpr);
      bath.render(c);
    },
  };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '') || 'print';
