const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const ForzzaScraper = require('./scraper');
const Game = require('./models/Game');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGODB_URI not found. Running without persistent storage.');
}

const scraper = new ForzzaScraper();

// Helper to save sport data in MongoDB
async function saveSportData(sportName, games) {
    if (!mongoUri) {
        // Fallback or skip if no DB
        return null;
    }

    const scrape_ts = new Date();
    const operations = games.map(game => ({
        updateOne: {
            filter: { gameId: game.id },
            update: {
                ...game,
                gameId: game.id,
                sport: sportName,
                last_updated: scrape_ts
            },
            upsert: true
        }
    }));

    if (operations.length > 0) {
        await Game.bulkWrite(operations);
    }
    return scrape_ts;
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
        const hierarchy = await scraper.getHierarchy();
        res.json(hierarchy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-games', async (req, res) => {
    try {
        if (!mongoUri) return res.status(501).json({ error: 'MongoDB not configured' });

        const latestGame = await Game.findOne({ sport: 'Football' }).sort({ last_updated: -1 });
        if (!latestGame) return res.status(404).json({ error: 'No football data found.' });

        const games = await Game.find({
            sport: 'Football',
            last_updated: latestGame.last_updated
        });

        res.json({
            source: 'mongodb',
            sport: 'Football',
            last_updated: latestGame.last_updated,
            count: games.length,
            data: games
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sport-games', async (req, res) => {
    const { sportName } = req.query;
    if (!sportName) return res.status(400).json({ error: 'sportName is required' });

    try {
        if (!mongoUri) return res.status(501).json({ error: 'MongoDB not configured' });

        // Case-insensitive search
        const latestGame = await Game.findOne({ 
            sport: { $regex: new RegExp(`^${sportName}$`, 'i') } 
        }).sort({ last_updated: -1 });
        if (!latestGame) return res.status(404).json({ error: `No data found for ${sportName}` });

        const games = await Game.find({
            sport: latestGame.sport,  // Use exact sport name from DB
            last_updated: latestGame.last_updated
        });

        res.json({
            source: 'mongodb',
            sport: latestGame.sport,  // Return actual sport name from DB
            last_updated: latestGame.last_updated,
            count: games.length,
            data: games
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/football-games-count', async (req, res) => {
    try {
        const rawData = await scraper.sendRequest('get', {
            source: 'betting',
            what: { sport: ['id', 'name'], game: ['id'] },
            where: { sport: { id: 1 }, game: { type: 0 } }
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

app.get('/api/sport-games-count', async (req, res) => {
    const { sportName } = req.query;
    if (!sportName) return res.status(400).json({ error: 'sportName is required' });

    try {
        const rawHierarchy = await scraper.getHierarchy();
        const hierarchy = rawHierarchy.data || rawHierarchy;
        const sports = hierarchy.sport || (hierarchy.data ? hierarchy.data.sport : null);

        let sportId = null;
        if (sports) {
            for (const id in sports) {
                if (sports[id].name.toLowerCase() === sportName.toLowerCase()) {
                    sportId = id;
                    break;
                }
            }
        }

        if (!sportId) {
            return res.status(404).json({ error: `Sport ${sportName} not found in hierarchy.` });
        }

        const rawData = await scraper.sendRequest('get', {
            source: 'betting',
            what: { sport: ['id', 'name'], game: ['id'] },
            where: {
                sport: { id: parseInt(sportId) },
                game: { type: 0 }
            }
        });

        const data = rawData.data && rawData.data.data ? rawData.data.data : (rawData.data || rawData);
        let count = 0;
        let foundName = sportName;

        if (data && data.sport) {
            const sportsData = Object.values(data.sport);
            if (sportsData.length > 0) {
                foundName = sportsData[0].name || foundName;
                if (sportsData[0].game) count = Object.keys(sportsData[0].game).length;
            }
        }

        res.json({ sport: foundName, count: count, timestamp: new Date().toISOString() });
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
        const rawData = await scraper.getGamesBySport(sportId);
        // Normalize sport name: replace underscores with spaces
        const normalizedName = sportName.replace(/_/g, ' ');
        const allGames = parseGamesFromData(rawData, normalizedName);
        const scrapeTime = await saveSportData(normalizedName, allGames);
        res.json({
            message: `Scrape completed for ${normalizedName}`,
            count: allGames.length,
            last_updated: scrapeTime,
            data: allGames
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/fetch-all-sports', async (req, res) => {
    try {
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
                        await saveSportData(sport.name, games);
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
        const rawData = await scraper.getGamesBySport(1);
        const allGames = parseGamesFromData(rawData, "Football");
        const scrapeTime = await saveSportData("Football", allGames);
        res.json({
            message: "Football scrape completed",
            count: allGames.length,
            last_updated: scrapeTime,
            data: allGames
        });
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
