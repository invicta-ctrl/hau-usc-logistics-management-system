import '../styles/visual/playground-console.css';
import { getAuthSession } from '../auth/session-state.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function metric(label, value, note = '') {
  return `<article class="card metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

function statusPanel(status) {
  const modules = status.moduleSwitcher?.modules ?? [];
  return `
    <div class="playground-console-backdrop" data-playground-close></div>
    <aside class="playground-console-panel" role="dialog" aria-modal="true" aria-labelledby="playgroundConsoleTitle">
      <header>
        <div><span class="eyebrow">Private operator surface</span><h2 id="playgroundConsoleTitle">Isolated Staging Playground</h2></div>
        <button class="secondary mini" type="button" data-playground-close aria-label="Close playground console">Close</button>
      </header>
      <p class="playground-console-intro">Production-derived clean baseline. Test mutations stay isolated and never synchronize back.</p>
      <div class="playground-console-metrics">
        ${metric('Candidate', status.candidate.version, `${status.candidate.commit} · tree ${status.candidate.tree}`)}
        ${metric('Production', status.production.version, status.production.identity)}
        ${metric('D1 baseline parity', status.d1BaselineParity, `Schema ${status.cleanBaseline.schema}`)}
        ${metric('R2 baseline parity', status.r2BaselineParity, 'Private evidence excluded by policy')}
        ${metric('Working state', status.workingState, status.activeTestSession ? 'Active test session protected' : 'No active test session')}
        ${metric('Baseline captured', status.cleanBaseline.capturedAt || 'Not reported', status.cleanBaseline.sourceProductionVersion)}
      </div>
      <section class="playground-console-section">
        <div><span class="eyebrow">Module switcher</span><h3>Move through the current product</h3></div>
        <div class="playground-module-grid">${modules
          .map(
            ([view, label]) =>
              `<button class="secondary" type="button" data-playground-module="${escapeHtml(view)}">${escapeHtml(label)}</button>`,
          )
          .join('')}</div>
        <button class="secondary playground-real-login" type="button" data-playground-real-login>Test Real Login Flow</button>
      </section>
      <section class="playground-console-section playground-console-actions">
        <div><span class="eyebrow">Workspace recovery</span><h3>Return to a known state</h3></div>
        <p>Reset discards playground mutations. Refresh replaces the clean baseline from a new read-only production snapshot.</p>
        <label>Confirmation phrase<input data-playground-confirmation autocomplete="off" placeholder="Type the exact phrase"></label>
        <label class="checkbox"><input type="checkbox" data-playground-discard-session> Discard the active manual test session during baseline refresh</label>
        <div class="playground-action-row">
          <button class="primary" type="button" data-playground-operation="RESET">Reset Workspace</button>
          <button class="secondary danger" type="button" data-playground-operation="REFRESH_BASELINE">Refresh Baseline From Production</button>
        </div>
        <p class="playground-console-result" role="status" data-playground-result></p>
      </section>
    </aside>`;
}

async function requestOperation(panel, kind) {
  const result = panel.querySelector('[data-playground-result]');
  const confirmation = panel.querySelector('[data-playground-confirmation]').value;
  const discardActiveSession = panel.querySelector('[data-playground-discard-session]').checked;
  result.textContent = 'Recording the operator request…';
  const response = await fetch('/api/playground/operation', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': getAuthSession().csrfToken ?? '',
    },
    body: JSON.stringify({ kind, confirmation, discardActiveSession }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'The playground operation was refused.');
  result.textContent = `${payload.state}. Operator reference ${payload.operationReference}.`;
}

function bindPanel(root) {
  const close = () => root.remove();
  root.querySelectorAll('[data-playground-close]').forEach((button) => button.addEventListener('click', close));
  root.querySelectorAll('[data-playground-module]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(`#primaryNav [data-view="${button.dataset.playgroundModule}"]`)?.click();
      close();
    });
  });
  root.querySelector('[data-playground-real-login]').addEventListener('click', () => {
    document.querySelector('[data-auth-logout]')?.click();
    close();
  });
  root.querySelectorAll('[data-playground-operation]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await requestOperation(root, button.dataset.playgroundOperation);
      } catch (error) {
        root.querySelector('[data-playground-result]').textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  });
}

export function installPlaygroundConsole() {
  if (document.querySelector('[data-playground-launcher]')) return;
  void fetch('/api/playground/status', { credentials: 'same-origin' })
    .then(async (response) => (response.ok ? response.json() : null))
    .then((status) => {
      if (!status?.playground) return;
      const launcher = document.createElement('button');
      launcher.type = 'button';
      launcher.className = 'playground-launcher';
      launcher.dataset.playgroundLauncher = '';
      launcher.innerHTML = `<span>Playground</span><strong>${escapeHtml(status.workingState)}</strong>`;
      launcher.addEventListener('click', async () => {
        const response = await fetch('/api/playground/status', { credentials: 'same-origin' });
        if (!response.ok) return;
        const current = await response.json();
        const root = document.createElement('div');
        root.className = 'playground-console-root';
        root.innerHTML = statusPanel(current);
        document.body.append(root);
        bindPanel(root);
      });
      document.body.append(launcher);
    })
    .catch(() => {});
}
