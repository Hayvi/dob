# Forzza Sports Betting Scraper

A Node.js API that scrapes prematch betting data from Forzza sportsbook via WebSocket and stores it in MongoDB Atlas.

## Tech Stack

- Express 5.x
- Mongoose 9.x (MongoDB Atlas)
- WebSocket (`ws`)
- Deployed on Render

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/forzza_scraper
PORT=3000
```

## Running

```bash
node index.js
```

## API Endpoints

### Live Endpoints (Real-time from Swarm API)

| Endpoint | Description |
|----------|-------------|
| `GET /api/hierarchy` | Full sports/regions/competitions tree |
| `GET /api/sport-games-count?sportName=X` | Live game count for a sport |
| `GET /api/football-games-count` | Live Football game count |
| `GET /api/sport-full-scrape?sportId=X&sportName=Y` | Scrape a sport and save to DB |
| `GET /api/football-full-scrape` | Scrape Football and save to DB |
| `GET /api/fetch-all-sports` | Bulk scrape all sports |

### Cached Endpoints (From MongoDB)

| Endpoint | Description |
|----------|-------------|
| `GET /api/sport-games?sportName=X` | Latest cached data for a sport |
| `GET /api/football-games` | Latest cached Football data |

## Game Types Explained

The Swarm API categorizes games into three types:

| Type | Name | Description | Included |
|------|------|-------------|----------|
| `0` | Prematch | Upcoming scheduled matches | ✅ Yes |
| `1` | Live | Currently in-play games | ❌ No |
| `2` | Outright | Futures/long-term bets (e.g., "League Winner", "Top Scorer") | ❌ No |

### Why Prematch Only?

This scraper intentionally fetches **only prematch games (type 0)**. Here's the breakdown for Football:

| Type | Count | Example |
|------|-------|---------|
| Prematch | ~197 | Liverpool vs Man City (Dec 28) |
| Live | ~1-10 | Currently playing matches |
| Outright | ~500 | "Premier League Winner", "World Cup Top Scorer" |
| **Total** | ~700 | What the website shows |

If you see fewer games in the scraper than on the website, this is expected behavior. The website displays all types combined (~700), while the scraper focuses on actual scheduled matches (~200).

### To Include All Game Types

If you need outrights and live games, modify `scraper.js`:

```javascript
// Change this:
where: {
    sport: { id: parseInt(sportId) },
    game: { type: 0 }
}

// To this:
where: {
    sport: { id: parseInt(sportId) },
    game: { type: { '@in': [0, 1, 2] } }
}
```

## Production URL

```
https://dob-lqpg.onrender.com
```

## License

ISC
