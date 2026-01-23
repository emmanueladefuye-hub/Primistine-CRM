import { test, expect } from '@playwright/test';

test.describe('Critical Path: Sales Pipeline', () => {

    test('User can create a new lead and see it on the dashboard', async ({ page }) => {
        // 1. Login Logic
        await page.goto('/login');

        // Wait for either the dashboard to load (if auto-logged in) or the login form
        const loginButton = page.getByRole('button', { name: /sign in/i });

        if (await loginButton.isVisible()) {
            // TODO: Update these credentials with a valid Test User account
            await page.getByPlaceholder('Email').fill('emmanuelfirebrand@gmail.com');
            await page.getByPlaceholder('Password').fill('firebrand'); // Adjust credentials as needed
            await page.getByRole('button', { name: /sign in/i }).click();
            // Wait for the dashboard to load (authentication success)
            await page.waitForTimeout(5000);
        }

        // 2. Navigate to Sales
        await page.goto('/sales');
        await expect(page.getByText('Lead Pipeline')).toBeVisible();

        // 3. Open Add Lead Modal
        await page.getByRole('button', { name: /add lead/i }).click();
        await expect(page.getByText('Add New Lead')).toBeVisible();

        // 4. Fill Form (Validation Check)
        // Try submitting empty to check validation
        await page.getByRole('button', { name: /create lead/i }).click();

        // Fill valid data
        const uniqueName = `Test Lead ${Date.now()}`;
        await page.getByText('First Name').fill(uniqueName);
        await page.getByText('Last Name').fill('Automation');
        await page.getByText('Email Address').fill('auto@test.com');
        await page.getByText('Phone Number').fill('08012345678');

        // Select Service Interest
        await page.getByText('Solar & Inverter').click();

        // Select Budget
        await page.locator('select').first().selectOption('<1M');
        await page.locator('select').last().selectOption('immediate');

        await page.getByPlaceholder('Any specific details').fill('Automated test lead.');

        // 5. Submit
        await page.getByRole('button', { name: /create lead/i }).click();

        // 6. Verify Appearance on Board
        await expect(page.getByText(uniqueName)).toBeVisible();
        // Use regex to match the number, handling potential symbol rendering differences
        await expect(page.getByText(/500,000/)).toBeVisible();
    });

});
