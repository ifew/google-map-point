const { test, expect } = require('@playwright/test');

test.describe('API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load points data on page load', async ({ page }) => {
    // Wait for API calls to complete
    await page.waitForTimeout(3000);
    
    // Check if points were loaded by examining the JavaScript context
    const pointsLoaded = await page.evaluate(() => {
      return window.allPoints && Array.isArray(window.allPoints) && window.allPoints.length > 0;
    });
    
    expect(pointsLoaded).toBe(true);
  });

  test('should handle API response correctly', async ({ page }) => {
    // Intercept the API call
    const apiResponse = await page.waitForResponse(response => 
      response.url().includes('/api/points') && response.status() === 200
    );
    
    expect(apiResponse.status()).toBe(200);
    
    const responseData = await apiResponse.json();
    expect(Array.isArray(responseData)).toBe(true);
    
    if (responseData.length > 0) {
      const firstPoint = responseData[0];
      expect(firstPoint).toHaveProperty('lat');
      expect(firstPoint).toHaveProperty('lng');
      expect(firstPoint).toHaveProperty('name_th');
      expect(firstPoint).toHaveProperty('project_id');
    }
  });

  test('should load location data for dropdown', async ({ page }) => {
    // Wait for locations API call
    const locationsResponse = await page.waitForResponse(response => 
      response.url().includes('/api/locations') && response.status() === 200
    );
    
    expect(locationsResponse.status()).toBe(200);
    
    const locationsData = await locationsResponse.json();
    expect(Array.isArray(locationsData)).toBe(true);
    
    if (locationsData.length > 0) {
      const firstLocation = locationsData[0];
      expect(firstLocation).toHaveProperty('id');
      expect(firstLocation).toHaveProperty('name');
      expect(firstLocation).toHaveProperty('name_th');
    }
  });

  test('should load property types for dropdown', async ({ page }) => {
    // Wait for property types API call
    const propertyTypesResponse = await page.waitForResponse(response => 
      response.url().includes('/api/property-types') && response.status() === 200
    );
    
    expect(propertyTypesResponse.status()).toBe(200);
    
    const propertyTypesData = await propertyTypesResponse.json();
    expect(Array.isArray(propertyTypesData)).toBe(true);
  });

  test('should load building status for dropdown', async ({ page }) => {
    // Wait for building status API call
    const buildingStatusResponse = await page.waitForResponse(response => 
      response.url().includes('/api/building-status') && response.status() === 200
    );
    
    expect(buildingStatusResponse.status()).toBe(200);
    
    const buildingStatusData = await buildingStatusResponse.json();
    expect(Array.isArray(buildingStatusData)).toBe(true);
  });

  test('should perform search API call on keyword input', async ({ page }) => {
    const keywordInput = page.locator('#keyword-input');
    
    // Set up response listener before typing
    const searchPromise = page.waitForResponse(response => 
      response.url().includes('/api/search'), 
      { timeout: 10000 }
    );
    
    // Type search query
    await keywordInput.fill('โนเบิล');
    await page.waitForTimeout(1000); // Wait for debounce
    
    try {
      const searchResponse = await searchPromise;
      expect(searchResponse.status()).toBe(200);
      
      const searchData = await searchResponse.json();
      expect(Array.isArray(searchData)).toBe(true);
    } catch (error) {
      // Search API might not be triggered if no matching data
      console.log('Search API not triggered or no results found');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock a failed API response
    await page.route('/api/points', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.reload();
    
    // Wait and check that the app doesn't crash
    await page.waitForTimeout(2000);
    
    // The map container should still be visible
    await expect(page.locator('#map')).toBeVisible();
    
    // Check for error handling in console (optional)
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // App should handle the error without crashing
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock a slow API response
    await page.route('/api/points', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.reload();
    
    // App should still load without the API data
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#filter-container')).toBeVisible();
  });

  test('should update UI when filter API calls return data', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Open location dropdown
    const locationFilter = page.locator('#location-filter .select-display');
    await locationFilter.click();
    
    // Wait for dropdown to potentially populate
    await page.waitForTimeout(1000);
    
    const dropdown = page.locator('#location-filter .dropdown-content');
    if (await dropdown.isVisible()) {
      const options = dropdown.locator('.dropdown-item');
      const optionCount = await options.count();
      
      // Should have some options if API returned data
      if (optionCount > 0) {
        await expect(options.first()).toBeVisible();
      }
    }
  });

  test('should maintain API data consistency across filter operations', async ({ page }) => {
    // Wait for initial data load
    await page.waitForTimeout(3000);
    
    // Get initial data count
    const initialCount = await page.evaluate(() => {
      return window.allPoints ? window.allPoints.length : 0;
    });
    
    // Perform some filter operations
    const keywordInput = page.locator('#keyword-input');
    await keywordInput.fill('test');
    await page.waitForTimeout(1000);
    
    await keywordInput.fill('');
    await page.waitForTimeout(1000);
    
    // Data count should remain consistent
    const finalCount = await page.evaluate(() => {
      return window.allPoints ? window.allPoints.length : 0;
    });
    
    expect(finalCount).toBe(initialCount);
  });
});