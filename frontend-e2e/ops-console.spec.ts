import { test, expect, type Page } from '@playwright/test';

async function signInAsAdmin(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('ChangeMe12345!');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('admin can sign in and see the operations console', async ({ page }) => {
  await signInAsAdmin(page);

  await expect(
    page.getByRole('heading', { name: 'Incident Tracker Dashboard' }),
  ).toBeVisible();
  await expect(page.getByText('Critical unresolved')).toBeVisible();
});

test('admin can open machine and user management', async ({ page }) => {
  await signInAsAdmin(page);

  await page.getByRole('link', { name: 'Machines' }).click();
  await expect(page.getByRole('heading', { name: 'Machines' })).toBeVisible();

  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
});

test('dashboard metrics refresh after resolving an incident and going back', async ({
  page,
}) => {
  await signInAsAdmin(page);

  await expect(page.getByTestId('metric-critical-unresolved')).toContainText(
    '1',
  );

  await page
    .getByRole('link', {
      name: 'Conveyor motor overheating in packaging zone',
    })
    .click();
  await page.getByRole('button', { name: 'Set RESOLVED' }).click();
  await expect(page.getByText('Status updated to RESOLVED.')).toBeVisible();

  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Incident Tracker Dashboard' }),
  ).toBeVisible();
  await expect(page.getByTestId('metric-critical-unresolved')).toContainText(
    '0',
  );
});
