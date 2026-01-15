/**
 * Authentication Service
 * Handles user authentication with password hashing
 */

class AuthService {
    constructor() {
        this.storageKey = 'mediamtx-auth';
        this.sessionKey = 'mediamtx-session';
        this.defaultCredentials = {
            username: 'admin',
            passwordHash: null // Will be set on first run
        };
        this.initializeDefaultUser();
    }

    /**
     * Initialize default user credentials
     */
    async initializeDefaultUser() {
        const users = this.getStoredUsers();
        if (users.length === 0) {
            // Create default admin user with password 'admin123'
            const passwordHash = await this.hashPassword('admin123');
            const defaultUser = {
                username: 'admin',
                passwordHash: passwordHash
            };
            localStorage.setItem(this.storageKey, JSON.stringify([defaultUser]));
        }
    }

    /**
     * Hash password using Web Crypto API
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password as hex string
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Get stored users
     * @returns {Array} - Array of user objects
     */
    getStoredUsers() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Promise<boolean>} - True if login successful
     */
    async login(username, password) {
        const users = this.getStoredUsers();
        const passwordHash = await this.hashPassword(password);
        
        const user = users.find(u => 
            u.username === username && u.passwordHash === passwordHash
        );

        if (user) {
            // Create session
            const session = {
                username: user.username,
                timestamp: new Date().toISOString(),
                token: this.generateToken()
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            return true;
        }

        return false;
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        // Trigger logout event
        window.dispatchEvent(new CustomEvent('user-logged-out'));
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if user has valid session
     */
    isAuthenticated() {
        const session = localStorage.getItem(this.sessionKey);
        return session !== null;
    }

    /**
     * Get current session
     * @returns {object|null} - Session object or null
     */
    getSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Generate random token using crypto.getRandomValues
     * @returns {string} - Cryptographically secure random token
     */
    generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Change password for a user
     * @param {string} username - Username
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} - True if password changed successfully
     */
    async changePassword(username, oldPassword, newPassword) {
        const users = this.getStoredUsers();
        const oldPasswordHash = await this.hashPassword(oldPassword);
        
        const userIndex = users.findIndex(u => 
            u.username === username && u.passwordHash === oldPasswordHash
        );

        if (userIndex !== -1) {
            const newPasswordHash = await this.hashPassword(newPassword);
            users[userIndex].passwordHash = newPasswordHash;
            localStorage.setItem(this.storageKey, JSON.stringify(users));
            return true;
        }

        return false;
    }
}

// Export singleton instance
const auth = new AuthService();
export default auth;
