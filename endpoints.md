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
**Description:** Triggers a fresh, high-speed extraction of all football pre-games. Includes **1X2 (Match Result)** odds. Updates the `/data/Football/` directory.
**Response:** JSON array of game objects with nested `market` and `event` data.

---

## Multi-Sport & Organization Endpoints

### 4. Fetch All Sports (Bulk)
**Endpoint:** `GET /api/fetch-all-sports`
**Description:** Triggers a bulk scrape of ALL available sports. Organizes data into directories by sport name.
**Response Structure:**
```json
{
  "message": "Bulk scrape completed",
  "summary": [
    { "sport": "Football", "id": "1", "count": 680 },
    { "sport": "Basketball", "id": "3", "count": 142 }
  ],
  "count": 42,
  "timestamp": "2025-12-26T20:51:33.679Z"
}
```

### 5. Games by Sport (Cached)
**Endpoint:** `GET /api/sport-games?sportName={NAME}`
**Description:** Returns the latest cached games for a specific sport.
**Parameters:**
- `sportName` (Required): The name of the sport (e.g., `Tennis`, `Ice_Hockey`).
**Response:**
```json
{
  "source": "cache",
  "sport": "Tennis",
  "count": 84,
  "data": [ ... ]
}
```

### 6. Sport Full Scrape (Fresh)
**Endpoint:** `GET /api/sport-full-scrape?sportId={ID}&sportName={NAME}`
**Description:** Triggers a fresh bulk fetch for a specific sport. Includes **Winner (1X2 or 1-2)** odds.
**Parameters:**
- `sportId` (Required): The ID of the sport.
- `sportName` (Required): The name of the sport.

---

## Data Organization
Scraped data is stored in the `/data` directory:
- **Structure:** `/data/{Sport_Name}/{YYYY-MM-DD}.json`
- **Latest:** `/data/{Sport_Name}/latest.json` (Symlink-like copy for the most recent scrape).

---

## General Betting Endpoints

### 7. Sports Hierarchy
**Endpoint:** `GET /api/hierarchy`
**Description:** Returns the complete tree of available Sports > Regions > Competitions.

### 8. Games by Competition
**Endpoint:** `GET /api/games?competitionId={ID}`
**Description:** Returns all prematch games for a specific competition ID.

### 9. Game Odds & Markets
**Endpoint:** `GET /api/odds?gameId={ID}`
**Description:** Returns **all available markets** and odds for a specific game (detailed view).

### 10. Full Sportsbook Scrape (Experimental)
**Endpoint:** `GET /api/full-scrape`
**Description:** Naive traversal of the entire hierarchy. **Slow and heavy.**
