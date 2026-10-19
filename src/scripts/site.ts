// Remember where the visitor clicked so the next page can land as a drop from that point.
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('a[href]')) return;
  try {
    sessionStorage.setItem('drop', `${Math.round(e.clientX)},${Math.round(e.clientY)}`);
  } catch {}
});

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loops play only while on screen; every loop has a pause control (WCAG 2.2.2).
const loops = document.querySelectorAll<HTMLElement>('[data-video="loop"]');
const paused = new WeakSet<HTMLElement>();
const setState = (box: HTMLElement, playing: boolean) => {
  box.dataset.state = playing ? 'playing' : 'paused';
  const btn = box.querySelector<HTMLButtonElement>('.vctl');
  if (btn) btn.setAttribute('aria-label', playing ? btn.dataset.pause! : btn.dataset.play!);
};
const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      const box = en.target as HTMLElement;
      const v = box.querySelector('video')!;
      if (en.isIntersecting && !paused.has(box) && !reduce) {
        if (v.preload === 'none') v.preload = 'auto';
        v.play().then(() => setState(box, true), () => setState(box, false));
      } else if (!v.paused) {
        v.pause();
        setState(box, false);
      }
    }
  },
  { threshold: 0.35 },
);
loops.forEach((box) => {
  if (reduce) paused.add(box);
  setState(box, false);
  io.observe(box);
  box.querySelector('.vctl')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const v = box.querySelector('video')!;
    if (v.paused) {
      paused.delete(box);
      v.play().then(() => setState(box, true));
    } else {
      paused.add(box);
      v.pause();
      setState(box, false);
    }
  });
});

// Embeds stay a still frame until asked: no third-party requests before a click.
document.querySelectorAll<HTMLElement>('[data-embed]').forEach((box) => {
  box.querySelector('.play')?.addEventListener('click', () => {
    const id = box.dataset.id!;
    const src =
      box.dataset.embed === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
        : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
    const f = document.createElement('iframe');
    f.src = src;
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.title = box.querySelector('.visually-hidden')?.textContent?.replace(/^:\s*/, '') || box.dataset.embed!;
    box.replaceChildren(f);
  });
});

// Copy-email buttons.
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      const label = btn.querySelector('.label')!;
      const was = label.textContent;
      label.textContent = btn.dataset.done!;
      setTimeout(() => (label.textContent = was), 1800);
    } catch {}
  });
});

// Same-page anchors in the mobile menu should close it.
const menu = document.getElementById('menu');
menu?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) menu.hidePopover();
});
