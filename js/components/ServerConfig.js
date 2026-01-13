/**
 * ServerConfig Component
 * Handles server configuration and connection
 */

import api from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml } from '../utils.js';

class ServerConfig {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isConnected = false;
        this.render();
        this.attachEventListeners();
        this.checkConnection();
    }

    render() {
        const config = api.getConfig();
        
        this.container.innerHTML = `
            <h2>Server Configuration</h2>
            <form id="server-config-form">
                <div class="form-group">
                    <label for="server-url">MediaMTX Server URL</label>
                    <input 
                        type="text" 
                        id="server-url" 
                        placeholder="http://localhost:9997" 
                        value="${escapeHtml(config.baseUrl || '')}"
                        required
                    >
                    <small>Example: http://localhost:9997 or http://your-server:9997</small>
                </div>
                <div class="form-group">
                    <label for="server-username">Username (optional)</label>
                    <input 
                        type="text" 
                        id="server-username" 
                        placeholder="admin" 
                        value="${escapeHtml(config.username || '')}"
                    >
                </div>
                <div class="form-group">
                    <label for="server-password">Password (optional)</label>
                    <input 
                        type="password" 
                        id="server-password" 
                        placeholder="password" 
                        value="${escapeHtml(config.password || '')}"
                    >
                </div>
                <button type="submit" class="btn btn-primary">Save & Connect</button>
                <button type="button" id="test-connection" class="btn btn-secondary">Test Connection</button>
            </form>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('server-config-form');
        const testBtn = document.getElementById('test-connection');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveConfig();
        });

        testBtn.addEventListener('click', async () => {
            await this.testConnection();
        });
    }

    async saveConfig() {
        const url = document.getElementById('server-url').value.trim();
        const username = document.getElementById('server-username').value.trim();
        const password = document.getElementById('server-password').value.trim();

        if (!url) {
            showToast('Server URL is required', 'error');
            return;
        }

        // Remove trailing slash from URL
        const cleanUrl = url.replace(/\/$/, '');

        showLoading();
        try {
            api.saveConfig(cleanUrl, username, password);
            const connected = await api.testConnection();
            
            if (connected) {
                this.isConnected = true;
                this.updateServerStatus(true);
                showToast('Connected to MediaMTX server successfully', 'success');
                
                // Trigger app refresh
                window.dispatchEvent(new CustomEvent('server-connected'));
            } else {
                this.isConnected = false;
                this.updateServerStatus(false);
                showToast('Configuration saved, but could not connect to server', 'warning');
            }
        } catch (error) {
            this.isConnected = false;
            this.updateServerStatus(false);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async testConnection() {
        const url = document.getElementById('server-url').value.trim();
        
        if (!url) {
            showToast('Please enter a server URL first', 'error');
            return;
        }

        showLoading();
        try {
            // Temporarily set config for testing
            const currentConfig = api.getConfig();
            const username = document.getElementById('server-username').value.trim();
            const password = document.getElementById('server-password').value.trim();
            
            api.saveConfig(url.replace(/\/$/, ''), username, password);
            const connected = await api.testConnection();
            
            if (connected) {
                this.isConnected = true;
                this.updateServerStatus(true);
                showToast('Connection successful!', 'success');
            } else {
                this.isConnected = false;
                this.updateServerStatus(false);
                showToast('Could not connect to server', 'error');
            }
        } catch (error) {
            this.isConnected = false;
            this.updateServerStatus(false);
            showToast(`Connection failed: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async checkConnection() {
        if (!api.getConfig().baseUrl) {
            this.updateServerStatus(false);
            return;
        }

        try {
            const connected = await api.testConnection();
            this.isConnected = connected;
            this.updateServerStatus(connected);
        } catch (error) {
            this.isConnected = false;
            this.updateServerStatus(false);
        }
    }

    updateServerStatus(connected) {
        const statusContainer = document.getElementById('server-status');
        const statusClass = connected ? 'connected' : 'disconnected';
        const statusText = connected ? 'Connected' : 'Disconnected';
        
        statusContainer.innerHTML = `
            <span class="status-indicator ${statusClass}"></span>
            <span>${statusText}</span>
        `;
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

export default ServerConfig;
