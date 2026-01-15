/**
 * StreamViewer Component
 * Main component to display and manage channels/paths
 */

import api from '../api.js';
import ChannelActions from './ChannelActions.js';
import StreamPreview from './StreamPreview.js';
import { showToast, showLoading, hideLoading, escapeHtml } from '../utils.js';

class StreamViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.channels = [];
        this.previewStates = {}; // Track preview visibility per channel
        this.previewInstances = {}; // Track StreamPreview instances
        this.loadPreviewStates();
        this.render();
        this.loadChannels();
        this.attachEventListeners();
    }

    /**
     * Load preview states from localStorage
     */
    loadPreviewStates() {
        const stored = localStorage.getItem('mediamtx-preview-states');
        this.previewStates = stored ? JSON.parse(stored) : {};
    }

    /**
     * Save preview states to localStorage
     */
    savePreviewStates() {
        localStorage.setItem('mediamtx-preview-states', JSON.stringify(this.previewStates));
    }

    /**
     * Get preview state for a channel (default: true)
     */
    getPreviewState(channelName) {
        return this.previewStates[channelName] !== undefined ? this.previewStates[channelName] : true;
    }

    /**
     * Set preview state for a channel
     */
    setPreviewState(channelName, visible) {
        this.previewStates[channelName] = visible;
        this.savePreviewStates();
    }

    render() {
        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">SRT Channels</h2>
                <div style="display: flex; gap: 0.5rem;">
                    <button id="toggle-all-previews" class="btn btn-secondary btn-small">
                        Toggle All Previews
                    </button>
                    <button id="refresh-channels" class="btn btn-primary btn-small">Refresh</button>
                </div>
            </div>
            <div id="channels-container"></div>
        `;
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refresh-channels');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadChannels());
        }

        const toggleAllBtn = document.getElementById('toggle-all-previews');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', () => this.toggleAllPreviews());
        }

        // Listen for channel creation/deletion/update events
        window.addEventListener('channel-created', () => this.loadChannels());
        window.addEventListener('channel-deleted', () => this.loadChannels());
        window.addEventListener('channel-updated', () => this.loadChannels());
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

        // Attach button event listeners and initialize previews
        this.channels.forEach(channel => {
            const safeId = channel.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const deleteBtn = document.getElementById(`delete-${safeId}`);
            const editBtn = document.getElementById(`edit-${safeId}`);
            const togglePreviewBtn = document.getElementById(`toggle-preview-${safeId}`);
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    ChannelActions.deleteChannel(channel.name);
                });
            }
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    ChannelActions.editChannel(channel.name);
                });
            }
            if (togglePreviewBtn) {
                togglePreviewBtn.addEventListener('click', () => {
                    this.togglePreview(channel.name);
                });
            }

            // Initialize preview
            const previewContainerId = `preview-${safeId}`;
            const isVisible = this.getPreviewState(channel.name);
            
            // Clean up existing instance if any
            if (this.previewInstances[channel.name]) {
                this.previewInstances[channel.name].destroy();
            }
            
            // Create new preview instance
            const preview = new StreamPreview(channel.name, previewContainerId, isVisible);
            preview.render();
            this.previewInstances[channel.name] = preview;
        });
    }

    renderChannelCard(channel) {
        const source = channel.source || 'Not configured';
        const publishUser = channel.publishUser || 'None';
        const readUser = channel.readUser || 'None';
        const safeId = channel.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const isPreviewVisible = this.getPreviewState(channel.name);
        
        return `
            <div class="channel-card" data-channel-name="${escapeHtml(channel.name)}">
                <div class="channel-header">
                    <div class="channel-name">${escapeHtml(channel.name)}</div>
                    <button 
                        id="toggle-preview-${safeId}" 
                        class="btn-icon toggle-preview-btn" 
                        title="${isPreviewVisible ? 'Hide preview' : 'Show preview'}"
                    >
                        ${isPreviewVisible ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>
                
                <!-- Preview Container -->
                <div id="preview-${safeId}" class="preview-container"></div>
                
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
                    <button id="edit-${safeId}" class="btn btn-primary btn-small">
                        Edit
                    </button>
                    <button id="delete-${safeId}" class="btn btn-danger btn-small">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    togglePreview(channelName) {
        const currentState = this.getPreviewState(channelName);
        const newState = !currentState;
        
        this.setPreviewState(channelName, newState);
        
        // Update preview instance
        const preview = this.previewInstances[channelName];
        if (preview) {
            preview.setVisible(newState);
        }
        
        // Update toggle button
        const safeId = channelName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const toggleBtn = document.getElementById(`toggle-preview-${safeId}`);
        if (toggleBtn) {
            toggleBtn.textContent = newState ? '👁️' : '👁️‍🗨️';
            toggleBtn.title = newState ? 'Hide preview' : 'Show preview';
        }
    }

    toggleAllPreviews() {
        // Determine if we should show or hide all
        // If any preview is hidden, show all. Otherwise, hide all.
        const anyHidden = this.channels.some(channel => !this.getPreviewState(channel.name));
        const newState = anyHidden;
        
        this.channels.forEach(channel => {
            this.setPreviewState(channel.name, newState);
            
            const preview = this.previewInstances[channel.name];
            if (preview) {
                preview.setVisible(newState);
            }
            
            const safeId = channel.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const toggleBtn = document.getElementById(`toggle-preview-${safeId}`);
            if (toggleBtn) {
                toggleBtn.textContent = newState ? '👁️' : '👁️‍🗨️';
                toggleBtn.title = newState ? 'Hide preview' : 'Show preview';
            }
        });
        
        showToast(newState ? 'All previews enabled' : 'All previews disabled', 'info');
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

    destroy() {
        // Clean up all preview instances
        Object.values(this.previewInstances).forEach(preview => {
            preview.destroy();
        });
        this.previewInstances = {};
    }
}

export default StreamViewer;
