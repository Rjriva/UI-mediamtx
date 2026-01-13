/**
 * StreamViewer Component
 * Main component to display and manage channels/paths
 */

import api from '../api.js';
import ChannelActions from './ChannelActions.js';
import { showToast, showLoading, hideLoading, escapeHtml } from '../utils.js';

class StreamViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.channels = [];
        this.render();
        this.loadChannels();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">SRT Channels</h2>
                <button id="refresh-channels" class="btn btn-primary btn-small">Refresh</button>
            </div>
            <div id="channels-container"></div>
        `;
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refresh-channels');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadChannels());
        }

        // Listen for channel creation/deletion events
        window.addEventListener('channel-created', () => this.loadChannels());
        window.addEventListener('channel-deleted', () => this.loadChannels());
        window.addEventListener('server-connected', () => this.loadChannels());
    }

    async loadChannels() {
        const config = api.getConfig();
        if (!config.baseUrl) {
            this.renderEmptyState('Please configure the MediaMTX server first');
            return;
        }

        showLoading();
        try {
            const response = await api.getPaths();
            
            // Convert paths object to array
            if (response && response.items) {
                this.channels = Object.entries(response.items).map(([name, config]) => ({
                    name,
                    ...config
                }));
            } else {
                this.channels = [];
            }
            
            this.renderChannels();
        } catch (error) {
            showToast(`Failed to load channels: ${error.message}`, 'error');
            this.renderEmptyState('Failed to load channels. Please check your server configuration.');
        } finally {
            hideLoading();
        }
    }

    renderChannels() {
        const container = document.getElementById('channels-container');
        
        if (!this.channels || this.channels.length === 0) {
            this.renderEmptyState('No channels found. Create your first SRT channel using the form above.');
            return;
        }

        container.innerHTML = `
            <div class="channels-grid">
                ${this.channels.map(channel => this.renderChannelCard(channel)).join('')}
            </div>
        `;

        // Attach delete button event listeners
        this.channels.forEach(channel => {
            const deleteBtn = document.getElementById(`delete-${channel.name}`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    ChannelActions.deleteChannel(channel.name);
                });
            }
        });
    }

    renderChannelCard(channel) {
        const source = channel.source || 'Not configured';
        const publishUser = channel.publishUser || 'None';
        const readUser = channel.readUser || 'None';
        
        return `
            <div class="channel-card">
                <div class="channel-header">
                    <div class="channel-name">${escapeHtml(channel.name)}</div>
                </div>
                
                <div class="channel-info">
                    <div class="channel-info-label">Source:</div>
                    <div class="channel-info-value">${escapeHtml(source)}</div>
                </div>
                
                <div class="channel-info">
                    <div class="channel-info-label">Publish User:</div>
                    <div class="channel-info-value">${escapeHtml(publishUser)}</div>
                </div>
                
                <div class="channel-info">
                    <div class="channel-info-label">Read User:</div>
                    <div class="channel-info-value">${escapeHtml(readUser)}</div>
                </div>
                
                <div class="channel-actions">
                    <button id="delete-${escapeHtml(channel.name)}" class="btn btn-danger btn-small">
                        Delete Channel
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState(message) {
        const container = document.getElementById('channels-container');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📺</div>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

export default StreamViewer;
