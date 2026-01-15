/**
 * ServerManager Component
 * Manages multiple MediaMTX servers
 */

import api from '../api.js';
import { showToast, showLoading, hideLoading, showConfirmDialog, escapeHtml } from '../utils.js';

class ServerManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.servers = [];
        this.activeServerId = null;
        this.storageKey = 'mediamtx-servers';
        this.activeServerKey = 'mediamtx-active-server';
        this.isEditing = false;
        this.editingServerId = null;
        
        this.loadServers();
        this.render();
        this.attachEventListeners();
    }

    /**
     * Load servers from localStorage
     */
    loadServers() {
        const stored = localStorage.getItem(this.storageKey);
        this.servers = stored ? JSON.parse(stored) : [];
        
        const activeId = localStorage.getItem(this.activeServerKey);
        this.activeServerId = activeId || (this.servers.length > 0 ? this.servers[0].id : null);
        
        // If we have an active server, update the API
        if (this.activeServerId) {
            const activeServer = this.servers.find(s => s.id === this.activeServerId);
            if (activeServer) {
                api.saveConfig(activeServer.url, activeServer.username, activeServer.password);
            }
        }
    }

    /**
     * Save servers to localStorage
     */
    saveServers() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.servers));
        if (this.activeServerId) {
            localStorage.setItem(this.activeServerKey, this.activeServerId);
        }
    }

    render() {
        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Server Management</h2>
                <button id="add-server-btn" class="btn btn-primary btn-small">
                    <i data-feather="plus"></i> Add Server
                </button>
            </div>
            
            <div id="server-form-container" class="server-form-container hidden"></div>
            
            <div id="servers-list" class="servers-list"></div>
            
            ${this.servers.length > 0 ? `
                <div class="server-selector">
                    <label for="active-server-select">Active Server:</label>
                    <select id="active-server-select" class="server-select">
                        ${this.servers.map(server => `
                            <option value="${server.id}" ${server.id === this.activeServerId ? 'selected' : ''}>
                                ${escapeHtml(server.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
            ` : ''}
        `;
        
        this.renderServersList();
        
        // Initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderServersList() {
        const listContainer = document.getElementById('servers-list');
        
        if (this.servers.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🖥️</div>
                    <p>No servers configured. Add your first MediaMTX server.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = `
            <div class="servers-grid">
                ${this.servers.map(server => this.renderServerCard(server)).join('')}
            </div>
        `;

        // Attach event listeners for each server card
        this.servers.forEach(server => {
            const editBtn = document.getElementById(`edit-server-${server.id}`);
            const deleteBtn = document.getElementById(`delete-server-${server.id}`);
            const activateBtn = document.getElementById(`activate-server-${server.id}`);
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editServer(server.id));
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteServer(server.id));
            }
            if (activateBtn && server.id !== this.activeServerId) {
                activateBtn.addEventListener('click', () => this.setActiveServer(server.id));
            }
        });
    }

    renderServerCard(server) {
        const isActive = server.id === this.activeServerId;
        const urlDisplay = server.url.length > 40 ? server.url.substring(0, 37) + '...' : server.url;
        
        return `
            <div class="server-card ${isActive ? 'active' : ''}">
                ${isActive ? '<div class="server-card-badge">Active</div>' : ''}
                <div class="server-card-header">
                    <div class="server-card-name">${escapeHtml(server.name)}</div>
                </div>
                <div class="server-card-info">
                    <div class="server-info-item">
                        <span class="server-info-label">URL:</span>
                        <span class="server-info-value" title="${escapeHtml(server.url)}">${escapeHtml(urlDisplay)}</span>
                    </div>
                    <div class="server-info-item">
                        <span class="server-info-label">Auth:</span>
                        <span class="server-info-value">${server.username ? '✓ Configured' : '✗ None'}</span>
                    </div>
                </div>
                <div class="server-card-actions">
                    ${!isActive ? `
                        <button id="activate-server-${server.id}" class="btn btn-success btn-small">
                            Activate
                        </button>
                    ` : '<span class="active-indicator">● Active</span>'}
                    <button id="edit-server-${server.id}" class="btn btn-secondary btn-small">
                        Edit
                    </button>
                    <button id="delete-server-${server.id}" class="btn btn-danger btn-small">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderServerForm(server = null) {
        const formContainer = document.getElementById('server-form-container');
        const isEdit = server !== null;
        
        formContainer.innerHTML = `
            <div class="server-form-card">
                <h3>${isEdit ? 'Edit' : 'Add'} Server</h3>
                <form id="server-form">
                    <div class="form-group">
                        <label for="server-form-name">Server Name</label>
                        <input 
                            type="text" 
                            id="server-form-name" 
                            placeholder="Production Server" 
                            value="${server ? escapeHtml(server.name) : ''}"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label for="server-form-url">Server URL</label>
                        <input 
                            type="text" 
                            id="server-form-url" 
                            placeholder="http://localhost:9997" 
                            value="${server ? escapeHtml(server.url) : ''}"
                            required
                        >
                        <small>Example: http://localhost:9997</small>
                    </div>
                    <div class="form-group">
                        <label for="server-form-username">Username (optional)</label>
                        <input 
                            type="text" 
                            id="server-form-username" 
                            placeholder="admin" 
                            value="${server && server.username ? escapeHtml(server.username) : ''}"
                        >
                    </div>
                    <div class="form-group">
                        <label for="server-form-password">Password (optional)</label>
                        <input 
                            type="password" 
                            id="server-form-password" 
                            placeholder="password" 
                            value="${server && server.password ? escapeHtml(server.password) : ''}"
                        >
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Update' : 'Add'} Server
                        </button>
                        <button type="button" id="cancel-server-form" class="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        formContainer.classList.remove('hidden');
        
        // Attach event listeners
        const form = document.getElementById('server-form');
        const cancelBtn = document.getElementById('cancel-server-form');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isEdit) {
                await this.updateServer(server.id);
            } else {
                await this.addServer();
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            this.hideServerForm();
        });
    }

    hideServerForm() {
        const formContainer = document.getElementById('server-form-container');
        formContainer.classList.add('hidden');
        formContainer.innerHTML = '';
        this.isEditing = false;
        this.editingServerId = null;
    }

    attachEventListeners() {
        const addBtn = document.getElementById('add-server-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.renderServerForm();
            });
        }
        
        const serverSelect = document.getElementById('active-server-select');
        if (serverSelect) {
            serverSelect.addEventListener('change', (e) => {
                this.setActiveServer(e.target.value);
            });
        }
    }

    async addServer() {
        const name = document.getElementById('server-form-name').value.trim();
        const url = document.getElementById('server-form-url').value.trim();
        const username = document.getElementById('server-form-username').value.trim();
        const password = document.getElementById('server-form-password').value.trim();

        if (!name || !url) {
            showToast('Server name and URL are required', 'error');
            return;
        }

        const cleanUrl = url.replace(/\/$/, '');
        
        const newServer = {
            id: Date.now().toString(),
            name,
            url: cleanUrl,
            username,
            password
        };

        this.servers.push(newServer);
        
        // If this is the first server, make it active
        if (this.servers.length === 1) {
            this.activeServerId = newServer.id;
            api.saveConfig(cleanUrl, username, password);
        }
        
        this.saveServers();
        showToast(`Server "${name}" added successfully`, 'success');
        
        this.hideServerForm();
        this.render();
        this.attachEventListeners();
    }

    editServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            this.isEditing = true;
            this.editingServerId = serverId;
            this.renderServerForm(server);
        }
    }

    async updateServer(serverId) {
        const name = document.getElementById('server-form-name').value.trim();
        const url = document.getElementById('server-form-url').value.trim();
        const username = document.getElementById('server-form-username').value.trim();
        const password = document.getElementById('server-form-password').value.trim();

        if (!name || !url) {
            showToast('Server name and URL are required', 'error');
            return;
        }

        const cleanUrl = url.replace(/\/$/, '');
        
        const serverIndex = this.servers.findIndex(s => s.id === serverId);
        if (serverIndex !== -1) {
            this.servers[serverIndex] = {
                ...this.servers[serverIndex],
                name,
                url: cleanUrl,
                username,
                password
            };
            
            // If this is the active server, update API
            if (this.activeServerId === serverId) {
                api.saveConfig(cleanUrl, username, password);
                window.dispatchEvent(new CustomEvent('server-changed'));
            }
            
            this.saveServers();
            showToast(`Server "${name}" updated successfully`, 'success');
            
            this.hideServerForm();
            this.render();
            this.attachEventListeners();
        }
    }

    async deleteServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        const confirmed = await showConfirmDialog(
            'Delete Server',
            `Are you sure you want to delete server "${server.name}"?`
        );

        if (!confirmed) return;

        this.servers = this.servers.filter(s => s.id !== serverId);
        
        // If we deleted the active server, switch to another one
        if (this.activeServerId === serverId) {
            if (this.servers.length > 0) {
                this.setActiveServer(this.servers[0].id);
            } else {
                this.activeServerId = null;
                localStorage.removeItem(this.activeServerKey);
                // Clear API config
                api.saveConfig('', '', '');
            }
        }
        
        this.saveServers();
        showToast(`Server "${server.name}" deleted successfully`, 'success');
        
        this.render();
        this.attachEventListeners();
    }

    setActiveServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        this.activeServerId = serverId;
        this.saveServers();
        
        // Update API configuration
        api.saveConfig(server.url, server.username, server.password);
        
        showToast(`Switched to server: ${server.name}`, 'success');
        
        // Trigger server change event
        window.dispatchEvent(new CustomEvent('server-changed'));
        
        this.render();
        this.attachEventListeners();
    }

    getActiveServer() {
        return this.servers.find(s => s.id === this.activeServerId);
    }
}

export default ServerManager;
