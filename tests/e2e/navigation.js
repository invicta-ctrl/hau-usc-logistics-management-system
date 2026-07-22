export async function navigateToView(page, view) {
  const mobile = page.locator(`[data-shared-mobile-view="${view}"]`);
  if (await mobile.isVisible()) {
    await mobile.click();
    return;
  }
  const more = page.locator('[data-shared-mobile-more]');
  if (await more.isVisible()) {
    await more.click();
    await page.locator(`[data-shared-more-view="${view}"]`).click();
    return;
  }
  await page.locator(`#primaryNav [data-view="${view}"]`).click();
}

export async function navigateToAdminView(page, view) {
  const more = page.locator('[data-shared-mobile-more]');
  if (await more.isVisible()) {
    await more.click();
    await page.locator(`[data-shared-more-admin="${view}"]`).click();
    return;
  }
  await page.locator(`[data-admin-view="${view}"]`).click();
}
