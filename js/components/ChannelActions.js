/**
 * ChannelActions Component
 * Handles channel deletion and management actions
 */

import api from '../api.js';
import { showToast, showLoading, hideLoading, showConfirmDialog } from '../utils.js';

class ChannelActions {
    /**
     * Delete a channel
     * @param {string} channelName - Name of the channel to delete
     */
    static async deleteChannel(channelName) {
        const confirmed = await showConfirmDialog(
            'Delete Channel',
            `Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            await api.deletePath(channelName);
            showToast(`Channel "${channelName}" deleted successfully`, 'success');
            
            // Trigger refresh of channel list
            window.dispatchEvent(new CustomEvent('channel-deleted'));
        } catch (error) {
            showToast(`Failed to delete channel: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    /**
     * Edit a channel
     * @param {string} channelName - Name of the channel to edit
     */
    static editChannel(channelName) {
        // Trigger edit event for ChannelForm
        window.dispatchEvent(new CustomEvent('edit-channel', {
            detail: { channelName }
        }));
    }

    /**
     * Duplicate a channel
     * @param {string} channelName - Name of the channel to duplicate
     */
    static async duplicateChannel(channelName) {
        showLoading();
        try {
            const channelData = await api.getPath(channelName);
            
            // Create a new name for the duplicate
            let newName = `${channelName}_copy`;
            let counter = 1;
            
            // Check if the name already exists, if so, add a number
            while (true) {
                try {
                    await api.getPath(newName);
                    // If we get here, the name exists, try another
                    newName = `${channelName}_copy_${counter}`;
                    counter++;
                } catch (error) {
                    // Name doesn't exist, we can use it
                    break;
                }
            }
            
            // Create the duplicate
            await api.createPath(newName, channelData);
            showToast(`Channel duplicated as "${newName}"`, 'success');
            
            // Trigger refresh of channel list
            window.dispatchEvent(new CustomEvent('channel-created'));
        } catch (error) {
            showToast(`Failed to duplicate channel: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    /**
     * View channel details
     * @param {string} channelName - Name of the channel
     */
    static async viewChannelDetails(channelName) {
        showLoading();
        try {
            const details = await api.getPath(channelName);
            console.log('Channel details:', details);
            showToast(`Channel details logged to console`, 'info');
        } catch (error) {
            showToast(`Failed to get channel details: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }
}

export default ChannelActions;
