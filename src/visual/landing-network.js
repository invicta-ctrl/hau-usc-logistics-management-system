export function landingNetworkMarkup() {
  return `<figure class="landing-network" data-landing-network data-motion="static" aria-labelledby="landingNetworkTitle landingNetworkDescription">
    <figcaption>
      <strong id="landingNetworkTitle">One accountable route</strong>
      <span id="landingNetworkDescription">Requests move through preparation, release, and completion.</span>
    </figcaption>
    <div class="landing-network__scene" aria-hidden="true">
      <span class="landing-network__plane"></span>
      <span class="landing-network__route landing-network__route--one"></span>
      <span class="landing-network__route landing-network__route--two"></span>
      <span class="landing-network__route landing-network__route--three"></span>
      <span class="landing-network__node landing-network__node--request"><i>1</i><b>Request</b><small>Send the need</small></span>
      <span class="landing-network__node landing-network__node--prepare"><i>2</i><b>Prepare</b><small>Review and ready</small></span>
      <span class="landing-network__node landing-network__node--release"><i>3</i><b>Release</b><small>Record the handoff</small></span>
      <span class="landing-network__node landing-network__node--complete"><i>4</i><b>Complete</b><small>Return or close</small></span>
      <span class="landing-network__parcel landing-network__parcel--one"></span>
      <span class="landing-network__parcel landing-network__parcel--two"></span>
    </div>
    <ol class="landing-network__fallback">
      <li><span>1</span><strong>Request</strong></li>
      <li><span>2</span><strong>Prepare</strong></li>
      <li><span>3</span><strong>Release</strong></li>
      <li><span>4</span><strong>Complete</strong></li>
    </ol>
  </figure>`;
}

function canEnhanceMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (matchMedia('(max-width: 39.99rem)').matches) return false;
  return !navigator.connection?.saveData;
}

export function activateLandingNetwork(root = document) {
  const network = root.querySelector('[data-landing-network]');
  if (!network || network.dataset.networkBound !== undefined) return;
  network.dataset.networkBound = '';
  if (!canEnhanceMotion()) {
    network.dataset.motion = 'static';
    return;
  }
  const start = () => {
    if (document.hidden) return;
    network.dataset.motion = 'active';
    network.addEventListener('animationend', (event) => {
      if (event.target !== network) return;
      network.dataset.motion = 'settled';
    });
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    network.dataset.paused = String(!visible || document.hidden);
    if (visible && network.dataset.motion === 'static') {
      observer.disconnect();
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 900 });
      else setTimeout(start, 120);
    }
  }, { rootMargin: '80px', threshold: 0.15 });
  observer.observe(network);
  document.addEventListener('visibilitychange', () => {
    network.dataset.paused = String(document.hidden);
  });
}
