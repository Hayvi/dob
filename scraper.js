const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class ForzzaScraper {
    constructor(partnerId = 1777) {
        this.partnerId = partnerId;
        this.wsUrl = 'wss://eu-swarm-newm.vmemkhhgjigrjefb.com';
        this.ws = null;
        this.sessionId = null;
        this.pendingRequests = new Map();
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', async () => {
                try {
                    const response = await this.sendRequest('request_session', {
                        site_id: this.partnerId,
                        language: 'eng'
                    });
                    if (response && response.data && response.data.sid) {
                        this.sessionId = response.data.sid;
                        resolve(this.sessionId);
                    } else {
                        reject(new Error('Failed to get session ID'));
                    }
                } catch (error) {
                    reject(error);
                }
            });

            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.rid && this.pendingRequests.has(message.rid)) {
                    const { resolve } = this.pendingRequests.get(message.rid);
                    this.pendingRequests.delete(message.rid);
                    resolve(message);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('WebSocket connection closed');
            });
        });
    }

    async sendRequest(command, params = {}) {
        const rid = uuidv4();
        const request = {
            command,
            params,
            rid
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(rid)) {
                    this.pendingRequests.delete(rid);
                    reject(new Error(`Request ${command} timed out`));
                }
            }, 30000);

            this.pendingRequests.set(rid, { resolve, reject, timeout });
            this.ws.send(JSON.stringify(request));
        });
    }

    async getHierarchy() {
        // We use 'get' command to retrieve the sports hierarchy
        const response = await this.sendRequest('get', {
            source: 'betting',
            what: {
                sport: ['id', 'name', 'alias', 'order'],
                region: ['id', 'name', 'alias', 'order'],
                competition: ['id', 'name', 'order']
            },
            where: {}
        });

        return response.data;
    }

    async getGames(competitionId) {
        const response = await this.sendRequest('get', {
            source: 'betting',
            what: {
                game: ['id', 'team1_name', 'team2_name', 'start_ts', 'markets_count', 'info']
            },
            where: {
                competition: { id: parseInt(competitionId) },
                game: { type: 0 }
            }
        });
        return response.data;
    }

    async getGamesBySport(sportId) {
        const response = await this.sendRequest('get', {
            source: 'betting',
            what: {
                region: ['id', 'name'],
                competition: ['id', 'name'],
                game: ['id', 'team1_name', 'team2_name', 'start_ts'],
                market: ['id', 'name', 'type', 'display_key'],
                event: ['id', 'name', 'price']
            },
            where: {
                sport: { id: parseInt(sportId) },
                game: { type: 0 } // Prematch
            }
        });
        return response.data;
    }

    async getGameDetails(gameId) {
        const response = await this.sendRequest('get', {
            source: 'betting',
            what: {
                market: ['id', 'name', 'type', 'order', 'col_count', 'display_key'],
                event: ['id', 'name', 'price', 'order', 'type', 'base']
            },
            where: {
                game: { id: parseInt(gameId) }
            }
        });
        return response.data;
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = ForzzaScraper;
