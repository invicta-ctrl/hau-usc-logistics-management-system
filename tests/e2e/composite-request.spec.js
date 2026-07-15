import { test, expect } from '@playwright/test';

test('submits selected composite sections as one visible parent hierarchy', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.use.viewport.width < 390,
    'Run the composite form at practical mobile and desktop widths.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="request"]').click();

  const panel = page.locator('#compositeRequestPanel');
  await expect(panel).toBeVisible();
  await panel.locator('#compositeEvent').selectOption({ index: 1 });
  await panel.locator('[data-composite-toggle][value="FOOD"]').check();
  await panel.locator('[name="foodLine"]').fill('Packed meals');
  await expect(panel.locator('[name="foodServiceClass"]')).toBeVisible();
  await panel.locator('[name="foodExpectedHeadcount"]').fill('25');
  await panel.locator('[name="foodRequiredServings"]').fill('30');
  await panel.locator('[name="foodDietarySummary"]').selectOption('ATTENTION_REQUIRED');
  await panel.locator('[name="foodDietaryAttentionServings"]').fill('3');
  await panel.locator('[name="foodSourcingMode"]').selectOption('APPROVED_EXTERNAL_SOURCE');
  await panel.locator('[name="foodSourceReference"]').fill('SYN-SOURCE-UI');
  await expect(
    panel.locator('[name="dietaryNarrative"], [name="medicalDetails"], [name="supplierTin"]'),
  ).toHaveCount(0);
  await panel.locator('[data-composite-toggle][value="MATERIALS"]').check();
  await panel.locator('[name="materialsLine"]').fill('Directional signs');
  await expect(panel.locator('[name="materialsMaterialCategory"]')).toBeVisible();
  await panel.locator('[name="materialsMaterialCategory"]').selectOption('PRINTING_SIGNAGE');
  await panel.locator('[name="materialsRequiredBy"]').fill('2026-08-08');
  await panel
    .locator('[name="materialsSpecification"]')
    .fill('A3 directional signs with approved event wording');
  await panel.locator('[name="materialsUsagePurpose"]').fill('Synthetic event wayfinding');
  await panel.getByRole('button', { name: 'Review composite request' }).click();

  const result = panel.locator('#compositeRequestResult');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/LREQ-/);
  await expect(result).toContainText('FOOD');
  await expect(result).toContainText('MATERIALS');
  const storedFood = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return state.compositeComponents.find((child) => child.componentType === 'FOOD')?.payload?.food;
  });
  expect(storedFood).toMatchObject({
    version: 1,
    expectedHeadcount: 25,
    requiredServings: 30,
    dietarySummary: 'ATTENTION_REQUIRED',
    dietaryAttentionServings: 3,
    sourcingMode: 'APPROVED_EXTERNAL_SOURCE',
    sourceReference: 'SYN-SOURCE-UI',
  });
  const storedMaterials = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return state.compositeComponents.find((child) => child.componentType === 'MATERIALS')?.payload
      ?.materials;
  });
  expect(storedMaterials).toMatchObject({
    version: 1,
    materialCategory: 'PRINTING_SIGNAGE',
    specification: 'A3 directional signs with approved event wording',
    usagePurpose: 'Synthetic event wayfinding',
    fulfillmentPath: 'PENDING_DECISION',
    substitutionPolicy: 'EXACT_ONLY',
  });

  const foodQueue = page.locator('#foodCommitteeQueue');
  await expect(foodQueue).toBeVisible();
  await expect(foodQueue).toContainText('30 servings');
  await foodQueue.getByRole('button', { name: 'Manage' }).click();
  const workflowForm = page.locator('#foodWorkflowForm');
  await expect(workflowForm).toBeVisible();
  await workflowForm.locator('[name="dietarySummary"]').selectOption('NONE_REPORTED');
  await workflowForm.locator('[name="dietaryAttentionServings"]').fill('0');
  await workflowForm.getByRole('button', { name: 'Save Food Workflow' }).click();
  await expect(workflowForm).toBeHidden();
  const updatedFood = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    const child = state.compositeComponents.find((entry) => entry.componentType === 'FOOD');
    return { revision: child.revision, food: child.payload?.food };
  });
  expect(updatedFood).toMatchObject({
    revision: 2,
    food: { dietarySummary: 'NONE_REPORTED', dietaryAttentionServings: 0 },
  });

  const materialsQueue = page.locator('#materialsCommitteeQueue');
  await expect(materialsQueue).toBeVisible();
  await expect(materialsQueue).toContainText('PENDING_DECISION');
  await materialsQueue.getByRole('button', { name: 'Manage' }).click();
  const materialsWorkflow = page.locator('#materialsWorkflowForm');
  await expect(materialsWorkflow).toBeVisible();
  await materialsWorkflow.locator('[name="fulfillmentPath"]').selectOption('STOCK_ISSUE');
  await materialsWorkflow.getByRole('button', { name: 'Save Materials Workflow' }).click();
  await expect(materialsWorkflow).toBeHidden();
  const updatedMaterials = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    const child = state.compositeComponents.find((entry) => entry.componentType === 'MATERIALS');
    return { revision: child.revision, materials: child.payload?.materials };
  });
  expect(updatedMaterials).toMatchObject({
    revision: 2,
    materials: { fulfillmentPath: 'STOCK_ISSUE', substitutionPolicy: 'EXACT_ONLY' },
  });
});
