const ForzzaScraper = require('./scraper');
const fs = require('fs');

async function fetchAllFootball() {
    const scraper = new ForzzaScraper();
    try {
        await scraper.init();
        console.log('Connected to Swarm API');

        console.log('Fetching all Football games...');
        // Football sport ID is 1
        const rawData = await scraper.getGamesBySport(1);

        // Handle nesting: Swarm sometimes wraps data in another 'data' property
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

        console.log(`\nSuccess! Total football games fetched: ${allGames.length}`);

        fs.writeFileSync('football_games.json', JSON.stringify(allGames, null, 2));
        console.log('Results saved to football_games.json');

    } catch (error) {
        console.error('Fatal error:', error.message);
    } finally {
        scraper.close();
    }
}

fetchAllFootball();
