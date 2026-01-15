/**
 * Main Application Entry Point
 */

import auth from './auth.js';
import Login from './components/Login.js';
import ServerConfig from './components/ServerConfig.js';
import ChannelForm from './components/ChannelForm.js';
import StreamViewer from './components/StreamViewer.js';
import ConnectionManager from './components/ConnectionManager.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInitialize();
});

/**
 * Check authentication and initialize appropriate view
 */
function checkAuthAndInitialize() {
    if (auth.isAuthenticated()) {
        initializeMainApp();
    } else {
        showLoginScreen();
    }
}

/**
 * Show login screen
 */
function showLoginScreen() {
    // Hide main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Show login
    const loginContainer = document.getElementById('login-container');
    loginContainer.style.display = 'flex';
    
    const login = new Login('login-container');
    
    // Listen for successful login
    window.addEventListener('user-logged-in', () => {
        loginContainer.style.display = 'none';
        initializeMainApp();
    }, { once: true });
}

/**
 * Initialize main application
 */
function initializeMainApp() {
    // Show main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
        mainApp.style.display = 'block';
    }
    
    // Update header with user info
    updateUserInfo();
    
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
    
    // Attach logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    console.log('UI-mediamtx application initialized');
}

/**
 * Update user info in header
 */
function updateUserInfo() {
    const session = auth.getSession();
    const userInfo = document.getElementById('user-info');
    if (userInfo && session) {
        userInfo.textContent = `👤 ${session.username}`;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    auth.logout();
    // Reload page to show login screen
    window.location.reload();
}
