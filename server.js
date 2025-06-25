require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    try {
        const htmlPath = path.join(__dirname, 'views', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        const apiKey = process.env.GMAP_APIKEY || 'YOUR_API_KEY';
        htmlContent = htmlContent.replace('{{GMAP_APIKEY}}', apiKey);
        
        res.send(htmlContent);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

app.get('/api/points', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public', 'data', 'project.json');
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
            project_id: project.project_id
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
        
        const dataPath = path.join(__dirname, 'public', 'data', 'project.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(data);
        
        let filteredResults = jsonData.payload;
        
        // Apply location filter
        if (location_id) {
            filteredResults = filteredResults.filter(project => 
                project.location_id === location_id
            );
        }
        
        // Apply property type filter (can be multiple)
        if (property_types) {
            const propertyTypeIds = Array.isArray(property_types) ? property_types : property_types.split(',');
            filteredResults = filteredResults.filter(project => 
                propertyTypeIds.includes(project.propertytype_id)
            );
        }
        
        // Apply building status filter (can be multiple)
        if (building_status) {
            const statusIds = Array.isArray(building_status) ? building_status : building_status.split(',');
            filteredResults = filteredResults.filter(project => 
                statusIds.includes(project.building_status_id)
            );
        }
        
        // Apply keyword search
        if (query && query.length >= 3) {
            filteredResults = filteredResults.filter(project => 
                project.name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.name_en?.toLowerCase().includes(query.toLowerCase()) ||
                project.propertytype_name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.developer_name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.province_name_th?.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Limit results and transform data
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

// API endpoint for locations
app.get('/api/locations', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public', 'data', 'location.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const locations = JSON.parse(data);
        res.json(locations);
    } catch (error) {
        console.error('Error reading location.json:', error);
        res.status(500).json({ error: 'Failed to load locations' });
    }
});

// API endpoint for property types
app.get('/api/property-types', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public', 'data', 'properties_type.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const propertyTypes = JSON.parse(data);
        res.json(propertyTypes);
    } catch (error) {
        console.error('Error reading properties_type.json:', error);
        res.status(500).json({ error: 'Failed to load property types' });
    }
});

// API endpoint for building status
app.get('/api/building-status', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public', 'data', 'building_status.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const buildingStatus = JSON.parse(data);
        res.json(buildingStatus);
    } catch (error) {
        console.error('Error reading building_status.json:', error);
        res.status(500).json({ error: 'Failed to load building status' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});