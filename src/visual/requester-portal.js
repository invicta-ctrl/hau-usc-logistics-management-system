function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const requestKey = (scope) => `${scope}:${crypto.randomUUID()}`;

export async function mountRequesterPortal({ root, client, session, onLogout }) {
  const logout = async () => onLogout();
  const renderDenied = () => {
    root.innerHTML = `
      <section class="auth-card" aria-labelledby="requesterTitle">
        <p class="eyebrow">Request Center</p>
        <h1 id="requesterTitle">Requester access is required</h1>
        <p class="auth-intro">This portal only shows the signed-in requester's own requests. Staff workspaces remain separate.</p>
        <button class="primary" type="button" data-requester-logout>Sign out</button>
      </section>`;
    root.querySelector('[data-requester-logout]').addEventListener('click', logout);
  };
  if (session?.user?.authorization?.roleId !== 'REQUESTER') {
    renderDenied();
    return;
  }

  const render = async () => {
    let portal;
    try {
      portal = await client.request('/api/portal/request', { method: 'GET' });
    } catch (error) {
      root.innerHTML = `<section class="auth-card"><h1>Request Center is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><button class="primary" type="button" data-requester-logout>Sign out</button></section>`;
      root.querySelector('[data-requester-logout]').addEventListener('click', logout);
      return;
    }
    const itemOptions = portal.items
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.category)} (${escapeHtml(item.unit)})</option>`,
      )
      .join('');
    const requests =
      portal.requests
        .map(
          (request) => `<article class="borrower-ticket" data-request="${escapeHtml(request.id)}">
          <div><span class="status blue">${escapeHtml(request.status.replaceAll('_', ' '))}</span><strong>${escapeHtml(request.purpose)}</strong><small>${escapeHtml(request.type)} · ${escapeHtml(request.lineCount)} line${request.lineCount === 1 ? '' : 's'}</small></div>
          <div><small>${escapeHtml(new Date(request.updatedAt).toLocaleDateString('en-PH', { dateStyle: 'medium' }))}</small>${request.status === 'FOR_REVIEW' ? `<button class="secondary mini" type="button" data-cancel-request="${escapeHtml(request.id)}">Cancel request</button>` : ''}</div>
        </article>`,
        )
        .join('') || '<p class="empty">No logistics requests yet.</p>';
    root.innerHTML = `
      <main class="borrower-portal requester-portal" aria-labelledby="requesterPortalTitle">
        <header class="borrower-portal-header">
          <div><p class="eyebrow">HAU-USC Logistics</p><h1 id="requesterPortalTitle">Request Center</h1><p>Submit and track only your own logistics requests.</p></div>
          <div class="borrower-profile"><strong>${escapeHtml(portal.profile.displayName)}</strong><small>Requester workspace</small><button class="secondary" type="button" data-requester-logout>Sign out</button></div>
        </header>
        <section class="borrower-grid">
          <form id="requesterRequestForm" class="panel borrower-form">
            <div class="panel-head"><div><h2>New logistics request</h2><p>Choose a catalog item and submit it for staff review. Submission does not reserve stock.</p></div></div>
            <label>Catalog item<select name="itemId" required><option value="">Select an item</option>${itemOptions}</select></label>
            <label>Quantity<input name="quantity" type="number" min="1" step="1" value="1" required></label>
            <label>Department / organization<input name="department" maxlength="120" required></label>
            <label>Purpose<textarea name="purpose" maxlength="500" required></textarea></label>
            <p class="borrower-form-message" role="status" aria-live="polite"></p>
            <button class="primary" type="submit">Submit for review</button>
          </form>
          <section class="panel borrower-ticket-panel" aria-labelledby="requesterTicketsTitle">
            <div class="panel-head"><div><h2 id="requesterTicketsTitle">My requests</h2><p>Track review and fulfillment status. You may cancel only while a request is still For Review.</p></div></div>
            <div class="borrower-ticket-list">${requests}</div>
          </section>
        </section>
      </main>`;
    root.querySelector('[data-requester-logout]').addEventListener('click', logout);
    const form = root.querySelector('#requesterRequestForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('.borrower-form-message');
      const submit = form.querySelector('button[type="submit"]');
      const values = new FormData(form);
      submit.disabled = true;
      try {
        const result = await client.request('/api/portal/request', {
          body: { ...Object.fromEntries(values), clientRequestId: requestKey('requester-request') },
          csrfToken: session.csrfToken,
        });
        message.textContent = `Request ${result.requestId} is now For Review.`;
        await render();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
    root.querySelectorAll('[data-cancel-request]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await client.request('/api/portal/request/cancel', {
            body: {
              requestId: button.dataset.cancelRequest,
              clientRequestId: requestKey('requester-cancel'),
            },
            csrfToken: session.csrfToken,
          });
          await render();
        } finally {
          button.disabled = false;
        }
      });
    });
  };
  await render();
}
