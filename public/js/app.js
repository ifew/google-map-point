let map;
let markers = [];
let currentInfoWindow = null;
let radiusCircle = null;
let currentFilters = {
    location_id: '1',
    property_types: ['2'],
    building_status: ['1'],
    keyword: ''
};

// Initialize the application
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    
    // Noble Ploenchit coordinates
    const nobleLocation = { lat: 13.7440357, lng: 100.5486963 };
    
    map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: nobleLocation,
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

    // Add 1km radius circle
    addRadiusCircle(nobleLocation);
    
    // Initialize components
    initSidebar();
    initFilters();
    loadMapPoints();
}

// Add radius circle to map
function addRadiusCircle(center) {
    if (radiusCircle) {
        radiusCircle.setMap(null);
    }
    
    radiusCircle = new google.maps.Circle({
        strokeColor: '#007bff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#007bff',
        fillOpacity: 0.1,
        map: map,
        center: center,
        radius: 1000 // 1km in meters
    });
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mapElement = document.getElementById('map');
    const filterContainer = document.getElementById('filter-container');

    // Sidebar toggle functionality
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mapElement.classList.toggle('sidebar-open');
        filterContainer.classList.toggle('sidebar-open');
    });

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Initialize filter functionality
async function initFilters() {
    await loadLocationFilter();
    await loadPropertyTypeFilter();
    await loadBuildingStatusFilter();
    initKeywordSearch();
}

// Load location filter data
async function loadLocationFilter() {
    try {
        const response = await fetch('/api/locations');
        const locations = await response.json();
        
        const locationSelect = document.getElementById('location-filter');
        locationSelect.innerHTML = '';
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.name;
            option.textContent = location.name;
            option.selected = location.name === 'Ploenchit';
            locationSelect.appendChild(option);
        });

        locationSelect.addEventListener('change', (e) => {
            const selectedLocationName = e.target.value;
            const selectedLocation = locations.find(loc => loc.name === selectedLocationName);
            if (selectedLocation) {
                currentFilters.location_id = selectedLocation.id;
                const newCenter = { lat: selectedLocation.lat, lng: selectedLocation.lng };
                map.setCenter(newCenter);
                addRadiusCircle(newCenter);
                applyFilters();
            }
        });
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// Load property type filter
async function loadPropertyTypeFilter() {
    try {
        const response = await fetch('/api/property-types');
        const propertyTypes = await response.json();
        
        const filterElement = document.getElementById('properties-filter');
        const dropdown = filterElement.querySelector('.dropdown-content');
        
        dropdown.innerHTML = '';
        
        propertyTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <input type="checkbox" id="prop-${type.id}" value="${type.id}" ${type.id === '2' ? 'checked' : ''}>
                <label for="prop-${type.id}">${type.name}</label>
            `;
            dropdown.appendChild(item);

            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', updatePropertyTypeDisplay);
        });

        // Show/hide dropdown
        const display = filterElement.querySelector('.select-display');
        display.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterElement.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    } catch (error) {
        console.error('Error loading property types:', error);
    }
}

// Update property type display
function updatePropertyTypeDisplay() {
    const filterElement = document.getElementById('properties-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:checked');
    const display = filterElement.querySelector('.select-display');
    
    const selectedTypeIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedTypeNames = Array.from(checkboxes).map(cb => cb.nextElementSibling.textContent);
    
    currentFilters.property_types = selectedTypeIds;
    
    if (selectedTypeIds.length === 0) {
        display.textContent = 'Select Property Types';
    } else if (selectedTypeIds.length === 1) {
        display.textContent = selectedTypeNames[0];
    } else {
        display.textContent = `${selectedTypeIds.length} types selected`;
    }
    
    applyFilters();
}

// Load building status filter
async function loadBuildingStatusFilter() {
    try {
        const response = await fetch('/api/building-status');
        const statuses = await response.json();
        
        const filterElement = document.getElementById('status-filter');
        const dropdown = filterElement.querySelector('.dropdown-content');
        
        dropdown.innerHTML = '';
        
        statuses.forEach(status => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <input type="checkbox" id="status-${status.id}" value="${status.id}" ${status.id === '1' ? 'checked' : ''}>
                <label for="status-${status.id}">${status.name}</label>
            `;
            dropdown.appendChild(item);

            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', updateBuildingStatusDisplay);
        });

        // Show/hide dropdown
        const display = filterElement.querySelector('.select-display');
        display.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterElement.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    } catch (error) {
        console.error('Error loading building status:', error);
    }
}

// Update building status display
function updateBuildingStatusDisplay() {
    const filterElement = document.getElementById('status-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:checked');
    const display = filterElement.querySelector('.select-display');
    
    const selectedStatusIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedStatusNames = Array.from(checkboxes).map(cb => cb.nextElementSibling.textContent);
    
    currentFilters.building_status = selectedStatusIds;
    
    if (selectedStatusIds.length === 0) {
        display.textContent = 'Select Building Status';
    } else if (selectedStatusIds.length === 1) {
        display.textContent = selectedStatusNames[0];
    } else {
        display.textContent = `${selectedStatusIds.length} statuses selected`;
    }
    
    applyFilters();
}

// Initialize keyword search
function initKeywordSearch() {
    const keywordInput = document.getElementById('keyword-search');
    const keywordResults = document.getElementById('keyword-results');
    let searchTimeout;

    keywordInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            keywordResults.classList.remove('show');
            currentFilters.keyword = '';
            applyFilters();
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                currentFilters.keyword = query;
                applyFilters();
            } catch (error) {
                console.error('Error searching:', error);
            }
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!keywordInput.closest('.filter-box').contains(e.target)) {
            keywordResults.classList.remove('show');
        }
    });
}

// Display keyword search results
function displayKeywordResults(results) {
    const keywordResults = document.getElementById('keyword-results');
    
    if (results.length === 0) {
        keywordResults.innerHTML = '<div class="keyword-item">No results found</div>';
        keywordResults.classList.add('show');
        return;
    }
    
    const html = results.map(result => `
        <div class="keyword-item" onclick="selectKeywordResult(${result.lat}, ${result.lng}, '${result.project_id}')">
            <div class="keyword-title">${result.name_th}</div>
            <div class="keyword-subtitle">${result.propertytype_name_th} - ${result.province_name_th || ''}</div>
        </div>
    `).join('');
    
    keywordResults.innerHTML = html;
    keywordResults.classList.add('show');
}

// Select keyword result
function selectKeywordResult(lat, lng, projectId) {
    map.setCenter({ lat, lng });
    map.setZoom(17);
    
    const marker = markers.find(m => 
        Math.abs(m.getPosition().lat() - lat) < 0.0001 && 
        Math.abs(m.getPosition().lng() - lng) < 0.0001
    );
    
    if (marker) {
        google.maps.event.trigger(marker, 'click');
    }
    
    document.getElementById('keyword-results').classList.remove('show');
}

// Apply current filters to map data
async function applyFilters() {
    try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (currentFilters.location_id) {
            params.append('location_id', currentFilters.location_id);
        }
        
        if (currentFilters.property_types && currentFilters.property_types.length > 0) {
            params.append('property_types', currentFilters.property_types.join(','));
        }
        
        if (currentFilters.building_status && currentFilters.building_status.length > 0) {
            params.append('building_status', currentFilters.building_status.join(','));
        }
        
        if (currentFilters.keyword && currentFilters.keyword.length >= 3) {
            params.append('q', currentFilters.keyword);
        }
        
        params.append('limit', '100');
        
        // Call API with filters
        const response = await fetch(`/api/search?${params.toString()}`);
        const filteredPoints = await response.json();
        
        // Update map with filtered results
        updateMapMarkers(filteredPoints);
        
        // Update keyword dropdown if there's a search
        if (currentFilters.keyword && currentFilters.keyword.length >= 3) {
            displayKeywordResults(filteredPoints.slice(0, 10));
        }
        
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Update map markers with filtered results
function updateMapMarkers(points) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Add new markers
    points.forEach(point => {
        addMarker(point);
    });
}

// Load and display map points
async function loadMapPoints() {
    // Use applyFilters to load initial data with current filter state
    await applyFilters();
}

// Add marker to map
function addMarker(point) {
    const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.name_th,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="#007bff" stroke="white" stroke-width="2"/>
                    <circle cx="15" cy="15" r="6" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15)
        }
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 250px; padding: 8px;">
                <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 8px;">${point.name_th || 'N/A'}</div>
                <div style="margin-bottom: 4px;"><strong>Type:</strong> ${point.propertytype_name_th || 'N/A'}</div>
                <div style="margin-bottom: 4px;"><strong>Developer:</strong> ${point.developer_name_th || 'N/A'}</div>
                <div style="margin-bottom: 4px;"><strong>Lat and Long:</strong> ${point.latitude}, ${point.longitude}</div>
                <div><strong>Total Unit:</strong> ${point.count_unit || 'N/A'}</div>
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

// Global function for search result selection
window.selectKeywordResult = selectKeywordResult;