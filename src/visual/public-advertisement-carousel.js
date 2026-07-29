const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export function mountPublicAdvertisementCarousel({ root, advertisements, intervalMs = 5000 }) {
  const items = Array.isArray(advertisements) ? advertisements : [];
  if (!items.length) {
    root.innerHTML =
      '<section class="panel public-announcement-placeholder"><p class="eyebrow">USC Announcements</p><h2>Updates will appear here</h2><p>Official HAU-USC and Department of Logistics announcements are published by authorized administrators.</p></section>';
    return { destroy() {} };
  }

  let index = 0;
  let timer = null;
  let paused = false;
  let pointerStart = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.innerHTML = `
    <section class="panel public-announcements${reducedMotion ? ' reduced-motion' : ''}" aria-labelledby="publicAnnouncementsTitle">
      <div class="panel-head"><div><p class="eyebrow">Official updates</p><h2 id="publicAnnouncementsTitle">USC Announcements</h2></div><span class="pill" data-announcement-position></span></div>
      <div class="public-announcement-stage" data-announcement-stage aria-live="polite"></div>
      <div class="public-announcement-controls" data-announcement-controls>
        <button class="secondary mini" type="button" data-announcement-previous aria-label="Previous announcement">Previous</button>
        <div data-announcement-indicators aria-label="Choose announcement"></div>
        <button class="secondary mini" type="button" data-announcement-next aria-label="Next announcement">Next</button>
      </div>
    </section>`;

  const container = root.querySelector('.public-announcements');
  const stage = root.querySelector('[data-announcement-stage]');
  const position = root.querySelector('[data-announcement-position]');
  const controls = root.querySelector('[data-announcement-controls]');
  const indicators = root.querySelector('[data-announcement-indicators]');

  const render = () => {
    const item = items[index];
    const linked = Boolean(item.destinationUrl);
    const media = `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText)}" decoding="async"${index === 0 ? '' : ' loading="lazy"'}>`;
    stage.innerHTML = `
      <article class="public-announcement-card" data-announcement-id="${escapeHtml(item.id)}">
        ${linked ? `<a class="public-announcement-media" href="${escapeHtml(item.destinationUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.callToAction || item.title)}">${media}</a>` : `<div class="public-announcement-media">${media}</div>`}
        <div class="public-announcement-copy"><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}${linked ? `<a class="secondary" href="${escapeHtml(item.destinationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.callToAction || 'View announcement')}</a>` : ''}</div>
      </article>`;
    position.textContent = `${index + 1} of ${items.length}`;
    indicators.innerHTML = items
      .map(
        (entry, itemIndex) =>
          `<button type="button" class="announcement-indicator${itemIndex === index ? ' active' : ''}" data-announcement-index="${itemIndex}" aria-label="Show ${escapeHtml(entry.title)}" aria-current="${itemIndex === index ? 'true' : 'false'}"></button>`,
      )
      .join('');
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (items.length <= 1 || paused || document.hidden || reducedMotion) return;
    timer = setInterval(() => {
      index = (index + 1) % items.length;
      render();
    }, intervalMs);
  };
  const show = (nextIndex) => {
    index = (nextIndex + items.length) % items.length;
    render();
    start();
  };

  controls.hidden = items.length === 1;
  root.querySelector('[data-announcement-previous]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-announcement-next]').addEventListener('click', () => show(index + 1));
  indicators.addEventListener('click', (event) => {
    const button = event.target.closest('[data-announcement-index]');
    if (button) show(Number(button.dataset.announcementIndex));
  });
  container.addEventListener('mouseenter', () => {
    paused = true;
    stop();
  });
  container.addEventListener('mouseleave', () => {
    paused = false;
    start();
  });
  container.addEventListener('focusin', () => {
    paused = true;
    stop();
  });
  container.addEventListener('focusout', (event) => {
    if (container.contains(event.relatedTarget)) return;
    paused = false;
    start();
  });
  container.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    }
  });
  container.addEventListener('pointerdown', (event) => {
    pointerStart = event.clientX;
  });
  container.addEventListener('pointerup', (event) => {
    if (pointerStart == null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) >= 45) show(index + (distance < 0 ? 1 : -1));
  });
  const visibilityHandler = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', visibilityHandler);
  render();
  start();
  return {
    destroy() {
      stop();
      document.removeEventListener('visibilitychange', visibilityHandler);
    },
  };
}
