/**
 * Login Component
 * Handles user authentication interface
 */

import auth from '../auth.js';
import { showToast, escapeHtml } from '../utils.js';

class Login {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1>MediaMTX Control Panel</h1>
                        <p>Please login to continue</p>
                    </div>
                    <form id="login-form">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                            <input 
                                type="text" 
                                id="login-username" 
                                placeholder="Enter username" 
                                required
                                autocomplete="username"
                            >
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input 
                                type="password" 
                                id="login-password" 
                                placeholder="Enter password" 
                                required
                                autocomplete="current-password"
                            >
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">
                            Login
                        </button>
                    </form>
                    <div class="login-footer">
                        <small>Default credentials: admin / admin123</small>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }

        try {
            const success = await auth.login(username, password);
            
            if (success) {
                showToast('Login successful!', 'success');
                // Trigger login event
                window.dispatchEvent(new CustomEvent('user-logged-in'));
            } else {
                showToast('Invalid username or password', 'error');
                // Clear password field
                document.getElementById('login-password').value = '';
            }
        } catch (error) {
            showToast(`Login error: ${error.message}`, 'error');
        }
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export default Login;
