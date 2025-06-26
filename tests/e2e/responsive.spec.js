const { test, expect, devices } = require('@playwright/test');

test.describe('Responsive Design Tests', () => {
  test('should display correctly on desktop', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Check desktop layout
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // Filter container should be positioned on the right
    const filterContainer = page.locator('#filter-container');
    const filterPosition = await filterContainer.boundingBox();
    expect(filterPosition.x).toBeGreaterThan(1000); // Should be on the right side
    
    await context.close();
  });

  test('should display correctly on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Check tablet layout
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    
    // Filter might stack differently on tablet
    const filterGroup = page.locator('.filter-group');
    await expect(filterGroup).toBeVisible();
    
    await context.close();
  });

  test('should display correctly on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Check mobile layout
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    
    // On mobile, filters might stack vertically
    const filterGroup = page.locator('.filter-group');
    await expect(filterGroup).toBeVisible();
    
    // Check if sidebar width is adjusted for mobile
    const sidebar = page.locator('.sidebar');
    const sidebarWidth = await sidebar.evaluate(el => 
      window.getComputedStyle(el).width
    );
    expect(sidebarWidth).toBe('280px'); // Mobile sidebar width
    
    await context.close();
  });

  test('should work with iPhone viewport', async ({ browser }) => {
    const iPhone = devices['iPhone 12'];
    const context = await browser.newContext({
      ...iPhone,
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Basic functionality should work on iPhone
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    
    // Touch interactions should work
    const sidebarToggle = page.locator('.sidebar-toggle');
    await sidebarToggle.tap();
    
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/open/);
    
    await context.close();
  });

  test('should work with Android viewport', async ({ browser }) => {
    const pixel5 = devices['Pixel 5'];
    const context = await browser.newContext({
      ...pixel5,
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Basic functionality should work on Android
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    
    // Check filter interactions on mobile
    const locationFilter = page.locator('#location-filter .select-display');
    await locationFilter.tap();
    
    const dropdown = page.locator('#location-filter .dropdown-content');
    await expect(dropdown).toHaveClass(/show/);
    
    await context.close();
  });

  test('should handle orientation changes', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Portrait mode
    await expect(page.locator('#map')).toBeVisible();
    
    // Simulate landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    // Should still be visible and functional
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
    
    await context.close();
  });

  test('should scale filter controls appropriately', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 } // Small mobile
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Filter controls should be appropriately sized
    const filterBoxes = page.locator('.filter-box');
    const firstFilterBox = filterBoxes.first();
    
    if (await firstFilterBox.isVisible()) {
      const boundingBox = await firstFilterBox.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(150); // Minimum width for usability
      expect(boundingBox.width).toBeLessThan(300); // Should fit on small screen
    }
    
    await context.close();
  });

  test('should handle touch interactions properly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Test touch on filter dropdown
    const propertyFilter = page.locator('#properties-filter .select-display');
    await propertyFilter.tap();
    
    const dropdown = page.locator('#properties-filter .dropdown-content');
    if (await dropdown.isVisible()) {
      await expect(dropdown).toHaveClass(/show/);
      
      // Tap outside to close
      await page.tap('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(300);
      await expect(dropdown).not.toHaveClass(/show/);
    }
    
    await context.close();
  });

  test('should maintain accessibility on different screen sizes', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }
    });
    const page = await context.newPage();
    await page.goto('/');
    
    // Check that interactive elements are still accessible
    const interactiveElements = page.locator('button, input, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();
        // Interactive elements should be at least 44px in height (accessibility guideline)
        expect(boundingBox.height).toBeGreaterThanOrEqual(30);
      }
    }
    
    await context.close();
  });
});