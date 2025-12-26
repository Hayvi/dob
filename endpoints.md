# API Endpoints Documentation

This document lists all available HTTP endpoints for the Forzza Scraper API.

## Base URL
`http://localhost:3000`

---

## Football Specific Endpoints

### 1. Football Games (Cached)
**Endpoint:** `GET /api/football-games`
**Description:** Returns the latest cached football games from `data/Football/latest.json`.
**Response Structure:**
```json
{
  "source": "cache",
  "sport": "Football",
  "count": 681,
  "data": [ ... ]
}
```

### 2. Football Games Count
**Endpoint:** `GET /api/football-games-count`
**Description:** Returns the real-time count of football pre-games available on the sportsbook without fetching full details.
**Response Structure:**
```json
{
  "sport": "Football",
  "count": 681,
  "timestamp": "2025-12-26T20:18:49.596Z"
}
```

### 3. Football Full Scrape (Fresh)
**Endpoint:** `GET /api/football-full-scrape`
**Description:** Triggers a fresh, high-speed extraction of all football pre-games across all regions and competitions. Updates the local cache.
**Response:** JSON array of game objects.

---

## Multi-Sport & Organization Endpoints

### 4. Fetch All Sports (Bulk)
**Endpoint:** `GET /api/fetch-all-sports`
**Description:** Triggers a bulk scrape of ALL available sports. Organizes data into directories by sport name and saves as date-stamped JSON files (e.g., `data/Basketball/2025-12-26.json`).
**Response:** Summary of sports scraped and their match counts.

### 5. Games by Sport (Cached)
**Endpoint:** `GET /api/sport-games?sportName={NAME}`
**Description:** Returns the latest cached games for a specific sport from its corresponding directory.
**Parameters:**
- `sportName` (Required): The name of the sport (e.g., Basketball, Tennis).

### 6. Sport Full Scrape (Fresh)
**Endpoint:** `GET /api/sport-full-scrape?sportId={ID}&sportName={NAME}`
**Description:** Triggers a fresh bulk fetch for a specific sport and updates its directory.
**Parameters:**
- `sportId` (Required): The ID of the sport.
- `sportName` (Required): The name of the sport.

---

## General Betting Endpoints

### 7. Sports Hierarchy
**Endpoint:** `GET /api/hierarchy`
**Description:** Returns the complete tree of available Sports > Regions > Competitions.
**Response: Standard Swarm API hierarchy JSON.

### 8. Games by Competition
**Endpoint:** `GET /api/games?competitionId={ID}`
**Description:** Returns all prematch games for a specific competition ID.
**Parameters:**
- `competitionId` (Required): The ID of the competition.

### 9. Game Odds & Markets
**Endpoint:** `GET /api/odds?gameId={ID}`
**Description:** Returns comprehensive market and odds data for a specific game.
**Parameters:**
- `gameId` (Required): The ID of the game.

### 10. Full Sportsbook Scrape (Experimental)
**Endpoint:** `GET /api/full-scrape`
**Description:** Attempts to traverse the entire sportsbook (all sports, all games).
**Warning:** This is resource-intensive and may be very slow.
