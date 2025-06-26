let map;
let markers = [];
let currentInfoWindow = null;
let radiusCircle = null;
let mapCenter = { lat: 13.7440357, lng: 100.5486963 }; // Current map center for distance calculation
let currentFilters = {
    location_id: '1',
    property_types: ['2'],
    building_status: ['1'],
    keyword: ''
};

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Format distance for display
function formatDistance(distance) {
    if (isNaN(distance)) {
        return 'N/A';
    }
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    } else {
        return `${distance.toFixed(1)}km`;
    }
}

// Format coordinate for display
function formatCoordinate(coord) {
    if (coord === null || coord === undefined || coord === '') {
        return 'N/A';
    }
    const numCoord = parseFloat(coord);
    if (isNaN(numCoord)) {
        return 'N/A';
    }
    return numCoord.toFixed(6);
}

// Create popup content with compact and expandable views
function createPopupContent(point, distance) {
    const popupId = `popup-${point.project_id}`;
    
    return `
        <div class="map-popup" id="${popupId}">
            <div class="popup-compact">
                <div class="popup-header">
                    <h3 class="popup-title">${point.name_th || 'N/A'}</h3>
                    <button class="popup-close-btn" onclick="closePopup(); event.stopPropagation();" title="Close">
                        ×
                    </button>
                </div>
                <div class="popup-info">
                    <div class="popup-location">${point.location_name_th || point.province_name_th || 'N/A'}</div>
                    <div class="popup-distance">${distance} from center</div>
                </div>
                <div class="popup-expand-section">
                    <button class="popup-expand-btn" onclick="togglePopup('${popupId}'); event.stopPropagation();">
                        <span class="expand-text">More details</span>
                        <span class="expand-arrow">▼</span>
                    </button>
                </div>
            </div>
            
            <div class="popup-expanded" id="expanded-${popupId}" style="display: none;">
                <div class="popup-detail-grid">
                    <div class="popup-detail-item">
                        <span class="popup-label">Developer:</span>
                        <span class="popup-value">${point.developer_name_th || 'N/A'}</span>
                    </div>
                    <div class="popup-detail-item">
                        <span class="popup-label">Property Type:</span>
                        <span class="popup-value">${point.propertytype_name_th || 'N/A'}</span>
                    </div>
                    <div class="popup-detail-item">
                        <span class="popup-label">Building Status:</span>
                        <span class="popup-value">${point.building_status_name_th || 'N/A'}</span>
                    </div>
                    <div class="popup-detail-item">
                        <span class="popup-label">Coordinates:</span>
                        <span class="popup-value">${point.latitude}, ${point.longitude}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

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
    
    // Add click listener to close popup when clicking on map
    map.addListener('click', () => {
        closePopup();
    });
    
    // Global event handler for all expand buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.popup-expand-btn')) {
            e.stopPropagation();
            e.preventDefault();
            
            const expandBtn = e.target.closest('.popup-expand-btn');
            const popup = expandBtn.closest('.map-popup');
            
            if (popup && popup.id) {
                console.log('Global expand handler triggered for:', popup.id);
                togglePopup(popup.id);
            }
        }
    }, true);
    
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
    const propertyListingsSection = document.getElementById('property-listings-section');

    // Sidebar toggle functionality
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mapElement.classList.toggle('sidebar-open');
        filterContainer.classList.toggle('sidebar-open');
        propertyListingsSection.classList.toggle('sidebar-open');
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
            const targetPanel = document.getElementById(`${tabName}-tab`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
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
                mapCenter = newCenter; // Update center for distance calculations
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
        
        // Add "Select All" option
        const selectAllItem = document.createElement('div');
        selectAllItem.className = 'dropdown-item select-all-item';
        selectAllItem.innerHTML = `
            <input type="checkbox" id="prop-select-all" value="all">
            <label for="prop-select-all"><strong>Select All</strong></label>
        `;
        dropdown.appendChild(selectAllItem);
        
        const selectAllCheckbox = selectAllItem.querySelector('input');
        selectAllCheckbox.addEventListener('change', (e) => {
            handlePropertyTypeSelectAll(e.target.checked);
        });
        
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

// Handle property type select all
function handlePropertyTypeSelectAll(isChecked) {
    const filterElement = document.getElementById('properties-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"])');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    updatePropertyTypeDisplay();
}

// Update property type display
function updatePropertyTypeDisplay() {
    const filterElement = document.getElementById('properties-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"]):checked');
    const selectAllCheckbox = filterElement.querySelector('input[value="all"]');
    const display = filterElement.querySelector('.select-display');
    
    const selectedTypeIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedTypeNames = Array.from(checkboxes).map(cb => cb.nextElementSibling.textContent);
    
    // Update select all checkbox state
    const allCheckboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"])');
    selectAllCheckbox.checked = selectedTypeIds.length === allCheckboxes.length;
    
    // If select all is checked, don't filter by property types (show all)
    if (selectAllCheckbox.checked) {
        currentFilters.property_types = [];
        display.textContent = 'All Property Types';
    } else {
        currentFilters.property_types = selectedTypeIds;
        
        if (selectedTypeIds.length === 0) {
            display.textContent = 'Select Property Types';
        } else if (selectedTypeIds.length === 1) {
            display.textContent = selectedTypeNames[0];
        } else {
            display.textContent = `${selectedTypeIds.length} types selected`;
        }
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
        
        // Add "Select All" option
        const selectAllItem = document.createElement('div');
        selectAllItem.className = 'dropdown-item select-all-item';
        selectAllItem.innerHTML = `
            <input type="checkbox" id="status-select-all" value="all">
            <label for="status-select-all"><strong>Select All</strong></label>
        `;
        dropdown.appendChild(selectAllItem);
        
        const selectAllCheckbox = selectAllItem.querySelector('input');
        selectAllCheckbox.addEventListener('change', (e) => {
            handleBuildingStatusSelectAll(e.target.checked);
        });
        
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

// Handle building status select all
function handleBuildingStatusSelectAll(isChecked) {
    const filterElement = document.getElementById('status-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"])');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    updateBuildingStatusDisplay();
}

// Update building status display
function updateBuildingStatusDisplay() {
    const filterElement = document.getElementById('status-filter');
    const checkboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"]):checked');
    const selectAllCheckbox = filterElement.querySelector('input[value="all"]');
    const display = filterElement.querySelector('.select-display');
    
    const selectedStatusIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedStatusNames = Array.from(checkboxes).map(cb => cb.nextElementSibling.textContent);
    
    // Update select all checkbox state
    const allCheckboxes = filterElement.querySelectorAll('input[type="checkbox"]:not([value="all"])');
    selectAllCheckbox.checked = selectedStatusIds.length === allCheckboxes.length;
    
    // If select all is checked, don't filter by building status (show all)
    if (selectAllCheckbox.checked) {
        currentFilters.building_status = [];
        display.textContent = 'All Building Status';
    } else {
        currentFilters.building_status = selectedStatusIds;
        
        if (selectedStatusIds.length === 0) {
            display.textContent = 'Select Building Status';
        } else if (selectedStatusIds.length === 1) {
            display.textContent = selectedStatusNames[0];
        } else {
            display.textContent = `${selectedStatusIds.length} statuses selected`;
        }
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
        // Show loading state for property listings
        showPropertyListingsLoading();
        
        // Build query parameters
        const params = new URLSearchParams();
        
        if (currentFilters.location_id) {
            params.append('location_id', currentFilters.location_id);
        }
        
        // Only add property_types filter if it's not empty (not "select all")
        if (currentFilters.property_types && currentFilters.property_types.length > 0) {
            params.append('property_types', currentFilters.property_types.join(','));
        }
        
        // Only add building_status filter if it's not empty (not "select all")
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
    // Clear existing markers and their popups
    markers.forEach(marker => {
        if (marker.miniInfoWindow) {
            marker.miniInfoWindow.close();
        }
        if (marker.fullInfoWindow) {
            marker.fullInfoWindow.close();
        }
        marker.setMap(null);
    });
    markers = [];
    
    // Close any current info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
    
    // Add new markers
    points.forEach(point => {
        addMarker(point);
    });
    
    // Update property listings and sidebar
    updatePropertyListings(points);
    updateSidebar(points);
}

// Load and display map points
async function loadMapPoints() {
    // Use applyFilters to load initial data with current filter state
    await applyFilters();
}

// Add marker to map
function addMarker(point) {
    const lat = parseFloat(point.latitude || point.lat);
    const lng = parseFloat(point.longitude || point.lng);
    
    // Skip markers with invalid coordinates
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('Skipping marker with invalid coordinates:', point);
        return;
    }
    
    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
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

    // Calculate distance from center
    const distance = calculateDistance(mapCenter.lat, mapCenter.lng, lat, lng);
    const formattedDistance = formatDistance(distance);
    
    // Create mini popup content (compact version with expand button)
    const miniPopupId = `mini-popup-${point.project_id}`;
    const miniPopupContent = `
        <div class="map-popup mini-popup" id="${miniPopupId}">
            <div class="popup-compact">
                <div class="popup-header mini-header">
                    <h3 class="popup-title mini-title">${point.name_th || 'N/A'}</h3>
                    <button class="popup-close-btn" onclick="closeMiniPopup('${point.project_id}'); event.stopPropagation();" title="Close">×</button>
                </div>
                <div class="popup-info mini-info">
                    <div class="popup-location-distance">
                        <span class="popup-location">${point.location_name_th || point.province_name_th || 'N/A'}</span>
                        <span class="popup-distance">${formattedDistance}</span>
                    </div>
                </div>
                <div class="popup-expand-section mini-expand-section">
                    <button class="popup-expand-btn mini-expand-btn" title="View Details">
                        <span class="expand-text">More details</span>
                        <span class="expand-arrow">▼</span>
                    </button>
                </div>
                <div class="popup-expanded" style="display: none;">
                    <div class="popup-detail-grid mini-detail-grid">
                        <div class="popup-detail-item mini-detail-item">
                            <span class="popup-label">Property Type:</span>
                            <span class="popup-value">${point.propertytype_name_th || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item mini-detail-item">
                            <span class="popup-label">Building Status:</span>
                            <span class="popup-value">${point.building_status_name_th || 'N/A'}</span>
                        </div>
                        <div class="popup-detail-item mini-detail-item">
                            <span class="popup-label">Developer:</span>
                            <span class="popup-value">${point.developer_name_th || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create full popup content (expandable version)
    const fullPopupContent = createPopupContent(point, formattedDistance);
    
    // Create mini popup that shows by default
    const miniInfoWindow = new google.maps.InfoWindow({
        content: miniPopupContent
    });
    
    // Create full popup for click interaction
    const fullInfoWindow = new google.maps.InfoWindow({
        content: fullPopupContent
    });

    // Store references on marker
    marker.miniInfoWindow = miniInfoWindow;
    marker.fullInfoWindow = fullInfoWindow;
    marker.pointData = point;

    // Show mini popup by default
    miniInfoWindow.open(map, marker);
    
    // The global event handler will catch expand button clicks
    // No need for individual event listeners anymore

    // Click listener for full popup
    marker.addListener('click', () => {
        // Close all mini popups
        closeAllMiniPopups();
        
        // Close any open full popup
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        
        // Open full popup
        fullInfoWindow.open(map, marker);
        currentInfoWindow = fullInfoWindow;
        
        // Add event listener for click outside after InfoWindow opens
        setTimeout(() => {
            const infoWindowElement = document.querySelector('.gm-style-iw');
            if (infoWindowElement) {
                document.addEventListener('click', handleOutsideClick, true);
                
                // Ensure expand buttons work by adding event listeners
                const expandBtns = infoWindowElement.querySelectorAll('.popup-expand-btn');
                expandBtns.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const popupId = this.closest('.map-popup').id;
                        if (popupId) {
                            togglePopup(popupId);
                        }
                    });
                });
            }
        }, 100);
    });

    markers.push(marker);
}

// Toggle popup expansion
function togglePopup(popupId) {
    console.log('Attempting to toggle popup:', popupId);
    
    // Multiple strategies to find the popup
    let popup = null;
    
    // Strategy 1: Direct document search
    popup = document.getElementById(popupId);
    
    // Strategy 2: Search in all InfoWindow containers
    if (!popup) {
        const infoWindows = document.querySelectorAll('.gm-style-iw-c, .gm-style-iw-d, .gm-style-iw');
        for (const container of infoWindows) {
            popup = container.querySelector(`#${popupId}`);
            if (popup) break;
        }
    }
    
    // Strategy 3: Search in all map popups
    if (!popup) {
        const allMapPopups = document.querySelectorAll('.map-popup');
        for (const mapPopup of allMapPopups) {
            if (mapPopup.id === popupId) {
                popup = mapPopup;
                break;
            }
        }
    }
    
    if (!popup) {
        console.log('Popup not found with any strategy:', popupId);
        return false;
    }
    
    console.log('Found popup:', popup);
    
    const expandedSection = popup.querySelector('.popup-expanded');
    const expandBtn = popup.querySelector('.popup-expand-btn');
    
    if (!expandedSection || !expandBtn) {
        console.log('Expand elements not found in popup:', popupId);
        console.log('expandedSection:', expandedSection);
        console.log('expandBtn:', expandBtn);
        return false;
    }
    
    const expandArrow = expandBtn.querySelector('.expand-arrow');
    const expandText = expandBtn.querySelector('.expand-text');
    
    console.log('Toggling display from:', expandedSection.style.display);
    
    if (expandedSection.style.display === 'none' || expandedSection.style.display === '') {
        expandedSection.style.display = 'block';
        if (expandArrow) expandArrow.textContent = '▲'; // Up arrow
        if (expandText) expandText.textContent = 'Less details';
        console.log('Expanded popup');
    } else {
        expandedSection.style.display = 'none';
        if (expandArrow) expandArrow.textContent = '▼'; // Down arrow
        if (expandText) expandText.textContent = 'More details';
        console.log('Collapsed popup');
    }
    
    return true;
}

// Handle clicks outside popup
function handleOutsideClick(event) {
    const infoWindow = document.querySelector('.gm-style-iw');
    const mapPopup = document.querySelector('.map-popup');
    
    if (infoWindow && mapPopup && !mapPopup.contains(event.target)) {
        closePopup();
        document.removeEventListener('click', handleOutsideClick, true);
    }
}

// Close current popup
function closePopup() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
        document.removeEventListener('click', handleOutsideClick, true);
        
        // Restore all mini popups when full popup is closed
        restoreAllMiniPopups();
    }
}

// Close all mini popups
function closeAllMiniPopups() {
    markers.forEach(marker => {
        if (marker.miniInfoWindow) {
            marker.miniInfoWindow.close();
        }
    });
}

// Restore all mini popups
function restoreAllMiniPopups() {
    markers.forEach(marker => {
        if (marker.miniInfoWindow) {
            marker.miniInfoWindow.open(map, marker);
        }
    });
}

// Close specific mini popup
function closeMiniPopup(projectId) {
    const marker = markers.find(m => m.pointData && m.pointData.project_id === projectId);
    if (marker && marker.miniInfoWindow) {
        marker.miniInfoWindow.close();
    }
}

// Open full popup from mini popup expand button
function openFullPopup(projectId) {
    const marker = markers.find(m => m.pointData && m.pointData.project_id === projectId);
    if (marker) {
        // Trigger click event on the marker to open full popup
        google.maps.event.trigger(marker, 'click');
    }
}

// Update property listings section
function updatePropertyListings(points) {
    console.log('Updating property listings with', points.length, 'properties');
    console.log('Sample property data:', points[0]);
    
    const propertyGrid = document.getElementById('property-grid');
    const totalPropertiesElement = document.getElementById('total-properties');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsElement = document.getElementById('no-results');
    
    if (!propertyGrid) {
        console.error('Property grid element not found!');
        return;
    }
    
    // Update total count (will be updated again if we filter out invalid properties)
    totalPropertiesElement.textContent = `${points.length} properties found`;
    
    // Hide loading and no results initially
    loadingIndicator.style.display = 'none';
    noResultsElement.style.display = 'none';
    
    if (points.length === 0) {
        propertyGrid.innerHTML = '';
        noResultsElement.style.display = 'block';
        return;
    }
    
    // Filter out properties with invalid coordinates
    const validPoints = points.filter(point => {
        const lat = parseFloat(point.latitude || point.lat);
        const lng = parseFloat(point.longitude || point.lng);
        return !isNaN(lat) && !isNaN(lng);
    });
    
    if (validPoints.length === 0) {
        propertyGrid.innerHTML = '';
        noResultsElement.style.display = 'block';
        totalPropertiesElement.textContent = '0 properties found (no valid coordinates)';
        return;
    }
    
    // Update total count with valid properties
    totalPropertiesElement.textContent = `${validPoints.length} properties found`;
    
    // Generate property cards
    const cardsHTML = validPoints.map(point => createPropertyCard(point)).join('');
    propertyGrid.innerHTML = cardsHTML;
    
    // Add event listeners to property cards and view buttons
    const propertyCards = propertyGrid.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        const projectId = card.dataset.projectId;
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        const point = validPoints.find(p => p.project_id === projectId);
        
        if (point) {
            // Add click listener to the card
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on the button
                if (!e.target.closest('.view-on-map-btn')) {
                    viewPropertyOnMap(point);
                }
            });
            
            // Add click listener to the view button
            const viewBtn = card.querySelector('.view-on-map-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewPropertyOnMap(point);
                });
            }
        }
    });
}

// Create property card HTML
function createPropertyCard(point) {
    const lat = parseFloat(point.latitude || point.lat);
    const lng = parseFloat(point.longitude || point.lng);
    
    let distance = NaN;
    if (!isNaN(lat) && !isNaN(lng)) {
        distance = calculateDistance(mapCenter.lat, mapCenter.lng, lat, lng);
    }
    const formattedDistance = formatDistance(distance);
    
    return `
        <div class="property-card" data-project-id="${point.project_id}" data-lat="${lat}" data-lng="${lng}">
            <div class="property-card-header">
                <h3 class="property-title">${point.name_th || 'N/A'}</h3>
                <div class="property-location">${point.location_name_th || point.province_name_th || 'N/A'}</div>
                <div class="property-distance">${formattedDistance}</div>
            </div>
            
            <div class="property-card-body">
                <div class="property-details">
                    <div class="property-detail-row">
                        <span class="property-label">Property Type:</span>
                        <span class="property-value">
                            <span class="property-type-badge">${point.propertytype_name_th || 'N/A'}</span>
                        </span>
                    </div>
                    
                    <div class="property-detail-row">
                        <span class="property-label">Building Status:</span>
                        <span class="property-value">
                            <span class="property-status-badge">${point.building_status_name_th || 'N/A'}</span>
                        </span>
                    </div>
                    
                    <div class="property-detail-row">
                        <span class="property-label">Developer:</span>
                        <span class="property-value">${point.developer_name_th || 'N/A'}</span>
                    </div>
                    
                    <div class="property-detail-row">
                        <span class="property-label">Location:</span>
                        <span class="property-value">${formatCoordinate(point.latitude || point.lat)}, ${formatCoordinate(point.longitude || point.lng)}</span>
                    </div>
                </div>
            </div>
            
            <div class="property-card-footer">
                <button class="view-on-map-btn" data-project-id="${point.project_id}">
                    View on Map
                </button>
            </div>
        </div>
    `;
}

// View property on map
function viewPropertyOnMap(point) {
    console.log('Viewing property on map:', point.name_th);
    
    // Get coordinates (handle both formats)
    const lat = parseFloat(point.latitude || point.lat);
    const lng = parseFloat(point.longitude || point.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates for property:', point);
        return;
    }
    
    // Remove viewing state from all property cards
    document.querySelectorAll('.property-card.viewing').forEach(card => {
        card.classList.remove('viewing');
    });
    
    // Add viewing state to the current property card
    const currentCard = document.querySelector(`[data-project-id="${point.project_id}"]`);
    if (currentCard) {
        currentCard.classList.add('viewing');
        
        // Remove viewing state after 5 seconds
        setTimeout(() => {
            currentCard.classList.remove('viewing');
        }, 5000);
    }
    
    // Show toast notification
    showViewMapToast(point.name_th || 'Property');
    
    // Smooth scroll to the top of the page (Google Map area)
    window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
    });
    
    // Wait for scroll to complete, then center the map and highlight marker
    setTimeout(() => {
        // Close all mini popups and current info window first
        closeAllMiniPopups();
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        
        // Center map on the property with smooth animation
        map.panTo({ lat: lat, lng: lng });
        
        // Set appropriate zoom level for property viewing
        if (map.getZoom() < 16) {
            map.setZoom(17);
        }
        
        // Find the corresponding marker
        const marker = markers.find(m => 
            Math.abs(m.getPosition().lat() - lat) < 0.0001 && 
            Math.abs(m.getPosition().lng() - lng) < 0.0001
        );
        
        if (marker) {
            // Add a slight delay to ensure map centering is complete
            setTimeout(() => {
                // Trigger marker click to show full popup
                google.maps.event.trigger(marker, 'click');
                
                // Add visual feedback - make the marker bounce briefly
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    marker.setAnimation(null);
                }, 2000); // Stop bouncing after 2 seconds
                
            }, 300);
        } else {
            console.warn('Marker not found for property:', point.name_th);
            
            // If marker not found, still show a visual indication
            // Create a temporary highlight circle
            const highlightCircle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: '#FF0000',
                fillOpacity: 0.2,
                map: map,
                center: { lat: lat, lng: lng },
                radius: 50 // 50 meter radius
            });
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                highlightCircle.setMap(null);
            }, 3000);
        }
        
    }, 800); // Wait for scroll animation to complete
}

// Show loading state for property listings
function showPropertyListingsLoading() {
    const propertyGrid = document.getElementById('property-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsElement = document.getElementById('no-results');
    
    propertyGrid.innerHTML = '';
    loadingIndicator.style.display = 'block';
    noResultsElement.style.display = 'none';
}

// Show toast notification for view on map action
function showViewMapToast(propertyName) {
    const toast = document.getElementById('view-map-toast');
    const message = document.getElementById('toast-message');
    const sidebar = document.getElementById('sidebar');
    
    if (!toast || !message) return;
    
    // Update message
    message.textContent = `📍 Centering "${propertyName}" on map...`;
    
    // Adjust position if sidebar is open
    if (sidebar && sidebar.classList.contains('open')) {
        toast.classList.add('sidebar-open');
    } else {
        toast.classList.remove('sidebar-open');
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update sidebar content with property data
function updateSidebar(points) {
    // Filter out properties with invalid coordinates
    const validPoints = points.filter(point => {
        const lat = parseFloat(point.latitude || point.lat);
        const lng = parseFloat(point.longitude || point.lng);
        return !isNaN(lat) && !isNaN(lng);
    });
    
    updateSidebarSummary(validPoints);
    updateSidebarPropertyList(validPoints);
    updateSidebarAnalytics(validPoints);
}

// Update sidebar summary tab
function updateSidebarSummary(points) {
    // Update total count
    const totalCountEl = document.getElementById('sidebar-total-count');
    if (totalCountEl) {
        totalCountEl.textContent = points.length;
    }
    
    // Calculate and update average distance
    if (points.length > 0) {
        const distances = points.map(point => {
            const lat = parseFloat(point.latitude || point.lat);
            const lng = parseFloat(point.longitude || point.lng);
            return calculateDistance(mapCenter.lat, mapCenter.lng, lat, lng);
        });
        const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
        
        const avgDistanceEl = document.getElementById('sidebar-avg-distance');
        if (avgDistanceEl) {
            avgDistanceEl.textContent = formatDistance(avgDistance);
        }
    }
    
    // Update property types
    updateSidebarPropertyTypes(points);
    
    // Update building status
    updateSidebarBuildingStatus(points);
}

// Update property types in sidebar
function updateSidebarPropertyTypes(points) {
    const container = document.getElementById('sidebar-property-types');
    if (!container) return;
    
    const typeCounts = {};
    points.forEach(point => {
        const type = point.propertytype_name_th || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const html = Object.entries(typeCounts).map(([type, count]) => `
        <div class="info-box">
            <div class="color-indicator" style="background: #007bff;"></div>
            <span>${type}</span>
            <span class="count">${count}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Update building status in sidebar
function updateSidebarBuildingStatus(points) {
    const container = document.getElementById('sidebar-building-status');
    if (!container) return;
    
    const statusCounts = {};
    const statusColors = {
        'Ready to Move In': '#28a745',
        'Under Construction': '#ffc107',
        'Pre-launch': '#007bff',
        'Completed': '#6c757d'
    };
    
    points.forEach(point => {
        const status = point.building_status_name_th || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const html = Object.entries(statusCounts).map(([status, count]) => `
        <div class="info-box">
            <div class="color-indicator" style="background: ${statusColors[status] || '#6c757d'};"></div>
            <span>${status}</span>
            <span class="count">${count}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Update sidebar property list
function updateSidebarPropertyList(points) {
    const container = document.getElementById('sidebar-property-list');
    if (!container) return;
    
    // Sort properties by distance
    const sortedPoints = [...points].sort((a, b) => {
        const distA = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(a.latitude || a.lat), parseFloat(a.longitude || a.lng));
        const distB = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(b.latitude || b.lat), parseFloat(b.longitude || b.lng));
        return distA - distB;
    });
    
    const html = sortedPoints.map(point => {
        const distance = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(point.latitude || point.lat), parseFloat(point.longitude || point.lng));
        
        return `
            <div class="sidebar-property-item" data-project-id="${point.project_id}" onclick="viewPropertyFromSidebar('${point.project_id}')">
                <div class="sidebar-property-name">${point.name_th || 'N/A'}</div>
                <div class="sidebar-property-details">
                    <span class="sidebar-property-type">${point.propertytype_name_th || 'N/A'}</span>
                    <span>${formatDistance(distance)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // Add search functionality
    setupSidebarSearch(sortedPoints);
}

// Setup sidebar search functionality
function setupSidebarSearch(points) {
    const searchInput = document.getElementById('sidebar-search');
    if (!searchInput) return;
    
    // Remove any existing event listeners
    searchInput.removeEventListener('input', handleSidebarSearch);
    
    // Add new event listener
    searchInput.addEventListener('input', (e) => handleSidebarSearch(e, points));
}

// Handle sidebar search
function handleSidebarSearch(event, points) {
    const query = event.target.value.toLowerCase().trim();
    const propertyItems = document.querySelectorAll('.sidebar-property-item');
    
    if (query === '') {
        // Show all items
        propertyItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    // Filter items based on search query
    propertyItems.forEach(item => {
        const name = item.querySelector('.sidebar-property-name').textContent.toLowerCase();
        const type = item.querySelector('.sidebar-property-type').textContent.toLowerCase();
        
        if (name.includes(query) || type.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update sidebar analytics
function updateSidebarAnalytics(points) {
    const within1km = points.filter(point => {
        const distance = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(point.latitude || point.lat), parseFloat(point.longitude || point.lng));
        return distance <= 1;
    }).length;
    
    const within2km = points.filter(point => {
        const distance = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(point.latitude || point.lat), parseFloat(point.longitude || point.lng));
        return distance <= 2;
    }).length;
    
    const within5km = points.filter(point => {
        const distance = calculateDistance(mapCenter.lat, mapCenter.lng, 
            parseFloat(point.latitude || point.lat), parseFloat(point.longitude || point.lng));
        return distance <= 5;
    }).length;
    
    const beyond5km = points.length - within5km;
    
    // Update the counts
    const elements = {
        'within-1km': within1km,
        'within-2km': within2km,
        'within-5km': within5km,
        'beyond-5km': beyond5km
    };
    
    Object.entries(elements).forEach(([id, count]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = count;
        }
    });
}

// View property from sidebar
function viewPropertyFromSidebar(projectId) {
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-property-item.active').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    const clickedItem = document.querySelector(`[data-project-id="${projectId}"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Find the property data
    const marker = markers.find(m => m.pointData && m.pointData.project_id === projectId);
    if (marker && marker.pointData) {
        viewPropertyOnMap(marker.pointData);
    }
}

// Global functions
window.selectKeywordResult = selectKeywordResult;
window.togglePopup = togglePopup;
window.closePopup = closePopup;
window.openFullPopup = openFullPopup;
window.closeMiniPopup = closeMiniPopup;
window.viewPropertyOnMap = viewPropertyOnMap;
window.viewPropertyFromSidebar = viewPropertyFromSidebar;