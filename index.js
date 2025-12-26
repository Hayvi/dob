const express = require('express');
const fs = require('fs');
const ForzzaScraper = require('./scraper');

const app = express();
const port = process.env.PORT || 3000;

// Initialize scraper once for the server lifetime or per request?
// For real-time Swarm API, maintaining one connection is better.
const scraper = new ForzzaScraper();

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
        if (fs.existsSync('football_games.json')) {
            const data = fs.readFileSync('football_games.json', 'utf8');
            res.json({
                source: 'cache',
                count: JSON.parse(data).length,
                data: JSON.parse(data)
            });
        } else {
            res.status(404).json({ error: 'Football games data not found. Run a scrape first.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-games-count', async (req, res) => {
    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }

        // We fetch with minimal fields just to count
        const rawData = await scraper.sendRequest('get', {
            source: 'betting',
            what: {
                sport: ['id', 'name'],
                game: ['id']
            },
            where: {
                sport: { id: 1 } // Football
            }
        });

        // Handle potential double nesting: Swarm sometimes wraps data in another 'data' property
        const data = rawData.data && rawData.data.data ? rawData.data.data : (rawData.data || rawData);
        let count = 0;
        let sportName = "Football";

        // Try to find the sport object and current count
        if (data && data.sport) {
            const sports = Object.values(data.sport);
            if (sports.length > 0) {
                const sportObj = sports[0];
                sportName = sportObj.name || sportName;
                if (sportObj.game) {
                    count = Object.keys(sportObj.game).length;
                }
            }
        }

        res.json({
            sport: sportName,
            count: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-full-scrape', async (req, res) => {
    try {
        if (!scraper.sessionId) {
            await scraper.init();
        }

        const rawData = await scraper.getGamesBySport(1);
        const data = rawData.data || rawData;
        const allGames = [];

        if (data && data.region) {
            for (const regionId in data.region) {
                const region = data.region[regionId];
                if (region.competition) {
                    for (const compId in region.competition) {
                        const competition = region.competition[compId];
                        if (competition.game) {
                            const gameIds = Object.keys(competition.game);
                            for (const gameId of gameIds) {
                                const game = competition.game[gameId];
                                allGames.push({
                                    sport: "Football",
                                    region: region.name,
                                    competition: competition.name,
                                    ...game
                                });
                            }
                        }
                    }
                }
            }
        }

        // Save to file as well
        fs.writeFileSync('football_games.json', JSON.stringify(allGames, null, 2));
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
