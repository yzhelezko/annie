import { Bath, recipe, advance, settle, rng, type Op, type Pattern } from '../engine/marbling';

const PATTERNS: Pattern[] = ['battal', 'gelgit', 'tarakli', 'bulbul'];
const VERTEX_BUDGET = 160_000;

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
  let dirty = true;
  let visible = true;
  let touched = false;
  let ambient = 0;
  let next = 1;
  let view = { s: 1, ox: 0, oy: 0, dpr: 1 };

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
    bath = new Bath(Math.max(1, r.width), Math.max(1, r.height), colors[0], r.width < 700 ? 2.6 : 3);
    ops = recipe(bath.w, bath.h, order, rand, pattern);
    progress.clear();
    growth.clear();
    clock = 0;
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
    clock += Math.min(64, now - last);
    last = now;
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
    if (bath.vertexCount() > VERTEX_BUDGET) bath.seg *= 1.25;
    if (dirty) draw();
    if (ops.length) play();
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

  function drop(x: number, y: number) {
    const color = colors[next % colors.length];
    next++;
    if (chip) chip.style.background = colors[next % colors.length];
    schedule({ kind: 'drop', x, y, r: unit() * (0.045 + Math.random() * 0.04), color, dur: 520, at: 0 });
  }

  function comb() {
    const u = unit();
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

  // Pointer = stylus. Horizontal drags comb; vertical ones scroll on touch (touch-action: pan-y).
  const toBath = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.ox) / view.s, y: (e.clientY - r.top - view.oy) / view.s };
  };
  let pen: { x: number; y: number; moved: number } | null = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    first();
    pen = { ...toBath(e), moved: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pen) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    const radius = unit() * 0.012;
    for (const ev of events) {
      const p = toBath(ev);
      const d = Math.hypot(p.x - pen.x, p.y - pen.y);
      if (pen.moved + d > 6 || pen.moved > 6) bath.stroke(pen.x, pen.y, p.x, p.y, radius);
      pen.moved += d;
      pen.x = p.x;
      pen.y = p.y;
    }
    dirty = true;
    play();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (pen && pen.moved < 6) drop(toBath(e).x, toBath(e).y);
    pen = null;
  });
  canvas.addEventListener('pointercancel', () => (pen = null));

  function first() {
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
    if (sheet && !reduce) {
      sheet.style.backgroundImage = `url(${url})`;
      sheet.classList.remove('lifting');
      sheet.classList.add('laying');
      await new Promise((r) => setTimeout(r, 380));
      sheet.classList.replace('laying', 'lifting');
      compose();
      setTimeout(() => sheet.classList.remove('lifting'), 1100);
    } else compose();
  }

  // A few drops fall on their own until the visitor takes the stylus.
  setInterval(() => {
    if (touched || reduce || !visible || document.hidden || ambient > 7) return;
    ambient++;
    schedule({ kind: 'drop', x: bath.w * (0.1 + Math.random() * 0.8), y: bath.h * (0.1 + Math.random() * 0.8), r: unit() * 0.03, color: colors[(ambient * 3) % colors.length], dur: 900, at: 0 });
  }, 5200);

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && (ops.length || dirty)) play();
  }).observe(root);

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
