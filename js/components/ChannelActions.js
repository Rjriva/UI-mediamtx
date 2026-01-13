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
