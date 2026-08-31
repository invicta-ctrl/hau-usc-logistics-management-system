import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFile(resolve(root, path), 'utf8');

describe('MFR-002 U04 entry-flow contract', () => {
  it('keeps the landing poster complete without fetching decorative motion before user intent', async () => {
    const hero = await source('src/frontend/app/landing/HeroMotion.tsx');

    expect(hero).toContain('const [motionRequested, setMotionRequested] = useState(false)');
    expect(hero).toMatch(/if \(!motionAllowed \|\| !motionRequested\)[\s\S]*setResolvedVideoSrc\(undefined\)/u);
    expect(hero).toContain("fetch(chunkUrl, { signal: controller.signal })");
    expect(hero).toContain('controller.abort()');
    expect(hero).toContain("preload={motionRequested ? 'metadata' : 'none'}");
    expect(hero).toContain('setMotionRequested(true)');
    expect(hero).not.toContain("setAttribute('fetchpriority', 'high')");
  });

  it('keeps Public Lending no-login while making selection, tracking, errors, and one-time receipts recoverable', async () => {
    const lending = await source('src/frontend/app/PublicFlows.tsx');

    expect(lending).toContain('Public lending — no account and no sign-in needed');
    expect(lending).toContain('frontendBackend.submitPublicLending');
    expect(lending).not.toContain('className="mast"');
    expect(lending).not.toContain('className="home"');
    expect(lending).not.toContain('className="leave"');
    expect(lending).toContain('className="selectionContinue"');
    expect(lending).toContain('continueToBorrowerDetails');
    expect(lending).toContain('<form onSubmit={(event) => { event.preventDefault(); void checkTracking(); }}>');
    expect(lending).toContain('htmlFor="lending-availability"');
    expect(lending).toContain('htmlFor="tracking-private-code"');
    expect(lending).toContain('className="inlineAlert" role="alert"');
    expect(lending).toContain('Copy tracking details');
    expect(lending).toContain('I saved these private details in a secure place.');
    expect(lending).toContain('disabled={!saved}');
    expect(lending).toContain('receiptRef.current?.focus()');
  });

  it('keeps the External Request Center authenticated and submits its compose flow as a real form', async () => {
    const requester = await source('src/frontend/app/request/ExternalRequestCenter.tsx');

    expect(requester).toContain('.requesterPortal(controller.signal)');
    expect(requester).toContain('frontendBackend.submitRequesterRequest');
    expect(requester).toContain("requestType === 'NEW' || parentRequestId");
    expect(requester).toContain('onSubmit={submitForm}');
    expect(requester).toContain('type="submit"');
    expect(requester).toContain('className="entry-flow__actions"');
    expect(requester).toContain('receiptRef.current?.focus()');
    expect(requester).not.toContain('minHeight: 36');
    expect(requester).not.toContain('minHeight: 38');
  });

  it('preserves password-manager semantics and makes every account lifecycle theme-aware', async () => {
    const [signIn, access, recovery] = await Promise.all([
      source('src/frontend/app/auth/StaffSignInPage.tsx'),
      source('src/frontend/app/auth/AccountAccessPanel.tsx'),
      source('src/frontend/app/auth/AccountRecoveryPanel.tsx'),
    ]);

    for (const marker of ['autoComplete="username"', 'autoComplete="current-password"', 'autoComplete="new-password"']) {
      expect(`${signIn}\n${access}\n${recovery}`).toContain(marker);
    }
    expect(access).toContain('event.key !== "ArrowLeft" && event.key !== "ArrowRight"');
    expect(access).toContain('aria-controls="account-access-apply-panel"');
    expect(access).toContain('Copy private status token');
    expect(access).toContain('var(--theme-input,#fff7e6)');
    expect(recovery).toContain('var(--theme-input,#fff7e6)');
    expect(recovery).toContain('aria-describedby="recovery-password-hint"');
    expect(signIn).not.toContain('minHeight: 42');
  });

  it('keeps Profile server-backed while making correction fields visible and controls touch-safe', async () => {
    const profile = await source('src/frontend/app/profile/ProfileRoute.tsx');

    expect(profile).toContain('frontendBackend.profile()');
    expect(profile).toContain('min-h-11 w-full');
    expect(profile).toContain('htmlFor="profile-correction-name"');
    expect(profile).toContain('htmlFor="profile-correction-reason"');
    expect(profile).toContain('formatProfileTimestamp(profile.updatedAt)');
    expect(profile).toContain('aria-describedby="profile-password-requirements"');
    expect(profile).toContain('Remove picture');
  });
});
