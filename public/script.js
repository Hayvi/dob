const API_BASE = 'https://dob-lqpg.onrender.com/api';

const sports = [
    { name: 'Football', id: 1 },
    { name: 'Ice_Hockey', id: 2 },
    { name: 'Basketball', id: 3 },
    { name: 'Tennis', id: 4 },
    { name: 'Volleyball', id: 5 },
    { name: 'American_Football', id: 6 },
    { name: 'Aussie_Rules', id: 8 },
    { name: 'Bandy', id: 10 },
    { name: 'Baseball', id: 11 },
    { name: 'Chess', id: 18 },
    { name: 'Cricket', id: 19 },
    { name: 'Curling', id: 20 },
    { name: 'Cycling', id: 21 },
    { name: 'Darts', id: 22 },
    { name: 'Floorball', id: 24 },
    { name: 'Formula_1', id: 25 },
    { name: 'Futsal', id: 26 },
    { name: 'Golf', id: 27 },
    { name: 'Handball', id: 29 },
    { name: 'Lacrosse', id: 110 },
    { name: 'Rugby_League', id: 36 },
    { name: 'Rugby_Union', id: 37 },
    { name: 'Snooker', id: 39 },
    { name: 'Table_Tennis', id: 41 },
    { name: 'Water_Polo', id: 42 },
    { name: '3x3_Basketball', id: 190 },
    { name: 'Counter_Strike_2', id: 75 },
    { name: 'Dota_2', id: 76 },
    { name: 'League_of_legends', id: 77 }
];

function showResponse(data, status = 'success') {
    const box = document.getElementById('responseBox');
    box.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    box.className = `response-box ${status}`;
}

function setStatus(sportName, message, type = 'loading') {
    const statusEl = document.getElementById(`status-${sportName}`);
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }
}

async function apiCall(url, sportName = null) {
    if (sportName) setStatus(sportName, 'Loading...', 'loading');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            showResponse(data, 'success');
            if (sportName) {
                const count = data.count || (data.data ? data.data.length : 0);
                setStatus(sportName, `✓ ${count} games`, 'success');
            }
        } else {
            showResponse(data, 'error');
            if (sportName) setStatus(sportName, `✗ ${data.error}`, 'error');
        }
    } catch (error) {
        const errorMsg = `Network error: ${error.message}`;
        showResponse(errorMsg, 'error');
        if (sportName) setStatus(sportName, `✗ ${error.message}`, 'error');
    }
}

function getCachedData(sportName) {
    apiCall(`${API_BASE}/sport-games?sportName=${sportName}`, sportName);
}

function getLiveCount(sportName) {
    apiCall(`${API_BASE}/sport-games-count?sportName=${sportName}`, sportName);
}

function scrapeSport(sportName, sportId) {
    apiCall(`${API_BASE}/sport-full-scrape?sportId=${sportId}&sportName=${sportName}`, sportName);
}

function testHierarchy() {
    apiCall(`${API_BASE}/hierarchy`);
}

function bulkScrape() {
    showResponse('Starting bulk scrape... This may take several minutes.', 'loading');
    apiCall(`${API_BASE}/fetch-all-sports`);
}

function createSportCard(sport) {
    return `
        <div class="sport-card">
            <div class="sport-name">${sport.name.replace(/_/g, ' ')}</div>
            <div class="btn-group">
                <button class="btn btn-cached" onclick="getCachedData('${sport.name}')">Cached</button>
                <button class="btn btn-live" onclick="getLiveCount('${sport.name}')">Count</button>
                <button class="btn btn-scrape" onclick="scrapeSport('${sport.name}', ${sport.id})">Scrape</button>
            </div>
            <div id="status-${sport.name}" class="status" style="display: none;"></div>
        </div>
    `;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('sportsGrid');
    grid.innerHTML = sports.map(createSportCard).join('');
});