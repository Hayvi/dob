const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class ForzzaScraper {
    constructor(partnerId = 1777) {
        this.partnerId = partnerId;
        this.wsUrl = 'wss://eu-swarm-newm.vmemkhhgjigrjefb.com';
        this.ws = null;
        this.sessionId = null;
        this.pendingRequests = new Map();
        this.isConnecting = false;
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId;
    }

    async ensureConnection() {
        if (this.isConnected()) return;
        
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting) {
            // Wait for ongoing connection
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (!this.isConnecting) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
            if (this.isConnected()) return;
        }
        
        await this.init();
    }

    async init() {
        // Close existing connection if any
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {}
            this.ws = null;
            this.sessionId = null;
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            const connectionTimeout = setTimeout(() => {
                this.isConnecting = false;
                reject(new Error('WebSocket connection timeout'));
            }, 15000);

            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', async () => {
                try {
                    const response = await this.sendRequest('request_session', {
                        site_id: this.partnerId,
                        language: 'eng'
                    });
                    if (response && response.data && response.data.sid) {
                        this.sessionId = response.data.sid;
                        clearTimeout(connectionTimeout);
                        this.isConnecting = false;
                        console.log('WebSocket connected, session:', this.sessionId);
                        resolve(this.sessionId);
                    } else {
                        clearTimeout(connectionTimeout);
                        this.isConnecting = false;
                        reject(new Error('Failed to get session ID'));
                    }
                } catch (error) {
                    clearTimeout(connectionTimeout);
                    this.isConnecting = false;
                    reject(error);
                }
            });

            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.rid && this.pendingRequests.has(message.rid)) {
                    const { resolve, timeout } = this.pendingRequests.get(message.rid);
                    clearTimeout(timeout);
                    this.pendingRequests.delete(message.rid);
                    resolve(message);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error.message);
                clearTimeout(connectionTimeout);
                this.isConnecting = false;
                this.sessionId = null;
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('WebSocket connection closed');
                this.sessionId = null;
                this.isConnecting = false;
            });
        });
    }

    async sendRequest(command, params = {}, timeoutMs = 60000) {
        // Ensure connection before sending (except for session request)
        if (command !== 'request_session') {
            await this.ensureConnection();
        }

        // Double-check connection state
        if (command !== 'request_session' && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
            throw new Error('WebSocket not connected');
        }

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
            }, timeoutMs);

            this.pendingRequests.set(rid, { resolve, reject, timeout });
            
            try {
                this.ws.send(JSON.stringify(request));
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(rid);
                this.sessionId = null;
                reject(new Error(`Failed to send request: ${error.message}`));
            }
        });
    }

    async getHierarchy() {
        const response = await this.sendRequest('get', {
            source: 'betting',
            what: {
                sport: ['id', 'name', 'alias', 'order'],
                region: ['id', 'name', 'alias', 'order'],
                competition: ['id', 'name', 'order']
            },
            where: {
                game: { type: 0 }
            }
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
                game: { type: 0 }
            }
        }, 90000); // 90 second timeout for large sports
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
            this.ws = null;
            this.sessionId = null;
        }
    }
}

module.exports = ForzzaScraper;
