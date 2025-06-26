let map;
let markers = [];
let currentInfoWindow = null;
let currentMiniPopup = null;
const mapCenter = { lat: 13.7411, lng: 100.5480 };

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    
    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: mapCenter,
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

// Calculate distance between two points in kilometers
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Format distance for display
function formatDistance(distanceKm) {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m from center`;
    }
    return `${distanceKm.toFixed(1)}km from center`;
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

    // Store point data with marker for easy access
    marker.pointData = point;

    // Calculate distance from center
    const distance = calculateDistance(mapCenter.lat, mapCenter.lng, point.lat, point.lng);
    const distanceText = formatDistance(distance);

    // Create mini popup content
    const miniPopupContent = `
        <div class="map-popup">
            <div class="popup-compact">
                <div class="popup-header">
                    <h3 class="popup-title">${point.name_th || 'N/A'}</h3>
                </div>
                <div class="popup-info">
                    <div class="popup-location">${point.location_name_th || 'N/A'}</div>
                    <div class="popup-distance">${distanceText}</div>
                </div>
            </div>
        </div>
    `;

    // Create mini popup
    const miniPopup = new google.maps.InfoWindow({
        content: miniPopupContent
    });

    // Create full popup content
    const fullPopupContent = `
        <div class="map-popup">
            <div class="popup-compact">
                <div class="popup-header">
                    <h3 class="popup-title">${point.name_th || 'N/A'}</h3>
                    <button class="popup-close-btn" onclick="closeCurrentPopup()">×</button>
                </div>
                <div class="popup-info">
                    <div class="popup-location">${point.location_name_th || 'N/A'}</div>
                    <div class="popup-distance">${distanceText}</div>
                </div>
                <div class="popup-expand-section">
                    <button class="popup-expand-btn" onclick="togglePopupDetails(this)">
                        <span>View Details</span>
                        <span class="expand-arrow">▼</span>
                    </button>
                </div>
                <div class="popup-expanded" style="display: none;">
                    <div class="popup-detail-grid">
                        <div class="popup-detail-item">
                            <span class="popup-label">Property Type:</span>
                            <span class="popup-value">${point.propertytype_name_th || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item">
                            <span class="popup-label">Developer:</span>
                            <span class="popup-value">${point.developer_name_th || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item">
                            <span class="popup-label">Total Units:</span>
                            <span class="popup-value">${point.count_unit || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item">
                            <span class="popup-label">Building Status:</span>
                            <span class="popup-value">${point.building_status_name_th || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item">
                            <span class="popup-label">Coordinates:</span>
                            <span class="popup-value">${point.latitude}, ${point.longitude}</span>
                        </div>
                        <div class="popup-detail-item">
                            <span class="popup-label">Province:</span>
                            <span class="popup-value">${point.province_name_th || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create full popup
    const fullPopup = new google.maps.InfoWindow({
        content: fullPopupContent
    });

    // Store popup references with marker
    marker.miniPopup = miniPopup;
    marker.fullPopup = fullPopup;

    // Show mini popup by default
    miniPopup.open(map, marker);

    // Add click listener for full popup
    marker.addListener('click', () => {
        // Close all mini popups
        closeAllMiniPopups();
        
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        
        fullPopup.open(map, marker);
        currentInfoWindow = fullPopup;
        
        // Store reference to this marker for restoring mini popup
        currentInfoWindow.currentMarker = marker;
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

// Helper functions for popup interactions
function closeCurrentPopup() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
        // Restore all mini popups when full popup is closed
        restoreAllMiniPopups();
    }
}

function closeAllMiniPopups() {
    markers.forEach(marker => {
        if (marker.miniPopup) {
            marker.miniPopup.close();
        }
    });
}

function restoreAllMiniPopups() {
    markers.forEach(marker => {
        if (marker.miniPopup) {
            marker.miniPopup.open(map, marker);
        }
    });
}

function togglePopupDetails(button) {
    const expandedSection = button.closest('.popup-compact').querySelector('.popup-expanded');
    const arrow = button.querySelector('.expand-arrow');
    const buttonText = button.querySelector('span:first-child');
    
    if (expandedSection.style.display === 'none') {
        expandedSection.style.display = 'block';
        arrow.textContent = '▲';
        buttonText.textContent = 'Hide Details';
    } else {
        expandedSection.style.display = 'none';
        arrow.textContent = '▼';
        buttonText.textContent = 'View Details';
    }
}