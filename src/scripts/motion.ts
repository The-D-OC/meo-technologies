/**
 * Site-wide motion: scroll reveals, split headlines, magnetic buttons,
 * card spotlights, parallax and scroll progress.
 * Re-runs on every Astro view-transition navigation.
 */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;

let cleanups: Array<() => void> = [];
const onCleanup = (fn: () => void) => cleanups.push(fn);

function splitHeadlines() {
  document.querySelectorAll<HTMLElement>('[data-split]:not(.split)').forEach((el) => {
    const words = (el.textContent ?? '').trim().split(/\s+/);
    const norm = (s: string) => s.toLowerCase().replace(/[^\w]/g, '');
    const serifWords = new Set((el.dataset.serif ?? '').split(',').map(norm).filter(Boolean));
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((word, i) => {
        const cls = serifWords.has(norm(word)) ? ' class="serif"' : '';
        return `<span class="w" aria-hidden="true"><span${cls} style="--i:${i}">${word}</span></span>`;
      })
      .join(' ');
    el.classList.add('split');
  });
}

function reveals() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], .split');
  if (reduced() || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((t) => io.observe(t));
  onCleanup(() => io.disconnect());
}

function magnetic() {
  if (reduced() || !finePointer()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.3;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${(e.clientX - (r.left + r.width / 2)) * strength}px`);
      el.style.setProperty('--y', `${(e.clientY - (r.top + r.height / 2)) * strength}px`);
    };
    const leave = () => {
      el.style.setProperty('--x', '0px');
      el.style.setProperty('--y', '0px');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    onCleanup(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}

function spotlights() {
  if (!finePointer()) return;
  const handler = (e: PointerEvent) => {
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', handler, { passive: true });
  onCleanup(() => document.removeEventListener('pointermove', handler));
}

function tilt() {
  if (reduced() || !finePointer()) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateZ(0)`;
    };
    const leave = () => (el.style.transform = '');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    onCleanup(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}

function scrollEffects() {
  const root = document.documentElement;
  const header = document.querySelector<HTMLElement>('[data-header]');
  const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--p', String(max > 0 ? y / max : 0));
    header?.classList.toggle('is-scrolled', y > 24);
    if (!reduced()) {
      for (const el of parallax) {
        const speed = Number(el.dataset.parallax) || 0.2;
        el.style.translate = `0 ${y * speed}px`;
      }
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  onCleanup(() => window.removeEventListener('scroll', onScroll));
}

function counters() {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!els.length) return;
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    if (reduced()) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const start = performance.now();
    const dur = 1600;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        run(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    });
  });
  els.forEach((el) => io.observe(el));
  onCleanup(() => io.disconnect());
}

function init() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  splitHeadlines();
  reveals();
  magnetic();
  spotlights();
  tilt();
  scrollEffects();
  counters();
}

document.addEventListener('astro:page-load', init);
