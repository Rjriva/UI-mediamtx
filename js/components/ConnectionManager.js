/**
 * ConnectionManager Component
 * Displays and manages SRT connections with IN/OUT separation
 */

import api from '../api.js';
import { showToast, showLoading, hideLoading, showConfirmDialog, formatDate, escapeHtml } from '../utils.js';

class ConnectionManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.connections = [];
        this.refreshInterval = null;
        this.failureCount = 0;
        this.maxFailures = 3;
        this.currentFilter = 'all'; // 'all', 'in', 'out'
        this.render();
        this.loadConnections();
        this.startAutoRefresh();
    }

    render() {
        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Active SRT Connections</h2>
                <div class="connection-filters">
                    <button id="filter-all" class="btn btn-secondary btn-small ${this.currentFilter === 'all' ? 'active' : ''}">
                        All
                    </button>
                    <button id="filter-in" class="btn btn-secondary btn-small ${this.currentFilter === 'in' ? 'active' : ''}">
                        IN (Listener)
                    </button>
                    <button id="filter-out" class="btn btn-secondary btn-small ${this.currentFilter === 'out' ? 'active' : ''}">
                        OUT (Caller)
                    </button>
                </div>
            </div>
            <div id="connections-list"></div>
        `;
        
        this.attachFilterListeners();
    }

    attachFilterListeners() {
        const filterAll = document.getElementById('filter-all');
        const filterIn = document.getElementById('filter-in');
        const filterOut = document.getElementById('filter-out');
        
        if (filterAll) {
            filterAll.addEventListener('click', () => this.setFilter('all'));
        }
        if (filterIn) {
            filterIn.addEventListener('click', () => this.setFilter('in'));
        }
        if (filterOut) {
            filterOut.addEventListener('click', () => this.setFilter('out'));
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
        this.renderConnections();
    }

    async loadConnections() {
        try {
            const response = await api.getSRTConnections();
            this.connections = response?.items || [];
            this.failureCount = 0; // Reset failure count on success
            this.renderConnections();
        } catch (error) {
            // Silent fail - connections might not be available
            this.failureCount++;
            this.connections = [];
            this.renderConnections();
            
            // Stop auto-refresh after multiple failures to avoid unnecessary API calls
            if (this.failureCount >= this.maxFailures) {
                this.stopAutoRefresh();
            }
        }
    }

    /**
     * Determine connection type (IN/OUT) based on state
     * MediaMTX SRT connections have a 'state' field that indicates direction
     */
    getConnectionType(connection) {
        // In MediaMTX, the state field can be:
        // - "read" or "publish" (from perspective of path)
        // For SRT specifically, we check if it's a listener (IN) or caller (OUT)
        
        // Check the connection state or URL parameters
        if (connection.state) {
            // If state contains "read", it's incoming (listener)
            if (connection.state.toLowerCase().includes('read')) {
                return 'IN';
            }
            // If state contains "publish", it's outgoing (caller)
            if (connection.state.toLowerCase().includes('publish')) {
                return 'OUT';
            }
        }
        
        // Fallback: check the remote address pattern
        // Listeners typically have remote addresses, callers might not
        if (connection.remoteAddr) {
            return 'IN'; // Has remote connection, likely listener
        }
        
        return 'OUT'; // Default to OUT
    }

    /**
     * Get path/channel from connection
     */
    getConnectionPath(connection) {
        // MediaMTX connections should have a path field
        return connection.path || 'Unknown';
    }

    renderConnections() {
        const listContainer = document.getElementById('connections-list');
        
        if (!this.connections || this.connections.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔌</div>
                    <p>No active SRT connections</p>
                </div>
            `;
            return;
        }

        // Filter connections based on current filter
        let filteredConnections = this.connections;
        if (this.currentFilter === 'in') {
            filteredConnections = this.connections.filter(conn => this.getConnectionType(conn) === 'IN');
        } else if (this.currentFilter === 'out') {
            filteredConnections = this.connections.filter(conn => this.getConnectionType(conn) === 'OUT');
        }

        if (filteredConnections.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔌</div>
                    <p>No ${this.currentFilter.toUpperCase()} connections</p>
                </div>
            `;
            return;
        }

        // Group connections by path
        const groupedByPath = {};
        filteredConnections.forEach(conn => {
            const path = this.getConnectionPath(conn);
            if (!groupedByPath[path]) {
                groupedByPath[path] = [];
            }
            groupedByPath[path].push(conn);
        });

        listContainer.innerHTML = `
            <div class="connection-groups">
                ${Object.entries(groupedByPath).map(([path, conns]) => 
                    this.renderConnectionGroup(path, conns)
                ).join('')}
            </div>
        `;

        // Attach event listeners for kick buttons
        filteredConnections.forEach(conn => {
            const kickBtn = document.getElementById(`kick-${conn.id}`);
            if (kickBtn) {
                kickBtn.addEventListener('click', () => this.kickConnection(conn.id));
            }
        });
    }

    renderConnectionGroup(path, connections) {
        return `
            <div class="connection-group">
                <div class="connection-group-header">
                    <h4>Channel: ${escapeHtml(path)}</h4>
                    <span class="connection-count">${connections.length} connection${connections.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="connection-list">
                    ${connections.map(conn => this.renderConnectionItem(conn)).join('')}
                </div>
            </div>
        `;
    }

    renderConnectionItem(connection) {
        const type = this.getConnectionType(connection);
        const typeClass = type === 'IN' ? 'type-in' : 'type-out';
        const typeColor = type === 'IN' ? 'var(--success-color)' : 'var(--primary-color)';
        
        return `
            <div class="connection-item">
                <div class="connection-info">
                    <div class="connection-id-row">
                        <span class="connection-id">ID: ${escapeHtml(connection.id || 'Unknown')}</span>
                        <span class="connection-type-badge ${typeClass}" style="background-color: ${typeColor}">
                            ${type}
                        </span>
                        <span class="connection-status active">Active</span>
                    </div>
                    <div class="connection-details">
                        ${connection.remoteAddr ? `<span>Remote: ${escapeHtml(connection.remoteAddr)}</span>` : ''}
                        ${connection.state ? `<span>State: ${escapeHtml(connection.state)}</span>` : ''}
                        ${connection.created ? `<span>Connected: ${formatDate(connection.created)}</span>` : ''}
                    </div>
                </div>
                <button id="kick-${escapeHtml(connection.id)}" class="btn btn-danger btn-small">
                    Disconnect
                </button>
            </div>
        `;
    }

    async kickConnection(connectionId) {
        const confirmed = await showConfirmDialog(
            'Disconnect Connection',
            `Are you sure you want to disconnect connection "${connectionId}"?`
        );

        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            await api.kickSRTConnection(connectionId);
            showToast(`Connection "${connectionId}" disconnected successfully`, 'success');
            
            // Refresh connection list
            await this.loadConnections();
        } catch (error) {
            showToast(`Failed to disconnect connection: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    startAutoRefresh() {
        // Refresh connections every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.loadConnections();
        }, 5000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

export default ConnectionManager;
