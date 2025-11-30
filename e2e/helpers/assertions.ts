import { expect, Page, Locator } from '@playwright/test';

export async function assertSelectionState(
  page: Page,
  expectedIds: number[]
): Promise<void> {
  if (expectedIds.length === 0) {
    await expect(page.locator('[data-testid="selection-bounding-box"]')).toHaveCount(0);
  } else {
    const selectionBox = page.locator('[data-testid="selection-bounding-box"]');
    await expect(selectionBox).toHaveCount(1);
    const idsAttr = await selectionBox.getAttribute('data-selection-ids');
    const actualIds = idsAttr ? idsAttr.split(',').map(Number) : [];
    expect(actualIds).toEqual(expectedIds);
  }
}

export async function assertFlipState(
  page: Page,
  expectedX: boolean,
  expectedY: boolean
): Promise<void> {
  const selectionBox = page.locator('[data-testid="selection-bounding-box"]');
  const flippedX = await selectionBox.getAttribute('data-flipped-x');
  const flippedY = await selectionBox.getAttribute('data-flipped-y');

  expect(flippedX === 'true', `Expected flip.x to be ${expectedX} but got ${flippedX}`).toBe(expectedX);
  expect(flippedY === 'true', `Expected flip.y to be ${expectedY} but got ${flippedY}`).toBe(expectedY);
}

export async function assertBoundingBox(
  selectionBox: Locator,
  expected: { x: number; y: number; width: number; height: number },
  tolerance: number = 1
): Promise<void> {
  const x = parseFloat(await selectionBox.getAttribute('x') || '0');
  const y = parseFloat(await selectionBox.getAttribute('y') || '0');
  const width = parseFloat(await selectionBox.getAttribute('width') || '0');
  const height = parseFloat(await selectionBox.getAttribute('height') || '0');

  expect(x, `Bounding box X: expected ${expected.x}, got ${x}`).toBeCloseTo(expected.x, tolerance);
  expect(y, `Bounding box Y: expected ${expected.y}, got ${y}`).toBeCloseTo(expected.y, tolerance);
  expect(width, `Bounding box width: expected ${expected.width}, got ${width}`).toBeCloseTo(expected.width, tolerance);
  expect(height, `Bounding box height: expected ${expected.height}, got ${height}`).toBeCloseTo(expected.height, tolerance);
}

export async function assertSelectionBoxVisible(page: Page): Promise<void> {
  const selectionBox = page.locator('[data-testid="selection-bounding-box"]');
  await expect(selectionBox).toBeVisible();
}

export async function assertNoSelection(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="selection-bounding-box"]')).toHaveCount(0);
}

export async function assertFixedAnchorPosition(
  page: Page,
  expected: { x: number; y: number },
  tolerance: number = 1
): Promise<void> {
  const fixedAnchor = page.locator('[data-is-fixed-anchor="true"]');
  const box = await fixedAnchor.boundingBox();
  if (!box) throw new Error('Fixed anchor not found');

  const actualX = box.x + box.width / 2;
  const actualY = box.y + box.height / 2;

  expect(actualX, `Fixed anchor X: expected ${expected.x}, got ${actualX}`).toBeCloseTo(expected.x, tolerance);
  expect(actualY, `Fixed anchor Y: expected ${expected.y}, got ${actualY}`).toBeCloseTo(expected.y, tolerance);
}
