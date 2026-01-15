/**
 * ChannelForm Component
 * Form to create and edit SRT channels
 */

import api from '../api.js';
import { showToast, showLoading, hideLoading, validateChannelName, validateSRTURL, escapeHtml } from '../utils.js';

class ChannelForm {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isEditMode = false;
        this.editingChannelName = null;
        this.render();
        this.attachEventListeners();
        
        // Listen for edit channel events
        window.addEventListener('edit-channel', (e) => {
            this.editChannel(e.detail.channelName);
        });
    }

    render() {
        const titleText = this.isEditMode ? 'Edit SRT Channel' : 'Create New SRT Channel';
        const buttonText = this.isEditMode ? 'Update Channel' : 'Create Channel';
        const buttonClass = this.isEditMode ? 'btn-primary' : 'btn-success';
        
        this.container.innerHTML = `
            <h2>${titleText}</h2>
            <form id="channel-form">
                <div class="form-group">
                    <label for="channel-name">Channel Name / ID</label>
                    <input 
                        type="text" 
                        id="channel-name" 
                        placeholder="my-channel" 
                        required
                        ${this.isEditMode ? 'disabled' : ''}
                    >
                    <small>Alphanumeric characters, underscores, and hyphens only</small>
                    <div id="channel-name-error" class="error"></div>
                </div>
                
                <div class="form-group">
                    <label for="channel-source">SRT Source URL</label>
                    <input 
                        type="text" 
                        id="channel-source" 
                        placeholder="srt://0.0.0.0:10000?mode=listener" 
                        required
                    >
                    <small>Example: srt://0.0.0.0:10000?mode=listener or srt://host:port</small>
                    <div id="channel-source-error" class="error"></div>
                </div>
                
                <div class="form-group">
                    <label for="channel-publish-user">Publish User (optional)</label>
                    <input 
                        type="text" 
                        id="channel-publish-user" 
                        placeholder="publisher"
                    >
                    <small>Username required to publish to this channel</small>
                </div>
                
                <div class="form-group">
                    <label for="channel-publish-password">Publish Password (optional)</label>
                    <input 
                        type="password" 
                        id="channel-publish-password" 
                        placeholder="password"
                    >
                    <small>Password required to publish to this channel</small>
                </div>
                
                <button type="submit" class="btn ${buttonClass}">${buttonText}</button>
                <button type="button" id="reset-form" class="btn btn-secondary">
                    ${this.isEditMode ? 'Cancel' : 'Reset'}
                </button>
            </form>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('channel-form');
        const resetBtn = document.getElementById('reset-form');
        const nameInput = document.getElementById('channel-name');
        const sourceInput = document.getElementById('channel-source');

        // Real-time validation
        if (!this.isEditMode) {
            nameInput.addEventListener('blur', () => this.validateName());
        }
        sourceInput.addEventListener('blur', () => this.validateSource());

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.isEditMode) {
                await this.updateChannel();
            } else {
                await this.createChannel();
            }
        });

        resetBtn.addEventListener('click', () => {
            if (this.isEditMode) {
                this.cancelEdit();
            } else {
                form.reset();
                this.clearErrors();
            }
        });
    }

    validateName() {
        const nameInput = document.getElementById('channel-name');
        const errorDiv = document.getElementById('channel-name-error');
        const validation = validateChannelName(nameInput.value);
        
        if (!validation.valid) {
            errorDiv.textContent = validation.error;
            nameInput.style.borderColor = 'var(--danger-color)';
            return false;
        } else {
            errorDiv.textContent = '';
            nameInput.style.borderColor = '';
            return true;
        }
    }

    validateSource() {
        const sourceInput = document.getElementById('channel-source');
        const errorDiv = document.getElementById('channel-source-error');
        const validation = validateSRTURL(sourceInput.value);
        
        if (!validation.valid) {
            errorDiv.textContent = validation.error;
            sourceInput.style.borderColor = 'var(--danger-color)';
            return false;
        } else {
            errorDiv.textContent = '';
            sourceInput.style.borderColor = '';
            return true;
        }
    }

    clearErrors() {
        document.getElementById('channel-name-error').textContent = '';
        document.getElementById('channel-source-error').textContent = '';
        document.getElementById('channel-name').style.borderColor = '';
        document.getElementById('channel-source').style.borderColor = '';
    }

    async createChannel() {
        // Validate inputs
        const nameValid = this.validateName();
        const sourceValid = this.validateSource();
        
        if (!nameValid || !sourceValid) {
            showToast('Please fix the validation errors', 'error');
            return;
        }

        const name = document.getElementById('channel-name').value.trim();
        const source = document.getElementById('channel-source').value.trim();
        const publishUser = document.getElementById('channel-publish-user').value.trim();
        const publishPassword = document.getElementById('channel-publish-password').value.trim();

        // Build path configuration
        const config = {
            source: source
        };

        // Add authentication if provided
        if (publishUser) {
            config.publishUser = publishUser;
        }
        if (publishPassword) {
            config.publishPass = publishPassword;
        }

        showLoading();
        try {
            await api.createPath(name, config);
            showToast(`Channel "${name}" created successfully`, 'success');
            
            // Reset form
            document.getElementById('channel-form').reset();
            this.clearErrors();
            
            // Trigger refresh of channel list
            window.dispatchEvent(new CustomEvent('channel-created'));
        } catch (error) {
            showToast(`Failed to create channel: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async editChannel(channelName) {
        showLoading();
        try {
            const channelData = await api.getPath(channelName);
            
            this.isEditMode = true;
            this.editingChannelName = channelName;
            this.render();
            this.attachEventListeners();
            
            // Populate form with channel data
            document.getElementById('channel-name').value = channelName;
            document.getElementById('channel-source').value = channelData.source || '';
            document.getElementById('channel-publish-user').value = channelData.publishUser || '';
            document.getElementById('channel-publish-password').value = channelData.publishPass || '';
            
            // Scroll to form
            this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            showToast(`Editing channel: ${channelName}`, 'info');
        } catch (error) {
            showToast(`Failed to load channel data: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async updateChannel() {
        // Validate inputs
        const sourceValid = this.validateSource();
        
        if (!sourceValid) {
            showToast('Please fix the validation errors', 'error');
            return;
        }

        const source = document.getElementById('channel-source').value.trim();
        const publishUser = document.getElementById('channel-publish-user').value.trim();
        const publishPassword = document.getElementById('channel-publish-password').value.trim();

        // Build path configuration
        const config = {
            source: source
        };

        // Add authentication if provided
        if (publishUser) {
            config.publishUser = publishUser;
        }
        if (publishPassword) {
            config.publishPass = publishPassword;
        }

        showLoading();
        try {
            await api.updatePath(this.editingChannelName, config);
            showToast(`Channel "${this.editingChannelName}" updated successfully`, 'success');
            
            // Reset to create mode
            this.cancelEdit();
            
            // Trigger refresh of channel list
            window.dispatchEvent(new CustomEvent('channel-updated'));
        } catch (error) {
            showToast(`Failed to update channel: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    cancelEdit() {
        this.isEditMode = false;
        this.editingChannelName = null;
        this.render();
        this.attachEventListeners();
        
        // Clear form
        document.getElementById('channel-form').reset();
        this.clearErrors();
    }
}

export default ChannelForm;
