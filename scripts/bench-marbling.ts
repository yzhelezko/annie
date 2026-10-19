// npm run bench — times the marbling engine at hero size (no canvas; render cost measured in-browser).
import { Bath, recipe, settle, rng, type Pattern } from '../src/engine/marbling.ts';

const W = 1440, H = 900;
const colors = ['#23349c', '#c42b2b', '#10835c', '#b8780f', '#17171c', '#5a2b6b'];

for (const pattern of ['battal', 'gelgit', 'tarakli', 'bulbul'] as Pattern[]) {
  const bath = new Bath(W, H, colors[0]);
  let t = performance.now();
  settle(bath, recipe(W, H, colors, rng(42), pattern));
  const compose = performance.now() - t;
  const verts = bath.vertexCount();

  const r = rng(7);
  let x = W / 2, y = H / 2;
  t = performance.now();
  const moves = 240;
  for (let i = 0; i < moves; i++) {
    const nx = Math.min(W, Math.max(0, x + (r() - 0.5) * 60));
    const ny = Math.min(H, Math.max(0, y + (r() - 0.5) * 60));
    bath.stroke(x, y, nx, ny, 14);
    x = nx; y = ny;
  }
  const perMove = (performance.now() - t) / moves;
  console.log(`${pattern.padEnd(8)} compose ${compose.toFixed(1)}ms  inks ${bath.inks.length}  verts ${verts} → ${bath.vertexCount()} after ${moves} strokes  stroke ${perMove.toFixed(2)}ms/move`);
}
