const express = require('express');
const fs = require('fs');
const path = require('path');
const ForzzaScraper = require('./scraper');

const app = express();
const port = process.env.PORT || 3000;

// Initialize scraper once for the server lifetime or per request?
// For real-time Swarm API, maintaining one connection is better.
const scraper = new ForzzaScraper();

// Helper to save sport data in organized directory
function saveSportData(sportName, games) {
    const date = new Date().toISOString().split('T')[0];
    const dir = path.join(__dirname, 'data', sportName.replace(/[^a-z0-9]/gi, '_'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${date}.json`);
    fs.writeFileSync(filePath, JSON.stringify(games, null, 2));

    // Also save as latest for easy access
    fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(games, null, 2));
    return filePath;
}

// Global function to parse games from Swarm response
function parseGamesFromData(rawData, sportName = "Unknown") {
    const data = rawData.data && rawData.data.data ? rawData.data.data : (rawData.data || rawData);
    const allGames = [];
    if (data && data.region) {
        for (const regionId in data.region) {
            const region = data.region[regionId];
            if (region.competition) {
                for (const compId in region.competition) {
                    const competition = region.competition[compId];
                    if (competition.game) {
                        for (const gameId in competition.game) {
                            const game = competition.game[gameId];
                            const markets = {};
                            if (game.market) {
                                for (const mId in game.market) {
                                    const market = game.market[mId];
                                    const events = {};
                                    if (market.event) {
                                        for (const eId in market.event) {
                                            events[eId] = market.event[eId];
                                        }
                                    }
                                    markets[mId] = { ...market, event: events };
                                }
                            }
                            allGames.push({
                                sport: sportName,
                                region: region.name,
                                competition: competition.name,
                                ...game,
                                market: markets
                            });
                        }
                    }
                }
            }
        }
    }
    return allGames;
}

app.get('/api/hierarchy', async (req, res) => {
    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }
        const hierarchy = await scraper.getHierarchy();
        res.json(hierarchy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/games', async (req, res) => {
    const { competitionId } = req.query;
    if (!competitionId) {
        return res.status(400).json({ error: 'competitionId is required' });
    }

    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }
        const games = await scraper.getGames(competitionId);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/odds', async (req, res) => {
    const { gameId } = req.query;
    if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
    }

    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }
        const odds = await scraper.getGameDetails(gameId);
        res.json(odds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-games', (req, res) => {
    try {
        const dir = path.join(__dirname, 'data', 'Football');
        const latestPath = path.join(dir, 'latest.json');

        if (fs.existsSync(latestPath)) {
            const data = fs.readFileSync(latestPath, 'utf8');
            const parsed = JSON.parse(data);
            res.json({
                source: 'cache',
                sport: 'Football',
                count: parsed.length,
                data: parsed
            });
        } else {
            // Check old path for migration support
            if (fs.existsSync('football_games.json')) {
                const data = fs.readFileSync('football_games.json', 'utf8');
                res.json({ source: 'legacy-cache', data: JSON.parse(data) });
            } else {
                res.status(404).json({ error: 'Football data not found. Run a scrape first.' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-games-count', async (req, res) => {
    try {
        if (!scraper.sessionId) await scraper.init();
        const rawData = await scraper.sendRequest('get', {
            source: 'betting',
            what: { sport: ['id', 'name'], game: ['id'] },
            where: { sport: { id: 1 } }
        });
        const data = rawData.data && rawData.data.data ? rawData.data.data : (rawData.data || rawData);
        let count = 0;
        let sportName = "Football";
        if (data && data.sport) {
            const sports = Object.values(data.sport);
            if (sports.length > 0) {
                sportName = sports[0].name || sportName;
                if (sports[0].game) count = Object.keys(sports[0].game).length;
            }
        }
        res.json({ sport: sportName, count: count, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sport-games', (req, res) => {
    const { sportName } = req.query;
    if (!sportName) return res.status(400).json({ error: 'sportName is required' });

    try {
        const dir = path.join(__dirname, 'data', sportName.replace(/[^a-z0-9]/gi, '_'));
        const latestPath = path.join(dir, 'latest.json');

        if (fs.existsSync(latestPath)) {
            const data = fs.readFileSync(latestPath, 'utf8');
            const parsed = JSON.parse(data);
            res.json({
                source: 'cache',
                sport: sportName,
                count: parsed.length,
                data: parsed
            });
        } else {
            res.status(404).json({ error: `Data for ${sportName} not found.` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sport-full-scrape', async (req, res) => {
    const { sportId, sportName } = req.query;
    if (!sportId || !sportName) {
        return res.status(400).json({ error: 'sportId and sportName are required' });
    }

    try {
        if (!scraper.sessionId) await scraper.init();
        const rawData = await scraper.getGamesBySport(sportId);
        const allGames = parseGamesFromData(rawData, sportName);
        saveSportData(sportName, allGames);
        res.json(allGames);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/fetch-all-sports', async (req, res) => {
    try {
        if (!scraper.sessionId) await scraper.init();
        const rawHierarchy = await scraper.getHierarchy();
        const hierarchy = rawHierarchy.data || rawHierarchy;
        const summary = [];

        const sports = hierarchy.sport || (hierarchy.data ? hierarchy.data.sport : null);

        if (sports) {
            for (const sportId in sports) {
                const sport = sports[sportId];
                console.log(`Scraping ${sport.name} (ID: ${sportId})...`);
                try {
                    const rawData = await scraper.getGamesBySport(sportId);
                    const games = parseGamesFromData(rawData, sport.name);
                    if (games.length > 0) {
                        saveSportData(sport.name, games);
                        summary.push({ sport: sport.name, id: sportId, count: games.length });
                    }
                } catch (err) {
                    console.error(`- Error scraping ${sport.name}:`, err.message);
                    summary.push({ sport: sport.name, id: sportId, error: err.message });
                }
            }
        }

        res.json({
            message: "Bulk scrape completed",
            summary: summary,
            count: summary.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-full-scrape', async (req, res) => {
    try {
        if (!scraper.sessionId) await scraper.init();
        const rawData = await scraper.getGamesBySport(1);
        const allGames = parseGamesFromData(rawData, "Football");
        saveSportData("Football", allGames);
        res.json(allGames);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/full-scrape', async (req, res) => {
    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }

        const hierarchy = await scraper.getHierarchy();
        const results = [];

        // This is a naive full scrape, it can be very slow if many competitions are present
        // In a real scenario, we might want to limit this or use a queue.
        for (const sportId in hierarchy.sport) {
            const sport = hierarchy.sport[sportId];
            for (const regionId in sport.region) {
                const region = sport.region[regionId];
                for (const compId in region.competition) {
                    const competition = region.competition[compId];
                    const gamesData = await scraper.getGames(competition.id);

                    if (gamesData && gamesData.game) {
                        for (const gameId in gamesData.game) {
                            const game = gamesData.game[gameId];
                            const odds = await scraper.getGameDetails(game.id);
                            results.push({
                                sport: sport.name,
                                region: region.name,
                                competition: competition.name,
                                game: game,
                                odds: odds
                            });
                        }
                    }
                }
            }
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    try {
        await scraper.init();
        console.log('Scraper initialized and connected to Swarm API');
    } catch (error) {
        console.error('Failed to initialize scraper:', error.message);
    }
});
