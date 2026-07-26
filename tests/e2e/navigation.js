export async function navigateToView(page, view) {
  const mobile = page.locator(`[data-shared-mobile-view="${view}"]`);
  const mobileViewport = (page.viewportSize()?.width ?? 1024) <= 820;
  if (mobileViewport && ['overview', 'request', 'lending', 'release'].includes(view)) {
    await mobile.waitFor({ state: 'visible' });
    await mobile.click();
    return;
  }
  const more = page.locator('[data-shared-mobile-more]');
  if (mobileViewport) {
    await more.waitFor({ state: 'visible' });
    await more.click();
    await page.locator(`[data-shared-more-view="${view}"]`).click();
    return;
  }
  await page.locator(`#primaryNav [data-view="${view}"]`).click();
}

export async function navigateToAdminView(page, view) {
  const more = page.locator('[data-shared-mobile-more]');
  const mobileViewport = (page.viewportSize()?.width ?? 1024) <= 820;
  if (mobileViewport) {
    await more.waitFor({ state: 'visible' });
    await more.click();
    await page.locator(`[data-shared-more-admin="${view}"]`).click();
    return;
  }
  await page.locator(`[data-admin-view="${view}"]`).click();
}
