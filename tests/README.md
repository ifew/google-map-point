# Testing Documentation

This project includes comprehensive testing for both backend API endpoints and frontend UI functionality.

## Test Structure

```
tests/
├── unit/           # Unit tests for API endpoints
├── e2e/           # End-to-end UI tests with Playwright
├── fixtures/      # Test data fixtures
└── setup.js       # Jest setup configuration
```

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run playwright:install
   ```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Unit Tests with Coverage
```bash
npm run test:unit:coverage
```

### Unit Tests in Watch Mode
```bash
npm run test:unit:watch
```

### E2E Tests Only
```bash
npm run test:e2e
```

### E2E Tests with UI
```bash
npm run test:e2e:ui
```

### E2E Tests in Headed Mode
```bash
npm run test:e2e:headed
```

## Test Coverage

### Unit Tests (API)

The unit tests cover:
- ✅ **GET /api/points** - Loading all project points
- ✅ **GET /api/search** - Search functionality with filters
  - Location filtering
  - Property type filtering (single and multiple)
  - Building status filtering (single and multiple)  
  - Keyword search (Thai and English)
  - Result limiting
  - Combined filters
- ✅ **GET /api/locations** - Location data loading
- ✅ **GET /api/property-types** - Property types data
- ✅ **GET /api/building-status** - Building status data
- ✅ **Error Handling** - Invalid JSON, missing files, etc.

### E2E Tests (UI)

The E2E tests cover:

#### Homepage (`homepage.spec.js`)
- ✅ Page loading and title
- ✅ Sidebar toggle functionality
- ✅ Map container display
- ✅ Filter controls presence
- ✅ Google Maps script loading

#### Filter Functionality (`filters.spec.js`)
- ✅ Filter dropdown visibility
- ✅ Dropdown open/close behavior
- ✅ Location options loading
- ✅ "Select All" functionality
- ✅ Keyword search functionality
- ✅ Search results display
- ✅ Click outside to close
- ✅ Empty search handling
- ✅ Filter state maintenance

#### API Integration (`api-integration.spec.js`)
- ✅ Points data loading on page load
- ✅ API response handling
- ✅ Location data loading
- ✅ Property types loading
- ✅ Building status loading
- ✅ Search API calls on keyword input
- ✅ API error handling
- ✅ Network timeout handling
- ✅ UI updates from API data
- ✅ Data consistency across operations

#### Responsive Design (`responsive.spec.js`)
- ✅ Desktop layout (1920x1080)
- ✅ Tablet layout (768x1024)
- ✅ Mobile layout (375x667)
- ✅ iPhone viewport compatibility
- ✅ Android viewport compatibility
- ✅ Orientation changes
- ✅ Filter control scaling
- ✅ Touch interactions
- ✅ Accessibility on different screen sizes

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Test pattern: `**/tests/unit/**/*.test.js`
- Coverage collection from `server.js` and `public/js/**/*.js`
- Coverage reports: text, lcov, html
- Setup file: `tests/setup.js`
- Test timeout: 10 seconds

### Playwright Configuration (`playwright.config.js`)
- Test directory: `tests/e2e`
- Parallel execution enabled
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit
- Mobile testing: Mobile Chrome, Mobile Safari
- Screenshots on failure
- Video recording on failure
- Trace collection on retry

## Test Data

Test fixtures are located in `tests/fixtures/`:
- `sample-projects.json` - Sample project data for testing
- `sample-locations.json` - Sample location data for testing

## Continuous Integration

The tests are configured to work with CI environments:
- Jest runs in CI mode automatically
- Playwright has CI-specific settings for retries and workers
- Coverage reports are generated in CI-friendly formats

## Writing New Tests

### Adding Unit Tests
1. Create a new `.test.js` file in `tests/unit/`
2. Import required modules (`supertest`, `express`, etc.)
3. Follow the existing pattern for API endpoint testing
4. Use descriptive test names and group related tests with `describe()`

### Adding E2E Tests
1. Create a new `.spec.js` file in `tests/e2e/`
2. Import Playwright test functions
3. Use page object patterns for complex interactions
4. Include proper waits and assertions
5. Test both happy path and error scenarios

## Debugging Tests

### Unit Tests
- Use `--verbose` flag for detailed output
- Use `--watch` mode for development
- Add `console.log` statements for debugging

### E2E Tests
- Use `--headed` flag to see browser actions
- Use `--ui` flag for interactive debugging
- Screenshots and videos are captured on failures
- Use `page.pause()` for step-by-step debugging

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Restore original state after tests
3. **Assertions**: Use meaningful assertions with clear error messages
4. **Waits**: Use proper waits instead of fixed timeouts
5. **Data**: Use test fixtures instead of production data
6. **Coverage**: Aim for high test coverage but focus on critical paths
7. **Performance**: Keep tests fast and efficient
8. **Maintenance**: Update tests when functionality changes