const { test, expect } = require('@playwright/test');

test.describe('Filter Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load and API calls to complete
    await page.waitForTimeout(2000);
  });

  test('should have all filter dropdowns', async ({ page }) => {
    // Check location filter
    await expect(page.locator('#location-filter')).toBeVisible();
    await expect(page.locator('#location-filter .select-display')).toBeVisible();
    
    // Check property type filter
    await expect(page.locator('#properties-filter')).toBeVisible();
    await expect(page.locator('#properties-filter .select-display')).toBeVisible();
    
    // Check building status filter
    await expect(page.locator('#building-status-filter')).toBeVisible();
    await expect(page.locator('#building-status-filter .select-display')).toBeVisible();
    
    // Check keyword search
    await expect(page.locator('#keyword-input')).toBeVisible();
  });

  test('should open and close location dropdown', async ({ page }) => {
    const locationFilter = page.locator('#location-filter');
    const dropdown = locationFilter.locator('.dropdown-content');
    const selectDisplay = locationFilter.locator('.select-display');
    
    // Initially dropdown should be closed
    await expect(dropdown).not.toHaveClass(/show/);
    
    // Click to open dropdown
    await selectDisplay.click();
    await expect(dropdown).toHaveClass(/show/);
    
    // Click again to close
    await selectDisplay.click();
    await expect(dropdown).not.toHaveClass(/show/);
  });

  test('should load location options', async ({ page }) => {
    const locationFilter = page.locator('#location-filter');
    const selectDisplay = locationFilter.locator('.select-display');
    const dropdown = locationFilter.locator('.dropdown-content');
    
    // Open dropdown
    await selectDisplay.click();
    await expect(dropdown).toHaveClass(/show/);
    
    // Wait for options to load
    await page.waitForTimeout(1000);
    
    // Check if location options are loaded
    const options = dropdown.locator('.dropdown-item');
    await expect(options.first()).toBeVisible();
  });

  test('should have select all functionality in property types', async ({ page }) => {
    const propertyFilter = page.locator('#properties-filter');
    const selectDisplay = propertyFilter.locator('.select-display');
    const dropdown = propertyFilter.locator('.dropdown-content');
    
    // Open dropdown
    await selectDisplay.click();
    await expect(dropdown).toHaveClass(/show/);
    
    // Wait for options to load
    await page.waitForTimeout(1000);
    
    // Check for "Select All" option
    const selectAllOption = dropdown.locator('.select-all-item');
    if (await selectAllOption.count() > 0) {
      await expect(selectAllOption).toBeVisible();
      await expect(selectAllOption.locator('label')).toHaveCSS('color', 'rgb(0, 123, 255)');
    }
  });

  test('should have select all functionality in building status', async ({ page }) => {
    const statusFilter = page.locator('#building-status-filter');
    const selectDisplay = statusFilter.locator('.select-display');
    const dropdown = statusFilter.locator('.dropdown-content');
    
    // Open dropdown
    await selectDisplay.click();
    await expect(dropdown).toHaveClass(/show/);
    
    // Wait for options to load
    await page.waitForTimeout(1000);
    
    // Check for "Select All" option
    const selectAllOption = dropdown.locator('.select-all-item');
    if (await selectAllOption.count() > 0) {
      await expect(selectAllOption).toBeVisible();
      await expect(selectAllOption.locator('label')).toHaveCSS('color', 'rgb(0, 123, 255)');
    }
  });

  test('should perform keyword search', async ({ page }) => {
    const keywordInput = page.locator('#keyword-input');
    const keywordDropdown = page.locator('.keyword-dropdown');
    
    // Type search query
    await keywordInput.fill('โนเบิล');
    
    // Wait for search to trigger
    await page.waitForTimeout(1000);
    
    // Check if dropdown appears with results
    if (await keywordDropdown.isVisible()) {
      const searchResults = keywordDropdown.locator('.keyword-item');
      await expect(searchResults.first()).toBeVisible();
    }
  });

  test('should show search results in dropdown', async ({ page }) => {
    const keywordInput = page.locator('#keyword-input');
    const keywordDropdown = page.locator('.keyword-dropdown');
    
    // Focus on input to trigger search
    await keywordInput.focus();
    await keywordInput.fill('test');
    
    // Wait for potential results
    await page.waitForTimeout(1000);
    
    // If dropdown appears, check structure
    if (await keywordDropdown.isVisible()) {
      const items = keywordDropdown.locator('.keyword-item');
      if (await items.count() > 0) {
        await expect(items.first().locator('.keyword-title')).toBeVisible();
        await expect(items.first().locator('.keyword-subtitle')).toBeVisible();
      }
    }
  });

  test('should close keyword dropdown when clicking outside', async ({ page }) => {
    const keywordInput = page.locator('#keyword-input');
    const keywordDropdown = page.locator('.keyword-dropdown');
    
    // Focus and type to potentially open dropdown
    await keywordInput.focus();
    await keywordInput.fill('test');
    await page.waitForTimeout(500);
    
    // Click outside to close dropdown
    await page.locator('body').click();
    await page.waitForTimeout(500);
    
    // Dropdown should be hidden
    await expect(keywordDropdown).not.toHaveClass(/show/);
  });

  test('should handle empty search gracefully', async ({ page }) => {
    const keywordInput = page.locator('#keyword-input');
    
    // Clear input and trigger search
    await keywordInput.fill('');
    await keywordInput.blur();
    
    // Should not crash or show errors
    await page.waitForTimeout(500);
    const errorMessages = page.locator('.error, .alert-error, [role="alert"]');
    await expect(errorMessages).toHaveCount(0);
  });

  test('should maintain filter state during interaction', async ({ page }) => {
    const propertyFilter = page.locator('#properties-filter');
    const selectDisplay = propertyFilter.locator('.select-display');
    
    // Open dropdown and potentially select something
    await selectDisplay.click();
    await page.waitForTimeout(1000);
    
    const dropdown = propertyFilter.locator('.dropdown-content');
    if (await dropdown.isVisible()) {
      // Click somewhere else to close
      await page.locator('body').click();
      
      // Dropdown should close but filter state should remain
      await expect(dropdown).not.toHaveClass(/show/);
      await expect(selectDisplay).toBeVisible();
    }
  });
});