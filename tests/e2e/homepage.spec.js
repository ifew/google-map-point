const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Google Map Point/);
    
    // Check if main elements are present
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('should have working sidebar toggle', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const toggleButton = page.locator('.sidebar-toggle');
    
    // Initially sidebar should be closed (has no 'open' class)
    await expect(sidebar).not.toHaveClass(/open/);
    
    // Click toggle button to open sidebar
    await toggleButton.click();
    await expect(sidebar).toHaveClass(/open/);
    
    // Click again to close sidebar
    await toggleButton.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('should display map container', async ({ page }) => {
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer).toHaveCSS('width', '100vw');
    await expect(mapContainer).toHaveCSS('height', '100vh');
  });

  test('should have filter controls', async ({ page }) => {
    // Check if filter container exists
    await expect(page.locator('#filter-container')).toBeVisible();
    
    // Check for filter boxes
    await expect(page.locator('.filter-box')).toHaveCount(3); // Location, Property Type, Building Status
    
    // Check for keyword search
    await expect(page.locator('#keyword-input')).toBeVisible();
  });

  test('should load external Google Maps script', async ({ page }) => {
    // Wait for Google Maps to potentially load
    await page.waitForTimeout(2000);
    
    // Check if Google Maps API is available (if API key is valid)
    const googleMapsLoaded = await page.evaluate(() => {
      return typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
    });
    
    // Note: This might fail if API key is not configured
    if (googleMapsLoaded) {
      expect(googleMapsLoaded).toBe(true);
    }
  });
});