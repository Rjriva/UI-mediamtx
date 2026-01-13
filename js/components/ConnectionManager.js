/**
 * ConnectionManager Component
 * Displays and manages SRT connections
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
        this.render();
        this.loadConnections();
        this.startAutoRefresh();
    }

    render() {
        this.container.innerHTML = `
            <h2>Active SRT Connections</h2>
            <div id="connections-list"></div>
        `;
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

        listContainer.innerHTML = `
            <div class="connection-list">
                ${this.connections.map(conn => this.renderConnectionItem(conn)).join('')}
            </div>
        `;

        // Attach event listeners for kick buttons
        this.connections.forEach(conn => {
            const kickBtn = document.getElementById(`kick-${conn.id}`);
            if (kickBtn) {
                kickBtn.addEventListener('click', () => this.kickConnection(conn.id));
            }
        });
    }

    renderConnectionItem(connection) {
        return `
            <div class="connection-item">
                <div class="connection-info">
                    <div class="connection-id">
                        ID: ${escapeHtml(connection.id || 'Unknown')}
                        <span class="connection-status active">Active</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        ${connection.remoteAddr ? `Remote: ${escapeHtml(connection.remoteAddr)}` : ''}
                        ${connection.created ? `| Connected: ${formatDate(connection.created)}` : ''}
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
