import { Bath, recipe, settle, rng, hash, type Pattern } from '../engine/marbling';

const PATTERNS: Pattern[] = ['battal', 'gelgit', 'tarakli', 'bulbul'];

/** A project's print: the same seed always lifts the same sheet, at any size. */
function lift(canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const colors: string[] = JSON.parse(canvas.dataset.colors!);
  const seed = hash(canvas.dataset.print!);
  const rand = rng(seed);
  const pattern = PATTERNS[seed % PATTERNS.length];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  // compose in a fixed-height space so the pattern scales instead of re-flowing on resize
  const H = 720;
  const W = Math.max(1, Math.round((r.width / r.height) * H));
  const bath = new Bath(W, H, colors[0], W > 1400 ? 3.2 : 2.6);
  settle(bath, recipe(W, H, colors.slice(1).concat(colors[0]), rand, pattern));
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const s = (r.height * dpr) / H;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  bath.render(ctx);
  canvas.classList.add('inked');
}

for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas[data-print]')) {
  let w = 0;
  new ResizeObserver(([e]) => {
    const nw = Math.round(e.contentRect.width);
    if (Math.abs(nw - w) < 40) return;
    w = nw;
    lift(c);
  }).observe(c);
}
