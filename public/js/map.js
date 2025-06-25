let map;
let markers = [];
let currentInfoWindow = null;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    
    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: { lat: 13.7411, lng: 100.5480 },
        mapTypeId: 'roadmap',
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
        },
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        scaleControl: true,
        rotateControl: true
    });

    loadMapPoints();
    initSearch();
}

async function loadMapPoints() {
    try {
        const response = await fetch('/api/points');
        const points = await response.json();
        
        points.forEach(point => {
            addMarker(point);
        });
    } catch (error) {
        console.error('Error loading map points:', error);
    }
}

function addMarker(point) {
    const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.name_th
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
                <strong>Project:</strong> ${point.name_th || 'N/A'}<br>
                <strong>Type:</strong> ${point.propertytype_name_th || 'N/A'}<br>
                <strong>Developer:</strong> ${point.developer_name_th || 'N/A'}<br>
                <strong>Lat and Long:</strong> ${point.latitude}, ${point.longitude}<br>
                <strong>Total Unit:</strong> ${point.count_unit || 'N/A'}
            </div>
        `
    });

    marker.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
    });

    markers.push(marker);
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const results = await response.json();
                
                displaySearchResults(results);
            } catch (error) {
                console.error('Error searching:', error);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-item">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    const html = results.map(result => `
        <div class="search-item" onclick="selectSearchResult(${result.lat}, ${result.lng}, '${result.project_id}')">
            <div class="search-title">${result.name_th}</div>
            <div class="search-subtitle">${result.propertytype_name_th} - ${result.province_name_th || ''}</div>
        </div>
    `).join('');
    
    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
}

function selectSearchResult(lat, lng, projectId) {
    map.setCenter({ lat, lng });
    map.setZoom(15);
    
    const marker = markers.find(m => 
        Math.abs(m.getPosition().lat() - lat) < 0.0001 && 
        Math.abs(m.getPosition().lng() - lng) < 0.0001
    );
    
    if (marker) {
        google.maps.event.trigger(marker, 'click');
    }
    
    document.getElementById('search-results').style.display = 'none';
}