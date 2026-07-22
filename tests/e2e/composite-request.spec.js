import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('submits selected composite sections as one visible parent hierarchy', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.use.viewport.width < 390,
    'Run the composite form at practical mobile and desktop widths.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'request');

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
  await panel.locator('[data-composite-toggle][value="VENUE_EQUIPMENT"]').check();
  await panel.locator('[name="venueEquipmentSearch"]').fill('projector');
  await panel
    .locator('[data-venue-equipment-results] [data-venue-equipment-reference="SYN-EQUIP-1"]')
    .click();
  await panel
    .locator('[name="venueEquipmentPurposeDetail"]')
    .fill('Synthetic audiovisual support for the approved event');
  await panel.getByRole('button', { name: 'Review composite request' }).click();

  const result = panel.locator('#compositeRequestResult');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/LREQ-/);
  await expect(result).toContainText('FOOD');
  await expect(result).toContainText('MATERIALS');
  await expect(result).toContainText('VENUE_EQUIPMENT');
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
  const storedVenueEquipment = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return state.compositeComponents.find((child) => child.componentType === 'VENUE_EQUIPMENT')
      ?.payload?.venueEquipment;
  });
  expect(storedVenueEquipment).toMatchObject({
    version: 1,
    ownerCommitteeId: 'COM_INVENTORY_PANTRY',
    confirmationStatus: 'PENDING_CONFIRMATION',
    returnRequired: true,
    returnStatus: 'PENDING_RETURN',
    referenceSnapshots: [
      {
        referenceId: 'SYN-EQUIP-1',
        routeId: 'SYN-ROUTE-EQUIPMENT',
        requestability: 'REQUESTABLE',
      },
    ],
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

  const venueEquipmentQueue = page.locator('#venueEquipmentQueue');
  await expect(venueEquipmentQueue).toBeVisible();
  await expect(venueEquipmentQueue).toContainText('PENDING_CONFIRMATION');
  await venueEquipmentQueue.getByRole('button', { name: 'Manage' }).click();
  const venueEquipmentWorkflow = page.locator('#venueEquipmentWorkflowForm');
  await expect(venueEquipmentWorkflow).toBeVisible();
  await venueEquipmentWorkflow.locator('[name="confirmationStatus"]').selectOption('CONFIRMED');
  await venueEquipmentWorkflow.locator('[name="confirmationReference"]').fill('SYN-CONFIRM-UI');
  await venueEquipmentWorkflow
    .getByRole('button', { name: 'Save Venue & Equipment Workflow' })
    .click();
  await expect(venueEquipmentWorkflow).toBeHidden();
  const updatedVenueEquipment = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    const child = state.compositeComponents.find(
      (entry) => entry.componentType === 'VENUE_EQUIPMENT',
    );
    return { revision: child.revision, venueEquipment: child.payload?.venueEquipment };
  });
  expect(updatedVenueEquipment).toMatchObject({
    revision: 2,
    venueEquipment: {
      confirmationStatus: 'CONFIRMED',
      confirmationReference: 'SYN-CONFIRM-UI',
      returnStatus: 'PENDING_RETURN',
    },
  });
});
