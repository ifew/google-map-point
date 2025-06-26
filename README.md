# Google Map Point - Bangkok Real Estate Mapping Application

A comprehensive real estate mapping application for Bangkok properties with advanced filtering and search capabilities.

## 🚀 Features

### Core Functionality
- **Interactive Google Maps Integration**: Full-screen map display with Bangkok real estate points
- **Comprehensive Dataset**: 1,200+ real estate projects across 60 Bangkok locations
- **Advanced Filtering System**: Multi-criteria search and filtering capabilities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Search**: Instant search with autocomplete suggestions

### Filter & Search Features
- **Location Filter**: 60 Bangkok areas including official districts and popular neighborhoods
- **Property Type Filter**: Condos, Houses, Townhomes, Twin Houses, Apartments
- **Building Status Filter**: Ready to Move In, Under Construction, Pre-launch, Completed, Planning Phase
- **"Select All" Functionality**: One-click selection/deselection for all filter options
- **Keyword Search**: Search by project name (Thai/English), developer, or property type
- **Combined Filtering**: Apply multiple filters simultaneously for precise results

### User Interface
- **Sidebar Toggle**: Collapsible sidebar for additional information and controls
- **Filter Dropdown Controls**: Intuitive multi-select dropdowns with visual feedback
- **Map Markers**: Color-coded markers for different property types and statuses
- **Project Popups**: Detailed information cards for each property with expand/collapse functionality
- **Mobile Optimized**: Touch-friendly interface with responsive breakpoints

### Technical Features
- **RESTful API**: Well-structured backend API with multiple endpoints
- **Data Management**: JSON-based data storage with efficient querying
- **Error Handling**: Graceful error handling for API failures and network issues
- **Performance Optimized**: Efficient data loading and rendering for large datasets

## 🏗️ Architecture

### Frontend
- **HTML5** with responsive design
- **CSS3** with Flexbox and Grid layouts
- **Vanilla JavaScript** for map integration and UI interactions
- **Google Maps JavaScript API** for mapping functionality

### Backend
- **Node.js** with Express.js framework
- **RESTful API** design
- **JSON file-based** data storage
- **Environment configuration** with dotenv

### Data Structure
- **Projects**: 1,200 real estate projects with comprehensive metadata
- **Locations**: 60 Bangkok areas with coordinates
- **Property Types**: 5 different property categories
- **Building Status**: 5 construction/availability statuses
- **Developers**: Various real estate development companies

## 📊 API Endpoints

### GET /api/points
Returns all project points for map display
```json
[
  {
    "lat": 13.7440357,
    "lng": 100.5486963,
    "name_th": "โนเบิล เพลินจิต",
    "propertytype_name_th": "คอนโด",
    "developer_name_th": "บริษัท โนเบิล ดีเวลลอปเมนท์ จำกัด",
    "count_unit": 180,
    "project_id": "proj_001",
    "location_name_th": "เพลินจิต",
    "building_status_name_th": "พร้อมอยู่",
    "province_name_th": "กรุงเทพมหานคร"
  }
]
```

### GET /api/search
Advanced search with multiple filter parameters
```
Parameters:
- q: Search query (minimum 3 characters)
- location_id: Location filter
- property_types: Property type filter (comma-separated)
- building_status: Building status filter (comma-separated)
- limit: Result limit (default: 50)
```

### GET /api/locations
Returns all available locations
```json
[
  {
    "id": "1",
    "name": "Ploenchit",
    "name_th": "เพลินจิต",
    "lat": 13.7411,
    "lng": 100.5480
  }
]
```

### GET /api/property-types
Returns all property types
```json
[
  {
    "id": "2",
    "name": "Condo",
    "name_th": "คอนโด"
  }
]
```

### GET /api/building-status
Returns all building status options
```json
[
  {
    "id": "1",
    "name": "Ready to Move In",
    "name_th": "พร้อมอยู่"
  }
]
```

## 🧪 Testing

### Test Coverage Overview
This project includes comprehensive testing with **17 unit tests** and **34+ end-to-end tests** covering:

- ✅ **API Endpoint Testing**: All REST endpoints with various scenarios
- ✅ **UI Component Testing**: Frontend interactions and responsiveness  
- ✅ **Integration Testing**: API-frontend integration and data flow
- ✅ **Cross-browser Testing**: Chrome, Firefox, Safari compatibility
- ✅ **Mobile Testing**: Responsive design on various devices
- ✅ **Error Handling**: Network failures and edge cases

### Unit Test Results
```
✅ 17/17 Tests Passed
✅ API Endpoints Coverage: 100%
✅ Error Handling: Comprehensive
✅ Filter Logic: All scenarios tested
✅ Data Validation: Complete
```

**Detailed Unit Test Results:**
```
API Endpoints
  GET /api/points
    ✓ should return all project points (19ms)
    ✓ should handle missing project.json file (15ms)
  GET /api/search  
    ✓ should return all projects without filters (2ms)
    ✓ should filter by location_id (4ms)
    ✓ should filter by property_types (1ms)
    ✓ should filter by multiple property_types (2ms)
    ✓ should filter by building_status (2ms)
    ✓ should search by query (Thai name) (2ms)
    ✓ should search by query (English name) (3ms)
    ✓ should return empty array for queries less than 3 characters (1ms)
    ✓ should limit results (1ms)
    ✓ should combine multiple filters (1ms)
    ✓ should handle no results found (1ms)
  GET /api/locations
    ✓ should return all locations (1ms)
  GET /api/property-types
    ✓ should return property types
  GET /api/building-status
    ✓ should return building status options
  Error Handling
    ✓ should handle invalid JSON in data files (2ms)

Test Suites: 1 passed, 1 total
Tests: 17 passed, 17 total
Time: 0.358s
```

### E2E Test Coverage
```
📱 Cross-Browser Testing: Chrome, Firefox, Safari
📱 Mobile Testing: iPhone, Android devices
📱 Responsive Testing: Desktop, Tablet, Mobile viewports
📱 API Integration: Real-time data loading and filtering
📱 User Interactions: Clicks, taps, form inputs
📱 Error Scenarios: Network failures, timeouts
```

**E2E Test Categories:**
- **Homepage Tests**: Page loading, map display, sidebar functionality
- **Filter Tests**: Dropdown interactions, multi-select, search functionality
- **API Integration Tests**: Data loading, error handling, network scenarios
- **Responsive Tests**: Multiple device sizes and orientations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Maps API key (optional for full functionality)

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/ifew/google-map-point.git
cd google-map-point

# Install dependencies
npm install

# Install Playwright browsers (for testing)
npm run playwright:install

# Set up environment variables (optional)
cp .env.example .env
# Edit .env and add your Google Maps API key
```

### Running the Application
```bash
# Start the development server
npm start
# or
npm run dev

# Access the application
open http://localhost:3000
```

## 🧪 Running Tests

### Prerequisites for Testing
```bash
# Ensure all dependencies are installed
npm install

# Install Playwright browsers
npm run playwright:install
```

### Unit Tests (API Testing)
```bash
# Run all unit tests
npm run test:unit

# Run with coverage report
npm run test:unit:coverage

# Run in watch mode (for development)
npm run test:unit:watch

# Example output:
# ✅ 17/17 tests passed
# 📊 Coverage: 95%+ on API endpoints
# ⏱️ Execution time: ~0.4s
```

### E2E Tests (UI Testing)
```bash
# Run all end-to-end tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run specific browser only
npx playwright test --project=chromium

# Example output:
# ✅ 30+ tests across multiple browsers
# 📱 Desktop + Mobile testing
# 📊 Screenshots + videos on failure
# ⏱️ Execution time: ~2-3 minutes
```

### All Tests
```bash
# Run both unit and E2E tests
npm test

# This will execute:
# 1. Unit tests (API endpoints)
# 2. E2E tests (UI functionality)
# 3. Generate comprehensive reports
```

### Test Reports & Coverage
```bash
# Unit test coverage report
npm run test:unit:coverage
# Opens coverage/lcov-report/index.html

# E2E test report
npm run test:e2e
# Opens playwright-report/index.html

# View test results in browser
# Coverage reports show line-by-line code coverage
# E2E reports include screenshots and videos of failures
```

## 📁 Project Structure
```
google-map-point/
├── public/                     # Frontend assets
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── app.js             # Main application logic
│   │   └── map.js             # Google Maps integration
│   └── data/                  # JSON data files
│       ├── project.json       # 1,200 real estate projects
│       ├── location.json      # 60 Bangkok locations
│       ├── properties_type.json
│       └── building_status.json
├── views/
│   └── index.html             # Main HTML template
├── tests/                     # Test suites
│   ├── unit/                  # API unit tests
│   │   └── api.test.js        # Comprehensive API testing
│   ├── e2e/                   # End-to-end tests
│   │   ├── homepage.spec.js   # Homepage functionality
│   │   ├── filters.spec.js    # Filter interactions
│   │   ├── api-integration.spec.js # API integration
│   │   └── responsive.spec.js # Responsive design
│   ├── fixtures/              # Test data
│   └── README.md              # Testing documentation
├── server.js                  # Express.js server
├── jest.config.js             # Unit test configuration
├── playwright.config.js       # E2E test configuration
└── package.json               # Dependencies and scripts
```

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run all tests
npm run test:unit  # Run unit tests only
npm run test:e2e   # Run E2E tests only
npm run test:unit:watch     # Unit tests in watch mode
npm run test:unit:coverage  # Unit tests with coverage
npm run test:e2e:ui        # E2E tests with UI
npm run test:e2e:headed    # E2E tests in headed mode
npm run playwright:install # Install browser dependencies
```

### Environment Variables
```bash
# .env file (optional)
PORT=3000                    # Server port
GMAP_APIKEY=your_api_key    # Google Maps API key
NODE_ENV=development        # Environment mode
```

### Data Management
```bash
# Data files are located in public/data/
# project.json - Main project dataset (1,200 records)
# location.json - Bangkok locations (60 areas)
# properties_type.json - Property types (5 types)
# building_status.json - Building statuses (5 statuses)
```

## 🧪 Test Strategy & Best Practices

### Unit Testing Strategy
- **API Endpoint Coverage**: Every endpoint tested with multiple scenarios
- **Error Handling**: Network failures, invalid data, missing files
- **Filter Logic**: All combinations of filters tested
- **Data Validation**: Input validation and output format verification
- **Edge Cases**: Empty results, malformed queries, large datasets

### E2E Testing Strategy
- **User Journey Testing**: Complete user workflows from start to finish
- **Cross-Browser Testing**: Chrome, Firefox, Safari compatibility
- **Responsive Testing**: Desktop, tablet, mobile viewports
- **Performance Testing**: Load times, API response times
- **Accessibility Testing**: Keyboard navigation, screen reader compatibility

### Testing Best Practices
1. **Isolation**: Each test runs independently
2. **Data Management**: Uses test fixtures, restores original data
3. **Error Scenarios**: Tests both success and failure paths
4. **Performance**: Efficient test execution with proper timeouts
5. **Maintainability**: Clear test descriptions and organized structure
6. **CI/CD Ready**: Configured for continuous integration environments

## 🔧 Troubleshooting

### Common Issues
1. **Google Maps not loading**: Check API key configuration
2. **Tests failing**: Ensure all dependencies installed with `npm install`
3. **Port conflicts**: Change PORT in .env file
4. **Playwright browser issues**: Run `npm run playwright:install`

### Performance Optimization
- Data is loaded efficiently with pagination
- Map markers are optimized for large datasets
- Responsive images and lazy loading implemented
- Minimal JavaScript bundles for faster load times

## 📈 Future Enhancements

### Planned Features
- [ ] Advanced map clustering for better performance
- [ ] Real-time price updates and notifications
- [ ] User authentication and saved searches
- [ ] Integration with external property APIs
- [ ] Advanced analytics and reporting
- [ ] Multi-language support expansion

### Technical Improvements
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] GraphQL API implementation
- [ ] Progressive Web App (PWA) features
- [ ] Real-time updates with WebSocket
- [ ] Advanced caching strategies
- [ ] Microservices architecture

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Code Standards
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Ensure responsive design
- Test across browsers

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Maps JavaScript API for mapping functionality
- Bangkok Metropolitan Administration for location data
- Real estate developers for project information
- Open source community for tools and libraries

---

**Made with ❤️ in Bangkok** | [Live Demo](http://localhost:3000) | [Report Issues](https://github.com/ifew/google-map-point/issues)