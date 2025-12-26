# API Endpoints Documentation

This document lists all available HTTP endpoints for the Forzza Scraper API.

## Base URL
`http://localhost:3000`

---

## Football Specific Endpoints

### 1. Football Games (Cached)
**Endpoint:** `GET /api/football-games`
**Description:** Returns the content of the last successful football scrape from `football_games.json`.
**Response Structure:**
```json
{
  "source": "cache",
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

## General Betting Endpoints

### 4. Sports Hierarchy
**Endpoint:** `GET /api/hierarchy`
**Description:** Returns the complete tree of available Sports > Regions > Competitions.
**Response: Standard Swarm API hierarchy JSON.

### 5. Games by Competition
**Endpoint:** `GET /api/games?competitionId={ID}`
**Description:** Returns all prematch games for a specific competition ID.
**Parameters:**
- `competitionId` (Required): The ID of the competition (found in the hierarchy).

### 6. Game Odds & Markets
**Endpoint:** `GET /api/odds?gameId={ID}`
**Description:** Returns comprehensive market and odds data for a specific game, including extended markets.
**Parameters:**
- `gameId` (Required): The ID of the game.

### 7. Full Sportsbook Scrape (Experimental)
**Endpoint:** `GET /api/full-scrape`
**Description:** Attempts to traverse the entire sportsbook (all sports, all games).
**Warning:** This is resource-intensive and may be very slow.
