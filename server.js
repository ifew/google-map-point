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
        const query = req.query.q;
        if (!query || query.length < 3) {
            return res.json([]);
        }
        
        const dataPath = path.join(__dirname, 'public', 'data', 'project.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(data);
        
        const searchResults = jsonData.payload
            .filter(project => 
                project.name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.name_en?.toLowerCase().includes(query.toLowerCase()) ||
                project.propertytype_name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.developer_name_th?.toLowerCase().includes(query.toLowerCase()) ||
                project.province_name_th?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10)
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
                province_name_th: project.province_name_th
            }));
        
        res.json(searchResults);
    } catch (error) {
        console.error('Error searching projects:', error);
        res.status(500).json({ error: 'Failed to search projects' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});