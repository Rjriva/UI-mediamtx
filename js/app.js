/**
 * Main Application Entry Point
 */

import ServerConfig from './components/ServerConfig.js';
import ChannelForm from './components/ChannelForm.js';
import StreamViewer from './components/StreamViewer.js';
import ConnectionManager from './components/ConnectionManager.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const serverConfig = new ServerConfig('server-config');
    const channelForm = new ChannelForm('channel-form');
    const streamViewer = new StreamViewer('stream-viewer');
    const connectionManager = new ConnectionManager('connection-manager');

    // Store components globally for debugging
    window.app = {
        serverConfig,
        channelForm,
        streamViewer,
        connectionManager
    };

    console.log('UI-mediamtx application initialized');
});
