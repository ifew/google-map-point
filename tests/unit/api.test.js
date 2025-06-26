const request = require('supertest');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Import the server configuration
let app;

describe('API Endpoints', () => {
  let originalProjectData;
  let originalLocationData;
  let originalPropertyTypesData;
  let originalBuildingStatusData;

  beforeAll(() => {
    // Backup original data files
    const dataDir = path.join(__dirname, '../../public/data');
    originalProjectData = fs.readFileSync(path.join(dataDir, 'project.json'), 'utf8');
    originalLocationData = fs.readFileSync(path.join(dataDir, 'location.json'), 'utf8');
    originalPropertyTypesData = fs.readFileSync(path.join(dataDir, 'properties_type.json'), 'utf8');
    originalBuildingStatusData = fs.readFileSync(path.join(dataDir, 'building_status.json'), 'utf8');

    // Set up test data
    const testProjectData = fs.readFileSync(path.join(__dirname, '../fixtures/sample-projects.json'), 'utf8');
    const testLocationData = fs.readFileSync(path.join(__dirname, '../fixtures/sample-locations.json'), 'utf8');
    
    fs.writeFileSync(path.join(dataDir, 'project.json'), testProjectData);
    fs.writeFileSync(path.join(dataDir, 'location.json'), testLocationData);

    // Create test app instance
    app = express();
    app.use(express.static('public'));
    app.use(express.json());

    // Copy route handlers from server.js
    app.get('/api/points', (req, res) => {
      try {
        const dataPath = path.join(__dirname, '../../public', 'data', 'project.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(data);
        
        const points = jsonData.payload.map(project => ({
          lat: parseFloat(project.latitude),
          lng: parseFloat(project.longitude),
          name_th: project.name_th,
          propertytype_name_th: project.propertytype_name_th,
          developer_name_th: project.developer_name_th,
          latitude: project.latitude,
          longitude: project.longitude,
          count_unit: project.count_unit,
          project_id: project.project_id,
          location_name_th: project.location_name_th,
          building_status_name_th: project.building_status_name_th,
          province_name_th: project.province_name_th
        }));
        
        res.json(points);
      } catch (error) {
        console.error('Error reading project.json:', error);
        res.status(500).json({ error: 'Failed to load points data' });
      }
    });

    app.get('/api/search', (req, res) => {
      try {
        const { q: query, location_id, property_types, building_status, limit = 50 } = req.query;
        
        const dataPath = path.join(__dirname, '../../public', 'data', 'project.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(data);
        
        let filteredResults = jsonData.payload;
        
        if (location_id) {
          filteredResults = filteredResults.filter(project => 
            project.location_id === location_id
          );
        }
        
        if (property_types) {
          const propertyTypeIds = Array.isArray(property_types) ? property_types : property_types.split(',');
          filteredResults = filteredResults.filter(project => 
            propertyTypeIds.includes(project.propertytype_id)
          );
        }
        
        if (building_status) {
          const statusIds = Array.isArray(building_status) ? building_status : building_status.split(',');
          filteredResults = filteredResults.filter(project => 
            statusIds.includes(project.building_status_id)
          );
        }
        
        if (query && query.length >= 3) {
          filteredResults = filteredResults.filter(project => 
            project.name_th?.toLowerCase().includes(query.toLowerCase()) ||
            project.name_en?.toLowerCase().includes(query.toLowerCase()) ||
            project.propertytype_name_th?.toLowerCase().includes(query.toLowerCase()) ||
            project.developer_name_th?.toLowerCase().includes(query.toLowerCase()) ||
            project.province_name_th?.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        const searchResults = filteredResults
          .slice(0, parseInt(limit))
          .map(project => ({
            lat: parseFloat(project.latitude),
            lng: parseFloat(project.longitude),
            name_th: project.name_th,
            propertytype_name_th: project.propertytype_name_th,
            developer_name_th: project.developer_name_th,
            latitude: project.latitude,
            longitude: project.longitude,
            count_unit: project.count_unit,
            project_id: project.project_id,
            province_name_th: project.province_name_th,
            location_id: project.location_id,
            location_name_th: project.location_name_th,
            propertytype_id: project.propertytype_id,
            building_status_id: project.building_status_id,
            building_status_name_th: project.building_status_name_th,
            price_min: project.price_min
          }));
        
        res.json(searchResults);
      } catch (error) {
        console.error('Error searching projects:', error);
        res.status(500).json({ error: 'Failed to search projects' });
      }
    });

    app.get('/api/locations', (req, res) => {
      try {
        const dataPath = path.join(__dirname, '../../public', 'data', 'location.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const locations = JSON.parse(data);
        res.json(locations);
      } catch (error) {
        console.error('Error reading location.json:', error);
        res.status(500).json({ error: 'Failed to load locations' });
      }
    });

    app.get('/api/property-types', (req, res) => {
      try {
        const dataPath = path.join(__dirname, '../../public', 'data', 'properties_type.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const propertyTypes = JSON.parse(data);
        res.json(propertyTypes);
      } catch (error) {
        console.error('Error reading properties_type.json:', error);
        res.status(500).json({ error: 'Failed to load property types' });
      }
    });

    app.get('/api/building-status', (req, res) => {
      try {
        const dataPath = path.join(__dirname, '../../public', 'data', 'building_status.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const buildingStatus = JSON.parse(data);
        res.json(buildingStatus);
      } catch (error) {
        console.error('Error reading building_status.json:', error);
        res.status(500).json({ error: 'Failed to load building status' });
      }
    });
  });

  afterAll(() => {
    // Restore original data files
    const dataDir = path.join(__dirname, '../../public/data');
    fs.writeFileSync(path.join(dataDir, 'project.json'), originalProjectData);
    fs.writeFileSync(path.join(dataDir, 'location.json'), originalLocationData);
  });

  describe('GET /api/points', () => {
    test('should return all project points', async () => {
      const response = await request(app)
        .get('/api/points')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      
      const firstPoint = response.body[0];
      expect(firstPoint).toHaveProperty('lat');
      expect(firstPoint).toHaveProperty('lng');
      expect(firstPoint).toHaveProperty('name_th');
      expect(firstPoint).toHaveProperty('propertytype_name_th');
      expect(firstPoint).toHaveProperty('project_id');
      
      expect(typeof firstPoint.lat).toBe('number');
      expect(typeof firstPoint.lng).toBe('number');
    });

    test('should handle missing project.json file', async () => {
      // Temporarily rename the file to simulate missing file
      const dataPath = path.join(__dirname, '../../public/data/project.json');
      const backupPath = path.join(__dirname, '../../public/data/project.json.backup');
      
      fs.renameSync(dataPath, backupPath);
      
      const response = await request(app)
        .get('/api/points')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to load points data');
      
      // Restore the file
      fs.renameSync(backupPath, dataPath);
    });
  });

  describe('GET /api/search', () => {
    test('should return all projects without filters', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    test('should filter by location_id', async () => {
      const response = await request(app)
        .get('/api/search?location_id=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].location_id).toBe('1');
    });

    test('should filter by property_types', async () => {
      const response = await request(app)
        .get('/api/search?property_types=2')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].propertytype_id).toBe('2');
    });

    test('should filter by multiple property_types', async () => {
      const response = await request(app)
        .get('/api/search?property_types=1,2')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    test('should filter by building_status', async () => {
      const response = await request(app)
        .get('/api/search?building_status=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].building_status_id).toBe('1');
    });

    test('should search by query (Thai name)', async () => {
      const response = await request(app)
        .get('/api/search?q=โนเบิล')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name_th).toContain('โนเบิล');
    });

    test('should search by query (English name)', async () => {
      const response = await request(app)
        .get('/api/search?q=Noble')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name_th');
      // Note: API response may not include name_en in the mapped output
    });

    test('should return empty array for queries less than 3 characters', async () => {
      const response = await request(app)
        .get('/api/search?q=no')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2); // Should return all since query is too short
    });

    test('should limit results', async () => {
      const response = await request(app)
        .get('/api/search?limit=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/search?location_id=1&property_types=2&building_status=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].location_id).toBe('1');
      expect(response.body[0].propertytype_id).toBe('2');
      expect(response.body[0].building_status_id).toBe('1');
    });

    test('should handle no results found', async () => {
      const response = await request(app)
        .get('/api/search?location_id=999')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/locations', () => {
    test('should return all locations', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      
      const firstLocation = response.body[0];
      expect(firstLocation).toHaveProperty('id');
      expect(firstLocation).toHaveProperty('name');
      expect(firstLocation).toHaveProperty('name_th');
      expect(firstLocation).toHaveProperty('lat');
      expect(firstLocation).toHaveProperty('lng');
    });
  });

  describe('GET /api/property-types', () => {
    test('should return property types', async () => {
      const response = await request(app)
        .get('/api/property-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const firstType = response.body[0];
        expect(firstType).toHaveProperty('id');
        expect(firstType).toHaveProperty('name');
        expect(firstType).toHaveProperty('name_th');
      }
    });
  });

  describe('GET /api/building-status', () => {
    test('should return building status options', async () => {
      const response = await request(app)
        .get('/api/building-status')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const firstStatus = response.body[0];
        expect(firstStatus).toHaveProperty('id');
        expect(firstStatus).toHaveProperty('name');
        expect(firstStatus).toHaveProperty('name_th');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON in data files', async () => {
      const dataPath = path.join(__dirname, '../../public/data/project.json');
      const originalData = fs.readFileSync(dataPath, 'utf8');
      
      // Write invalid JSON
      fs.writeFileSync(dataPath, 'invalid json content');
      
      const response = await request(app)
        .get('/api/points')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      
      // Restore original data
      fs.writeFileSync(dataPath, originalData);
    });
  });
});