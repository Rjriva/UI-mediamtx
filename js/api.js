/**
 * MediaMTX API Service
 * Handles all API calls to the MediaMTX Control API
 */

class MediaMTXAPI {
    constructor() {
        this.baseUrl = '';
        this.username = '';
        this.password = '';
        this.loadConfig();
    }

    /**
     * Load server configuration from localStorage
     */
    loadConfig() {
        const config = localStorage.getItem('mediamtx-config');
        if (config) {
            const parsed = JSON.parse(config);
            this.baseUrl = parsed.baseUrl || '';
            this.username = parsed.username || '';
            this.password = parsed.password || '';
        }
    }

    /**
     * Save server configuration to localStorage
     */
    saveConfig(baseUrl, username, password) {
        const config = { baseUrl, username, password };
        localStorage.setItem('mediamtx-config', JSON.stringify(config));
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            baseUrl: this.baseUrl,
            username: this.username,
            password: this.password
        };
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        if (!this.baseUrl) {
            throw new Error('Server URL not configured');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add basic authentication if credentials are provided
        if (this.username && this.password) {
            const credentials = btoa(`${this.username}:${this.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        const fetchOptions = {
            ...options,
            headers,
            mode: 'cors'
        };

        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use default error message
                }
                throw new Error(errorMessage);
            }

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Please check the server URL and CORS settings.');
            }
            throw error;
        }
    }

    /**
     * Get all paths/channels
     */
    async getPaths() {
        return await this.request('/v3/config/paths/list');
    }

    /**
     * Create a new path/channel
     * @param {string} pathName - Name of the path
     * @param {object} config - Path configuration
     */
    async createPath(pathName, config) {
        return await this.request(`/v3/config/paths/add/${pathName}`, {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    /**
     * Delete a path/channel
     * @param {string} pathName - Name of the path to delete
     */
    async deletePath(pathName) {
        return await this.request(`/v3/config/paths/delete/${pathName}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get path/channel details
     * @param {string} pathName - Name of the path
     */
    async getPath(pathName) {
        return await this.request(`/v3/config/paths/get/${pathName}`);
    }

    /**
     * Update a path/channel
     * @param {string} pathName - Name of the path
     * @param {object} config - Updated path configuration
     */
    async updatePath(pathName, config) {
        return await this.request(`/v3/config/paths/patch/${pathName}`, {
            method: 'PATCH',
            body: JSON.stringify(config)
        });
    }

    /**
     * Get all SRT connections
     */
    async getSRTConnections() {
        return await this.request('/v3/srtconns/list');
    }

    /**
     * Kick/disconnect an SRT connection
     * @param {string} connectionId - ID of the connection to kick
     */
    async kickSRTConnection(connectionId) {
        return await this.request(`/v3/srtconns/kick/${connectionId}`, {
            method: 'POST'
        });
    }

    /**
     * Test server connection
     */
    async testConnection() {
        try {
            // Try to get the paths list as a connection test
            await this.getPaths();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
const api = new MediaMTXAPI();
export default api;
