/**
 * Utility functions for UI-mediamtx
 */

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const header = document.createElement('div');
    header.className = 'toast-header';
    header.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.textContent = message;
    
    toast.appendChild(header);
    toast.appendChild(messageDiv);
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading overlay
 */
export function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
}

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
 */
export function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirmation-dialog');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const confirmBtn = document.getElementById('dialog-confirm');
        const cancelBtn = document.getElementById('dialog-cancel');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        dialog.classList.remove('hidden');
        
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            dialog.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

/**
 * Validate channel name
 * @param {string} name - Channel name to validate
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateChannelName(name) {
    if (!name || name.trim() === '') {
        return { valid: false, error: 'Channel name is required' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return { valid: false, error: 'Channel name can only contain letters, numbers, underscores, and hyphens' };
    }
    
    if (name.length < 1 || name.length > 100) {
        return { valid: false, error: 'Channel name must be between 1 and 100 characters' };
    }
    
    return { valid: true, error: '' };
}

/**
 * Validate SRT URL
 * @param {string} url - SRT URL to validate
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateSRTURL(url) {
    if (!url || url.trim() === '') {
        return { valid: false, error: 'SRT URL is required' };
    }
    
    if (!url.startsWith('srt://')) {
        return { valid: false, error: 'SRT URL must start with srt://' };
    }
    
    // Custom SRT URL validation
    // Format: srt://host:port or srt://host:port?params
    const srtPattern = /^srt:\/\/[\w.-]+(:\d+)?(\?[\w=&.-]+)?$/;
    if (!srtPattern.test(url)) {
        return { valid: false, error: 'Invalid SRT URL format. Expected: srt://host:port or srt://0.0.0.0:10000?mode=listener' };
    }
    
    return { valid: true, error: '' };
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
